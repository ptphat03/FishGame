using System;
using FishGame.Proto;
using UnityEngine;

namespace FishGame.Net
{
    /// <summary>
    /// Central event hub — receives every incoming Envelope from WsClient
    /// and fires a typed C# event on the Unity main thread.
    ///
    /// Subscribers (GameManager, FishSpawner, SessionUI, …) simply wire up
    /// to the appropriate event; no message-type string matching required.
    /// </summary>
    public class MessageRouter : MonoBehaviour
    {
        public static MessageRouter Instance { get; private set; }

        // ── Server → Client events ─────────────────────────────────────────
        public event Action<SessionStartedEvent> OnSessionStarted;
        public event Action<ShootAckEvent>       OnShootAck;
        public event Action<HitResultEvent>      OnHitResult;
        public event Action<SessionEndedEvent>   OnSessionEnded;
        public event Action<SpawnFishEvent>      OnSpawnFish;
        public event Action<BroadcastShootEvent> OnBroadcastShoot;
        public event Action<BroadcastKillEvent>  OnBroadcastKill;
        public event Action<ErrorEvent>          OnServerError;

        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        /// <summary>
        /// Called from the WebSocket receive thread.
        /// Queues the actual dispatch onto the Unity main thread so that
        /// subscribers can freely call Unity APIs (Instantiate, UI updates, etc.).
        /// </summary>
        public void Dispatch(Envelope envelope)
        {
            UnityMainThreadDispatcher.Enqueue(() => DispatchOnMainThread(envelope));
        }

        private void DispatchOnMainThread(Envelope envelope)
        {
            switch (envelope.PayloadCase)
            {
                case Envelope.PayloadOneofCase.SessionStarted:
                    OnSessionStarted?.Invoke(envelope.SessionStarted);
                    break;
                case Envelope.PayloadOneofCase.ShootAck:
                    OnShootAck?.Invoke(envelope.ShootAck);
                    break;
                case Envelope.PayloadOneofCase.HitResult:
                    OnHitResult?.Invoke(envelope.HitResult);
                    break;
                case Envelope.PayloadOneofCase.SessionEnded:
                    OnSessionEnded?.Invoke(envelope.SessionEnded);
                    break;
                case Envelope.PayloadOneofCase.SpawnFish:
                    OnSpawnFish?.Invoke(envelope.SpawnFish);
                    break;
                case Envelope.PayloadOneofCase.BroadcastShoot:
                    OnBroadcastShoot?.Invoke(envelope.BroadcastShoot);
                    break;
                case Envelope.PayloadOneofCase.BroadcastKill:
                    OnBroadcastKill?.Invoke(envelope.BroadcastKill);
                    break;
                case Envelope.PayloadOneofCase.Error:
                    Debug.LogWarning($"[Server Error] {envelope.Error.Code}: {envelope.Error.Message}");
                    OnServerError?.Invoke(envelope.Error);
                    break;
                case Envelope.PayloadOneofCase.Pong:
                    // keepalive response — no action needed
                    break;
                default:
                    Debug.LogWarning($"[MessageRouter] Unhandled payload case: {envelope.PayloadCase}");
                    break;
            }
        }
    }
}
