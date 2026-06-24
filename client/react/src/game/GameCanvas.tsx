import { useEffect, useRef, useCallback } from 'react'
import { GameScene } from './scenes/GameScene'
import type { Fish, Room } from '../types'

interface GameCanvasProps {
  room: Room
  fishList: Fish[]
  seatId: number
  onHitFish: (fishId: number, instanceId: string) => void
  onShot: (x: number, y: number, angle: number) => boolean
  onReady?: () => void
  // Ref để parent gọi hàm confirmFishDeath
  confirmDeathRef: { current: ((instanceId: string) => void) | null }
  // BỔ SUNG: Ref để parent truyền lệnh sinh cá (spawn_fish) từ Server vào Canvas
  spawnFishRef?: React.MutableRefObject<((payload: any) => void) | null>
  // BỔ SUNG: Ref để parent truyền event bắn của người khác vào Canvas
  onBroadcastShootRef?: React.MutableRefObject<((payload: any) => void) | null>
  // BỔ SUNG: Ref để parent truyền event kill broadcast vào Canvas
  onBroadcastKillRef?: React.MutableRefObject<((instanceId: string) => void) | null>
  // BỔ SUNG: Ref để parent gọi hàm clearBoard
  clearBoardRef?: React.MutableRefObject<(() => void) | null>
}

export default function GameCanvas({ room, fishList, seatId, onHitFish, onShot, onReady, confirmDeathRef, spawnFishRef, onBroadcastShootRef, onBroadcastKillRef, clearBoardRef }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameSceneRef = useRef<GameScene | null>(null)

  const handleHitFish = useCallback(
    (fishId: number, instanceId: string) => onHitFish(fishId, instanceId),
    [onHitFish],
  )

  const handleShot = useCallback(
    (x: number, y: number, angle: number): boolean => onShot(x, y, angle),
    [onShot],
  )

  useEffect(() => {
    if (!canvasRef.current) return

    const timeout = setTimeout(() => {
      if (!canvasRef.current) return
      const scene = new GameScene({
        canvas: canvasRef.current,
        fishList,
        roomRtp: room.rtp,
        seatId,
        onHitFish: handleHitFish,
        onShot: handleShot,
      })
      gameSceneRef.current = scene

      // Expose các hàm của GameScene ra cho component cha sử dụng
      confirmDeathRef.current = (instanceId) => scene.confirmFishDeath(instanceId)

      // BỔ SUNG: Gắn hàm addFishFromServer ra ngoài
      if (spawnFishRef) {
        spawnFishRef.current = (payload) => scene.addFishFromServer(payload)
      }
      if (onBroadcastShootRef) {
        onBroadcastShootRef.current = (payload) => scene.handleRemoteShoot(payload)
      }
      if (onBroadcastKillRef) {
        onBroadcastKillRef.current = (instanceId) => scene.confirmFishDeath(instanceId)
      }
      if (clearBoardRef) {
        clearBoardRef.current = () => scene.clearBoard()
      }
      onReady?.()

    }, 50)

    return () => {
      clearTimeout(timeout)
      gameSceneRef.current?.dispose()
      gameSceneRef.current = null
      confirmDeathRef.current = null
      if (spawnFishRef) spawnFishRef.current = null
      if (onBroadcastShootRef) onBroadcastShootRef.current = null
      if (onBroadcastKillRef) onBroadcastKillRef.current = null
      if (clearBoardRef) clearBoardRef.current = null
    }
  }, [fishList, handleHitFish, handleShot, confirmDeathRef, onBroadcastShootRef, spawnFishRef, room.rtp, seatId])

  return (
    <canvas
      ref={canvasRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'block', 
        cursor: 'none'
      }}
    />
  )
}