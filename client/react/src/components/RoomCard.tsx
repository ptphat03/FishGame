import { useNavigate } from 'react-router-dom'
import type { Room } from '../types'

interface RoomCardProps {
  room: Room
}

export default function RoomCard({ room }: RoomCardProps) {
  const navigate = useNavigate()

  return (
    <div className="rounded-xl border border-white/[0.07] bg-gray-800 p-5 hover:bg-gray-700/50 hover:border-white/[0.12] transition-all duration-200 flex flex-col gap-4">
      <div>
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-100">{room.name}</h3>
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
        className="w-full py-2 px-4 rounded-lg font-medium text-sm text-white bg-blue-600 hover:bg-blue-500 transition-colors"
      >
        Enter room
      </button>
    </div>
  )
}
