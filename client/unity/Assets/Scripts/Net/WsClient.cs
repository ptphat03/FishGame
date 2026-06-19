using System;
using System.IO;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using FishGame.Game;
using FishGame.Proto;
using Google.Protobuf;
using UnityEngine;

namespace FishGame.Net
{
    /// <summary>
    /// Manages the single persistent WebSocket connection to the Golang game server.
    ///
    /// Message framing:
    ///   Every outgoing frame is a proto-serialised Envelope (binary).
    ///   Incoming frames are accumulated across WebSocket fragments until
    ///   EndOfMessage = true, then parsed as a single Envelope.
    ///
    /// Thread safety:
    ///   ConnectAsync / SendAsync are awaited from the Unity main thread.
    ///   ReceiveLoopAsync runs on a background thread-pool thread; it only
    ///   touches MessageRouter.Dispatch() which itself queues to the main thread.
    /// </summary>
    public class WsClient : MonoBehaviour
    {
        public static WsClient Instance { get; private set; }

        [SerializeField] private string serverUrl = "ws://localhost:8080/api/v1/ws";

        public bool IsConnected => _ws?.State == WebSocketState.Open;

        private ClientWebSocket       _ws;
        private CancellationTokenSource _cts;
        private readonly SemaphoreSlim  _sendLock = new SemaphoreSlim(1, 1);

        // ── Unity lifecycle ────────────────────────────────────────────────

        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void OnDestroy() => CleanUp();

        private void OnApplicationQuit() => CleanUp();

        // ── Public API ─────────────────────────────────────────────────────

        /// <summary>
        /// Opens the WebSocket connection authenticated with a JWT token.
        /// Must be awaited before calling SendAsync.
        /// </summary>
        public async Task ConnectAsync(string token, string url = null)
        {
            if (url != null) serverUrl = url;

            CleanUp();
            _cts = new CancellationTokenSource();
            _ws  = new ClientWebSocket();

            var uri = new Uri($"{serverUrl}?token={Uri.EscapeDataString(token)}");
            await _ws.ConnectAsync(uri, _cts.Token);

            Debug.Log("[WsClient] Connected");
            _ = ReceiveLoopAsync(); // fire-and-forget background receiver
        }

        /// <summary>
        /// Sends a Protobuf Envelope as a single binary WebSocket frame.
        /// Thread-safe: a semaphore prevents interleaved sends.
        /// </summary>
        public async Task SendAsync(Envelope envelope)
        {
            if (!IsConnected)
            {
                Debug.LogWarning("[WsClient] SendAsync ignored — not connected");
                return;
            }

            var bytes = envelope.ToByteArray();

            await _sendLock.WaitAsync(_cts.Token);
            try
            {
                await _ws.SendAsync(
                    new ArraySegment<byte>(bytes),
                    WebSocketMessageType.Binary,
                    endOfMessage: true,
                    cancellationToken: _cts.Token
                );
            }
            finally
            {
                _sendLock.Release();
            }
        }

        /// <summary>Gracefully closes the connection and fires OnDisconnected.</summary>
        public async Task DisconnectAsync()
        {
            if (_ws?.State == WebSocketState.Open)
            {
                try
                {
                    await _ws.CloseAsync(
                        WebSocketCloseStatus.NormalClosure,
                        "Client disconnect",
                        CancellationToken.None
                    );
                }
                catch { /* ignore close errors */ }
            }
            CleanUp();
        }

        // ── Receive loop ───────────────────────────────────────────────────

        /// <summary>
        /// Background loop that reads WebSocket frames and reassembles them into
        /// complete Envelope messages. Runs until the socket closes or is cancelled.
        ///
        /// A proto message can theoretically span multiple WS frames, so we
        /// accumulate into a MemoryStream until EndOfMessage is true.
        /// </summary>
        private async Task ReceiveLoopAsync()
        {
            var frameBuf = new byte[8192];
            using var msgBuf = new MemoryStream(capacity: 8192);

            while (_ws.State == WebSocketState.Open && !_cts.IsCancellationRequested)
            {
                try
                {
                    msgBuf.SetLength(0);
                    WebSocketReceiveResult result;

                    // ── Accumulate fragments until EndOfMessage ──
                    do
                    {
                        result = await _ws.ReceiveAsync(
                            new ArraySegment<byte>(frameBuf),
                            _cts.Token
                        );

                        if (result.MessageType == WebSocketMessageType.Close)
                        {
                            Debug.Log("[WsClient] Server sent Close frame");
                            await _ws.CloseAsync(
                                WebSocketCloseStatus.NormalClosure,
                                "Acknowledged",
                                CancellationToken.None
                            );
                            return;
                        }

                        msgBuf.Write(frameBuf, 0, result.Count);

                    } while (!result.EndOfMessage);

                    // ── Parse complete binary message as Envelope ──
                    if (result.MessageType == WebSocketMessageType.Binary)
                    {
                        var segment = new ArraySegment<byte>(msgBuf.GetBuffer(), 0, (int)msgBuf.Length);
                        var envelope = Envelope.Parser.ParseFrom(segment);
                        MessageRouter.Instance?.Dispatch(envelope);
                    }
                }
                catch (OperationCanceledException)
                {
                    break; // normal shutdown
                }
                catch (WebSocketException ex)
                {
                    Debug.LogError($"[WsClient] WebSocket error: {ex.Message}");
                    break;
                }
                catch (Exception ex)
                {
                    Debug.LogError($"[WsClient] Unexpected receive error: {ex.Message}");
                    break;
                }
            }

            Debug.Log("[WsClient] Receive loop ended");
            UnityMainThreadDispatcher.Enqueue(() =>
                GameManager.Instance?.OnConnectionLost()
            );
        }

        // ── Helpers ────────────────────────────────────────────────────────

        private void CleanUp()
        {
            _cts?.Cancel();
            _cts?.Dispose();
            _cts = null;
            _ws?.Dispose();
            _ws = null;
        }
    }
}
