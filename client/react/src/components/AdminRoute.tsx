import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function AdminRoute() {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to="/lobby" replace />
  if (user.role_id === 1) return <Navigate to="/lobby" replace />

  return <Outlet />
}
