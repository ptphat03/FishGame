import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/admin'
import Navbar from '../../components/Navbar'
import { Link } from 'react-router-dom'
import { Users, Gamepad2, Fish, ArrowLeft } from 'lucide-react'

function StatCard({ icon, label, value, to }: { icon: React.ReactNode; label: string; value: number | undefined; to: string }) {
  return (
    <Link
      to={to}
      className="neon-card neon-card-hover flex flex-col gap-2 p-5"
    >
      <div className="mb-1">{icon}</div>
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
    <div className="min-h-screen text-gray-100">
      <Navbar />
      <main className="pt-20 px-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-7 mt-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-100">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">System Overview</p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] text-gray-400 hover:text-gray-200 hover:border-white/20 hover:bg-white/5 text-sm transition-all"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
            Failed to load data. Please try again.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={<Users size={28} className="text-purple-400" />} label="Users" value={data?.total_users} to="/admin/users" />
          <StatCard icon={<Gamepad2 size={28} className="text-emerald-400" />} label="Rooms" value={data?.total_rooms} to="/admin/rooms" />
          <StatCard icon={<Fish size={28} className="text-blue-400" />} label="Fish Species" value={data?.total_fish} to="/admin/fish" />
        </div>

        <div className="text-sm font-medium text-gray-300 mb-3">Management</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { to: '/admin/fish', icon: <Fish size={20} className="text-blue-400" />, title: 'Fish Management', desc: 'Species & rewards' },
            { to: '/admin/rooms', icon: <Gamepad2 size={20} className="text-emerald-400" />, title: 'Room Management', desc: 'Configure & RTP' },
            { to: '/admin/users', icon: <Users size={20} className="text-purple-400" />, title: 'User Management', desc: 'Player accounts' },
          ].map(({ to, icon, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="neon-card neon-card-hover flex items-center gap-3 p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center shrink-0 shadow-inner">{icon}</div>
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
