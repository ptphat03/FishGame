package models

import "time"

type Room struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	MaxPlayers  int32     `json:"max_players"`
	Description *string   `json:"description"`
	RTP         float64   `json:"rtp"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Fish struct {
	ID               int32     `json:"id"`
	Name             string    `json:"name"`
	Health           int32     `json:"health"`
	RewardMultiplier int32     `json:"reward_multiplier"`
	BaseProb         float64   `json:"base_prob"`
	Speed            float64   `json:"speed"`
	AssetPath        string    `json:"asset_path"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type Wallet struct {
	UserID    int64     `json:"user_id"`
	Balance   int64     `json:"balance"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Transaction struct {
	ID          int64     `json:"id"`
	UserID      int64     `json:"user_id"`
	SessionID   *int64    `json:"session_id"`
	Amount      int64     `json:"amount"`
	Type        string    `json:"type"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type GameSession struct {
	ID         int64      `json:"id"`
	UserID     int64      `json:"user_id"`
	RoomID     int64      `json:"room_id"`
	ShotsFired int32      `json:"shots_fired"`
	FishKilled int32      `json:"fish_killed"`
	TotalSpend int64      `json:"total_spend"`
	TotalEarn  int64      `json:"total_earn"`
	Status     string     `json:"status"`
	StartedAt  time.Time  `json:"started_at"`
	EndedAt    *time.Time `json:"ended_at"`
}
