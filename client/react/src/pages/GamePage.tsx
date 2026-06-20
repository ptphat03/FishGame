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

  const [selectedBet, setSelectedBet] = useState<number>(BET_OPTIONS[0])

  const { data: room, isLoading: roomLoading, isError: roomError } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomsApi.get(roomId),
    enabled: !!roomId && !isNaN(roomId),
  })

  const { data: fishList, isLoading: fishLoading, isError: fishError } = useQuery({
    queryKey: ['fish'],
    queryFn: fishApi.list,
  })

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

  const confirmDeathRef = useRef<((instanceId: string) => void) | null>(null)
  const spawnFishRef = useRef<((payload: any) => void) | null>(null)
  const broadcastShootRef = useRef<((payload: any) => void) | null>(null)
  const broadcastKillRef = useRef<((instanceId: string) => void) | null>(null)

  useEffect(() => {
    if (room) setCurrentRoom(room)
  }, [room, setCurrentRoom])

  useEffect(() => {
    resetGame()
  }, [roomId, resetGame])

  useEffect(() => {
    fetchWallet()
    return () => setCurrentRoom(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const balanceRef = useRef(balance)
  const selectedBetRef = useRef(selectedBet)
  useEffect(() => { balanceRef.current = balance }, [balance])
  useEffect(() => { selectedBetRef.current = selectedBet }, [selectedBet])

  const handleShot = useCallback(
    (x: number, y: number, angle: number): boolean => {
      const bal = balanceRef.current
      const bet = selectedBetRef.current
      if (bal !== null && bal < bet) return false
      sendShoot(x, y, angle, bet)
      return true
    },
    [sendShoot],
  )

  const handleHitFish = useCallback(
    (fishId: number, instanceId: string) => sendHitFish(fishId, instanceId),
    [sendHitFish],
  )

  useEffect(() => {
    onFishKilledRef.current = (instanceId: string) => {
      confirmDeathRef.current?.(instanceId)
    }
  }, [onFishKilledRef])

  useEffect(() => {
    if (onFishSpawnRef) {
      onFishSpawnRef.current = (payload: any) => { spawnFishRef.current?.(payload) }
    }
    if (onBroadcastShootRef) {
      onBroadcastShootRef.current = (payload: any) => { broadcastShootRef.current?.(payload) }
    }
    if (onBroadcastKillRef) {
      onBroadcastKillRef.current = (instanceId: string) => { broadcastKillRef.current?.(instanceId) }
    }
  }, [onFishSpawnRef, onBroadcastShootRef, onBroadcastKillRef])

  const isLoading = roomLoading || fishLoading
  const isError = roomError || fishError

  if (isNaN(roomId)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm font-medium">Invalid room ID</p>
          <button onClick={() => navigate('/lobby')} className="mt-3 text-xs text-blue-400 underline">Back to Lobby</button>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm font-medium mb-4">Failed to load game data</p>
          <button
            onClick={() => navigate('/lobby')}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 overflow-hidden">
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

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading game...</p>
          </div>
        </div>
      )}

      {/* Disconnect overlay */}
      {wsStatus === 'disconnected' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center px-8 py-7 rounded-xl bg-gray-800 border border-white/[0.07] shadow-2xl max-w-sm mx-4">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 17.657a9 9 0 010-12.728M8.464 15.536a5 5 0 010-7.072M12 12h.01" />
              </svg>
            </div>
            <h3 className="text-gray-100 font-semibold mb-1.5">Mất kết nối</h3>
            <p className="text-gray-400 text-sm mb-5">
              Kết nối đến server bị gián đoạn. Ván chơi đã được lưu lại.
            </p>
            <button
              onClick={() => navigate('/lobby')}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors"
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
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50 backdrop-blur border border-white/[0.08]">
            <span className="text-white/80 font-medium text-sm">{room?.name ?? '...'}</span>
          </div>

          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${wsStatus === 'connected'
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
            : wsStatus === 'connecting'
              ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400'
              : 'bg-red-500/10 border-red-500/25 text-red-400'
            }`}>
            {wsStatus === 'connected' ? '● Live' : wsStatus === 'connecting' ? '◌ Connecting...' : '○ Offline'}
          </div>

          <button
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/50 backdrop-blur border border-white/[0.08] text-white/70 hover:text-white text-sm transition-colors"
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
          <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-black/50 backdrop-blur border border-white/[0.08]">
            <span className="text-xs text-white/40 uppercase tracking-wider">Ví</span>
            <span className="text-amber-400 font-bold text-xl tabular-nums">
              {balance !== null ? balance.toLocaleString() : '...'}
            </span>
          </div>

          {/* Chọn đạn */}
          <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-black/50 backdrop-blur border border-white/[0.08] pointer-events-auto">
            <span className="text-xs text-white/40 uppercase tracking-wider">Chọn đạn</span>
            <div className="flex gap-1.5">
              {BET_OPTIONS.map((bet) => (
                <button
                  key={bet}
                  onClick={() => setSelectedBet(bet)}
                  className={`w-11 h-8 rounded-lg text-sm font-medium transition-all ${selectedBet === bet
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white'
                    }`}
                >
                  {bet}
                </button>
              ))}
            </div>
          </div>

          {/* Thu nhập */}
          <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-black/50 backdrop-blur border border-white/[0.08]">
            <span className="text-xs text-white/40 uppercase tracking-wider">Ván này</span>
            <span className="text-emerald-400 font-bold text-xl tabular-nums">+{coins.toLocaleString()}</span>
          </div>

          {/* Cá bắn hạ */}
          <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-black/50 backdrop-blur border border-white/[0.08]">
            <span className="text-xs text-white/40 uppercase tracking-wider">Cá bắn</span>
            <span className="text-blue-400 font-bold text-xl tabular-nums">{score}</span>
          </div>
        </div>

        {lastError && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-red-500/90 backdrop-blur text-white text-sm font-medium shadow-lg pointer-events-none">
            ⚠️ {lastError.message}
          </div>
        )}

        <div className="absolute top-1/2 right-4 -translate-y-1/2 text-right">
          <div className="px-3 py-2 rounded-lg bg-black/30 backdrop-blur border border-white/[0.05] text-white/25 text-xs space-y-1">
            <p>Click to shoot</p>
            <p>Aim with mouse</p>
          </div>
        </div>
      </div>
    </div>
  )
}
