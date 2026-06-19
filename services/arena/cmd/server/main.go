package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ptphat03/Fish-Game/services/game-server/internal/database"
	authHttp "github.com/ptphat03/Fish-Game/services/game-server/internal/transport/http"
	"github.com/ptphat03/Fish-Game/services/game-server/pkg/utils"
	"github.com/golang-jwt/jwt/v5"
)

func main() {
	db, err := database.InitDB(os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("❌ Lỗi khởi tạo Database: %v", err)
	}
	defer db.Close()

	tokenMaker := utils.NewTokenMaker(os.Getenv("ACCESS_TOKEN_KEY"), jwt.SigningMethodHS256)

	allHandlers, err := InitializeApp(db, tokenMaker)
	if err != nil {
		log.Fatalf("❌ Lỗi khởi tạo Dependencies (Wire): %v", err)
	}

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: authHttp.SetupRouter(allHandlers),
	}

	go func() {
		log.Printf("🐟 Fish Game Server đang chạy tại port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Lỗi server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("⏳ Đang đóng server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("❌ Server buộc phải đóng:", err)
	}
	log.Println("✅ Server đã dừng an toàn.")
}
