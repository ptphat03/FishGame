using System;
using System.Threading.Tasks;
using FishGame.Net;
using FishGame.Proto;
using UnityEngine;

namespace FishGame.Game
{
    /// <summary>
    /// Central game state machine.
    ///
    /// Owns the session state (seatId, balance, stats) and provides the
    /// high-level API (JoinRoom, Shoot, HitFish, LeaveRoom) that other
    /// MonoBehaviours call instead of touching WsClient directly.
    ///
    /// Subscribes to MessageRouter events and fires simplified Unity events
    /// that UI / gameplay scripts react to.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        // ── Session state (read-only from outside) ─────────────────────────
        public int   SeatId           { get; private set; } = -1;
        public long  Balance          { get; private set; }
        public long  TotalEarn        { get; private set; }
        public long  TotalSpend       { get; private set; }
        public int   FishKilled       { get; private set; }
        public int   ShotsFired       { get; private set; }
        public bool  InSession        => SeatId >= 0;

        // ── Events that UI/gameplay scripts subscribe to ───────────────────
        public event Action<long>              OnBalanceChanged;
        public event Action<int>               OnSessionStarted;   // arg = seatId
        public event Action<SessionEndedEvent> OnSessionEnded;
        public event Action<HitResultEvent>    OnHitResult;
        public event Action                    OnDisconnected;
        public event Action<string>            OnError;            // arg = error code

        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            var router = MessageRouter.Instance;
            if (router == null) { Debug.LogError("[GameManager] MessageRouter not found"); return; }

            router.OnSessionStarted  += HandleSessionStarted;
            router.OnShootAck        += HandleShootAck;
            router.OnHitResult       += HandleHitResult;
            router.OnSessionEnded    += HandleSessionEnded;
            router.OnServerError     += HandleServerError;
        }

        private void OnDestroy()
        {
            var router = MessageRouter.Instance;
            if (router == null) return;
            router.OnSessionStarted  -= HandleSessionStarted;
            router.OnShootAck        -= HandleShootAck;
            router.OnHitResult       -= HandleHitResult;
            router.OnSessionEnded    -= HandleSessionEnded;
            router.OnServerError     -= HandleServerError;
        }

        // ── High-level API ─────────────────────────────────────────────────

        public async Task ConnectAsync(string serverUrl, string jwtToken)
        {
            if (WsClient.Instance == null) { Debug.LogError("[GameManager] WsClient not found"); return; }
            await WsClient.Instance.ConnectAsync(jwtToken, serverUrl);
        }

        public async Task JoinRoomAsync(long roomId)
        {
            if (WsClient.Instance == null) { Debug.LogError("[GameManager] WsClient not found"); return; }
            await WsClient.Instance.SendAsync(new Envelope
            {
                JoinRoom = new JoinRoomRequest { RoomId = roomId }
            });
        }

        /// <summary>
        /// Called by CannonController with ALREADY-TRANSFORMED server coordinates.
        /// HeroViewTransformer.ToServerCoords() must be applied before calling this.
        /// </summary>
        public async Task ShootAsync(float serverX, float serverY, float serverAngle, long betAmount)
        {
            if (!InSession || WsClient.Instance == null) return;
            await WsClient.Instance.SendAsync(new Envelope
            {
                Shoot = new ShootRequest
                {
                    PosX      = serverX,
                    PosY      = serverY,
                    Angle     = serverAngle,
                    BetAmount = betAmount,
                }
            });
        }

        public async Task HitFishAsync(int fishId, string instanceId)
        {
            if (!InSession || WsClient.Instance == null) return;
            await WsClient.Instance.SendAsync(new Envelope
            {
                HitFish = new HitFishRequest { FishId = fishId, InstanceId = instanceId }
            });
        }

        public async Task NotifyReadyAsync()
        {
            if (WsClient.Instance == null) { Debug.LogError("[GameManager] WsClient not found"); return; }
            await WsClient.Instance.SendAsync(new Envelope
            {
                ClientReady = new ClientReadyRequest()
            });
        }

        public async Task LeaveRoomAsync()
        {
            if (!InSession || WsClient.Instance == null) return;
            await WsClient.Instance.SendAsync(new Envelope
            {
                LeaveRoom = new LeaveRoomRequest()
            });
        }

        /// <summary>Called by WsClient when the socket drops unexpectedly.</summary>
        public void OnConnectionLost()
        {
            ResetSession();
            OnDisconnected?.Invoke();
        }

        // ── MessageRouter handlers (all run on main thread) ───────────────

        private void HandleSessionStarted(SessionStartedEvent ev)
        {
            SeatId      = (int)ev.SeatId;
            Balance     = ev.Balance;
            TotalEarn   = 0;
            TotalSpend  = 0;
            FishKilled  = 0;
            ShotsFired  = 0;

            Debug.Log($"[GameManager] Session started — seat={SeatId} balance={Balance}");
            OnSessionStarted?.Invoke(SeatId);
            OnBalanceChanged?.Invoke(Balance);
        }

        private void HandleShootAck(ShootAckEvent ev)
        {
            ShotsFired = (int)ev.ShotsFired;
            TotalSpend = ev.TotalSpend;
            Balance    = ev.Balance;
            OnBalanceChanged?.Invoke(Balance);
        }

        private void HandleHitResult(HitResultEvent ev)
        {
            if (ev.Killed)
            {
                FishKilled = (int)ev.FishKilled;
                TotalEarn  = ev.TotalEarn;
                Balance    = ev.Balance;
                OnBalanceChanged?.Invoke(Balance);
            }
            OnHitResult?.Invoke(ev);
        }

        private void HandleSessionEnded(SessionEndedEvent ev)
        {
            Balance    = ev.FinalBalance;
            TotalEarn  = ev.TotalEarn;
            TotalSpend = ev.TotalSpend;
            FishKilled = (int)ev.FishKilled;
            ShotsFired = (int)ev.ShotsFired;

            Debug.Log($"[GameManager] Session ended — balance={Balance} earn={TotalEarn} spend={TotalSpend}");
            OnSessionEnded?.Invoke(ev);
            OnBalanceChanged?.Invoke(Balance);
            ResetSession();
        }

        private void HandleServerError(ErrorEvent ev)
        {
            Debug.LogWarning($"[GameManager] Server error: {ev.Code} — {ev.Message}");
            OnError?.Invoke(ev.Code);
        }

        // ── Helpers ────────────────────────────────────────────────────────

        private void ResetSession()
        {
            SeatId = -1;
        }
    }
}
