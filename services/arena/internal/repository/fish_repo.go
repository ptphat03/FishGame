package repository

import (
	"context"

	"github.com/ptphat03/Fish-Game/services/game-server/internal/models"
	"github.com/ptphat03/Fish-Game/services/game-server/internal/repository/dbgen"
	"github.com/ptphat03/Fish-Game/services/game-server/pkg/apperror"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FishRepository interface {
	List(ctx context.Context) ([]models.Fish, error)
}

type fishPgRepo struct {
	queries *dbgen.Queries
}

func NewFishRepository(pool *pgxpool.Pool) FishRepository {
	return &fishPgRepo{queries: dbgen.New(pool)}
}

func mapToModelFish(f dbgen.Fish) models.Fish {
	return models.Fish{
		ID:               f.ID,
		Name:             f.Name,
		Health:           f.Health,
		RewardMultiplier: f.RewardMultiplier,
		BaseProb:         f.BaseProb,
		Speed:            f.Speed,
		AssetPath:        f.AssetPath,
		CreatedAt:        f.CreatedAt.Time,
		UpdatedAt:        f.UpdatedAt.Time,
	}
}

func (r *fishPgRepo) List(ctx context.Context) ([]models.Fish, error) {
	rows, err := r.queries.ListFishes(ctx)
	if err != nil {
		return nil, apperror.Wrap("repository", "fishRepo.List", err)
	}
	fishes := make([]models.Fish, len(rows))
	for i, row := range rows {
		fishes[i] = mapToModelFish(row)
	}
	return fishes, nil
}
