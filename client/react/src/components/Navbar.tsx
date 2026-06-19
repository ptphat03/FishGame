import { useEffect } from 'react'
import { useNavigate, useLocation, Link, NavLink } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useWalletStore } from '../stores/walletStore'
import { authApi } from '../api/auth'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, accessToken, setAuth, logout } = useAuthStore()
  const { balance, loading, fetchWallet, reset: resetWallet } = useWalletStore()

  // Khôi phục user từ /me nếu có token nhưng chưa có user (sau refresh trang)
  useEffect(() => {
    if (accessToken && !user) {
      authApi.me()
        .then((u) => setAuth(u, accessToken))
        .catch(() => {
          // token hết hạn hoặc lỗi → logout
          logout()
          navigate('/login', { replace: true })
        })
    }
  }, [accessToken, user, setAuth, logout, navigate])

  // Fetch balance khi đã có user
  useEffect(() => {
    if (user && balance === null) {
      fetchWallet()
    }
  }, [user, balance, fetchWallet])

  const handleLogout = () => {
    logout()
    resetWallet() // clear balance → auto-fetch khi login lại
    navigate('/login', { replace: true })
  }

  const isWalletPage = location.pathname === '/wallet'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-slate-900/80 backdrop-blur border-b border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🐟</span>
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
          Fish Game
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Admin link — chỉ hiển thị với admin */}
        {user && user.role_id !== 1 && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isActive
                  ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
                  : 'border-white/15 text-white/50 hover:text-white hover:border-white/30'
              }`
            }
          >
            ⚙ Admin
          </NavLink>
        )}

        {/* Balance chip */}
        {user && (
          <Link
            to="/wallet"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all ${
              isWalletPage
                ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500/35'
            }`}
          >
            <span className="text-base leading-none">🪙</span>
            {loading && balance === null ? (
              <span className="w-12 h-3 rounded-full bg-yellow-400/20 animate-pulse inline-block" />
            ) : (
              <span className="tabular-nums">{(balance ?? 0).toLocaleString()}</span>
            )}
          </Link>
        )}

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-white/80 text-sm font-medium hidden sm:block">
              {user.username}
            </span>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-white/70 hover:text-white border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-200"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
