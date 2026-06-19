using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FishApi.Data;
using FishApi.Models;
using FishApi.Services;

namespace FishApi.Controllers.Admin;

public record AdminFishRequest(
    string Name,
    int Health,
    int RewardMultiplier,
    double BaseProb,
    double Speed,
    string AssetPath);

[ApiController]
[Route("api/admin/fish")]
[Authorize(Policy = "AdminOnly")]
public class AdminFishController(PlayerDbContext db, IGameServerNotifier notifier) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List() =>
        Ok(new { data = await db.Fishes.OrderBy(f => f.RewardMultiplier).ToListAsync() });

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var fish = await db.Fishes.FindAsync(id);
        return fish is null
            ? NotFound(Error("FISH_NOT_FOUND", "Không tìm thấy cá"))
            : Ok(new { data = fish });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminFishRequest req)
    {
        var fish = new Fish
        {
            Name             = req.Name,
            Health           = req.Health,
            RewardMultiplier = req.RewardMultiplier,
            BaseProb         = req.BaseProb,
            Speed            = req.Speed,
            AssetPath        = req.AssetPath,
            CreatedAt        = DateTime.UtcNow,
            UpdatedAt        = DateTime.UtcNow,
        };
        db.Fishes.Add(fish);
        await db.SaveChangesAsync();
        await notifier.ReloadConfigAsync();
        return CreatedAtAction(nameof(GetById), new { id = fish.Id }, new { data = fish });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AdminFishRequest req)
    {
        var fish = await db.Fishes.FindAsync(id);
        if (fish is null) return NotFound(Error("FISH_NOT_FOUND", "Không tìm thấy cá"));

        fish.Name             = req.Name;
        fish.Health           = req.Health;
        fish.RewardMultiplier = req.RewardMultiplier;
        fish.BaseProb         = req.BaseProb;
        fish.Speed            = req.Speed;
        fish.AssetPath        = req.AssetPath;
        fish.UpdatedAt        = DateTime.UtcNow;

        await db.SaveChangesAsync();
        await notifier.ReloadConfigAsync();
        return Ok(new { data = fish });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var fish = await db.Fishes.FindAsync(id);
        if (fish is null) return NotFound(Error("FISH_NOT_FOUND", "Không tìm thấy cá"));

        db.Fishes.Remove(fish);
        await db.SaveChangesAsync();
        await notifier.ReloadConfigAsync();
        return Ok(new { message = "Xóa thành công" });
    }

    private static object Error(string code, string message) =>
        new { error = new { code, message } };
}
