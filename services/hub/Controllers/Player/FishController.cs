using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FishApi.Services;

namespace FishApi.Controllers.Player;

[ApiController]
[Route("api/fish")]
[Authorize]
public class FishController : ControllerBase
{
    private readonly IFishService _fish;

    public FishController(IFishService fish) => _fish = fish;

    [HttpGet]
    public async Task<IActionResult> List() =>
        Ok(new { data = await _fish.GetAllAsync() });

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var fish = await _fish.GetByIdAsync(id);
        return fish is null
            ? NotFound(Error("FISH_NOT_FOUND", "Không tìm thấy cá"))
            : Ok(new { data = fish });
    }

    private static object Error(string code, string message) =>
        new { error = new { code, message } };
}
