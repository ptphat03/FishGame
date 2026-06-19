package http

import (
	"net/http"

	"github.com/ptphat03/Fish-Game/services/game-server/internal/transport/http/middleware"
	"github.com/ptphat03/Fish-Game/services/game-server/internal/usecase"
	"github.com/ptphat03/Fish-Game/services/game-server/internal/ws"
	"github.com/ptphat03/Fish-Game/services/game-server/pkg/utils"
	"github.com/gin-gonic/gin"
	gorillaws "github.com/gorilla/websocket"
)

type WSHandler struct {
	hub           *ws.Hub
	walletUsecase usecase.WalletUsecase
	roomUsecase   usecase.RoomUsecase
	fishUsecase   usecase.FishUsecase
	tokenMaker    utils.TokenMaker
	upgrader      gorillaws.Upgrader
}

func NewWSHandler(
	hub *ws.Hub,
	walletUC usecase.WalletUsecase,
	roomUC usecase.RoomUsecase,
	fishUC usecase.FishUsecase,
	tm utils.TokenMaker,
) *WSHandler {
	allowed := middleware.ParseAllowedOrigins()
	return &WSHandler{
		hub:           hub,
		walletUsecase: walletUC,
		roomUsecase:   roomUC,
		fishUsecase:   fishUC,
		tokenMaker:    tm,
		upgrader: gorillaws.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				origin := r.Header.Get("Origin")
				if origin == "" {
					return true // Unity / native client không gửi Origin
				}
				_, ok := allowed[origin]
				return ok
			},
		},
	}
}

func (h *WSHandler) RegisterRoutes(router *gin.RouterGroup) {
	// WSAuthMiddleware đọc token từ ?token= thay vì Authorization header
	// vì browser WebSocket API không hỗ trợ custom header khi connect
	router.GET("/ws", middleware.WSAuthMiddleware(h.tokenMaker), h.ServeWS)
}

// ServeWS godoc
// GET /api/v1/ws?token=<access_token>
func (h *WSHandler) ServeWS(c *gin.Context) {
	userID := c.MustGet("user_id").(int64)

	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		// upgrader đã tự ghi response lỗi
		return
	}

	client := ws.NewClient(h.hub, conn, userID, h.walletUsecase, h.roomUsecase, h.fishUsecase)
	go client.WritePump()
	go client.ReadPump()
}
