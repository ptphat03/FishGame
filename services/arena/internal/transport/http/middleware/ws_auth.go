package middleware

import (
	"github.com/ptphat03/Fish-Game/services/game-server/pkg/apperror"
	"github.com/ptphat03/Fish-Game/services/game-server/pkg/utils"
	"github.com/gin-gonic/gin"
)

const ctxUserIDKey = "user_id"

func abortWithAppError(c *gin.Context, err *apperror.AppError) {
	c.AbortWithStatusJSON(err.HTTPStatus, gin.H{"error": gin.H{
		"code":    err.Code,
		"message": err.Error(),
	}})
}

// WSAuthMiddleware xác thực JWT cho WebSocket.
// Browser không thể set custom header khi connect WS,
// nên token được truyền qua query param ?token=<access_token>.
func WSAuthMiddleware(tokenMaker utils.TokenMaker) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := c.Query("token")
		if tokenStr == "" {
			abortWithAppError(c, apperror.ErrInvalidToken)
			return
		}

		claims, err := tokenMaker.VerifyAccessToken(tokenStr)
		if err != nil {
			abortWithAppError(c, apperror.ErrInvalidToken)
			return
		}

		c.Set(ctxUserIDKey, utils.ToInt64((*claims)["user_id"]))
		c.Next()
	}
}
