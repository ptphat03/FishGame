package http

import (
	"github.com/ptphat03/Fish-Game/services/game-server/internal/transport/http/middleware"
	"github.com/gin-gonic/gin"
)

// Handlers chỉ còn WebSocket — các REST API đã chuyển sang services/player-api (.NET)
type Handlers struct {
	WS *WSHandler
}

func SetupRouter(h Handlers) *gin.Engine {
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())

	v1 := router.Group("/api/v1")
	if h.WS != nil {
		h.WS.RegisterRoutes(v1)
	}

	return router
}
