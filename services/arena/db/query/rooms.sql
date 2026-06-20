-- name: ListRooms :many
SELECT id, name, max_players, description, rtp, created_at, updated_at
FROM rooms
ORDER BY id ASC;

-- name: GetRoomByID :one
SELECT id, name, max_players, description, rtp, created_at, updated_at
FROM rooms
WHERE id = $1;

-- name: CreateRoom :one
INSERT INTO rooms (name, max_players, description, rtp)
VALUES ($1, $2, $3, $4)
RETURNING id, name, max_players, description, rtp, created_at, updated_at;

-- name: UpdateRoom :one
UPDATE rooms
SET name = $1, max_players = $2, description = $3, rtp = $4, updated_at = NOW()
WHERE id = $5
RETURNING id, name, max_players, description, rtp, created_at, updated_at;

-- name: DeleteRoom :one
DELETE FROM rooms
WHERE id = $1
RETURNING id;
