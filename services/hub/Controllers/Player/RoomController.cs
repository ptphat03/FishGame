using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FishApi.Services;

namespace FishApi.Controllers.Player;

[ApiController]
[Route("api/rooms")]
[Authorize]
public class RoomController : ControllerBase
{
    private readonly IRoomService _rooms;

    public RoomController(IRoomService rooms) => _rooms = rooms;

    [HttpGet]
    public async Task<IActionResult> List() =>
        Ok(new { data = await _rooms.GetAllAsync() });

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var room = await _rooms.GetByIdAsync(id);
        return room is null
            ? NotFound(Error("ROOM_NOT_FOUND", "Không tìm thấy phòng"))
            : Ok(new { data = room });
    }

    private static object Error(string code, string message) =>
        new { error = new { code, message } };
}
