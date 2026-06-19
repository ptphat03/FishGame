import { useNavigate } from 'react-router-dom'
import type { Room } from '../types'

interface RoomCardProps {
  room: Room
}

export default function RoomCard({ room }: RoomCardProps) {
  const navigate = useNavigate()

  const handleJoin = () => {
    navigate(`/game/${room.id}`)
  }

  return (
    <div className="group relative rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-6 hover:bg-white/10 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer flex flex-col gap-4">
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors duration-200">
            {room.name}
          </h3>
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        {room.description && (
          <p className="text-white/50 text-sm mb-4 line-clamp-2">{room.description}</p>
        )}

        <div className="flex flex-col">
          <span className="text-white/40 text-xs uppercase tracking-wider mb-1">Max Players</span>
          <span className="text-teal-400 font-bold text-lg">
            {room.max_players}
            <span className="text-xs text-teal-400/70 ml-1">players</span>
          </span>
        </div>
      </div>

      <button
        onClick={handleJoin}
        className="relative w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 active:scale-95 transition-all duration-200 shadow-lg shadow-cyan-500/20"
      >
        Join Room
      </button>
    </div>
  )
}
