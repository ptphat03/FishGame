package ws

import (
	"context"
	"log"
	"math/rand"
	"sync"
	"time"

	"github.com/ptphat03/Fish-Game/services/game-server/internal/models"
	"github.com/ptphat03/Fish-Game/services/game-server/internal/usecase"
	"github.com/google/uuid"
)

// ActiveFish lưu trữ trạng thái của con cá đang bơi trong phòng
type ActiveFish struct {
	InstanceID string
	FishID     int32
	PathID     int32
	SpawnTime  time.Time
	Duration   time.Duration // Thời gian cá bơi trước khi biến mất khỏi màn hình
}

type room struct {
	mu      sync.RWMutex
	clients map[*Client]struct{}
	roomID  int64 // Cần lưu roomID để tiện gọi hàm Broadcast
	hub     *Hub  // Tham chiếu ngược lại Hub

	seats [4]*Client // Mảng quản lý 4 ghế ngồi
	// Quản lý cá
	activeFishes map[string]*ActiveFish

	// Điều khiển Vòng lặp Game
	loopActive bool
	quitChan   chan struct{}
}

type Hub struct {
	mu    sync.RWMutex
	rooms map[int64]*room

	fishMu        sync.RWMutex // guards CachedFishIDs and CachedFishMap
	CachedFishIDs []int32
	CachedFishMap map[int32]models.Fish
}

func NewHub(fishUC usecase.FishUsecase) *Hub {
	h := &Hub{
		rooms: make(map[int64]*room),
	}

	h.CachedFishMap = make(map[int32]models.Fish)

	// 1. Tạo context ngắn hạn để gọi DB lúc khởi động server
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 2. Lấy danh sách cá từ DB 1 lần duy nhất
	fishList, err := fishUC.List(ctx)
	if err != nil {
		log.Printf("[Hub Init] Lỗi không lấy được Fish config từ DB: %v", err)
		// Fallback mặc định nếu DB lỗi
		h.CachedFishIDs = []int32{1, 2, 3, 4, 5}
	} else {
		for _, f := range fishList {
			h.CachedFishIDs = append(h.CachedFishIDs, f.ID)
			h.CachedFishMap[f.ID] = f // Lưu vào RAM luôn
		}
		log.Printf("[Hub Init] Đã load %d loại cá vào Cache", len(h.CachedFishIDs))
	}

	return h
}

func (h *Hub) getOrCreateRoom(roomID int64) *room {
	h.mu.RLock()
	r := h.rooms[roomID]
	h.mu.RUnlock()
	if r != nil {
		return r
	}

	h.mu.Lock()
	defer h.mu.Unlock()
	if r = h.rooms[roomID]; r == nil {
		r = &room{
			clients:      make(map[*Client]struct{}),
			roomID:       roomID,
			hub:          h,
			activeFishes: make(map[string]*ActiveFish), // Khởi tạo map chứa cá
		}
		h.rooms[roomID] = r
	}
	return r
}

// JoinRoom cấp ghế cho người chơi và trả về SeatID (0-3). Trả về -1 nếu phòng đầy.
func (h *Hub) JoinRoom(c *Client, roomID int64) int {
	r := h.getOrCreateRoom(roomID)

	r.mu.Lock()
	seatID := r.getAvailableSeat()
	if seatID != -1 {
		r.seats[seatID] = c // Xí chỗ ngồi
		r.clients[c] = struct{}{}
	}
	clientCount := len(r.clients)
	r.mu.Unlock()

	// Kích hoạt Game Loop khi có người đầu tiên vào phòng
	if clientCount == 1 {
		r.StartGameLoop()
	}

	return seatID
}

// LeaveRoom xóa client khỏi phòng và giải phóng ghế ngồi
func (h *Hub) LeaveRoom(c *Client, roomID int64) {
	h.mu.RLock()
	r := h.rooms[roomID]
	h.mu.RUnlock()
	if r == nil {
		return
	}

	r.mu.Lock()
	delete(r.clients, c)

	// Giải phóng ghế
	for i := 0; i < 4; i++ {
		if r.seats[i] == c {
			r.seats[i] = nil
			break
		}
	}

	empty := len(r.clients) == 0
	r.mu.Unlock()

	if empty {
		h.mu.Lock()
		r.mu.Lock()
		stillEmpty := len(r.clients) == 0
		if stillEmpty {
			// Dừng Goroutine sinh cá khi phòng trống
			if r.loopActive {
				close(r.quitChan)
				r.loopActive = false
			}
			delete(h.rooms, roomID)
		}
		r.mu.Unlock()
		h.mu.Unlock()
	}
}

func (h *Hub) BroadcastToRoom(roomID int64, data []byte, except *Client) {
	h.mu.RLock()
	r := h.rooms[roomID]
	h.mu.RUnlock()
	if r == nil {
		return
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	for c := range r.clients {
		if c == except {
			continue
		}
		select {
		case c.send <- data:
		default:
		}
	}
}

func (h *Hub) SyncFishesToClient(roomID int64, c *Client) {
	h.mu.RLock()
	r := h.rooms[roomID]
	h.mu.RUnlock()
	if r == nil {
		return
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, fish := range r.activeFishes {
		if data := outMsg("spawn_fish", SpawnFishMsg{
			InstanceID: fish.InstanceID,
			FishID:     fish.FishID,
			PathID:     fish.PathID,
			SpawnTime:  fish.SpawnTime.UnixMilli(),
			Duration:   int32(fish.Duration.Seconds()),
		}); data != nil {
			select {
			case c.send <- data:
			default:
			}
		}
	}
}

// ── GAME LOOP & SPAWN LOGIC ──────────────────────────────────────────────────

// StartGameLoop khởi chạy vòng lặp sinh cá cho phòng
func (r *room) StartGameLoop() {
	r.mu.Lock()
	if r.loopActive {
		r.mu.Unlock()
		return
	}
	r.loopActive = true
	r.quitChan = make(chan struct{})
	r.mu.Unlock()

	spawnTicker := time.NewTicker(3 * time.Second)    // Sinh cá mỗi 1 giây (hoặc 3 giây)
	cleanupTicker := time.NewTicker(10 * time.Second) // Dọn cá hết hạn mỗi 10 giây

	go func() {
		defer func() {
			spawnTicker.Stop()
			cleanupTicker.Stop()
		}()

		for {
			select {
			case <-r.quitChan:
				return // Kết thúc goroutine khi nhận tín hiệu đóng phòng
			case <-spawnTicker.C:
				r.spawnRandomFish()
			case <-cleanupTicker.C:
				r.cleanupExpiredFishes()
			}
		}
	}()
}

// spawnRandomFish xử lý logic tạo cá và gửi xuống Client
func (r *room) spawnRandomFish() {
	fishIDs := r.hub.CachedFishIDs

	if len(fishIDs) == 0 {
		fishIDs = []int32{1, 2, 3, 4, 5}
	}
	pathIDs := []int32{1, 2, 3, 4}

	newFish := &ActiveFish{
		InstanceID: uuid.New().String(),
		FishID:     fishIDs[rand.Intn(len(fishIDs))],
		PathID:     pathIDs[rand.Intn(len(pathIDs))],
		SpawnTime:  time.Now(),
		Duration:   60 * time.Second,
	}

	// Thêm vào bộ nhớ phòng
	r.mu.Lock()
	r.activeFishes[newFish.InstanceID] = newFish
	r.mu.Unlock()

	if data := outMsg("spawn_fish", SpawnFishMsg{
		InstanceID: newFish.InstanceID,
		FishID:     newFish.FishID,
		PathID:     newFish.PathID,
		SpawnTime:  newFish.SpawnTime.UnixMilli(),
		Duration:   int32(newFish.Duration.Seconds()),
	}); data != nil {
		r.hub.BroadcastToRoom(r.roomID, data, nil)
	}
}

// cleanupExpiredFishes xoá cá đã sống quá thời gian quy định
func (r *room) cleanupExpiredFishes() {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	for id, fish := range r.activeFishes {
		if now.Sub(fish.SpawnTime) > fish.Duration {
			delete(r.activeFishes, id)
		}
	}
}

// ValidateFishInRoom kiểm tra xem cá có thực sự đang bơi trong phòng không
func (h *Hub) ValidateFishInRoom(roomID int64, instanceID string) bool {
	h.mu.RLock()
	r := h.rooms[roomID]
	h.mu.RUnlock()

	if r == nil {
		return false
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	_, exists := r.activeFishes[instanceID]
	return exists
}

// MarkFishAsKilled kiểm tra xem cá còn sống không, nếu còn thì xoá luôn để ngăn người khác giết.
func (h *Hub) MarkFishAsKilled(roomID int64, instanceID string) bool {
	h.mu.RLock()
	r := h.rooms[roomID]
	h.mu.RUnlock()

	if r == nil {
		return false
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.activeFishes[instanceID]; exists {
		delete(r.activeFishes, instanceID) // Xoá xác cá
		return true                        // Báo hiệu giết thành công
	}

	return false // Cá đã bị người khác giết trước đó 1 tích tắc
}

// getAvailableSeat Tìm ghế trống từ 0 đến 3. Trả về -1 nếu phòng đầy.
func (r *room) getAvailableSeat() int {
	for i := 0; i < 4; i++ {
		if r.seats[i] == nil {
			return i
		}
	}
	return -1
}
