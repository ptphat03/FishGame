-- name: CreateTransaction :one
INSERT INTO transactions (user_id, session_id, amount, type, description)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, user_id, session_id, amount, type, description, created_at;

-- name: ListTransactionsByUserID :many
SELECT id, user_id, session_id, amount, type, description, created_at
FROM transactions
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountTransactionsByUserID :one
SELECT COUNT(*) FROM transactions WHERE user_id = $1;
