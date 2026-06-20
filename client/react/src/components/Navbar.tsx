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

  useEffect(() => {
    if (accessToken && !user) {
      authApi.me()
        .then((u) => setAuth(u, accessToken))
        .catch(() => {
          logout()
          navigate('/login', { replace: true })
        })
    }
  }, [accessToken, user, setAuth, logout, navigate])

  useEffect(() => {
    if (user && balance === null) {
      fetchWallet()
    }
  }, [user, balance, fetchWallet])

  const handleLogout = () => {
    logout()
    resetWallet()
    navigate('/login', { replace: true })
  }

  const isWalletPage = location.pathname === '/wallet'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-gray-900/90 backdrop-blur border-b border-white/[0.07]">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <span className="text-xl">🐟</span>
        <span className="text-base font-semibold text-gray-100">Fish Game</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Admin link */}
        {user && user.role_id !== 1 && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isActive
                  ? 'bg-amber-500/15 border-amber-500/35 text-amber-400'
                  : 'border-white/[0.1] text-gray-400 hover:text-gray-200 hover:border-white/20'
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              isWalletPage
                ? 'bg-amber-500/15 border-amber-500/35 text-amber-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/30'
            }`}
          >
            <span className="text-base leading-none">🪙</span>
            {loading && balance === null ? (
              <span className="w-12 h-3 rounded-full bg-amber-400/20 animate-pulse inline-block" />
            ) : (
              <span className="tabular-nums">{(balance ?? 0).toLocaleString()}</span>
            )}
          </Link>
        )}

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-300 text-sm hidden sm:block">{user.username}</span>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 border border-white/[0.1] hover:border-white/20 hover:bg-white/5 transition-all"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
