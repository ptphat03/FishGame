using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FishApi.Services;

namespace FishApi.Controllers.Admin;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminDashboardController(IAdminService adminService) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var stats = await adminService.GetDashboardStatsAsync();
        return Ok(new
        {
            data = new
            {
                totalUsers = stats.TotalUsers,
                totalRooms = stats.TotalRooms,
                totalFish  = stats.TotalFish,
            }
        });
    }
}
