package ws

import "encoding/json"

// InEnvelope is the JSON wrapper for all client→server messages.
type InEnvelope struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// outMsg serialises a typed payload into {"type":"...","payload":{...}}.
// Returns nil on marshal failure (should never happen with plain Go structs).
func outMsg(msgType string, payload any) []byte {
	type out struct {
		Type    string `json:"type"`
		Payload any    `json:"payload"`
	}
	b, err := json.Marshal(out{Type: msgType, Payload: payload})
	if err != nil {
		return nil
	}
	return b
}

// ── Incoming payloads ─────────────────────────────────────────────────────────

type JoinRoomPayload struct {
	RoomID int64 `json:"room_id"`
}

type ShootPayload struct {
	X         float32 `json:"x"`
	Y         float32 `json:"y"`
	Angle     float32 `json:"angle"`
	BetAmount int64   `json:"bet_amount"`
}

type HitFishPayload struct {
	FishID     int32  `json:"fish_id"`
	InstanceID string `json:"instance_id"`
}

// ── Outgoing payloads ─────────────────────────────────────────────────────────

type SessionStartedMsg struct {
	SessionID int64 `json:"session_id"`
	SeatID    int   `json:"seat_id"`
	Balance   int64 `json:"balance"`
}

type ShootAckMsg struct {
	ShotsFired int64 `json:"shots_fired"`
	TotalSpend int64 `json:"total_spend"`
	Balance    int64 `json:"balance"`
}

type HitResultMsg struct {
	Killed     bool   `json:"killed"`
	FishID     int32  `json:"fish_id"`
	InstanceID string `json:"instance_id"`
	Amount     int64  `json:"amount,omitempty"`
	Balance    int64  `json:"balance"`
	TotalEarn  int64  `json:"total_earn"`
	FishKilled int32  `json:"fish_killed"`
}

type SessionEndedMsg struct {
	Session SessionSummary `json:"session"`
	Wallet  walletInfo     `json:"wallet"`
}

type SessionSummary struct {
	TotalEarn  int64 `json:"total_earn"`
	TotalSpend int64 `json:"total_spend"`
	FishKilled int32 `json:"fish_killed"`
	ShotsFired int32 `json:"shots_fired"`
}

type walletInfo struct {
	Balance int64 `json:"balance"`
}

type SpawnFishMsg struct {
	InstanceID string `json:"instance_id"`
	FishID     int32  `json:"fish_id"`
	PathID     int32  `json:"path_id"`
	SpawnTime  int64  `json:"spawn_time"` // Unix milliseconds
	Duration   int32  `json:"duration"`   // seconds
}

type BroadcastShootMsg struct {
	SeatID int     `json:"seat_id"`
	X      float32 `json:"x"`
	Y      float32 `json:"y"`
	Angle  float32 `json:"angle"`
}

type BroadcastKillMsg struct {
	InstanceID string `json:"instance_id"`
	SeatID     int    `json:"seat_id"`
}

type ErrorMsg struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
