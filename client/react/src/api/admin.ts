import { apiClient, extractData } from './client'
import type { DashboardStats, Fish, Room, FishRequest, RoomRequest, AdminUser } from '../types'

const A = '/admin'

export const adminApi = {
  // Dashboard
  getDashboard: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<{ data: DashboardStats; error: null }>(`${A}/dashboard`)
    return extractData(res)
  },

  // Fish
  listFish: async (): Promise<Fish[]> => {
    const res = await apiClient.get<{ data: Fish[]; error: null }>(`${A}/fish`)
    return extractData(res)
  },
  createFish: async (body: FishRequest): Promise<Fish> => {
    const res = await apiClient.post<{ data: Fish; error: null }>(`${A}/fish`, body)
    return extractData(res)
  },
  updateFish: async (id: number, body: FishRequest): Promise<Fish> => {
    const res = await apiClient.put<{ data: Fish; error: null }>(`${A}/fish/${id}`, body)
    return extractData(res)
  },
  deleteFish: async (id: number): Promise<void> => {
    await apiClient.delete(`${A}/fish/${id}`)
  },

  // Rooms
  listRooms: async (): Promise<Room[]> => {
    const res = await apiClient.get<{ data: Room[]; error: null }>(`${A}/rooms`)
    return extractData(res)
  },
  createRoom: async (body: RoomRequest): Promise<Room> => {
    const res = await apiClient.post<{ data: Room; error: null }>(`${A}/rooms`, body)
    return extractData(res)
  },
  updateRoom: async (id: number, body: RoomRequest): Promise<Room> => {
    const res = await apiClient.put<{ data: Room; error: null }>(`${A}/rooms/${id}`, body)
    return extractData(res)
  },
  deleteRoom: async (id: number): Promise<void> => {
    await apiClient.delete(`${A}/rooms/${id}`)
  },

  // Users (read-only)
  listUsers: async (limit = 50, offset = 0): Promise<{ data: AdminUser[]; total: number }> => {
    const res = await apiClient.get<{ data: AdminUser[]; total: number; error: null }>(
      `${A}/users?limit=${limit}&offset=${offset}`,
    )
    return { data: res.data.data, total: res.data.total }
  },
}
