namespace FishApi.Dtos;

public record AdminFishRequest(
    string Name,
    int Health,
    int RewardMultiplier,
    double BaseProb,
    double Speed,
    string AssetPath);

public record AdminRoomRequest(string Name, int MaxPlayers, double Rtp, string? Description);

public record AdminUserResponse(long Id, string Username, string Email, string Role, DateTime CreatedAt);

public record DashboardStats(int TotalUsers, int TotalRooms, int TotalFish);
