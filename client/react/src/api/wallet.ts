import { apiClient, extractData } from './client'
import type { Wallet, TransactionListResponse } from '../types'

export const walletApi = {
  getWallet: async (): Promise<Wallet> => {
    const res = await apiClient.get<{ data: Wallet; error: null }>('/wallet')
    return extractData(res)
  },

  getTransactions: async (limit = 20, offset = 0): Promise<TransactionListResponse> => {
    const res = await apiClient.get<{ data: TransactionListResponse; error: null }>(
      `/wallet/transactions?limit=${limit}&offset=${offset}`,
    )
    return extractData(res)
  },

  deposit: async (amount: number, description?: string): Promise<Wallet> => {
    const res = await apiClient.post<{ data: Wallet; error: null }>('/wallet/deposit', {
      amount,
      description: description ?? null,
    })
    return extractData(res)
  },

  withdraw: async (amount: number, description?: string): Promise<Wallet> => {
    const res = await apiClient.post<{ data: Wallet; error: null }>('/wallet/withdraw', {
      amount,
      description: description ?? null,
    })
    return extractData(res)
  },
}
