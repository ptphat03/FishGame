namespace FishApi.Models;

public class GameSession
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long RoomId { get; set; }
    public int ShotsFired { get; set; }
    public int FishKilled { get; set; }
    public long TotalSpend { get; set; }
    public long TotalEarn { get; set; }
    public string Status { get; set; } = "active";
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
}
