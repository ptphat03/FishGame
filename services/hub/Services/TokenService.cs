using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FishApi.Data;
using FishApi.Models;

namespace FishApi.Services;

public interface ITokenService
{
    (string token, long expiresAt) CreateAccessToken(long userId, int roleId);
    (string token, long expiresAt) CreateRefreshToken();
    Task SaveSessionAsync(long userId, string plainToken, string? deviceName, string? ipAddress);
    Task<(string accessToken, long accessExp, string refreshToken, long refreshExp)?> RotateSessionAsync(string plainToken);
    Task<bool> RevokeSessionAsync(string plainToken);
}

public class TokenService : ITokenService
{
    private readonly string         _accessKey;
    private readonly TimeSpan       _accessExpiry;
    private readonly TimeSpan       _refreshExpiry;
    private readonly PlayerDbContext _db;

    public TokenService(IConfiguration config, PlayerDbContext db)
    {
        _accessKey     = config["Jwt:AccessTokenKey"] ?? throw new InvalidOperationException("Jwt:AccessTokenKey missing");
        _accessExpiry  = ParseExpiry(config["Jwt:AccessTokenExpiry"]  ?? "15m");
        _refreshExpiry = ParseExpiry(config["Jwt:RefreshTokenExpiry"] ?? "168h");
        _db            = db;
    }

    public (string token, long expiresAt) CreateAccessToken(long userId, int roleId)
    {
        var exp    = DateTimeOffset.UtcNow.Add(_accessExpiry);
        var claims = new[]
        {
            new Claim("user_id", userId.ToString(), ClaimValueTypes.Integer64),
            new Claim("role_id", roleId.ToString(), ClaimValueTypes.Integer64),
            new Claim("type",    "access"),
        };
        return (Sign(claims, _accessKey, exp), exp.ToUnixTimeSeconds());
    }

    public (string token, long expiresAt) CreateRefreshToken()
    {
        var token     = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var expiresAt = DateTimeOffset.UtcNow.Add(_refreshExpiry).ToUnixTimeSeconds();
        return (token, expiresAt);
    }

    public async Task SaveSessionAsync(long userId, string plainToken, string? deviceName, string? ipAddress)
    {
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId     = userId,
            TokenHash  = HashToken(plainToken),
            ExpiresAt  = DateTime.UtcNow.Add(_refreshExpiry),
            CreatedAt  = DateTime.UtcNow,
            IsRevoked  = false,
            DeviceName = deviceName,
            IpAddress  = ipAddress,
        });
        await _db.SaveChangesAsync();
    }

    public async Task<(string accessToken, long accessExp, string refreshToken, long refreshExp)?> RotateSessionAsync(string plainToken)
    {
        var hash   = HashToken(plainToken);
        var record = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash);

        if (record is null || !record.IsActive)
        {
            if (record is not null)
            {
                _db.RefreshTokens.Remove(record);
                await _db.SaveChangesAsync();
            }
            return null;
        }

        var user = await _db.Users.FindAsync(record.UserId);
        if (user is null) return null;

        record.IsRevoked = true;
        var (newRefreshToken, refreshExp) = CreateRefreshToken();
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId     = user.Id,
            TokenHash  = HashToken(newRefreshToken),
            ExpiresAt  = DateTimeOffset.FromUnixTimeSeconds(refreshExp).UtcDateTime,
            CreatedAt  = DateTime.UtcNow,
            IsRevoked  = false,
            DeviceName = record.DeviceName,
            IpAddress  = record.IpAddress,
        });
        await _db.SaveChangesAsync();

        var (newAccessToken, accessExp) = CreateAccessToken(user.Id, user.RoleId);
        return (newAccessToken, accessExp, newRefreshToken, refreshExp);
    }

    public async Task<bool> RevokeSessionAsync(string plainToken)
    {
        var hash   = HashToken(plainToken);
        var record = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash);
        if (record is null) return false;

        record.IsRevoked = true;
        await _db.SaveChangesAsync();
        return true;
    }

    internal static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string Sign(Claim[] claims, string key, DateTimeOffset exp)
    {
        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(claims: claims, expires: exp.UtcDateTime, signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static TimeSpan ParseExpiry(string s)
    {
        if (s.EndsWith('m') && int.TryParse(s[..^1], out var min))  return TimeSpan.FromMinutes(min);
        if (s.EndsWith('h') && int.TryParse(s[..^1], out var hrs))  return TimeSpan.FromHours(hrs);
        if (s.EndsWith('d') && int.TryParse(s[..^1], out var days)) return TimeSpan.FromDays(days);
        throw new FormatException($"Không thể parse expiry: '{s}'. Dùng format: 15m, 168h, 7d");
    }
}
