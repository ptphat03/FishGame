import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../api/auth'

export default function ProtectedRoute() {
  const { accessToken, setToken } = useAuthStore()

  // Lần đầu mount mà không có token trong memory (reload trang) → thử silent refresh
  const [isInitializing, setIsInitializing] = useState(!accessToken)

  useEffect(() => {
    if (accessToken) return // đã có token, không cần refresh

    authApi
      .refresh()
      .then((data) => setToken(data.access_token))
      .catch(() => {}) // refresh thất bại → accessToken vẫn null → redirect login
      .finally(() => setIsInitializing(false))
  // chỉ chạy 1 lần khi mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
