import { useQuery } from '@tanstack/react-query'
import { roomsApi } from '../api/rooms'
import Navbar from '../components/Navbar'
import RoomCard from '../components/RoomCard'

export default function LobbyPage() {
  const {
    data: rooms,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.list,
    refetchInterval: 30_000,
  })

  return (
    <div className="min-h-screen w-full bg-slate-900 overflow-auto">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-teal-600/5 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <main className="relative pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-3">
            Game{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Rooms
            </span>
          </h2>
          <p className="text-white/40 max-w-md mx-auto">
            Choose a room to enter the underwater world. Shoot fish, earn rewards!
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm">
              {rooms ? `${rooms.length} rooms available` : 'Loading rooms...'}
            </span>
            {isLoading && (
              <div className="w-4 h-4 border-2 border-cyan-500/40 border-t-cyan-400 rounded-full animate-spin" />
            )}
          </div>
          <button
            onClick={() => refetch()}
            className="text-sm text-cyan-400/70 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Error state */}
        {isError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-400 font-medium">
              {error instanceof Error ? error.message : 'Failed to load rooms'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-sm text-red-400/70 hover:text-red-400 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && !rooms && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
                <div className="h-5 bg-white/10 rounded-lg mb-3 w-3/4" />
                <div className="h-3 bg-white/5 rounded-lg mb-2 w-full" />
                <div className="h-3 bg-white/5 rounded-lg mb-5 w-2/3" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="h-10 bg-white/5 rounded-lg" />
                  <div className="h-10 bg-white/5 rounded-lg" />
                </div>
                <div className="h-10 bg-white/10 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && rooms && rooms.length === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🌊</span>
            <p className="text-white/40 text-lg">No rooms available right now.</p>
            <p className="text-white/25 text-sm mt-1">Check back later or contact an admin.</p>
          </div>
        )}

        {/* Room grid */}
        {rooms && rooms.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
