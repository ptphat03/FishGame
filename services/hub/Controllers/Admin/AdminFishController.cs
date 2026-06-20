using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FishApi.Dtos;
using FishApi.Services;

namespace FishApi.Controllers.Admin;

[ApiController]
[Route("api/admin/fish")]
[Authorize(Policy = "AdminOnly")]
public class AdminFishController(IFishService fishService, IGameServerNotifier notifier) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List() =>
        Ok(new { data = await fishService.GetAllAsync() });

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var fish = await fishService.GetByIdAsync(id);
        return fish is null
            ? NotFound(Error("FISH_NOT_FOUND", "Không tìm thấy cá"))
            : Ok(new { data = fish });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminFishRequest req)
    {
        var fish = await fishService.CreateAsync(req);
        await notifier.ReloadConfigAsync();
        return CreatedAtAction(nameof(GetById), new { id = fish.Id }, new { data = fish });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AdminFishRequest req)
    {
        var fish = await fishService.UpdateAsync(id, req);
        if (fish is null) return NotFound(Error("FISH_NOT_FOUND", "Không tìm thấy cá"));
        await notifier.ReloadConfigAsync();
        return Ok(new { data = fish });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!await fishService.DeleteAsync(id))
            return NotFound(Error("FISH_NOT_FOUND", "Không tìm thấy cá"));
        await notifier.ReloadConfigAsync();
        return Ok(new { message = "Xóa thành công" });
    }

    private static object Error(string code, string message) =>
        new { error = new { code, message } };
}
