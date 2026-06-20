import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/admin'
import Navbar from '../../components/Navbar'
import type { Fish, FishRequest } from '../../types'

const EMPTY: FishRequest = { name: '', health: 100, reward_multiplier: 2, base_prob: 0.3, speed: 100, asset_path: '' }

const inputCls = 'bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500/60 w-full'

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </label>
  )
}

function NumField({ label, value, onChange, step, min, max }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        type="number" step={step ?? 1} min={min} max={max}
        className={inputCls}
        value={value} onChange={(e) => onChange(step ? parseFloat(e.target.value) : parseInt(e.target.value))}
      />
    </label>
  )
}

function FishModal({ fish, onClose }: { fish: Fish | null; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = fish !== null
  const [form, setForm] = useState<FishRequest>(
    fish ? { name: fish.name, health: fish.health, reward_multiplier: fish.reward_multiplier, base_prob: fish.base_prob, speed: fish.speed, asset_path: fish.asset_path } : EMPTY,
  )
  const set = (k: keyof FishRequest, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: isEdit ? (body: FishRequest) => adminApi.updateFish(fish!.id, body) : adminApi.createFish,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'fish'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-white/[0.07] bg-gray-800 p-6">
        <h2 className="text-base font-semibold text-gray-100 mb-5">{isEdit ? 'Sửa cá' : 'Thêm cá mới'}</h2>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }} className="flex flex-col gap-3">
          {mutation.isError && (
            <div className="text-red-400 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              {(mutation.error as Error).message}
            </div>
          )}
          <Field label="Tên" value={form.name} onChange={(v) => set('name', v)} required />
          <div className="grid grid-cols-2 gap-3">
            <NumField label="HP" value={form.health} onChange={(v) => set('health', v)} min={1} />
            <NumField label="Reward ×" value={form.reward_multiplier} onChange={(v) => set('reward_multiplier', v)} min={1} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Xác suất (0–1)" value={form.base_prob} onChange={(v) => set('base_prob', v)} step={0.001} min={0} max={1} />
            <NumField label="Tốc độ (px/s)" value={form.speed} onChange={(v) => set('speed', v)} min={10} />
          </div>
          <Field label="Asset path" value={form.asset_path} onChange={(v) => set('asset_path', v)} />
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/[0.1] text-gray-400 hover:bg-white/5 transition-all text-sm">
              Hủy
            </button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-all">
              {mutation.isPending ? 'Đang lưu…' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FishPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Fish | null | 'new'>(null)

  const { data: fishes = [], isLoading } = useQuery({
    queryKey: ['admin', 'fish'],
    queryFn: adminApi.listFish,
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteFish,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'fish'] }),
  })

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Navbar />
      <main className="pt-20 px-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 mt-8">
          <div>
            <h1 className="text-xl font-semibold">Quản lý cá</h1>
            <p className="text-gray-500 text-sm mt-0.5">{fishes.length} loại cá</p>
          </div>
          <button
            onClick={() => setEditing('new')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors"
          >
            + Thêm cá
          </button>
        </div>

        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Tên</th>
                <th className="text-right px-4 py-3 font-medium">HP</th>
                <th className="text-right px-4 py-3 font-medium">Reward ×</th>
                <th className="text-right px-4 py-3 font-medium">Xác suất</th>
                <th className="text-right px-4 py-3 font-medium">Tốc độ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] bg-gray-800/40">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-white/[0.05] animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : fishes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-600">Chưa có cá nào</td>
                </tr>
              ) : (
                fishes.map((f) => (
                  <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-100">{f.name}</td>
                    <td className="px-4 py-3 text-right text-gray-400 tabular-nums">{f.health}</td>
                    <td className="px-4 py-3 text-right text-blue-400 tabular-nums">×{f.reward_multiplier}</td>
                    <td className="px-4 py-3 text-right text-gray-400 tabular-nums">{(f.base_prob * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right text-gray-400 tabular-nums">{f.speed}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditing(f)}
                          className="px-3 py-1 rounded-md text-xs border border-white/[0.1] text-gray-400 hover:border-blue-500/40 hover:text-blue-400 transition-all"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => { if (confirm(`Xóa cá "${f.name}"?`)) deleteMutation.mutate(f.id) }}
                          disabled={deleteMutation.isPending}
                          className="px-3 py-1 rounded-md text-xs border border-red-500/20 text-red-400/60 hover:border-red-500/40 hover:text-red-400 transition-all disabled:opacity-40"
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
        <FishModal fish={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
