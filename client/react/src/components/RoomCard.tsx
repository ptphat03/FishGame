import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import type { Room } from '../types'

interface RoomCardProps {
  room: Room
}

export default function RoomCard({ room }: RoomCardProps) {
  const navigate = useNavigate()

  return (
    <div className="group neon-card neon-card-hover p-5 flex flex-col gap-4">
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-bold text-gray-100 group-hover:text-blue-400 transition-colors drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">{room.name}</h3>
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        </div>

        {room.description && (
          <p className="text-gray-500 text-xs mb-3 line-clamp-2">{room.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{room.max_players} players max</span>
          <span>RTP {(room.rtp * 100).toFixed(0)}%</span>
        </div>
      </div>

      <button
        onClick={() => navigate(`/game/${room.id}`)}
        className="neon-btn w-full py-2.5 px-4 gap-1.5"
      >
        <Play size={16} fill="currentColor" />
        Join Room
      </button>
    </div>
  )
}
