import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/admin'
import Navbar from '../../components/Navbar'
import type { Room, RoomRequest } from '../../types'

const EMPTY: RoomRequest = { name: '', max_players: 4, rtp: 0.95, description: null }

function RoomModal({ room, onClose }: { room: Room | null; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = room !== null

  const [form, setForm] = useState<RoomRequest>(
    room
      ? { name: room.name, max_players: room.max_players, rtp: room.rtp, description: room.description }
      : EMPTY,
  )

  const set = <K extends keyof RoomRequest>(k: K, v: RoomRequest[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: isEdit ? (body: RoomRequest) => adminApi.updateRoom(room!.id, body) : adminApi.createRoom,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'rooms'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-800 p-6">
        <h2 className="text-lg font-bold mb-5">{isEdit ? 'Sửa phòng' : 'Thêm phòng mới'}</h2>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }} className="flex flex-col gap-3">
          {mutation.isError && (
            <div className="text-red-400 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              {(mutation.error as Error).message}
            </div>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/50">Tên phòng</span>
            <input
              required
              className="bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/60"
              value={form.name} onChange={(e) => set('name', e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-white/50">Số người tối đa</span>
              <input
                type="number" min={1} max={10}
                className="bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/60"
                value={form.max_players} onChange={(e) => set('max_players', parseInt(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-white/50">RTP (0–1)</span>
              <input
                type="number" min={0} max={1} step={0.01}
                className="bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/60"
                value={form.rtp} onChange={(e) => set('rtp', parseFloat(e.target.value))}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/50">Mô tả (tuỳ chọn)</span>
            <input
              className="bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/60"
              value={form.description ?? ''} onChange={(e) => set('description', e.target.value || null)}
            />
          </label>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/5 text-sm transition-all">
              Hủy
            </button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-900 font-semibold text-sm transition-all">
              {mutation.isPending ? 'Đang lưu…' : 'Lưu'}
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

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteRoom,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'rooms'] }),
  })

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <main className="pt-20 px-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">🏠 Quản lý phòng</h1>
            <p className="text-white/50 text-sm mt-1">{rooms.length} phòng</p>
          </div>
          <button
            onClick={() => setEditing('new')}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-all"
          >
            + Thêm phòng
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 text-white/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Tên</th>
                <th className="text-right px-4 py-3 font-medium">Người chơi</th>
                <th className="text-right px-4 py-3 font-medium">RTP</th>
                <th className="text-left px-4 py-3 font-medium">Mô tả</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-white/5 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-white/30">Chưa có phòng nào</td>
                </tr>
              ) : (
                rooms.map((r) => (
                  <tr key={r.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{r.name}</td>
                    <td className="px-4 py-3 text-right text-white/70 tabular-nums">{r.max_players}</td>
                    <td className="px-4 py-3 text-right text-cyan-400 tabular-nums">
                      {(r.rtp * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">{r.description ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditing(r)}
                          className="px-3 py-1 rounded-lg text-xs border border-white/20 text-white/60 hover:border-cyan-500/40 hover:text-cyan-400 transition-all"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => { if (confirm(`Xóa phòng "${r.name}"?`)) deleteMutation.mutate(r.id) }}
                          disabled={deleteMutation.isPending}
                          className="px-3 py-1 rounded-lg text-xs border border-red-500/20 text-red-400/70 hover:border-red-500/40 hover:text-red-400 transition-all disabled:opacity-40"
                        >
                          Xóa
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
