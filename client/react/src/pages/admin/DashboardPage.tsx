import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/admin'
import Navbar from '../../components/Navbar'
import { Link } from 'react-router-dom'

function StatCard({ icon, label, value, to }: { icon: string; label: string; value: number | undefined; to: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-3 p-6 rounded-2xl border border-white/10 bg-slate-800/60 hover:bg-slate-800/90 hover:border-cyan-500/30 transition-all"
    >
      <div className="text-3xl">{icon}</div>
      <div className="text-3xl font-bold text-white tabular-nums">
        {value === undefined ? (
          <span className="inline-block w-16 h-8 rounded-lg bg-white/10 animate-pulse" />
        ) : (
          value.toLocaleString()
        )}
      </div>
      <div className="text-sm text-white/50">{label}</div>
    </Link>
  )
}

export default function DashboardPage() {
  const { data, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminApi.getDashboard,
    staleTime: 1000 * 30,
  })

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <main className="pt-20 px-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/50 text-sm mt-1">Tổng quan hệ thống</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            Không thể tải dữ liệu. Vui lòng thử lại.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon="👤" label="Người dùng" value={data?.total_users} to="/admin/users" />
          <StatCard icon="🏠" label="Phòng chơi" value={data?.total_rooms} to="/admin/rooms" />
          <StatCard icon="🐟" label="Loại cá" value={data?.total_fish} to="/admin/fish" />
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/admin/fish"
            className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-slate-800/40 hover:border-cyan-500/30 hover:bg-slate-800/70 transition-all"
          >
            <span className="text-2xl">🐟</span>
            <div>
              <div className="font-semibold text-white">Quản lý cá</div>
              <div className="text-xs text-white/40 mt-0.5">Thêm, sửa, xóa loại cá và cấu hình</div>
            </div>
            <span className="ml-auto text-white/30">→</span>
          </Link>
          <Link
            to="/admin/rooms"
            className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-slate-800/40 hover:border-cyan-500/30 hover:bg-slate-800/70 transition-all"
          >
            <span className="text-2xl">🏠</span>
            <div>
              <div className="font-semibold text-white">Quản lý phòng</div>
              <div className="text-xs text-white/40 mt-0.5">Cấu hình phòng chơi và RTP</div>
            </div>
            <span className="ml-auto text-white/30">→</span>
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-slate-800/40 hover:border-cyan-500/30 hover:bg-slate-800/70 transition-all"
          >
            <span className="text-2xl">👤</span>
            <div>
              <div className="font-semibold text-white">Danh sách người dùng</div>
              <div className="text-xs text-white/40 mt-0.5">Xem thông tin tài khoản</div>
            </div>
            <span className="ml-auto text-white/30">→</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
