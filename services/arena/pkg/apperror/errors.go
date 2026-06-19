package apperror

import (
	"errors"
	"net/http"
)

type AppError struct {
	Code       string `json:"code"`
	HTTPStatus int    `json:"-"`
	Err        error  `json:"-"`
}

func (e *AppError) Error() string {
	return e.Err.Error()
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// New tạo AppError với error bất kỳ.
func New(code string, status int, err error) *AppError {
	return &AppError{Code: code, HTTPStatus: status, Err: err}
}

// Newf tạo AppError với message string.
func Newf(code string, status int, msg string) *AppError {
	return New(code, status, errors.New(msg))
}

var (
	ErrBadRequest         = Newf("BAD_REQUEST", http.StatusBadRequest, "dữ liệu yêu cầu không hợp lệ")
	ErrInvalidCredentials = Newf("INVALID_CREDENTIALS", http.StatusUnauthorized, "tài khoản hoặc mật khẩu không đúng")
	ErrUsernameExisted    = Newf("USERNAME_EXISTED", http.StatusConflict, "tài khoản đã tồn tại")
	ErrUserNotFound       = Newf("USER_NOT_FOUND", http.StatusNotFound, "không tìm thấy người dùng")
	ErrInvalidToken       = Newf("INVALID_TOKEN", http.StatusUnauthorized, "token không hợp lệ")
	ErrExpiredToken       = Newf("EXPIRED_TOKEN", http.StatusUnauthorized, "token đã hết hạn")
	ErrForbidden          = Newf("FORBIDDEN", http.StatusForbidden, "bạn không có quyền thực hiện thao tác này")
	ErrRoomNotFound       = Newf("ROOM_NOT_FOUND", http.StatusNotFound, "không tìm thấy phòng")
	ErrFishNotFound       = Newf("FISH_NOT_FOUND", http.StatusNotFound, "không tìm thấy cá")
	ErrWalletNotFound      = Newf("WALLET_NOT_FOUND", http.StatusNotFound, "không tìm thấy ví")
	ErrInsufficientBalance = Newf("INSUFFICIENT_BALANCE", http.StatusBadRequest, "số dư không đủ")
	ErrSessionNotFound     = Newf("SESSION_NOT_FOUND", http.StatusNotFound, "không tìm thấy phiên chơi")
	ErrSessionAlreadyEnded = Newf("SESSION_ALREADY_ENDED", http.StatusBadRequest, "phiên chơi đã kết thúc")
	ErrInternalServer      = Newf("INTERNAL_SERVER_ERROR", http.StatusInternalServerError, "lỗi máy chủ nội bộ")
)
