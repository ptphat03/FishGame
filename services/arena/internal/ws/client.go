package ws

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"sync"
	"time"

	"github.com/ptphat03/Fish-Game/services/game-server/internal/domain"
	"github.com/ptphat03/Fish-Game/services/game-server/internal/usecase"
	gorillaws "github.com/gorilla/websocket"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
	maxMsgSize = 8192
	dbTimeout  = 5 * time.Second
)

// Client đại diện cho 1 kết nối WebSocket của 1 người chơi.
type Client struct {
	hub  *Hub
	conn *gorillaws.Conn
	send chan []byte
	once sync.Once

	userID int64

	walletUsecase usecase.WalletUsecase
	roomUsecase   usecase.RoomUsecase
	fishUsecase   usecase.FishUsecase

	// Trạng thái session
	sessionID int64
	roomID    int64
	roomRTP   float64

	// Counters authoritative (server-side only)
	shotsFired int32
	fishKilled int32
	totalSpend int64
	totalEarn  int64
	lastBet    int64

	estimatedBalance int64
	seatID           int
}

func NewClient(
	hub *Hub,
	conn *gorillaws.Conn,
	userID int64,
	walletUC usecase.WalletUsecase,
	roomUC usecase.RoomUsecase,
	fishUC usecase.FishUsecase,
) *Client {
	return &Client{
		hub:           hub,
		conn:          conn,
		send:          make(chan []byte, 512),
		userID:        userID,
		walletUsecase: walletUC,
		roomUsecase:   roomUC,
		fishUsecase:   fishUC,
		seatID:        -1,
	}
}

func dbCtx() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), dbTimeout)
}

// ── Pumps ─────────────────────────────────────────────────────────────────────

func (c *Client) ReadPump() {
	defer func() {
		c.endSessionIfActive()
		if c.roomID != 0 {
			c.hub.LeaveRoom(c, c.roomID)
		}
		c.closeSend()
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMsgSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, raw, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		c.handleMessage(raw)
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(gorillaws.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(gorillaws.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(gorillaws.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

func (c *Client) handleMessage(raw []byte) {
	var env InEnvelope
	if err := json.Unmarshal(raw, &env); err != nil {
		c.sendError("BAD_REQUEST", "invalid JSON envelope")
		return
	}

	switch env.Type {
	case "join_room":
		var p JoinRoomPayload
		if err := json.Unmarshal(env.Payload, &p); err != nil {
			c.sendError("BAD_REQUEST", "invalid join_room payload")
			return
		}
		c.handleJoinRoom(p)
	case "client_ready":
		c.handleClientReady()
	case "shoot":
		var p ShootPayload
		if err := json.Unmarshal(env.Payload, &p); err != nil {
			c.sendError("BAD_REQUEST", "invalid shoot payload")
			return
		}
		c.handleShoot(p)
	case "hit_fish":
		var p HitFishPayload
		if err := json.Unmarshal(env.Payload, &p); err != nil {
			c.sendError("BAD_REQUEST", "invalid hit_fish payload")
			return
		}
		c.handleHitFish(p)
	case "leave_room":
		c.handleLeaveRoom()
	case "request_resync":
		c.handleRequestResync()
	case "ping":
		c.handlePing()
	default:
		c.sendError("UNKNOWN_TYPE", "unknown message type: "+env.Type)
	}
}

// ── Handlers ──────────────────────────────────────────────────────────────────

func (c *Client) handleJoinRoom(p JoinRoomPayload) {
	if c.sessionID != 0 {
		c.sendError("ALREADY_IN_ROOM", "leave current room first")
		return
	}

	ctx, cancel := dbCtx()
	defer cancel()

	roomData, err := c.roomUsecase.GetByID(ctx, p.RoomID)
	if err != nil {
		c.sendError("ROOM_NOT_FOUND", "room not found")
		return
	}

	seatID := c.hub.JoinRoom(c, p.RoomID)
	if seatID == -1 {
		c.sendError("ROOM_FULL", "room is full (max 4 players)")
		return
	}

	wallet, err := c.walletUsecase.GetWallet(ctx, c.userID)
	if err != nil {
		c.hub.LeaveRoom(c, p.RoomID)
		c.sendError("WALLET_ERROR", "cannot get wallet")
		return
	}

	session, err := c.walletUsecase.StartSession(ctx, c.userID, &domain.StartSessionRequest{
		RoomID: p.RoomID,
	})
	if err != nil {
		c.hub.LeaveRoom(c, p.RoomID)
		c.sendError("SESSION_ERROR", "cannot start session")
		return
	}

	c.sessionID = session.ID
	c.roomID = p.RoomID
	c.roomRTP = roomData.RTP
	c.shotsFired = 0
	c.fishKilled = 0
	c.totalSpend = 0
	c.totalEarn = 0
	c.estimatedBalance = wallet.Balance
	c.seatID = seatID

	c.sendMsg("session_started", SessionStartedMsg{
		SessionID: session.ID,
		SeatID:    seatID,
		Balance:   wallet.Balance,
	})
}

func (c *Client) handleClientReady() {
	if c.sessionID == 0 || c.roomID == 0 {
		return
	}
	c.hub.SyncFishesToClient(c.roomID, c)
}

func (c *Client) handleRequestResync() {
	if c.sessionID == 0 || c.roomID == 0 {
		return
	}
	c.hub.SyncBoardToClient(c.roomID, c)
}

func (c *Client) handleShoot(p ShootPayload) {
	if c.sessionID == 0 {
		c.sendError("NO_SESSION", "join a room first")
		return
	}

	const minBet, maxBet = int64(10), int64(100)
	if p.BetAmount < minBet || p.BetAmount > maxBet {
		c.sendError("INVALID_BET", fmt.Sprintf("bet must be between %d and %d", minBet, maxBet))
		return
	}
	if c.estimatedBalance < p.BetAmount {
		c.sendError("INSUFFICIENT_BALANCE", "not enough balance to shoot")
		return
	}

	c.shotsFired++
	c.totalSpend += p.BetAmount
	c.estimatedBalance -= p.BetAmount
	c.lastBet = p.BetAmount

	c.sendMsg("shoot_ack", ShootAckMsg{
		ShotsFired: int64(c.shotsFired),
		TotalSpend: c.totalSpend,
		Balance:    c.estimatedBalance,
	})

	if c.roomID != 0 && c.seatID >= 0 {
		if data := outMsg("broadcast_shoot", BroadcastShootMsg{
			SeatID: c.seatID,
			X:      p.X,
			Y:      p.Y,
			Angle:  p.Angle,
		}); data != nil {
			c.hub.BroadcastToRoom(c.roomID, data, c)
		}
	}
}

func (c *Client) handleHitFish(p HitFishPayload) {
	if c.sessionID == 0 {
		c.sendError("NO_SESSION", "join a room first")
		return
	}

	if !c.hub.ValidateFishInRoom(c.roomID, p.InstanceID) {
		c.sendError("INVALID_FISH_INSTANCE", "fish does not exist or has expired")
		return
	}

	fish, ok := c.hub.CachedFishMap[p.FishID]
	if !ok {
		c.sendError("INVALID_FISH", "unknown fish id")
		return
	}

	rtp := c.roomRTP
	if rtp <= 0 || rtp > 1 {
		rtp = 0.90
	}
	killProb := fish.BaseProb * rtp
	killed := rand.Float64() < killProb

	result := HitResultMsg{
		Killed:     killed,
		FishID:     p.FishID,
		InstanceID: p.InstanceID,
		Balance:    c.estimatedBalance,
		TotalEarn:  c.totalEarn,
		FishKilled: c.fishKilled,
	}

	if killed {
		if !c.hub.MarkFishAsKilled(c.roomID, p.InstanceID) {
			c.sendError("FISH_ALREADY_DEAD", "fish was killed by another player")
			return
		}

		bet := c.lastBet
		if bet == 0 {
			bet = 10
		}
		earned := int64(fish.RewardMultiplier) * bet
		c.fishKilled++
		c.totalEarn += earned
		c.estimatedBalance += earned

		result.Amount = earned
		result.Balance = c.estimatedBalance
		result.TotalEarn = c.totalEarn
		result.FishKilled = c.fishKilled

		if data := outMsg("broadcast_kill", BroadcastKillMsg{
			InstanceID: p.InstanceID,
			SeatID:     c.seatID,
		}); data != nil {
			c.hub.BroadcastToRoom(c.roomID, data, c)
		}
	}

	c.sendMsg("hit_result", result)
}

func (c *Client) handleLeaveRoom() {
	c.endSessionIfActive()
	if c.roomID != 0 {
		c.hub.LeaveRoom(c, c.roomID)
		c.roomID = 0
		c.seatID = -1
	}
}

func (c *Client) handlePing() {
	c.sendMsg("pong", struct{}{})
}

// ── Session lifecycle ─────────────────────────────────────────────────────────

func (c *Client) endSessionIfActive() {
	if c.sessionID == 0 {
		return
	}
	sid := c.sessionID
	c.sessionID = 0

	ctx, cancel := dbCtx()
	defer cancel()

	session, wallet, err := c.walletUsecase.EndSession(ctx, c.userID, &domain.EndSessionRequest{
		SessionID:  sid,
		ShotsFired: c.shotsFired,
		FishKilled: c.fishKilled,
		TotalSpend: c.totalSpend,
		TotalEarn:  c.totalEarn,
	})
	if err != nil {
		log.Printf("[ws] endSession user=%d err=%v", c.userID, err)
		return
	}

	c.sendMsg("session_ended", SessionEndedMsg{
		Session: SessionSummary{
			TotalEarn:  session.TotalEarn,
			TotalSpend: session.TotalSpend,
			FishKilled: session.FishKilled,
			ShotsFired: session.ShotsFired,
		},
		Wallet: walletInfo{Balance: wallet.Balance},
	})
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// sendMsg encodes payload as JSON and queues the text frame for delivery.
func (c *Client) sendMsg(msgType string, payload any) {
	data := outMsg(msgType, payload)
	if data == nil {
		return
	}
	select {
	case c.send <- data:
	default:
		// buffer full — drop silently
	}
}

func (c *Client) sendError(code, message string) {
	c.sendMsg("error", ErrorMsg{Code: code, Message: message})
}

func (c *Client) closeSend() {
	c.once.Do(func() { close(c.send) })
}
