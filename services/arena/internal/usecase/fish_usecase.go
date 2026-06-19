package usecase

import (
	"context"

	"github.com/ptphat03/Fish-Game/services/game-server/internal/models"
	"github.com/ptphat03/Fish-Game/services/game-server/internal/repository"
)

type FishUsecase interface {
	List(ctx context.Context) ([]models.Fish, error)
}

type fishUsecase struct {
	fishRepo repository.FishRepository
}

func NewFishUsecase(repo repository.FishRepository) FishUsecase {
	return &fishUsecase{fishRepo: repo}
}

func (u *fishUsecase) List(ctx context.Context) ([]models.Fish, error) {
	return u.fishRepo.List(ctx)
}
