import { apiClient, extractData } from './client'
import type { Room } from '../types'

export const roomsApi = {
  list: async (): Promise<Room[]> => {
    const res = await apiClient.get<{ data: Room[]; error: null }>('/rooms')
    return extractData(res)
  },

  get: async (id: number): Promise<Room> => {
    const res = await apiClient.get<{ data: Room; error: null }>(`/rooms/${id}`)
    return extractData(res)
  },
}
