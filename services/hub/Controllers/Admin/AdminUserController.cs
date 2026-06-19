using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FishApi.Data;

namespace FishApi.Controllers.Admin;

[ApiController]
[Route("api/admin/users")]
[Authorize(Policy = "AdminOnly")]
public class AdminUserController(PlayerDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int limit = 50, [FromQuery] int offset = 0)
    {
        var users = await db.Users
            .OrderBy(u => u.Id)
            .Skip(offset)
            .Take(limit)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                Role      = u.RoleId == 1 ? "Player" : "Admin",
                u.CreatedAt,
            })
            .ToListAsync();

        var total = await db.Users.CountAsync();
        return Ok(new { data = users, total });
    }
}
