using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FishApi.Data;

namespace FishApi.Controllers.Admin;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminDashboardController(PlayerDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard() =>
        Ok(new
        {
            data = new
            {
                totalUsers = await db.Users.CountAsync(),
                totalRooms = await db.Rooms.CountAsync(),
                totalFish  = await db.Fishes.CountAsync(),
            }
        });
}
