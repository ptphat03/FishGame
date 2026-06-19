using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FishApi.Dtos;
using FishApi.Services;

namespace FishApi.Controllers.Auth;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private const string RefreshTokenCookie     = "refresh_token";
    private const string RefreshTokenCookiePath = "/api/auth";

    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var deviceName = Request.Headers.UserAgent.ToString();
        var ipAddress  = HttpContext.Connection.RemoteIpAddress?.ToString();

        try
        {
            var (response, refreshToken, refreshExp) = await _auth.LoginAsync(req, deviceName, ipAddress);
            SetRefreshCookie(refreshToken, refreshExp);
            return Ok(new { data = response });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(Error("INVALID_CREDENTIALS", ex.Message));
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        try
        {
            var response = await _auth.RegisterAsync(req);
            return Ok(new { data = response });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(Error("USERNAME_EXISTED", ex.Message));
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        if (!Request.Cookies.TryGetValue(RefreshTokenCookie, out var refreshToken))
            return Unauthorized(Error("INVALID_TOKEN", "Thiếu refresh token"));

        try
        {
            var (response, newRefreshToken, newRefreshExp) = await _auth.RefreshAsync(refreshToken);
            SetRefreshCookie(newRefreshToken, newRefreshExp);
            return Ok(new { data = response });
        }
        catch (UnauthorizedAccessException ex)
        {
            ClearRefreshCookie();
            return Unauthorized(Error("INVALID_TOKEN", ex.Message));
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var claim = User.FindFirst("user_id")?.Value;
        if (!long.TryParse(claim, out var userId))
            return Unauthorized(Error("INVALID_TOKEN", "Không lấy được user_id từ token"));

        try
        {
            var response = await _auth.MeAsync(userId);
            return Ok(new { data = response });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(Error("USER_NOT_FOUND", ex.Message));
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        if (Request.Cookies.TryGetValue(RefreshTokenCookie, out var refreshToken))
            await _auth.LogoutAsync(refreshToken);

        ClearRefreshCookie();
        return Ok(new { message = "Đăng xuất thành công" });
    }

    private void SetRefreshCookie(string token, long expiresAt)
    {
        var maxAge = (int)(DateTimeOffset.FromUnixTimeSeconds(expiresAt) - DateTimeOffset.UtcNow).TotalSeconds;
        Response.Cookies.Append(RefreshTokenCookie, token, new CookieOptions
        {
            HttpOnly = true,
            Secure   = IsProduction(),
            SameSite = SameSiteMode.Strict,
            Path     = RefreshTokenCookiePath,
            MaxAge   = TimeSpan.FromSeconds(maxAge),
        });
    }

    private void ClearRefreshCookie() =>
        Response.Cookies.Append(RefreshTokenCookie, "", new CookieOptions
        {
            HttpOnly = true,
            Secure   = IsProduction(),
            SameSite = SameSiteMode.Strict,
            Path     = RefreshTokenCookiePath,
            MaxAge   = TimeSpan.FromSeconds(-1),
        });

    private bool IsProduction() =>
        HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsProduction();

    private static object Error(string code, string message) =>
        new { error = new { code, message } };
}
