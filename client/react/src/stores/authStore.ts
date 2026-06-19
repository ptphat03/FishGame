import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  user: User | null
  accessToken: string | null
  setAuth: (user: User, accessToken: string) => void
  setToken: (accessToken: string) => void
  logout: () => void
}

// accessToken chỉ sống trong RAM — không persist xuống localStorage
// Reload trang → ProtectedRoute gọi silent refresh để lấy lại token mới
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,

  setAuth: (user, accessToken) => set({ user, accessToken }),

  setToken: (accessToken) => set({ accessToken }),

  logout: () => set({ user: null, accessToken: null }),
}))
