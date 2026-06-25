export interface User {
  id: number
  username: string
  email: string
  role_id: number
  created_at: string
  updated_at?: string  
}

export interface Room {
  id: number
  name: string
  max_players: number
  description: string | null
  rtp: number
  created_at: string
  updated_at: string
}

export interface Fish {
  id: number
  name: string
  health: number
  reward_multiplier: number
  base_prob: number
  speed: number
  asset_path: string
  created_at: string
  updated_at: string
}

export interface ApiSuccess<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: {
    code: string
    message: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  access_token_expires_at: number
}

export interface RefreshTokenResponse {
  access_token: string
  access_token_expires_at: number
}

export interface RegisterResponse {
  id: number
  username: string
  role_id: number
}

export interface Wallet {
  user_id: number
  balance: number
  updated_at: string
}

export interface Transaction {
  id: number
  user_id: number
  session_id: number | null
  amount: number
  type: 'play' | 'deposit' | 'withdraw'
  description: string | null
  created_at: string
}

export interface TransactionListResponse {
  transactions: Transaction[]
  total: number
  limit: number
  offset: number
}


export interface DashboardStats {
  total_users: number
  total_rooms: number
  total_fish: number
}

export interface AdminUser {
  id: number
  username: string
  email: string
  role: string
  created_at: string
}

export interface FishRequest {
  name: string
  health: number
  reward_multiplier: number
  base_prob: number
  speed: number
  asset_path: string
}

export interface RoomRequest {
  name: string
  max_players: number
  rtp: number
  description: string | null
}
