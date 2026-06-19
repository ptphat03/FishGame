# Regenerate Go and C# structs from fish_game.proto.
#
# Prerequisites (install once):
#   Windows : winget install Google.Protobuf
#             go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
#   macOS   : brew install protobuf
#             go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
#
# Run from the repo root:
#   make -C proto

PROTO_FILE   = fish_game.proto
GO_OUT       = ../services/game-server/internal/pb
CSHARP_OUT   = ../client/unity/Assets/Protos

.PHONY: proto clean

proto:
	protoc \
	  --proto_path=. \
	  --go_out=$(GO_OUT) --go_opt=paths=source_relative \
	  --csharp_out=$(CSHARP_OUT) \
	  $(PROTO_FILE)
	@echo "✅  Go    → $(GO_OUT)/fish_game.pb.go"
	@echo "✅  C#    → $(CSHARP_OUT)/FishGame.cs"

clean:
	rm -f $(GO_OUT)/fish_game.pb.go
	rm -f $(CSHARP_OUT)/FishGame.cs
