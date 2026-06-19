using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FishApi.Data;
using FishApi.Models;
using FishApi.Services;

namespace FishApi.Controllers.Admin;

public record AdminRoomRequest(string Name, int MaxPlayers, double Rtp, string? Description);

[ApiController]
[Route("api/admin/rooms")]
[Authorize(Policy = "AdminOnly")]
public class AdminRoomController(PlayerDbContext db, IGameServerNotifier notifier) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List() =>
        Ok(new { data = await db.Rooms.OrderBy(r => r.Id).ToListAsync() });

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var room = await db.Rooms.FindAsync(id);
        return room is null
            ? NotFound(Error("ROOM_NOT_FOUND", "Không tìm thấy phòng"))
            : Ok(new { data = room });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminRoomRequest req)
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
        db.Rooms.Add(room);
        await db.SaveChangesAsync();
        await notifier.ReloadConfigAsync();
        return CreatedAtAction(nameof(GetById), new { id = room.Id }, new { data = room });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] AdminRoomRequest req)
    {
        var room = await db.Rooms.FindAsync(id);
        if (room is null) return NotFound(Error("ROOM_NOT_FOUND", "Không tìm thấy phòng"));

        room.Name        = req.Name;
        room.MaxPlayers  = req.MaxPlayers;
        room.Rtp         = req.Rtp;
        room.Description = req.Description;
        room.UpdatedAt   = DateTime.UtcNow;

        await db.SaveChangesAsync();
        await notifier.ReloadConfigAsync();
        return Ok(new { data = room });
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var room = await db.Rooms.FindAsync(id);
        if (room is null) return NotFound(Error("ROOM_NOT_FOUND", "Không tìm thấy phòng"));

        db.Rooms.Remove(room);
        await db.SaveChangesAsync();
        await notifier.ReloadConfigAsync();
        return Ok(new { message = "Xóa thành công" });
    }

    private static object Error(string code, string message) =>
        new { error = new { code, message } };
}
