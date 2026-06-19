package utils

import (
	"errors"
	"fmt"

	"github.com/ptphat03/Fish-Game/services/game-server/pkg/apperror"
	"github.com/golang-jwt/jwt/v5"
)

type TokenMaker interface {
	VerifyAccessToken(token string) (*jwt.MapClaims, error)
}

type jwtMaker struct {
	accessKey     string
	signingMethod jwt.SigningMethod
}

func NewTokenMaker(accessKey string, signingMethod jwt.SigningMethod) TokenMaker {
	return &jwtMaker{
		accessKey:     accessKey,
		signingMethod: signingMethod,
	}
}

func (m *jwtMaker) VerifyAccessToken(tokenStr string) (*jwt.MapClaims, error) {
	keyfunc := func(t *jwt.Token) (interface{}, error) {
    if t.Method.Alg() != m.signingMethod.Alg() {
        return nil, fmt.Errorf("thuật toán không khớp")
    }
    return []byte(m.accessKey), nil}

	token, err := jwt.Parse(tokenStr, keyfunc)	
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, apperror.ErrExpiredToken
		}
		return nil, apperror.ErrInvalidToken
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, apperror.ErrInvalidToken
	}
	if claims["type"] != "access" {
		return nil, apperror.ErrInvalidToken
	}
	return &claims, nil
}
