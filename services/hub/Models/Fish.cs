using System.ComponentModel.DataAnnotations.Schema;

namespace FishApi.Models;

[Table("fishes")]
public class Fish
{
    [Column("id")]
    public int Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("health")]
    public int Health { get; set; }

    [Column("reward_multiplier")]
    public int RewardMultiplier { get; set; }

    [Column("base_prob")]
    public double BaseProb { get; set; }

    [Column("speed")]
    public double Speed { get; set; }

    [Column("asset_path")]
    public string AssetPath { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
