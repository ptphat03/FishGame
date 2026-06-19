import { create } from 'zustand'
import { walletApi } from '../api/wallet'

interface WalletState {
  balance: number | null   // null = chưa fetch
  loading: boolean
  fetchWallet: () => Promise<void>
  setBalance: (balance: number) => void
  reset: () => void        // gọi khi logout
  optimisticEarn: (amount: number) => void
  optimisticSpend: (amount: number) => void
}

export const useWalletStore = create<WalletState>()((set, get) => ({
  balance: null,
  loading: false,

  fetchWallet: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      const wallet = await walletApi.getWallet()
      set({ balance: wallet.balance })
    } catch {
      // lỗi im lặng, giữ giá trị cũ
    } finally {
      set({ loading: false })
    }
  },

  setBalance: (balance) => set({ balance }),

  reset: () => set({ balance: null, loading: false }),

  // cập nhật UI ngay trước khi server phản hồi
  optimisticEarn: (amount) =>
    set((s) => ({ balance: s.balance !== null ? s.balance + amount : null })),

  optimisticSpend: (amount) =>
    set((s) => ({ balance: s.balance !== null ? Math.max(0, s.balance - amount) : null })),
}))
