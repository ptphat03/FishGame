import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/admin'
import Navbar from '../../components/Navbar'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import type { Room, RoomRequest } from '../../types'

const EMPTY: RoomRequest = { name: '', max_players: 4, rtp: 0.95, description: null }

function RoomModal({ room, onClose }: { room: Room | null; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = room !== null
  const [form, setForm] = useState<RoomRequest>(
    room ? { name: room.name, max_players: room.max_players, rtp: room.rtp, description: room.description } : EMPTY,
  )
  const set = <K extends keyof RoomRequest>(k: K, v: RoomRequest[K]) => setForm((f) => ({ ...f, [k]: v }))

  const saveMut = useMutation({
    mutationFn: isEdit ? (body: RoomRequest) => adminApi.updateRoom(room!.id, body) : adminApi.createRoom,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'rooms'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="neon-card w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-5">{isEdit ? 'Edit Room' : 'Add New Room'}</h2>
        <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(form) }} className="flex flex-col gap-3">
          {saveMut.isError && (
            <div className="text-red-400 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              {(saveMut.error as Error).message}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Room Name</label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Max Players</label>
              <input type="number" required value={form.max_players} onChange={(e) => set('max_players', parseInt(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 text-sm focus:outline-none focus:border-blue-500 tabular-nums" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">RTP (Return to Player)</label>
              <input type="number" step="0.01" required value={form.rtp} onChange={(e) => set('rtp', parseFloat(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 text-sm focus:outline-none focus:border-blue-500 tabular-nums" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description (Optional)</label>
            <textarea value={form.description || ''} onChange={(e) => set('description', e.target.value || null)} className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 text-sm focus:outline-none focus:border-blue-500 min-h-[80px]" />
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/[0.1] text-gray-400 hover:text-gray-200 hover:bg-white/5 text-sm transition-all">Cancel</button>
            <button type="submit" disabled={saveMut.isPending} className="neon-btn flex-1 py-2.5">
              {saveMut.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RoomsPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Room | null | 'new'>(null)

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['admin', 'rooms'],
    queryFn: adminApi.listRooms,
  })

  const deleteMut = useMutation({
    mutationFn: adminApi.deleteRoom,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'rooms'] }),
  })

  return (
    <div className="min-h-screen text-gray-100">
      <Navbar />
      <main className="pt-20 px-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 mt-8">
          <h1 className="text-xl font-semibold text-gray-100">Room Management</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditing('new')}
              className="neon-btn px-4 py-2 gap-1"
            >
              <Plus size={16} />
              Add Room
            </button>
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.1] text-gray-400 hover:text-gray-200 hover:border-white/20 hover:bg-white/5 text-sm transition-all"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="neon-card">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-white/[0.02] border-b border-white/[0.05] text-gray-400">
              <tr>
                <th className="px-5 py-4 font-medium">Room Name</th>
                <th className="px-5 py-4 font-medium">Players</th>
                <th className="px-5 py-4 font-medium">RTP</th>
                <th className="px-5 py-4 font-medium">Description</th>
                <th className="px-5 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-500/10">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-white/[0.05] animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-600">No rooms available</td>
                </tr>
              ) : (
                rooms.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-100">{r.name}</td>
                    <td className="px-4 py-3 text-right text-gray-400 tabular-nums">{r.max_players}</td>
                    <td className="px-4 py-3 text-right text-blue-400 tabular-nums">{(r.rtp * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.description ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditing(r)} className="px-3 py-1.5 text-xs font-medium rounded border border-white/[0.1] text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all">
                          Edit
                        </button>
                        <button onClick={() => { if (confirm(`Delete room "${r.name}"?`)) deleteMut.mutate(r.id) }} className="px-3 py-1.5 text-xs font-medium rounded border border-white/[0.1] text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {editing !== null && (
        <RoomModal room={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
