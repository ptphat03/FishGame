package domain

type StartSessionRequest struct {
	RoomID int64 `json:"room_id" binding:"required,min=1"`
}

type EndSessionRequest struct {
	SessionID  int64 `json:"session_id"  binding:"required,min=1"`
	ShotsFired int32 `json:"shots_fired" binding:"min=0"`
	FishKilled int32 `json:"fish_killed" binding:"min=0"`
	TotalSpend int64 `json:"total_spend" binding:"min=0"`
	TotalEarn  int64 `json:"total_earn"  binding:"min=0"`
}
