FROM golang:1.23-alpine AS builder

ENV GOTOOLCHAIN=auto

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

COPY services/arena/go.mod services/arena/go.sum ./
RUN go mod download

COPY services/arena/ .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o /app/bin/game-server ./cmd/server

FROM alpine:3.21

RUN addgroup -S app && adduser -S app -G app
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /app/bin/game-server .

USER app

EXPOSE 8080 9090

ENTRYPOINT ["./game-server"]
