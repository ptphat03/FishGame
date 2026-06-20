using Microsoft.EntityFrameworkCore;
using FishApi.Data;
using FishApi.Dtos;
using FishApi.Models;

namespace FishApi.Services;

public interface IFishService
{
    Task<List<Fish>> GetAllAsync();
    Task<Fish?> GetByIdAsync(int id);
    Task<Fish> CreateAsync(AdminFishRequest req);
    Task<Fish?> UpdateAsync(int id, AdminFishRequest req);
    Task<bool> DeleteAsync(int id);
}

public class FishService : IFishService
{
    private readonly PlayerDbContext _db;

    public FishService(PlayerDbContext db) => _db = db;

    public Task<List<Fish>> GetAllAsync() =>
        _db.Fishes.AsNoTracking().OrderBy(f => f.RewardMultiplier).ToListAsync();

    public Task<Fish?> GetByIdAsync(int id) =>
        _db.Fishes.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id);

    public async Task<Fish> CreateAsync(AdminFishRequest req)
    {
        var fish = new Fish
        {
            Name             = req.Name,
            Health           = req.Health,
            RewardMultiplier = req.RewardMultiplier,
            BaseProb         = req.BaseProb,
            Speed            = req.Speed,
            AssetPath        = req.AssetPath,
            CreatedAt        = DateTime.UtcNow,
            UpdatedAt        = DateTime.UtcNow,
        };
        _db.Fishes.Add(fish);
        await _db.SaveChangesAsync();
        return fish;
    }

    public async Task<Fish?> UpdateAsync(int id, AdminFishRequest req)
    {
        var fish = await _db.Fishes.FindAsync(id);
        if (fish is null) return null;

        fish.Name             = req.Name;
        fish.Health           = req.Health;
        fish.RewardMultiplier = req.RewardMultiplier;
        fish.BaseProb         = req.BaseProb;
        fish.Speed            = req.Speed;
        fish.AssetPath        = req.AssetPath;
        fish.UpdatedAt        = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return fish;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var fish = await _db.Fishes.FindAsync(id);
        if (fish is null) return false;

        _db.Fishes.Remove(fish);
        await _db.SaveChangesAsync();
        return true;
    }
}
