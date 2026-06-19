using Microsoft.EntityFrameworkCore;
using FishApi.Data;
using FishApi.Models;

namespace FishApi.Services;

public interface IFishService
{
    Task<List<Fish>> GetAllAsync();
    Task<Fish?> GetByIdAsync(int id);
}

public class FishService : IFishService
{
    private readonly PlayerDbContext _db;

    public FishService(PlayerDbContext db) => _db = db;

    public Task<List<Fish>> GetAllAsync() =>
        _db.Fishes.AsNoTracking().OrderBy(f => f.RewardMultiplier).ToListAsync();

    public Task<Fish?> GetByIdAsync(int id) =>
        _db.Fishes.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id);
}
