using Microsoft.EntityFrameworkCore;
using FishApi.Data;
using FishApi.Models;

namespace FishApi.Services;

public interface IRoomService
{
    Task<List<Room>> GetAllAsync();
    Task<Room?> GetByIdAsync(long id);
}

public class RoomService : IRoomService
{
    private readonly PlayerDbContext _db;

    public RoomService(PlayerDbContext db) => _db = db;

    public Task<List<Room>> GetAllAsync() =>
        _db.Rooms.AsNoTracking().OrderBy(r => r.Id).ToListAsync();

    public Task<Room?> GetByIdAsync(long id) =>
        _db.Rooms.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);
}
