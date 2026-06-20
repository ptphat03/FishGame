using Microsoft.EntityFrameworkCore;
using FishApi.Data;
using FishApi.Dtos;
using FishApi.Models;

namespace FishApi.Services;

public interface IRoomService
{
    Task<List<Room>> GetAllAsync();
    Task<Room?> GetByIdAsync(long id);
    Task<Room> CreateAsync(AdminRoomRequest req);
    Task<Room?> UpdateAsync(long id, AdminRoomRequest req);
    Task<bool> DeleteAsync(long id);
}

public class RoomService : IRoomService
{
    private readonly PlayerDbContext _db;

    public RoomService(PlayerDbContext db) => _db = db;

    public Task<List<Room>> GetAllAsync() =>
        _db.Rooms.AsNoTracking().OrderBy(r => r.Id).ToListAsync();

    public Task<Room?> GetByIdAsync(long id) =>
        _db.Rooms.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);

    public async Task<Room> CreateAsync(AdminRoomRequest req)
    {
        var room = new Room
        {
            Name        = req.Name,
            MaxPlayers  = req.MaxPlayers,
            Rtp         = req.Rtp,
            Description = req.Description,
            CreatedAt   = DateTime.UtcNow,
            UpdatedAt   = DateTime.UtcNow,
        };
        _db.Rooms.Add(room);
        await _db.SaveChangesAsync();
        return room;
    }

    public async Task<Room?> UpdateAsync(long id, AdminRoomRequest req)
    {
        var room = await _db.Rooms.FindAsync(id);
        if (room is null) return null;

        room.Name        = req.Name;
        room.MaxPlayers  = req.MaxPlayers;
        room.Rtp         = req.Rtp;
        room.Description = req.Description;
        room.UpdatedAt   = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return room;
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var room = await _db.Rooms.FindAsync(id);
        if (room is null) return false;

        _db.Rooms.Remove(room);
        await _db.SaveChangesAsync();
        return true;
    }
}
