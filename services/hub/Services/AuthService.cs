using Microsoft.EntityFrameworkCore;
using FishApi.Data;
using FishApi.Dtos;
using FishApi.Models;

namespace FishApi.Services;

public interface IAuthService
{
    Task<(LoginResponse response, string refreshToken, long refreshExpiresAt)> LoginAsync(LoginRequest req, string? deviceName, string? ipAddress);
    Task<RegisterResponse> RegisterAsync(RegisterRequest req);
    Task<(RefreshResponse response, string newRefreshToken, long newRefreshExpiresAt)> RefreshAsync(string refreshToken);
    Task<MeResponse> MeAsync(long userId);
    Task LogoutAsync(string refreshToken);
}

public class AuthService : IAuthService
{
    private readonly PlayerDbContext _db;
    private readonly ITokenService   _tokens;

    public AuthService(PlayerDbContext db, ITokenService tokens) =>
        (_db, _tokens) = (db, tokens);

    public async Task<(LoginResponse response, string refreshToken, long refreshExpiresAt)> LoginAsync(LoginRequest req, string? deviceName, string? ipAddress)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == req.Username)
            ?? throw new UnauthorizedAccessException("Thông tin đăng nhập không hợp lệ");

        if (!BCrypt.Net.BCrypt.Verify(req.Password, user.Password))
            throw new UnauthorizedAccessException("Thông tin đăng nhập không hợp lệ");

        var (accessToken, accessExp)   = _tokens.CreateAccessToken(user.Id, user.RoleId);
        var (refreshToken, refreshExp) = _tokens.CreateRefreshToken();

        await _tokens.SaveSessionAsync(user.Id, refreshToken, deviceName, ipAddress);

        return (new LoginResponse(accessToken, accessExp), refreshToken, refreshExp);
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest req)
    {
        if (await _db.Users.AnyAsync(u => u.Username == req.Username))
            throw new InvalidOperationException("Tên đăng nhập đã tồn tại");

        var user = new User
        {
            Username  = req.Username,
            Email     = req.Email,
            Password  = BCrypt.Net.BCrypt.HashPassword(req.Password),
            RoleId    = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _db.Wallets.Add(new Wallet { UserId = user.Id, Balance = 5000, UpdatedAt = DateTime.UtcNow });
        await _db.SaveChangesAsync();

        return new RegisterResponse(user.Id, user.Username, user.RoleId);
    }

    public async Task<(RefreshResponse response, string newRefreshToken, long newRefreshExpiresAt)> RefreshAsync(string refreshToken)
    {
        var result = await _tokens.RotateSessionAsync(refreshToken)
            ?? throw new UnauthorizedAccessException("Token không hợp lệ hoặc đã hết hạn");

        return (new RefreshResponse(result.accessToken, result.accessExp), result.refreshToken, result.refreshExp);
    }

    public async Task<MeResponse> MeAsync(long userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Người dùng không tồn tại");

        return new MeResponse(user.Id, user.Username, user.Email, user.RoleId, user.CreatedAt);
    }

    public async Task LogoutAsync(string refreshToken) =>
        await _tokens.RevokeSessionAsync(refreshToken);
}
