import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/admin'
import Navbar from '../../components/Navbar'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const PAGE_SIZE = 20

export default function UsersPage() {
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => adminApi.listUsers(PAGE_SIZE, page * PAGE_SIZE),
    placeholderData: (prev) => prev,
  })

  const users = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen text-gray-100">
      <Navbar />
      <main className="pt-20 px-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 mt-8">
          <h1 className="text-xl font-semibold text-gray-100">User Management</h1>
          <div className="flex items-center gap-3">
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
                <th className="px-5 py-4 font-medium">Username</th>
                <th className="px-5 py-4 font-medium">Role</th>
                <th className="px-5 py-4 font-medium">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-500/10">
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-white/[0.05] animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-600">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        {u.username}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${u.role === 'Admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-white/[0.05] text-gray-400 border-white/[0.1]'}`}>
                        {u.role === 'Admin' ? 'Admin' : 'Player'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-white/[0.1] hover:border-white/20 text-gray-400 hover:text-gray-200 disabled:opacity-30 transition-all text-xs"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-white/[0.1] hover:border-white/20 text-gray-400 hover:text-gray-200 disabled:opacity-30 transition-all text-xs"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
