using System.ComponentModel.DataAnnotations.Schema;

namespace FishApi.Models;

[Table("rooms")]
public class Room
{
    [Column("id")]
    public long Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("max_players")]
    public int MaxPlayers { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("rtp")]
    public double Rtp { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
