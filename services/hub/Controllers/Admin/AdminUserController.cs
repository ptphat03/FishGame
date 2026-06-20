using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FishApi.Services;

namespace FishApi.Controllers.Admin;

[ApiController]
[Route("api/admin/users")]
[Authorize(Policy = "AdminOnly")]
public class AdminUserController(IAdminService adminService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int limit = 50, [FromQuery] int offset = 0)
    {
        var (users, total) = await adminService.GetUsersAsync(limit, offset);
        return Ok(new { data = users, total });
    }
}
