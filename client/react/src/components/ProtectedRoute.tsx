import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../api/auth'

export default function ProtectedRoute() {
  const { accessToken, setToken } = useAuthStore()

  const [isInitializing, setIsInitializing] = useState(!accessToken)

  useEffect(() => {
    if (accessToken) return

    authApi
      .refresh()
      .then((data) => setToken(data.access_token))
      .catch(() => {})
      .finally(() => setIsInitializing(false))
  }, [])

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
