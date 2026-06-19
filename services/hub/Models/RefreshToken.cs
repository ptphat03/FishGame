using System.ComponentModel.DataAnnotations.Schema;

namespace FishApi.Models;

[Table("refresh_tokens")]
public class RefreshToken
{
    [Column("id")]
    public long Id { get; set; }

    [Column("user_id")]
    public long UserId { get; set; }

    [Column("token_hash")]
    public string TokenHash { get; set; } = string.Empty;

    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("is_revoked")]
    public bool IsRevoked { get; set; } = false;

    [Column("device_name")]
    public string? DeviceName { get; set; }

    [Column("ip_address")]
    public string? IpAddress { get; set; }

    public bool IsActive => !IsRevoked && ExpiresAt > DateTime.UtcNow;
}
