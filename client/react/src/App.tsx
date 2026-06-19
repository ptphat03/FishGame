import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import LoginPage from './pages/LoginPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import WalletPage from './pages/WalletPage'
import DashboardPage from './pages/admin/DashboardPage'
import FishPage from './pages/admin/FishPage'
import RoomsPage from './pages/admin/RoomsPage'
import UsersPage from './pages/admin/UsersPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/game/:roomId" element={<GamePage />} />
            <Route path="/wallet" element={<WalletPage />} />

            {/* Admin — chỉ role_id != 1 */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/fish" element={<FishPage />} />
              <Route path="/admin/rooms" element={<RoomsPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/lobby" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
