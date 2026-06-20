-- name: CloseOrphanedSessions :exec
UPDATE game_sessions
SET status = 'finished', ended_at = NOW()
WHERE user_id = $1
  AND status = 'active';

-- name: CreateGameSession :one
INSERT INTO game_sessions (user_id, room_id)
VALUES ($1, $2)
RETURNING id, user_id, room_id, shots_fired, fish_killed, total_spend, total_earn, status, started_at, ended_at;

-- name: GetGameSessionByID :one
SELECT id, user_id, room_id, shots_fired, fish_killed, total_spend, total_earn, status, started_at, ended_at
FROM game_sessions
WHERE id = $1;

-- name: EndGameSession :one
UPDATE game_sessions
SET status      = 'finished',
    shots_fired = $2,
    fish_killed = $3,
    total_spend = $4,
    total_earn  = $5,
    ended_at    = NOW()
WHERE id = $1
  AND status = 'active'
RETURNING id, user_id, room_id, shots_fired, fish_killed, total_spend, total_earn, status, started_at, ended_at;

-- name: ListGameSessionsByUserID :many
SELECT id, user_id, room_id, shots_fired, fish_killed, total_spend, total_earn, status, started_at, ended_at
FROM game_sessions
WHERE user_id = $1
ORDER BY started_at DESC
LIMIT $2 OFFSET $3;
