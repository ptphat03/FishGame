package usecase

import (
	"context"

	"github.com/ptphat03/Fish-Game/services/game-server/internal/domain"
	"github.com/ptphat03/Fish-Game/services/game-server/internal/models"
	"github.com/ptphat03/Fish-Game/services/game-server/internal/repository"
)

type WalletUsecase interface {
	GetWallet(ctx context.Context, userID int64) (*models.Wallet, error)
	StartSession(ctx context.Context, userID int64, req *domain.StartSessionRequest) (*models.GameSession, error)
	EndSession(ctx context.Context, userID int64, req *domain.EndSessionRequest) (*models.GameSession, *models.Wallet, error)
}

type walletUsecase struct {
	walletRepo repository.WalletRepository
}

func NewWalletUsecase(repo repository.WalletRepository) WalletUsecase {
	return &walletUsecase{walletRepo: repo}
}

func (u *walletUsecase) GetWallet(ctx context.Context, userID int64) (*models.Wallet, error) {
	return u.walletRepo.GetOrCreate(ctx, userID, 5000)
}

func (u *walletUsecase) StartSession(ctx context.Context, userID int64, req *domain.StartSessionRequest) (*models.GameSession, error) {
	return u.walletRepo.StartSession(ctx, userID, req.RoomID)
}

func (u *walletUsecase) EndSession(ctx context.Context, userID int64, req *domain.EndSessionRequest) (*models.GameSession, *models.Wallet, error) {
	return u.walletRepo.EndSession(ctx, userID, repository.EndSessionParams{
		SessionID:  req.SessionID,
		ShotsFired: req.ShotsFired,
		FishKilled: req.FishKilled,
		TotalSpend: req.TotalSpend,
		TotalEarn:  req.TotalEarn,
	})
}
