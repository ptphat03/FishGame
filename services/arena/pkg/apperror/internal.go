package apperror

import "fmt"

// InternalError ghi lại context nơi lỗi xảy ra, chỉ dùng để log.
// Client không bao giờ nhìn thấy nội dung này — Fail() trả về ErrInternalServer.
type InternalError struct {
	Layer string // "repository" | "usecase" | "handler"
	Op    string // tên hàm, ví dụ "userRepo.GetByID"
	Err   error  // lỗi gốc
}

func (e *InternalError) Error() string {
	return fmt.Sprintf("[%s] %s: %v", e.Layer, e.Op, e.Err)
}

func (e *InternalError) Unwrap() error {
	return e.Err
}

// Wrap tạo InternalError với đầy đủ context.
// Dùng thay cho fmt.Errorf hoặc apperror.ErrInternalServer ở repo/usecase.
func Wrap(layer, op string, err error) error {
	return &InternalError{Layer: layer, Op: op, Err: err}
}
