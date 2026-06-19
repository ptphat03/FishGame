-- name: ListRooms :many
SELECT id, name, min_bet, max_players, description, rtp, created_at, updated_at
FROM rooms
ORDER BY min_bet ASC;

-- name: GetRoomByID :one
SELECT id, name, min_bet, max_players, description, rtp, created_at, updated_at
FROM rooms
WHERE id = $1;

-- name: CreateRoom :one
INSERT INTO rooms (name, min_bet, max_players, description, rtp)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, name, min_bet, max_players, description, rtp, created_at, updated_at;

-- name: UpdateRoom :one
UPDATE rooms
SET name = $1, min_bet = $2, max_players = $3, description = $4, rtp = $5, updated_at = NOW()
WHERE id = $6
RETURNING id, name, min_bet, max_players, description, rtp, created_at, updated_at;

-- name: DeleteRoom :one
DELETE FROM rooms
WHERE id = $1
RETURNING id;
