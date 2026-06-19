package usecase

import (
	"context"

	"github.com/ptphat03/Fish-Game/services/game-server/internal/models"
	"github.com/ptphat03/Fish-Game/services/game-server/internal/repository"
)

type RoomUsecase interface {
	GetByID(ctx context.Context, id int64) (*models.Room, error)
}

type roomUsecase struct {
	roomRepo repository.RoomRepository
}

func NewRoomUsecase(repo repository.RoomRepository) RoomUsecase {
	return &roomUsecase{roomRepo: repo}
}

func (u *roomUsecase) GetByID(ctx context.Context, id int64) (*models.Room, error) {
	return u.roomRepo.GetByID(ctx, id)
}
