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
    <div className="min-h-screen w-full bg-gray-900 overflow-auto">
      <Navbar />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 mt-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Rooms</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {rooms ? `${rooms.length} rooms available` : 'Loading...'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 border border-white/[0.1] hover:border-white/20 px-3 py-1.5 rounded-lg transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {isError && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-5 text-center mb-6">
            <p className="text-red-400 text-sm">
              {error instanceof Error ? error.message : 'Failed to load rooms'}
            </p>
            <button onClick={() => refetch()} className="mt-2 text-xs text-red-400/70 hover:text-red-400 underline">
              Try again
            </button>
          </div>
        )}

        {isLoading && !rooms && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-white/[0.07] bg-gray-800 p-5 animate-pulse">
                <div className="h-4 bg-white/[0.07] rounded mb-3 w-3/4" />
                <div className="h-3 bg-white/[0.05] rounded mb-2 w-full" />
                <div className="h-3 bg-white/[0.05] rounded mb-5 w-1/2" />
                <div className="h-8 bg-white/[0.07] rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && rooms && rooms.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">No rooms available right now.</p>
            <p className="text-gray-600 text-sm mt-1">Check back later or contact an admin.</p>
          </div>
        )}

        {rooms && rooms.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
