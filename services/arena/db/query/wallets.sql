-- name: GetWallet :one
SELECT user_id, balance, updated_at
FROM wallets
WHERE user_id = $1;

-- name: CreateWallet :one
INSERT INTO wallets (user_id, balance)
VALUES ($1, $2)
ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
RETURNING user_id, balance, updated_at;

-- name: UpdateWalletBalance :one
UPDATE wallets
SET balance = balance + $1, updated_at = NOW()
WHERE user_id = $2
  AND balance + $1 >= 0
RETURNING user_id, balance, updated_at;
