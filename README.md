# Fish Game — Multiplayer Fish Shooting Game

A real-time multiplayer fish-shooting game with a microservices backend. Up to 4 players share the same room, shoot fish to earn coins, and compete simultaneously.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                       Client Layer                       │
│   React (Web) ──────────── Unity (Mobile) [In Progress] │
└───────────────┬──────────────────────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
   ┌────▼────┐      ┌────▼────┐
   │   hub   │      │  arena  │
   │ .NET 8  │      │   Go    │
   │  :5100  │      │  :8080  │
   │ REST API│      │   WS    │
   └────┬────┘      └────┬────┘
        └───────┬─────────┘
           ┌────▼─────┐
           │PostgreSQL │
           │  :5433    │
           └───────────┘
```

| Service | Role | Stack |
|---------|------|-------|
| **hub** | Auth, rooms, fish config, wallet — REST API | ASP.NET Core 8, EF Core, Npgsql, JWT |
| **arena** | Real-time game sessions, fish spawning — WebSocket only | Go 1.23, Gin, Gorilla WebSocket, pgx/v5, sqlc, Wire |
| **react** | Web client | React 18, Vite 5, TypeScript, Tailwind CSS 3, Zustand, TanStack Query |
| **unity** | Desktop/mobile client | Unity — *in development* |

---

## Project Structure

```
Fish-Game/
├── client/
│   │   ├── src/
│   │   │   ├── game/
│   │   │   │   ├── entities/     
│   │   │   │   └── GameCanvas.tsx
│   │   │   ├── hooks/            
│   │   │   ├── pages/            
│   │   │   ├── stores/           
│   │   │   └── types/
│   │   ├── nginx.conf            
│   │   └── Dockerfile            
│   └── unity                          
├── database/
│   └── init.sql                  
├── docker/
│   └── hub.Dockerfile
├── proto/
│   └── fish_game.proto           
├── services/
│   ├── arena/                    
│   │   ├── cmd/server/           
│   │   └── internal/
│   │       ├── ws/               
│   │       ├── usecase/
│   │       ├── repository/       
│   │       └── transport/http/   
│   └── hub/                      
│       ├── Controllers/
│       │   ├── Admin/            
│       │   ├── Auth/            
│       │   └── Player/           
│       ├── Services/             
│       └── hub.csproj
├── go.work                      
└── docker-compose.yml
```

---

## Quick Start (Docker)

**Requires:** Docker Desktop

### 1. Clone

```bash
git clone https://github.com/ptphat03/Fish-Game.git
cd Fish-Game
```

### 2. Create `.env`

```env
ACCESS_TOKEN_KEY=your-secret-key-minimum-32-characters
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=168h
INTERNAL_SECRET=dev-secret
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Run

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web client | http://localhost:3000 |
| Hub REST + Swagger | http://localhost:5100/swagger |
| Arena WebSocket | ws://localhost:8080/api/v1/ws |
| PostgreSQL | localhost:**5433** |

---

## Local Development

**Requires:** Go 1.23+, .NET SDK 8.0+, Node.js 22+, PostgreSQL 17

### arena

```bash
cd services/arena

# Required env vars:
export DATABASE_URL="postgres://postgres:postgres@localhost:5433/fish_game?sslmode=disable"
export ACCESS_TOKEN_KEY="your-secret-key-minimum-32-characters"

go run ./cmd/server
# → listening on :8080
```

### hub

```bash
cd services/hub

# Set via env or appsettings.json:
# ConnectionStrings__DefaultConnection, Jwt__AccessTokenKey

dotnet run
# → listening on :5100
```

### react

```bash
cd client/react
npm install
npm run dev
# → http://localhost:3000
```

Vite dev server proxies automatically:
- `/api/v1/ws` → arena `:8080` (WebSocket)
- `/api` → hub `:5100` (REST)

---
