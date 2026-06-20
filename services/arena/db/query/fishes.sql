-- name: ListFishes :many
SELECT id, name, health, reward_multiplier, base_prob, speed, asset_path, created_at, updated_at
FROM fishes
ORDER BY reward_multiplier ASC;

-- name: GetFishByID :one
SELECT id, name, health, reward_multiplier, base_prob, speed, asset_path, created_at, updated_at
FROM fishes
WHERE id = $1;

-- name: CreateFish :one
INSERT INTO fishes (name, health, reward_multiplier, base_prob, speed, asset_path)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, name, health, reward_multiplier, base_prob, speed, asset_path, created_at, updated_at;

-- name: UpdateFish :one
UPDATE fishes
SET name = $1, health = $2, reward_multiplier = $3, base_prob = $4, speed = $5, asset_path = $6, updated_at = NOW()
WHERE id = $7
RETURNING id, name, health, reward_multiplier, base_prob, speed, asset_path, created_at, updated_at;

-- name: DeleteFish :one
DELETE FROM fishes
WHERE id = $1
RETURNING id;
