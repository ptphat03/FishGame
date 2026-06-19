import { create } from 'zustand'
import type { Room } from '../types'

interface GameState {
  coins: number
  score: number
  currentRoom: Room | null
  addCoins: (amount: number) => void
  addScore: (amount: number) => void
  setCurrentRoom: (room: Room | null) => void
  resetGame: () => void
}

export const useGameStore = create<GameState>()((set) => ({
  coins: 0,
  score: 0,
  currentRoom: null,

  addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),

  addScore: (amount) => set((state) => ({ score: state.score + amount })),

  setCurrentRoom: (room) => set({ currentRoom: room }),

  resetGame: () => set({ coins: 0, score: 0, currentRoom: null }),
}))
