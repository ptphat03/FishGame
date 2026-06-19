import { apiClient, extractData } from './client'
import type { Fish } from '../types'

export const fishApi = {
  list: async (): Promise<Fish[]> => {
    const res = await apiClient.get<{ data: Fish[]; error: null }>('/fish')
    return extractData(res)
  },

  get: async (id: number): Promise<Fish> => {
    const res = await apiClient.get<{ data: Fish; error: null }>(`/fish/${id}`)
    return extractData(res)
  },
}
