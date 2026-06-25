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

  const { setCurrentRoom, resetGame } = useGameStore()
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
    sendRequestResync,
    onFishKilledRef,
    onFishSpawnRef,
    onBroadcastShootRef,
    onBroadcastKillRef,
  } = useGameSocket(!isNaN(roomId) ? roomId : null)

  const confirmDeathRef = useRef<((instanceId: string) => void) | null>(null)
  const spawnFishRef = useRef<((payload: any) => void) | null>(null)
  const broadcastShootRef = useRef<((payload: any) => void) | null>(null)
  const broadcastKillRef = useRef<((instanceId: string) => void) | null>(null)
  const clearBoardRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (room) setCurrentRoom(room)
  }, [room, setCurrentRoom])

  useEffect(() => {
    resetGame()
  }, [roomId, resetGame])

  useEffect(() => {
    fetchWallet()
    return () => setCurrentRoom(null)
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearBoardRef.current?.()
        sendRequestResync()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [sendRequestResync])

  const isLoading = roomLoading || fishLoading
  const isError = roomError || fishError

  if (isNaN(roomId)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm font-medium">Invalid room ID</p>
          <button onClick={() => navigate('/')} className="mt-3 text-xs text-blue-400 underline">Back to Home</button>
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
            onClick={() => navigate('/')}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Back to Home
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
          currentBet={selectedBet}
          onShot={handleShot}
          onHitFish={handleHitFish}
          onReady={sendClientReady}
          confirmDeathRef={confirmDeathRef}
          spawnFishRef={spawnFishRef}
          onBroadcastShootRef={broadcastShootRef}
          onBroadcastKillRef={broadcastKillRef}
          clearBoardRef={clearBoardRef}
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

      {}
      {wsStatus === 'disconnected' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center px-8 py-7 rounded-xl bg-gray-800 border border-white/[0.07] shadow-2xl max-w-sm mx-4">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 17.657a9 9 0 010-12.728M8.464 15.536a5 5 0 010-7.072M12 12h.01" />
              </svg>
            </div>
            <h3 className="text-gray-100 font-semibold mb-1.5">Disconnected</h3>
            <p className="text-gray-400 text-sm mb-5">
              Connection to server interrupted. Your progress has been saved.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {}
      <div className="absolute inset-0 pointer-events-none">
        {}
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
            onClick={() => navigate('/')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Home
          </button>
        </div>

        {}
        {(() => {
          const isCannonLeft = seatId === 0 || seatId === 3;
          const isBottom = seatId === 0 || seatId === 1;

          const hudBox = (
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/15 shadow-lg px-3 py-1.5 rounded-xl flex items-center gap-4 pointer-events-none shrink-0 h-12">
              <div className={isCannonLeft ? "text-left" : "text-right"}>
                <div className="text-[9px] text-gray-400 font-bold uppercase">Your Wallet</div>
                <div className="text-lg font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] tabular-nums leading-tight">
                  {balance !== null ? balance.toLocaleString() : '...'}
                </div>
              </div>
            </div>
          );

          const yClass = isBottom ? "bottom-6" : "top-6";
          const xClass = isCannonLeft ? "left-6 flex-row" : "right-6 flex-row-reverse";

          return (
            <div className={`absolute z-10 flex items-center gap-3 ${yClass} ${xClass}`}>
              <button
                onClick={() => setSelectedBet(Math.max(10, selectedBet - 10))}
                className="w-10 h-10 rounded-full bg-slate-800 border border-white/20 text-white font-bold hover:bg-slate-700 pointer-events-auto shadow-md shrink-0 text-xl"
              >
                -
              </button>
              
              {}
              <div className="w-24 h-24 shrink-0 pointer-events-none" />

              <button
                onClick={() => setSelectedBet(Math.min(100, selectedBet + 10))}
                className="w-10 h-10 rounded-full bg-blue-600 border border-blue-400 text-white font-bold hover:bg-blue-500 pointer-events-auto shadow-[0_0_15px_rgba(37,99,235,0.5)] shrink-0 text-xl"
              >
                +
              </button>

              {}
              <div className="w-1 shrink-0" />
              {hudBox}
            </div>
          );
        })()}

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
