using Microsoft.EntityFrameworkCore;
using FishApi.Data;
using FishApi.Dtos;
using FishApi.Models;

namespace FishApi.Services;

public interface IWalletService
{
    Task<WalletResponse> GetWalletAsync(long userId);
    Task<WalletResponse> DepositAsync(long userId, DepositRequest req);
    Task<WalletResponse> WithdrawAsync(long userId, WithdrawRequest req);
    Task<TransactionListResponse> GetTransactionsAsync(long userId, int limit, int offset);
}

public class WalletService : IWalletService
{
    private readonly PlayerDbContext _db;

    public WalletService(PlayerDbContext db) => _db = db;

    public async Task<WalletResponse> GetWalletAsync(long userId)
    {
        // GetOrCreate: dùng ON CONFLICT để tạo ví nếu chưa có
        await _db.Database.ExecuteSqlAsync(
            $"INSERT INTO wallets (user_id, balance, updated_at) VALUES ({userId}, 5000, NOW()) ON CONFLICT (user_id) DO NOTHING");

        _db.ChangeTracker.Clear();
        var wallet = await _db.Wallets.FindAsync(userId)
            ?? throw new KeyNotFoundException("Wallet không tồn tại");

        return ToResponse(wallet);
    }

    public async Task<WalletResponse> DepositAsync(long userId, DepositRequest req)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();

        // Cộng balance, không cần kiểm tra âm (deposit luôn dương)
        var rows = await _db.Database.ExecuteSqlAsync(
            $"UPDATE wallets SET balance = balance + {req.Amount}, updated_at = NOW() WHERE user_id = {userId}");

        if (rows == 0) throw new KeyNotFoundException("Wallet không tồn tại");

        _db.Transactions.Add(new Transaction
        {
            UserId      = userId,
            Amount      = req.Amount,
            Type        = "deposit",
            Description = req.Description,
            CreatedAt   = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        _db.ChangeTracker.Clear();
        return ToResponse(await _db.Wallets.FindAsync(userId) ?? throw new KeyNotFoundException());
    }

    public async Task<WalletResponse> WithdrawAsync(long userId, WithdrawRequest req)
    {
        var activeSession = await _db.GameSessions
            .AnyAsync(s => s.UserId == userId && s.Status == "active" && s.StartedAt >= DateTime.UtcNow.AddHours(-1));

        if (activeSession)
        {
            throw new InvalidOperationException("Tài khoản đang trong trò chơi. Vui lòng thoát game trước khi rút tiền!");
        }

        await using var tx = await _db.Database.BeginTransactionAsync();

        // Chỉ update nếu balance >= amount (ngăn số dư âm, đồng bộ với Go SQL)
        var rows = await _db.Database.ExecuteSqlAsync(
            $"UPDATE wallets SET balance = balance - {req.Amount}, updated_at = NOW() WHERE user_id = {userId} AND balance >= {req.Amount}");

        if (rows == 0)
        {
            _db.ChangeTracker.Clear();
            var exists = await _db.Wallets.AsNoTracking().AnyAsync(w => w.UserId == userId);
            throw exists
                ? new InvalidOperationException("Số dư không đủ")
                : new KeyNotFoundException("Wallet không tồn tại");
        }

        _db.Transactions.Add(new Transaction
        {
            UserId      = userId,
            Amount      = -req.Amount,   // lưu âm cho withdrawal, khớp với Go convention
            Type        = "withdraw",
            Description = req.Description,
            CreatedAt   = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        _db.ChangeTracker.Clear();
        return ToResponse(await _db.Wallets.FindAsync(userId) ?? throw new KeyNotFoundException());
    }

    public async Task<TransactionListResponse> GetTransactionsAsync(long userId, int limit, int offset)
    {
        if (limit <= 0) limit = 20;
        if (limit > 100) limit = 100;

        var txs = await _db.Transactions
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        var total = await _db.Transactions.CountAsync(t => t.UserId == userId);

        return new TransactionListResponse(
            txs.Select(t => new TransactionResponse(
                t.Id, t.UserId, t.SessionId, t.Amount, t.Type, t.Description, t.CreatedAt)),
            total, limit, offset);
    }

    private static WalletResponse ToResponse(Wallet w) =>
        new(w.UserId, w.Balance, w.UpdatedAt);
}
