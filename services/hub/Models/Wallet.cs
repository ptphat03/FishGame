using System.ComponentModel.DataAnnotations.Schema;

namespace FishApi.Models;

[Table("wallets")]
public class Wallet
{
    [Column("user_id")]
    public long UserId { get; set; }

    [Column("balance")]
    public long Balance { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
