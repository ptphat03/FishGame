-- name: ListFishes :many
SELECT id, name, health, reward_multiplier, speed, asset_path, created_at, updated_at
FROM fishes
ORDER BY reward_multiplier ASC;

-- name: GetFishByID :one
SELECT id, name, health, reward_multiplier, speed, asset_path, created_at, updated_at
FROM fishes
WHERE id = $1;

-- name: CreateFish :one
INSERT INTO fishes (name, health, reward_multiplier, speed, asset_path)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, name, health, reward_multiplier, speed, asset_path, created_at, updated_at;

-- name: UpdateFish :one
UPDATE fishes
SET name = $1, health = $2, reward_multiplier = $3, speed = $4, asset_path = $5, updated_at = NOW()
WHERE id = $6
RETURNING id, name, health, reward_multiplier, speed, asset_path, created_at, updated_at;

-- name: DeleteFish :one
DELETE FROM fishes
WHERE id = $1
RETURNING id;
