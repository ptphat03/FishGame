using System.ComponentModel.DataAnnotations.Schema;

namespace FishApi.Models;

[Table("transactions")]
public class Transaction
{
    [Column("id")]
    public long Id { get; set; }

    [Column("user_id")]
    public long UserId { get; set; }

    [Column("session_id")]
    public long? SessionId { get; set; }

    [Column("amount")]
    public long Amount { get; set; }

    [Column("type")]
    public string Type { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
