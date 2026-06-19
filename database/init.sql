CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS roles (
    id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role_id    INT          NOT NULL DEFAULT 1 REFERENCES roles(id),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    max_players INT          NOT NULL DEFAULT 4,
    description TEXT,
    rtp         FLOAT        NOT NULL DEFAULT 0.95,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fishes (
    id                INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    health            INT          NOT NULL,
    reward_multiplier INT          NOT NULL,
    base_prob         FLOAT        NOT NULL DEFAULT 0.5,
    speed             FLOAT        NOT NULL DEFAULT 1.0,
    asset_path        TEXT         NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
    user_id    BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance    BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_sessions (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id     BIGINT      NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    shots_fired INT         NOT NULL DEFAULT 0,
    fish_killed INT         NOT NULL DEFAULT 0,
    total_spend BIGINT      NOT NULL DEFAULT 0,
    total_earn  BIGINT      NOT NULL DEFAULT 0,
    status      VARCHAR(20) NOT NULL DEFAULT 'active',
    started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS transactions (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id  BIGINT      REFERENCES game_sessions(id),
    amount      BIGINT      NOT NULL,
    type        VARCHAR(20) NOT NULL CHECK (type IN ('play', 'deposit', 'withdraw')),
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_revoked  BOOLEAN     NOT NULL DEFAULT false,
    device_name TEXT,
    ip_address  TEXT
);

-- Seed data
INSERT INTO roles (role_name) VALUES ('player'), ('admin') ON CONFLICT DO NOTHING;

INSERT INTO rooms (name, max_players, rtp) VALUES
    ('Sảnh Tân Thủ', 4, 0.95),
    ('Đại Dương',    4, 0.90)
ON CONFLICT DO NOTHING;

-- base_prob × reward_multiplier ≈ 1.0 tại RTP 100%
INSERT INTO fishes (name, health, reward_multiplier, base_prob, speed, asset_path) VALUES
    ('Cá Con',       10,  2,    0.5000, 1.2, '/assets/fish/small_fish.glb'),
    ('Cá Nhỡ',       30,  15,   0.0667, 1.0, '/assets/fish/mid_fish.glb'),
    ('Cá Heo',       60,  30,   0.0333, 0.8, '/assets/fish/dolphin.glb'),
    ('Cá Mập',       150, 100,  0.0100, 0.6, '/assets/fish/shark.glb'),
    ('Cá Voi',       300, 200,  0.0050, 0.5, '/assets/fish/whale.glb'),
    ('Tiên Cá Boss', 500, 1000, 0.0010, 0.3, '/assets/fish/mermaid_boss.glb'),
    ('Rồng Biển',    500, 5000, 0.0002, 0.2, '/assets/fish/sea_dragon.glb')
ON CONFLICT DO NOTHING;
