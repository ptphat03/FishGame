import { useEffect, useCallback, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { roomsApi } from '../api/rooms'
import { fishApi } from '../api/fish'
import { useGameStore } from '../stores/gameStore'
import { useWalletStore } from '../stores/walletStore'
import { useGameSocket } from '../hooks/useGameSocket'
import GameCanvas from '../game/GameCanvas'

const BET_OPTIONS = [10, 20, 50, 100]

export default function GamePage() {
  const { roomId: roomIdStr } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const roomId = Number(roomIdStr)

  const { coins, score, setCurrentRoom, resetGame } = useGameStore()
  const { balance, fetchWallet } = useWalletStore()

  // ── Bet selection ──────────────────────────────────────────────────────────
  const [selectedBet, setSelectedBet] = useState<number>(BET_OPTIONS[0])

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: room, isLoading: roomLoading, isError: roomError } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomsApi.get(roomId),
    enabled: !!roomId && !isNaN(roomId),
  })

  const { data: fishList, isLoading: fishLoading, isError: fishError } = useQuery({
    queryKey: ['fish'],
    queryFn: fishApi.list,
  })

  // ── WebSocket (tự động join_room khi connect, leave_room khi unmount) ──────
  const {
    status: wsStatus,
    seatId,
    lastError,
    sendShoot,
    sendHitFish,
    sendClientReady,
    onFishKilledRef,
    onFishSpawnRef,
    onBroadcastShootRef,
    onBroadcastKillRef,
  } = useGameSocket(!isNaN(roomId) ? roomId : null)

  // Ref để GameCanvas expose confirmFishDeath; hook gọi nó khi server confirms kill
  const confirmDeathRef = useRef<((instanceId: string) => void) | null>(null)

  // Ref để GameCanvas expose addFishFromServer; hook gọi nó khi server báo spawn_fish
  const spawnFishRef = useRef<((payload: any) => void) | null>(null)
  const broadcastShootRef = useRef<((payload: any) => void) | null>(null)
  const broadcastKillRef = useRef<((instanceId: string) => void) | null>(null)

  // ── Game state setup ───────────────────────────────────────────────────────
  useEffect(() => {
    if (room) setCurrentRoom(room)
  }, [room, setCurrentRoom])

  // Reset coins/score mỗi khi roomId thay đổi (bao gồm lần mount đầu)
  useEffect(() => {
    resetGame()
  }, [roomId, resetGame])

  useEffect(() => {
    fetchWallet()
    return () => setCurrentRoom(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Ref để đọc latest balance/selectedBet trong callback mà không recreate ──
  const balanceRef = useRef(balance)
  const selectedBetRef = useRef(selectedBet)
  useEffect(() => { balanceRef.current = balance }, [balance])
  useEffect(() => { selectedBetRef.current = selectedBet }, [selectedBet])

  // ── Canvas callbacks → WS ─────────────────────────────────────────────────
  // Dùng ref thay vì state trong deps → handleShot không bị recreate khi balance thay đổi
  // → GameScene không bị dispose/recreate mỗi khi bắn
  const handleShot = useCallback(
    (x: number, y: number, angle: number): boolean => {
      const bal = balanceRef.current
      const bet = selectedBetRef.current
      if (bal !== null && bal < bet) {
        return false // GameScene sẽ không push bullet
      }
      sendShoot(x, y, angle, bet)
      return true
    },
    [sendShoot], // ← không còn balance/selectedBet trong deps
  )

  const handleHitFish = useCallback(
    (fishId: number, instanceId: string) => sendHitFish(fishId, instanceId),
    [sendHitFish],
  )

  // Kết nối onFishKilledRef (từ hook) → confirmDeathRef (vào GameCanvas)
  // Dùng useEffect để gán ref sau khi confirmDeathRef sẵn sàng
  useEffect(() => {
    onFishKilledRef.current = (instanceId: string) => {
      confirmDeathRef.current?.(instanceId)
    }
  }, [onFishKilledRef])

  useEffect(() => {
    if (onFishSpawnRef) {
      onFishSpawnRef.current = (payload: any) => {
        spawnFishRef.current?.(payload)
      }
    }
    if (onBroadcastShootRef) {
      onBroadcastShootRef.current = (payload: any) => {
        broadcastShootRef.current?.(payload)
      }
    }
    if (onBroadcastKillRef) {
      onBroadcastKillRef.current = (instanceId: string) => {
        broadcastKillRef.current?.(instanceId)
      }
    }
  }, [onFishSpawnRef, onBroadcastShootRef, onBroadcastKillRef])

  // ── Error / invalid states ─────────────────────────────────────────────────
  const isLoading = roomLoading || fishLoading
  const isError = roomError || fishError

  if (isNaN(roomId)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-medium">Invalid room ID</p>
          <button onClick={() => navigate('/lobby')} className="mt-4 text-cyan-400 underline">Back to Lobby</button>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl mb-4 block">🌊</span>
          <p className="text-red-400 text-lg font-medium mb-2">Failed to load game data</p>
          <button
            onClick={() => navigate('/lobby')}
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-medium"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-hidden">
      {/* Canvas */}
      {!isLoading && room && fishList && (
        <GameCanvas
          room={room}
          fishList={fishList}
          seatId={seatId ?? 0}
          onShot={handleShot}
          onHitFish={handleHitFish}
          onReady={sendClientReady}
          confirmDeathRef={confirmDeathRef}
          spawnFishRef={spawnFishRef}
          onBroadcastShootRef={broadcastShootRef}
          onBroadcastKillRef={broadcastKillRef}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60 text-lg">Loading game...</p>
          </div>
        </div>
      )}

      {/* Disconnect overlay — hiện khi WS mất kết nối sau khi đã connect */}
      {wsStatus === 'disconnected' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center px-8 py-8 rounded-2xl bg-slate-800 border border-red-500/30 shadow-2xl max-w-sm mx-4">
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 17.657a9 9 0 010-12.728M8.464 15.536a5 5 0 010-7.072M12 12h.01" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Mất kết nối</h3>
            <p className="text-white/50 text-sm mb-6">
              Kết nối đến server bị gián đoạn. Ván chơi đã được lưu lại.
            </p>
            <button
              onClick={() => navigate('/lobby')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Về Lobby
            </button>
          </div>
        </div>
      )}

      {/* HUD */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 backdrop-blur border border-white/10">
            <span className="text-lg">🏠</span>
            <span className="text-white font-semibold text-sm">{room?.name ?? 'Loading...'}</span>
          </div>

          {/* WS status indicator */}
          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${wsStatus === 'connected'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : wsStatus === 'connecting'
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
            {wsStatus === 'connected' ? '● Live' : wsStatus === 'connecting' ? '◌ Connecting...' : '○ Offline'}
          </div>

          <button
            className="pointer-events-auto px-4 py-2 rounded-xl bg-black/40 backdrop-blur border border-white/10 text-white/70 hover:text-white hover:border-white/30 text-sm font-medium transition-all flex items-center gap-1.5"
            onClick={() => navigate('/lobby')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Lobby
          </button>
        </div>

        {/* Bottom HUD */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-4 pb-4">
          {/* Ví */}
          <div className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl bg-black/50 backdrop-blur border border-yellow-500/20">
            <span className="text-2xl">🪙</span>
            <span className="text-yellow-400 font-extrabold text-2xl leading-none tabular-nums">
              {balance !== null ? balance.toLocaleString() : '...'}
            </span>
            <span className="text-white/40 text-xs uppercase tracking-wider">Ví</span>
          </div>

          {/* Chọn đạn */}
          <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl bg-black/50 backdrop-blur border border-orange-500/20 pointer-events-auto">
            <span className="text-white/40 text-xs uppercase tracking-wider">Chọn đạn</span>
            <div className="flex gap-1.5">
              {BET_OPTIONS.map((bet) => (
                <button
                  key={bet}
                  onClick={() => setSelectedBet(bet)}
                  className={`w-12 h-8 rounded-lg text-sm font-bold transition-all ${selectedBet === bet
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110'
                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }`}
                >
                  {bet}
                </button>
              ))}
            </div>
          </div>

          {/* Thu nhập ván này */}
          <div className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl bg-black/50 backdrop-blur border border-emerald-500/20">
            <span className="text-2xl">💰</span>
            <span className="text-emerald-400 font-extrabold text-2xl leading-none tabular-nums">
              +{coins.toLocaleString()}
            </span>
            <span className="text-white/40 text-xs uppercase tracking-wider">Ván này</span>
          </div>

          {/* Cá bắn hạ */}
          <div className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl bg-black/50 backdrop-blur border border-cyan-500/20">
            <span className="text-2xl">🎯</span>
            <span className="text-cyan-400 font-extrabold text-2xl leading-none tabular-nums">{score}</span>
            <span className="text-white/40 text-xs uppercase tracking-wider">Cá bắn</span>
          </div>
        </div>


        {/* Toast lỗi WS (INSUFFICIENT_BALANCE, INVALID_BET...) */}
        {lastError && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl bg-red-500/90 backdrop-blur text-white text-sm font-semibold shadow-lg pointer-events-none animate-fade-in">
            ⚠️ {lastError.message}
          </div>
        )}

        {/* Controls hint */}
        <div className="absolute top-1/2 right-4 -translate-y-1/2 text-right">
          <div className="px-3 py-2 rounded-xl bg-black/30 backdrop-blur border border-white/5 text-white/25 text-xs space-y-1">
            <p>Click to shoot</p>
            <p>Aim with mouse</p>
          </div>
        </div>
      </div>
    </div>
  )
}
