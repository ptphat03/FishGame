import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/authStore'

const BASE_URL = '/api'

// Routes that must never trigger an auto-refresh attempt
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh']

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // send HttpOnly refresh_token cookie automatically
})

// ── Request interceptor: attach Bearer token ────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Refresh queue: hold concurrent 401 requests while refreshing ─────────────
let isRefreshing = false
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function drainQueue(token: string) {
  refreshQueue.forEach((p) => p.resolve(token))
  refreshQueue = []
}

function rejectQueue(err: unknown) {
  refreshQueue.forEach((p) => p.reject(err))
  refreshQueue = []
}

// ── Response interceptor: handle 401 with auto-refresh ──────────────────────
apiClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError<{ error: { code: string; message: string } | null }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    const isAuthRoute = AUTH_ROUTES.some((r) => originalRequest?.url?.includes(r))
    const is401 = error.response?.status === 401

    // Attempt token refresh only once per original request
    if (is401 && !isAuthRoute && !originalRequest._retry) {
      originalRequest._retry = true

      if (isRefreshing) {
        // Queue this request until the ongoing refresh finishes
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(apiClient(originalRequest))
            },
            reject,
          })
        })
      }

      isRefreshing = true

      try {
        // POST /auth/refresh — cookie is sent automatically (withCredentials)
        const refreshRes = await apiClient.post<{
          data: { access_token: string; access_token_expires_at: number }
          error: null
        }>('/auth/refresh')
        const newToken = refreshRes.data.data.access_token

        useAuthStore.getState().setToken(newToken)

        drainQueue(newToken)

        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch (refreshErr) {
        rejectQueue(refreshErr)

        useAuthStore.getState().logout()
        window.location.href = '/login'

        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    // For all other errors normalise into a plain Error
    const serverMessage = error.response?.data?.error?.message
    const message = serverMessage ?? error.message ?? 'Unknown error'
    return Promise.reject(new Error(message))
  },
)

export function extractData<T>(res: AxiosResponse<{ data: T; error: null }>): T {
  return res.data.data
}
