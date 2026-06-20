import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../api/auth'
import { useWalletStore } from '../stores/walletStore'

type Tab = 'login' | 'register'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, setToken } = useAuthStore()

  const [activeTab, setActiveTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const fetchWallet = useWalletStore((s) => s.fetchWallet)

  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await authApi.login({ username: loginUsername, password: loginPassword })
      setToken(res.access_token)
      const user = await authApi.me()
      setAuth(user, res.access_token)
      fetchWallet()
      navigate('/lobby', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (regPassword !== regConfirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authApi.register({ username: regUsername, email: regEmail, password: regPassword })
      setSuccessMsg('Account created! Please log in.')
      setActiveTab('login')
      setLoginUsername(regUsername)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    setError(null)
    setSuccessMsg(null)
  }

  const inputCls = 'w-full rounded-lg bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all'
  const labelCls = 'block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5'

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-4xl mx-4 flex rounded-xl border border-white/[0.07] overflow-hidden shadow-2xl">
        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-center bg-gray-800 px-10 py-12 w-2/5 border-r border-white/[0.07]">
          <div className="flex items-center gap-2.5 mb-8">
            <span className="text-2xl">🐟</span>
            <span className="text-lg font-semibold text-gray-100">Fish Game</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-100 leading-snug mb-3">
            Shoot fish,<br />earn coins,<br />top the board.
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            Up to 4 players per room. Join any time.
          </p>
          <div className="flex flex-col gap-3">
            {['Free to join', 'Instant sessions', 'Live leaderboard'].map((txt) => (
              <div key={txt} className="flex items-center gap-2.5 text-sm text-gray-400">
                <span className="text-emerald-400">✓</span>
                {txt}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 bg-gray-900 px-8 py-10">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 md:hidden">
            <span className="text-xl">🐟</span>
            <span className="text-base font-semibold text-gray-100">Fish Game</span>
          </div>

          {/* Tab toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1 mb-7">
            {(['login', 'register'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-gray-700 text-gray-100 border border-white/[0.08]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
              {successMsg}
            </div>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelCls}>Username</label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter your username"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {loading ? 'Logging in...' : 'Sign in'}
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={labelCls}>Username</label>
                <input type="text" required value={regUsername} onChange={(e) => setRegUsername(e.target.value)} placeholder="Choose a username" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="your@email.com" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Password</label>
                <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Choose a password" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Confirm Password</label>
                <input type="password" required value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} placeholder="Repeat your password" className={inputCls} />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
