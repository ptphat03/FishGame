//go:build wireinject
// +build wireinject

package main

import (
	"github.com/google/wire"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ptphat03/Fish-Game/services/game-server/internal/repository"
	"github.com/ptphat03/Fish-Game/services/game-server/internal/usecase"
	gameHttp "github.com/ptphat03/Fish-Game/services/game-server/internal/transport/http"
	"github.com/ptphat03/Fish-Game/services/game-server/pkg/utils"
)

// InitializeApp khởi tạo WebSocket handler và các usecase cần thiết cho game engine.
// Repos/usecases cho Room, Fish, Wallet vẫn cần vì WS game engine dùng chúng trực tiếp.
func InitializeApp(db *pgxpool.Pool, tokenMaker utils.TokenMaker) (gameHttp.Handlers, error) {
	wire.Build(
		repository.NewRoomRepository,
		repository.NewFishRepository,
		repository.NewWalletRepository,
		usecase.NewRoomUsecase,
		usecase.NewFishUsecase,
		usecase.NewWalletUsecase,
		gameHttp.NewWSHandler,
		wire.Struct(new(gameHttp.Handlers), "*"),
	)
	return gameHttp.Handlers{}, nil
}
