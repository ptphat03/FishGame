import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/admin'
import Navbar from '../../components/Navbar'
import { Link } from 'react-router-dom'

function StatCard({ icon, label, value, to }: { icon: string; label: string; value: number | undefined; to: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-2 p-5 rounded-xl border border-white/[0.07] bg-gray-800 hover:bg-gray-700/60 hover:border-white/[0.12] transition-all"
    >
      <div className="text-xl">{icon}</div>
      <div className="text-2xl font-bold text-gray-100 tabular-nums">
        {value === undefined ? (
          <span className="inline-block w-14 h-7 rounded-lg bg-white/[0.07] animate-pulse" />
        ) : (
          value.toLocaleString()
        )}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
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
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Navbar />
      <main className="pt-20 px-6 max-w-4xl mx-auto">
        <div className="mb-7 mt-8">
          <h1 className="text-xl font-semibold text-gray-100">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Tổng quan hệ thống</p>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
            Không thể tải dữ liệu. Vui lòng thử lại.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon="👤" label="Người dùng" value={data?.total_users} to="/admin/users" />
          <StatCard icon="🏠" label="Phòng chơi" value={data?.total_rooms} to="/admin/rooms" />
          <StatCard icon="🐟" label="Loại cá" value={data?.total_fish} to="/admin/fish" />
        </div>

        <div className="text-sm font-medium text-gray-300 mb-3">Quản lý</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { to: '/admin/fish', icon: '🐟', title: 'Quản lý cá', desc: 'Species & rewards' },
            { to: '/admin/rooms', icon: '🏠', title: 'Quản lý phòng', desc: 'Configure & RTP' },
            { to: '/admin/users', icon: '👤', title: 'Người dùng', desc: 'Player accounts' },
          ].map(({ to, icon, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.07] bg-gray-800 hover:bg-gray-700/60 hover:border-white/[0.12] transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-base shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-100">{title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </div>
              <span className="text-gray-600 text-sm">→</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
