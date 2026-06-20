using Microsoft.EntityFrameworkCore;
using FishApi.Data;
using FishApi.Dtos;

namespace FishApi.Services;

public interface IAdminService
{
    Task<DashboardStats> GetDashboardStatsAsync();
    Task<(IEnumerable<AdminUserResponse> Users, long Total)> GetUsersAsync(int limit, int offset);
}

public class AdminService : IAdminService
{
    private readonly PlayerDbContext _db;

    public AdminService(PlayerDbContext db) => _db = db;

    public async Task<DashboardStats> GetDashboardStatsAsync() =>
        new DashboardStats(
            TotalUsers: await _db.Users.CountAsync(),
            TotalRooms: await _db.Rooms.CountAsync(),
            TotalFish:  await _db.Fishes.CountAsync()
        );

    public async Task<(IEnumerable<AdminUserResponse> Users, long Total)> GetUsersAsync(int limit, int offset)
    {
        var users = await _db.Users
            .OrderBy(u => u.Id)
            .Skip(offset)
            .Take(limit)
            .Select(u => new AdminUserResponse(
                u.Id,
                u.Username,
                u.Email,
                u.RoleId == 1 ? "Player" : "Admin",
                u.CreatedAt))
            .ToListAsync();

        var total = await _db.Users.LongCountAsync();
        return (users, total);
    }
}
