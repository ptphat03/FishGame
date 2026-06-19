package repository

import (
	"context"
	"errors"

	"github.com/ptphat03/Fish-Game/services/game-server/internal/models"
	"github.com/ptphat03/Fish-Game/services/game-server/internal/repository/dbgen"
	"github.com/ptphat03/Fish-Game/services/game-server/pkg/apperror"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RoomRepository interface {
	GetByID(ctx context.Context, id int64) (*models.Room, error)
}

type roomPgRepo struct {
	queries *dbgen.Queries
}

func NewRoomRepository(pool *pgxpool.Pool) RoomRepository {
	return &roomPgRepo{queries: dbgen.New(pool)}
}

// pgtextToPtr chuyển pgtype.Text (nullable DB) → *string (Go chuẩn)
func pgtextToPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	s := t.String
	return &s
}

func mapToModelRoom(r dbgen.Room) models.Room {
	return models.Room{
		ID:          r.ID,
		Name:        r.Name,
		MaxPlayers:  r.MaxPlayers,
		Description: pgtextToPtr(r.Description),
		RTP:         r.Rtp,
		CreatedAt:   r.CreatedAt.Time,
		UpdatedAt:   r.UpdatedAt.Time,
	}
}

func (r *roomPgRepo) GetByID(ctx context.Context, id int64) (*models.Room, error) {
	row, err := r.queries.GetRoomByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.ErrRoomNotFound
		}
		return nil, apperror.Wrap("repository", "roomRepo.GetByID", err)
	}
	room := mapToModelRoom(row)
	return &room, nil
}
