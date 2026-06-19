# PHÂN TÍCH NGHIỆP VỤ DỰ ÁN FISH GAME

> Nguồn phân tích: `Fish-Game/README.md`, `Fish-Game/src/App.tsx`, `Fish-Game/package.json`, thư mục `DOC/` (video + ảnh tham chiếu lối chơi).
> Mục tiêu: Tách nghiệp vụ rõ ràng cho **Agent Back-End** và **Agent Front-End** để 2 agent có thể làm song song mà không giẫm chân nhau.

---

## 1. Tổng quan hệ thống

Dự án gồm 3 thành phần lớn:

1. **CMS Admin (Web Frontend)** — đã có khung UI ở `Fish-Game/src/App.tsx`.
2. **Gameplay Client (Web Frontend)** — màn hình bắn cá thực tế, hiện mới có placeholder `GamePlayPlaceholder`.
3. **Game Server (Back-End)** — REST API cho CMS + WebSocket Server cho gameplay realtime, hiện thư mục `Fish-Back-End` còn trống.

Cơ chế tính thưởng đặc biệt: **không dùng HP truyền thống**, mà dùng **Multiplier (hệ số nhân)** + **Base probability (tỷ lệ nổ gốc)** + **RTP (Return to Player)** theo phòng và theo người chơi.

---

## 2. Agent FRONT-END — Nghiệp vụ phải làm

### 2.1. Module CMS Admin (đã có khung, cần hoàn thiện + nối API)

| # | Nghiệp vụ | Mô tả công việc | File / Component liên quan |
|---|-----------|-----------------|----------------------------|
| FE-CMS-01 | Đăng nhập / Đăng xuất Admin | Form login, lưu token, nút Đăng xuất ở sidebar | Mới (chưa có) |
| FE-CMS-02 | Dashboard tổng quan | 4 thẻ KPI (Người chơi hiện tại, Doanh thu, Lượt tải, Số cá bị tiêu diệt) + biểu đồ Area 7 ngày qua | `DashboardTab` |
| FE-CMS-03 | Quản lý Người chơi | Bảng danh sách, lọc, tìm kiếm, hiển thị Vàng / Trạng thái / RTP cá nhân, hành động Sửa, Khoá, Tặng quà | `PlayersTab` |
| FE-CMS-04 | Cấu hình Chỉ số Cá 2D | Grid card hiển thị mỗi loại cá (id, tên, multiplier, base prob, speed, role: Thường/Vừa/Boss); CRUD cá | `FishConfigTab` |
| FE-CMS-05 | Quản lý Phòng chơi | Grid card phòng (loại, mức cược, số người, RTP base); CRUD phòng + nút "Xem trực tiếp" | `RoomsTab` |
| FE-CMS-06 | Cài đặt Hệ thống | Cấu hình chung: tên game, % phí, ngưỡng cảnh báo, banner | `settings` (đang placeholder) |
| FE-CMS-07 | Theo dõi trạng thái server | Đèn pulse "Online/Offline" cuối sidebar — gọi health-check API | Sidebar |
| FE-CMS-08 | Tìm kiếm toàn cục | Ô search ở topbar — search người chơi / phòng / cá | Topbar |
| FE-CMS-09 | Routing & State | Hiện đang dùng `useState('activeTab')` — nên chuyển sang React Router để có URL riêng cho từng trang | `App.tsx` |

### 2.2. Module Gameplay Client (mới có placeholder, làm gần như từ đầu)

| # | Nghiệp vụ | Mô tả công việc |
|---|-----------|-----------------|
| FE-GAME-01 | Sảnh chọn phòng | Màn hình list phòng dành cho người chơi (khác với CMS), filter theo mức cược |
| FE-GAME-02 | Vào / Rời phòng | Kết nối WebSocket khi vào phòng, ngắt khi rời, chiếm 1 trong 4 ghế (cannon slot) |
| FE-GAME-03 | Render khung cảnh đại dương | Canvas 2D (Pixi.js / Phaser / Konva) — background, hiệu ứng nước |
| FE-GAME-04 | Hệ thống cá bơi | Spawn cá theo lệnh server, animation di chuyển theo path (Cá nhỏ, Cá đuối, Cá mập, Tiên cá Boss…) |
| FE-GAME-05 | Pháo (Cannon) & Đạn | 4 vị trí pháo, mỗi pháo có level (mức cược/đạn), bắn ra đạn theo góc người dùng click |
| FE-GAME-06 | Tăng/giảm mức cược | Nút +/- thay đổi mức cược/đạn (10, 100, 1000, 10000 vàng) |
| FE-GAME-07 | Hit detection (client-side) | Phát hiện đạn chạm cá để hiển thị animation; **kết quả nổ phải do server quyết định**, client chỉ chờ event |
| FE-GAME-08 | Hiệu ứng nổ + cộng vàng | Khi server trả `fish_killed` → animation nổ + bay vàng vào HUD |
| FE-GAME-09 | HUD trong game | Hiển thị: Avatar + Tên + Vàng (ô trên trái), Phòng + Cược (ô trên phải) |
| FE-GAME-10 | Chat / Emote nhanh | (Tuỳ chọn) chat in-room realtime |
| FE-GAME-11 | Âm thanh | SFX bắn, nổ, trúng boss + nhạc nền, có nút mute |
| FE-GAME-12 | Reconnect logic | Khi mất WebSocket → tự reconnect, đồng bộ lại state phòng |

### 2.3. Việc dọn dẹp kỹ thuật chung của FE Agent

- Tách `App.tsx` (hiện 525 dòng, mọi tab gom chung) thành các component riêng `pages/` và `components/`.
- Tạo layer `services/api.ts` (axios/fetch) + `services/socket.ts` (WebSocket client) để tách logic gọi server khỏi UI.
- Định nghĩa **TypeScript types** dùng chung với BE (Player, Fish, Room, GameEvent…).
- Bỏ dữ liệu hard-code (`data`, `players`, `fishes`, `rooms` trong `App.tsx`) → thay bằng dữ liệu từ API.
- Cấu hình `.env` cho `VITE_API_URL`, `VITE_WS_URL`.
- Viết Dockerfile production cho cả 2 phần CMS & Gameplay (đã có `Dockerfile` mẫu).

---

## 3. Agent BACK-END — Nghiệp vụ phải làm

> **Stack: Golang.** Thư mục `Fish-Back-End` hiện chỉ có file `.idea` (GoLand) → khởi tạo lại module Go.
>
> **Đề xuất thư viện chuẩn cho dự án:**
> - HTTP / REST: **Gin** hoặc **Echo** (gợi ý Gin vì cộng đồng + middleware sẵn).
> - WebSocket: **gorilla/websocket** (ổn định, là chuẩn de-facto) hoặc **nhooyr/websocket** (gọn, hiện đại hơn).
> - ORM / DB: **GORM** + Postgres (driver `pgx`); migrate bằng **golang-migrate**.
> - Cache / Pub-Sub: **go-redis** với Redis.
> - Cấu hình: **viper** + file `.env` / YAML.
> - Logging: **zap** hoặc **zerolog** (structured logging, perf cao).
> - Validation: **go-playground/validator**.
> - JWT: **golang-jwt/jwt**.
> - Test: `testing` chuẩn + **testify** + **gomock**; load test bằng **vegeta** hoặc **k6**.
> - Lint: `golangci-lint`. Quản lý job nền: **asynq** (queue trên Redis) cho aggregator stats.
>
> **Cấu trúc thư mục đề xuất** (Clean Architecture / hexagonal):
> ```
> Fish-Back-End/
>   cmd/
>     api/        # REST server cho CMS
>     gameserver/ # WebSocket server cho gameplay
>     worker/     # Job định kỳ (stats, audit)
>   internal/
>     domain/        # Entity: Player, Fish, Room, Wallet, Transaction
>     usecase/       # Business logic (RTP engine, spawn, ledger)
>     repository/    # GORM impl, redis impl
>     transport/
>       http/        # Handler Gin
>       ws/          # Hub, Client, Room
>     middleware/
>     config/
>     pkg/
>   migrations/      # SQL migration
>   deploy/          # Dockerfile, docker-compose, k8s
>   go.mod
>   go.sum
> ```

### 3.1. Nhóm REST API phục vụ CMS

| # | Nghiệp vụ | Endpoint gợi ý | Output cho FE |
|---|-----------|---------------|---------------|
| BE-API-01 | Auth admin | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | JWT, role |
| BE-API-02 | Health-check | `GET /health` | uptime, status |
| BE-API-03 | Dashboard stats | `GET /stats/overview`, `GET /stats/timeseries?range=7d` | KPI + dữ liệu biểu đồ |
| BE-API-04 | CRUD Người chơi | `GET/POST/PUT/DELETE /players`, `POST /players/{id}/ban`, `POST /players/{id}/gift`, `PUT /players/{id}/rtp` | Player list/detail |
| BE-API-05 | CRUD Cấu hình cá | `GET/POST/PUT/DELETE /fishes` (multiplier, base prob, speed, role) | Fish config | 
| BE-API-06 | CRUD Phòng chơi | `GET/POST/PUT/DELETE /rooms`, `PUT /rooms/{id}/rtp` | Room list/detail |
| BE-API-07 | Lịch sử giao dịch | `GET /transactions?playerId=&type=` | Audit log thắng/thua/nạp/rút |
| BE-API-08 | Cài đặt hệ thống | `GET/PUT /settings` | Config global |
| BE-API-09 | Tìm kiếm tổng | `GET /search?q=` | Mix players, rooms, fishes |

### 3.2. Nhóm Game Server (WebSocket Realtime)

| # | Nghiệp vụ | Sự kiện WS | Mô tả |
|---|-----------|-----------|-------|
| BE-WS-01 | Auth player & join room | `join_room` / `joined` | Xác thực token, gán slot 0–3 trong phòng |
| BE-WS-02 | Spawn cá định kỳ | `fish_spawn` | Tick theo cấu hình phòng, sinh đàn cá theo phân phối base prob |
| BE-WS-03 | Đồng bộ vị trí cá | `fish_state` | Server là **authoritative**, gửi snapshot/delta cho 4 client |
| BE-WS-04 | Bắn đạn | `shoot` (client → server) | Trừ vàng = mức cược/đạn; ghi log shot |
| BE-WS-05 | Quyết định nổ cá | `fish_killed` (server → all) | **Đây là nghiệp vụ lõi**: tính prob = base_prob × multiplier RTP phòng × hệ số RTP người chơi; rút random; nếu trúng → cộng vàng = bet × multiplier |
| BE-WS-06 | Cập nhật vàng người chơi | `wallet_update` | Realtime đồng bộ số dư |
| BE-WS-07 | Người chơi rời phòng | `leave_room` | Giải phóng slot, dọn state |
| BE-WS-08 | Heartbeat / Ping-pong | `ping` / `pong` | Phát hiện disconnect, cho phép reconnect trong N giây trước khi kick |
| BE-WS-09 | Xem trực tiếp (Admin spectate) | `spectate_room` | Admin từ CMS join chế độ chỉ xem, không chiếm slot |
| BE-WS-10 | Boss event | `boss_appear`, `boss_killed` | Sự kiện đặc biệt với multiplier rất cao (Tiên Cá x1000) |

### 3.3. Nhóm Domain / Logic lõi

| # | Nghiệp vụ | Mô tả |
|---|-----------|-------|
| BE-CORE-01 | Hệ thống RTP nhiều tầng | RTP toàn server → RTP phòng (75–90%) → RTP cá nhân (cho phép admin "kèo riêng" 1 player). Công thức xác định cuối cùng cho tỷ lệ nổ cá |
| BE-CORE-02 | Engine RNG & kiểm toán | Random có seed có thể audit, log mọi quyết định nổ để chống gian lận và truy vết khiếu nại |
| BE-CORE-03 | Wallet / Ledger | Mọi thay đổi vàng phải qua ledger transaction (debit/credit), không ghi đè số dư trực tiếp |
| BE-CORE-04 | Anti-cheat / Rate limit | Giới hạn tần suất bắn, kiểm tra góc bắn hợp lệ, phát hiện auto-clicker |
| BE-CORE-05 | Fish spawn algorithm | Phân phối loại cá theo trọng số role (Thường/Vừa/Boss), cooldown cho boss |
| BE-CORE-06 | Path generator cho cá | Sinh đường đi (Bezier / spline) cho từng cá, gửi trước cho client để giảm băng thông |
| BE-CORE-07 | Statistics aggregator | Job định kỳ tổng hợp số liệu cho dashboard (daily/weekly) |
| BE-CORE-08 | Notification | Push event lên kênh admin khi: phát hiện player thắng bất thường, server quá tải, RTP lệch ngưỡng |

### 3.4. Database Schema chi tiết (Postgres)

> Đây là schema **bắt buộc tối thiểu**. Mọi bảng đều có `id BIGSERIAL`, `created_at`, `updated_at`. Tiền tệ lưu bằng `BIGINT` (đơn vị xu — 1 vàng = 100 xu) để tránh sai số float.

```sql
-- Người chơi (game) và admin (CMS)
players(id, username UNIQUE, password_hash, display_name, status ENUM('active','banned','locked'),
        last_login_at, personal_rtp NUMERIC(5,2) DEFAULT 100.00, vip_level INT DEFAULT 0)

admins(id, username UNIQUE, password_hash, role ENUM('superadmin','operator','viewer'))

-- Ví & Sổ cái (KHÔNG ghi đè số dư trực tiếp)
wallets(player_id PK FK, balance BIGINT DEFAULT 0, version INT)  -- optimistic lock
transactions(id, player_id FK, type ENUM('shot','win','gift','deposit','withdraw','adjust'),
             amount BIGINT, balance_after BIGINT, ref_shot_id, ref_kill_id, idempotency_key UNIQUE,
             metadata JSONB)

-- Phòng & ghế ngồi
rooms(id, name, type ENUM('newbie','advanced','pro','vip','boss'), bet_per_shot BIGINT,
      max_players INT DEFAULT 4, base_rtp NUMERIC(5,2), status ENUM('open','closed','maintenance'))

room_seats(room_id, seat_index 0..3, occupied_by player_id NULL, joined_at, PRIMARY KEY(room_id, seat_index))

-- Cấu hình cá
fish_configs(id, code UNIQUE, name, multiplier INT, base_prob NUMERIC(7,4),
             speed ENUM('slow','medium','fast','very_slow'),
             role ENUM('common','medium','boss'), enabled BOOLEAN)

-- Audit gameplay
game_sessions(id, room_id, started_at, ended_at, total_bet, total_payout, server_rtp_actual)
shots(id, session_id, player_id, room_id, bet_amount, angle, shot_at, idempotency_key UNIQUE)
fish_kills(id, shot_id FK, fish_id FK, payout BIGINT, rng_seed, prob_used NUMERIC(7,6), killed_at)
audit_logs(id, actor_type ENUM('admin','player','system'), actor_id, action, target, payload JSONB, ip)

-- Cài đặt hệ thống
settings(key PK, value JSONB, updated_by)
```

**Index cần có**: `transactions(player_id, created_at DESC)`, `shots(room_id, shot_at DESC)`, `fish_kills(killed_at DESC)`, `players(username)`.

### 3.5. REST API Contract chi tiết

> Tất cả endpoint admin yêu cầu `Authorization: Bearer <jwt>` trong header. Response theo chuẩn `{ "data": ..., "error": null }` hoặc `{ "data": null, "error": { "code": "...", "message": "..." } }`.

| Method | Path | Body / Query | Response | Mô tả |
|--------|------|--------------|----------|-------|
| POST | `/api/v1/auth/login` | `{username, password}` | `{token, expiresAt, admin}` | Login admin |
| POST | `/api/v1/auth/refresh` | `{refreshToken}` | `{token}` | Refresh JWT |
| GET  | `/api/v1/me` | — | `{admin}` | Profile hiện tại |
| GET  | `/api/v1/health` | — | `{status, uptime, deps:{db,redis,ws}}` | Health-check |
| GET  | `/api/v1/stats/overview` | — | `{onlinePlayers, todayRevenue, newSignups, fishKilledCount}` | KPI dashboard |
| GET  | `/api/v1/stats/timeseries` | `?range=7d&metric=players,revenue` | `[{date, players, revenue}]` | Biểu đồ |
| GET  | `/api/v1/players` | `?page=&size=&q=&status=` | `{items, total}` | Danh sách player |
| GET  | `/api/v1/players/{id}` | — | Player detail | |
| PUT  | `/api/v1/players/{id}` | `{displayName, personalRtp, vipLevel}` | Player | Sửa player |
| POST | `/api/v1/players/{id}/ban` | `{reason}` | Player | Khoá tài khoản |
| POST | `/api/v1/players/{id}/unban` | — | Player | Mở khoá |
| POST | `/api/v1/players/{id}/gift` | `{amount, note}` | Transaction | Cộng vàng quà tặng |
| GET  | `/api/v1/fishes` | — | `[FishConfig]` | List cá |
| POST | `/api/v1/fishes` | FishConfig | FishConfig | Thêm cá |
| PUT  | `/api/v1/fishes/{id}` | FishConfig | FishConfig | Sửa cá |
| DELETE | `/api/v1/fishes/{id}` | — | — | Vô hiệu hoá cá |
| GET  | `/api/v1/rooms` | — | `[Room]` | List phòng |
| POST | `/api/v1/rooms` | Room | Room | Tạo phòng |
| PUT  | `/api/v1/rooms/{id}` | Room | Room | Sửa phòng |
| PUT  | `/api/v1/rooms/{id}/rtp` | `{baseRtp}` | Room | Điều RTP |
| GET  | `/api/v1/transactions` | `?playerId=&type=&from=&to=` | `{items, total}` | Lịch sử giao dịch |
| GET  | `/api/v1/audit-logs` | `?actor=&action=&from=&to=` | `{items, total}` | Audit |
| GET  | `/api/v1/settings` | — | Settings | |
| PUT  | `/api/v1/settings` | Settings | Settings | |

**API cho Player (game client) — port riêng hoặc cùng port:**

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/api/v1/player/auth/login` | Login player (username + password / OTP) |
| POST | `/api/v1/player/auth/register` | Đăng ký |
| GET  | `/api/v1/player/wallet` | Số dư hiện tại |
| GET  | `/api/v1/player/rooms` | Sảnh phòng cho player |
| GET  | `/api/v1/player/ws-ticket` | Lấy ticket 1 lần để mở WS (chống nhúng JWT vào URL) |

### 3.6. WebSocket Protocol chi tiết

**Endpoint:** `wss://server/game?ticket=<one-time-ticket>`

**Format envelope** mọi message:
```json
{ "type": "shoot", "seq": 12, "ts": 1715040000123, "data": { ... } }
```

**Bảng event:**

| Hướng | Type | Payload | Mô tả |
|-------|------|---------|-------|
| C→S | `join_room` | `{roomId, seatPreference?}` | Yêu cầu vào phòng |
| S→C | `joined` | `{roomId, seatIndex, snapshot:{players, fishes, balance}}` | Xác nhận đã vào |
| S→C | `room_state` | `{players[], seats[]}` | Khi có thay đổi ghế |
| S→C | `fish_spawn` | `{batch:[{id, fishCode, path, spawnAt, expireAt}]}` | Server gửi đường đi định trước |
| S→C | `fish_despawn` | `{ids:[...]}` | Cá ra khỏi màn hình |
| C→S | `shoot` | `{bullet:{id, angle, power, fromSeat}, idempotencyKey}` | Bắn 1 phát |
| S→C | `shot_ack` | `{bulletId, costAmount, balanceAfter}` | Server đã trừ vàng |
| C→S | `claim_hit` | `{bulletId, fishId}` | Client tuyên bố bắn trúng (server xác nhận) |
| S→C | `fish_killed` | `{fishId, byBulletId, payout, killerSeat, balanceAfter}` | Quyết định cuối cùng |
| S→C | `fish_miss` | `{fishId, byBulletId}` | Không trúng (random rớt) |
| S→C | `wallet_update` | `{balance, delta, reason}` | Đồng bộ ví |
| S→C | `boss_appear` | `{fishId, multiplier, durationMs}` | Boss xuất hiện |
| S→C | `boss_killed` | `{fishId, jackpotAmount, killerSeat}` | Hạ boss |
| C→S | `leave_room` | — | Rời phòng |
| C↔S | `ping`/`pong` | `{ts}` | Heartbeat 15s |
| C→S | `spectate_room` *(admin)* | `{roomId}` | Admin xem trực tiếp |
| S→C | `error` | `{code, message}` | Lỗi nghiệp vụ |

**Quy tắc an toàn:**
- Server **authoritative tuyệt đối**: client gửi `claim_hit`, server quyết định kết quả dựa RTP + RNG.
- Mọi `shoot` phải có `idempotencyKey` (UUID) để chống double-shot do reconnect.
- Bullet & fish path được server pre-generate, client chỉ chạy animation.

### 3.7. Thuật toán RTP Engine (logic LÕI quan trọng nhất)

**3 tầng RTP:**

```
final_prob(fish, player, room) =
    base_prob[fish]                       -- cấu hình cá
  × room_rtp_multiplier(room.base_rtp)    -- VD 90% → ×0.9
  × player_rtp_multiplier(player.personal_rtp)
  × pool_correction(room)                 -- điều chỉnh động theo pool
```

**Pool correction (để giữ RTP thực tế quanh mức base):**
- Mỗi `room` duy trì cửa sổ trượt (sliding window) gần nhất N=10000 phát: `total_bet`, `total_payout`.
- Tính `actual_rtp = total_payout / total_bet`.
- Nếu `actual_rtp > base_rtp` → giảm prob (server đang trả nhiều quá).
- Nếu `actual_rtp < base_rtp` → tăng prob.
- Hệ số điều chỉnh dùng PID controller hoặc đơn giản: `correction = clamp(base_rtp / actual_rtp, 0.5, 1.5)`.

**Quyết định 1 phát bắn (pseudo-Go):**

```go
func (e *RTPEngine) ResolveShot(shot Shot, fish Fish, player Player, room Room) ShotResult {
    base := fish.BaseProb
    p := base * room.RTPMultiplier() * player.RTPMultiplier() * e.PoolCorrection(room.ID)
    p = clamp(p, 0, 1)
    seed := e.NextSeed()              // có thể audit lại
    roll := rng.Float64WithSeed(seed)
    if roll < p {
        payout := shot.BetAmount * fish.Multiplier
        return ShotResult{Killed: true, Payout: payout, Prob: p, Seed: seed}
    }
    return ShotResult{Killed: false, Prob: p, Seed: seed}
}
```

**Yêu cầu kiểm thử RTP:**
- Test bằng table-driven với 1 triệu shot mô phỏng → RTP thực tế phải nằm trong ±2% so với cấu hình.
- Lưu mọi `seed` + `prob_used` vào `fish_kills` để audit khi player khiếu nại.

### 3.8. Mô hình Concurrency Game Server (Go)

```
                ┌────────────────┐
   WS conn ───► │   readPump     │ ──► commands chan ──┐
                └────────────────┘                     ▼
                                              ┌──────────────┐
                                              │  Room loop   │  goroutine /room
                                              │  (tick 30Hz) │  - spawn cá
                                              │              │  - dispatch shoot
                                              └──────┬───────┘
                                                     │ broadcast chan
                ┌────────────────┐                   ▼
   WS conn ◄── │   writePump    │ ◄── outbound chan
                └────────────────┘
```

**Quy tắc:**
- 1 goroutine `Hub` quản map `roomID → *Room`, dùng RWMutex.
- 1 `Room` = 1 goroutine vòng lặp tick 30 Hz; tất cả mutation state phải trong goroutine này (chuyển message qua channel) → **không cần mutex trong Room**.
- 1 `Client` = 2 goroutine (read + write), giao tiếp với Room qua `commands chan` và `outbound chan`.
- Backpressure: outbound buffer = 64; nếu đầy → kick client (client quá chậm).
- Bắt buộc chạy `go test -race` trên CI.

### 3.9. Anti-cheat & Bảo mật

- **Rate limit shot**: mỗi player tối đa 10 shot/giây, vượt → drop + cảnh báo. Token bucket lưu trong Redis.
- **Validate angle**: angle ∈ [0, 2π), `power` thuộc danh sách hợp lệ.
- **Replay protection**: `idempotencyKey` unique trong 5 phút.
- **WS ticket dùng 1 lần**: tránh chia sẻ token; ticket sống 30s, đổi lấy session sau khi connect.
- **JWT**: HS256 với secret rotate được, exp 30 phút, refresh token 7 ngày.
- **Password**: bcrypt cost 12.
- **CORS**: whitelist origin của CMS + game client.
- **PII**: KHÔNG log password, mask username trong audit log.
- **Idempotency** cho mọi mutation tài chính (`gift`, `adjust`).
- **Database**: dùng `SERIALIZABLE` cho transaction wallet, hoặc `optimistic lock` qua cột `version`.

### 3.10. Hạ tầng & Phi chức năng (Go-specific)

- **Database**: Postgres + GORM. Bảng: `players`, `wallets`, `transactions`, `rooms`, `fish_configs`, `settings`, `audit_logs`, `game_sessions`, `shots`. Migration version-controlled bằng `golang-migrate`.
- **Cache**: Redis (`go-redis`) — lưu session WS, online players, ratelimit token bucket, leaderboard tạm bằng ZSET.
- **Concurrency model cho Game Server**:
  - 1 goroutine `Hub` quản lý map `roomID → *Room`.
  - Mỗi `Room` chạy 1 goroutine vòng lặp tick (spawn cá, broadcast snapshot 20–30 fps).
  - Mỗi `Client` có 2 goroutine: `readPump` và `writePump`, giao tiếp với Room qua channel.
  - Dùng `sync.RWMutex` hoặc channel cho state, tránh race — bắt buộc chạy `go test -race`.
- **Logging**: `zap` JSON structured, log mọi shot + quyết định nổ vào `audit_logs` (đảm bảo audit cờ bạc).
- **Tracing**: OpenTelemetry → Jaeger để trace 1 shot từ HTTP/WS → usecase → DB.
- **Graceful shutdown**: `signal.Notify` cho SIGTERM, đóng listener, drain các Room, flush ledger.
- **Build & Deploy**: multi-stage `Dockerfile` (build với `golang:1.23-alpine`, runtime `gcr.io/distroless/static`); `docker-compose.yml` chạy chung Postgres + Redis + 2 service `api` và `gameserver`.
- **Test**:
  - Unit cho **RTP engine** (cực quan trọng) — bảng test với hàng ngàn case bằng `testify`.
  - Integration cho WS flow bằng `httptest` + `gorilla/websocket` client giả.
  - Load test 4 user × N phòng bằng **k6** hoặc Go test với goroutine simulator.
- **CI/CD**: GitHub Actions chạy `golangci-lint`, `go test -race -cover`, build image, push registry; môi trường dev/staging/prod.

---

## 4. Hợp đồng giữa 2 Agent (Interface Contract)

Hai agent phải **khoá cứng** các điểm sau để làm song song được:

1. **Schema dữ liệu chung**: Player, Fish, Room, Transaction, GameEvent.
   - BE Agent (Go) dùng `struct` + tag `json:"..."`, viết tại `internal/domain`.
   - FE Agent gen TypeScript type từ OpenAPI spec hoặc dùng tool **`tygo`** để convert struct Go → TS tự động.
2. **OpenAPI 3 spec** cho REST: BE viết bằng **swaggo/swag** (sinh từ comment Go), FE dùng `openapi-typescript` để gen client.
3. **WebSocket event spec** — file `docs/WS_PROTOCOL.md` định nghĩa: tên event, hướng (C→S / S→C), payload JSON, ví dụ. BE Agent định nghĩa enum event tại `internal/transport/ws/events.go`.
4. **Quy ước mã lỗi** thống nhất (ví dụ `E_INSUFFICIENT_GOLD`, `E_ROOM_FULL`) — đặt ở 1 file Go const + export sang FE.
5. **Mock server cho FE**: trong tuần đầu BE Agent có thể chạy nhanh handler trả fixture JSON (Gin route trỏ vào `testdata/*.json`) để FE không bị block.

---

## 5. Đề xuất thứ tự ưu tiên (Sprint plan gợi ý)

**Sprint 1 — Móng:**
- BE (Go): Khởi tạo `go mod`, dựng cấu trúc thư mục, Postgres + Redis qua `docker-compose`, migrate schema, Auth JWT, Player/Fish/Room CRUD, Swagger sinh tự động.
- FE: Tách `App.tsx` thành component nhỏ, dựng `services/api.ts` (axios), nối CMS với 4 API trên.

**Sprint 2 — Gameplay tối thiểu:**
- BE (Go): Game server với `gorilla/websocket`, `Hub`/`Room`/`Client` goroutine, event `join_room`, `fish_spawn`, `shoot`, `fish_killed` (RTP phòng đơn giản); chạy `go test -race`.
- FE: Canvas cá bơi (Pixi.js / Phaser) + bắn + nổ, HUD vàng, kết nối WS realtime.

**Sprint 3 — RTP nâng cao + Dashboard:**
- BE (Go): RTP cá nhân, wallet ledger có transaction Postgres, asynq worker tổng hợp stats, audit log mọi shot.
- FE: Dashboard hiển thị số liệu thật từ `/stats/*`, Spectate mode, UI quản lý RTP từng player.

**Sprint 4 — Polish:**
- BE (Go): Rate-limit (token bucket Redis), anti-cheat (frequency / angle check), boss event, k6 load test 1000 concurrent player, graceful shutdown, OpenTelemetry tracing.
- FE: Âm thanh, animation đẹp, reconnect WS có backoff, responsive mobile, Docker prod multi-stage.

---

*Tài liệu này được tạo dựa trên phân tích README + source code frontend hiện có. Khi spec gốc (video trong `DOC/`) có thêm chi tiết về luật chơi cụ thể, mục 3.3 (Logic lõi) cần được cập nhật.*
