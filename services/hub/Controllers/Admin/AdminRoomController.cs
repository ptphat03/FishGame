using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FishApi.Dtos;
using FishApi.Services;

namespace FishApi.Controllers.Admin;

[ApiController]
[Route("api/admin/rooms")]
[Authorize(Policy = "AdminOnly")]
public class AdminRoomController(IRoomService roomService, IGameServerNotifier notifier) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List() =>
        Ok(new { data = await roomService.GetAllAsync() });

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var room = await roomService.GetByIdAsync(id);
        return room is null
            ? NotFound(Error("ROOM_NOT_FOUND", "Không tìm thấy phòng"))
            : Ok(new { data = room });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminRoomRequest req)
    {
        var room = await roomService.CreateAsync(req);
        await notifier.ReloadConfigAsync();
        return CreatedAtAction(nameof(GetById), new { id = room.Id }, new { data = room });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] AdminRoomRequest req)
    {
        var room = await roomService.UpdateAsync(id, req);
        if (room is null) return NotFound(Error("ROOM_NOT_FOUND", "Không tìm thấy phòng"));
        await notifier.ReloadConfigAsync();
        return Ok(new { data = room });
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        if (!await roomService.DeleteAsync(id))
            return NotFound(Error("ROOM_NOT_FOUND", "Không tìm thấy phòng"));
        await notifier.ReloadConfigAsync();
        return Ok(new { message = "Xóa thành công" });
    }

    private static object Error(string code, string message) =>
        new { error = new { code, message } };
}
