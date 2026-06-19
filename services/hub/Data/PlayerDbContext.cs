using Microsoft.EntityFrameworkCore;
using FishApi.Models;

namespace FishApi.Data;

public class PlayerDbContext : DbContext
{
    public PlayerDbContext(DbContextOptions<PlayerDbContext> options) : base(options) { }

    public DbSet<User>         Users         => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Wallet>       Wallets       => Set<Wallet>();
    public DbSet<Room>         Rooms         => Set<Room>();
    public DbSet<Fish>         Fishes        => Set<Fish>();
    public DbSet<Transaction>  Transactions  => Set<Transaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.Id).UseIdentityAlwaysColumn();
            e.HasIndex(u => u.Username).IsUnique();
            e.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Id).UseIdentityAlwaysColumn();
            e.HasIndex(r => r.TokenHash).IsUnique();
        });

        // wallets dùng user_id làm PK (không auto-increment)
        modelBuilder.Entity<Wallet>(e =>
        {
            e.HasKey(w => w.UserId);
            e.Property(w => w.UserId).ValueGeneratedNever();
        });

        modelBuilder.Entity<Room>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Id).UseIdentityAlwaysColumn();
        });

        modelBuilder.Entity<Fish>(e =>
        {
            e.HasKey(f => f.Id);
            e.Property(f => f.Id).UseIdentityAlwaysColumn();
        });

        modelBuilder.Entity<Transaction>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Id).UseIdentityAlwaysColumn();
        });
    }
}
