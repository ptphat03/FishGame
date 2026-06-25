import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { walletApi } from '../api/wallet'
import { useWalletStore } from '../stores/walletStore'
import Navbar from '../components/Navbar'
import { Link } from 'react-router-dom'
import { Gamepad2, ArrowDownToLine, ArrowUpFromLine, Wallet, Banknote, ArrowLeft } from 'lucide-react'
import type { Transaction } from '../types'

const PAGE_SIZE = 10

const TX_META: Record<string, { icon: React.ReactNode; label: string; bgCls: string }> = {
  play:     { icon: <Gamepad2 size={18} />, label: 'Play Game',  bgCls: 'bg-blue-500/10 text-blue-400'    },
  deposit:  { icon: <ArrowDownToLine size={18} />, label: 'Deposit',   bgCls: 'bg-amber-500/10 text-amber-400'  },
  withdraw: { icon: <ArrowUpFromLine size={18} />, label: 'Withdraw',   bgCls: 'bg-red-500/10 text-red-400'    },
}

type ModalMode = 'deposit' | 'withdraw'

function TransferModal({ mode, onClose }: { mode: ModalMode; onClose: () => void }) {
  const qc = useQueryClient()
  const { setBalance } = useWalletStore()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const isDeposit = mode === 'deposit'

  const mutation = useMutation({
    mutationFn: async () => {
      const n = parseInt(amount)
      if (isNaN(n) || n <= 0) throw new Error('Invalid amount')
      return (isDeposit ? walletApi.deposit : walletApi.withdraw)(n, description || undefined)
    },
    onSuccess: (wallet) => {
      setBalance(wallet.balance)
      qc.invalidateQueries({ queryKey: ['wallet'] })
      qc.invalidateQueries({ queryKey: ['wallet-transactions'] })
      onClose()
    },
  })

  const PRESETS = isDeposit ? [100, 500, 1000, 5000] : [100, 200, 500, 1000]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="neon-card w-full max-w-sm p-6 shadow-2xl border-blue-500/30">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-100">{isDeposit ? 'Deposit' : 'Withdraw'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none">×</button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="flex flex-col gap-4">
          {mutation.isError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {(mutation.error as Error).message}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Amount</label>
            <input
              type="number"
              min={1}
              required
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500/60 tabular-nums"
            />
            <div className="flex gap-2 mt-2">
              {PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAmount(String(n))}
                  className={`flex-1 py-1 rounded-md text-xs font-medium border transition-all ${
                    amount === String(n)
                      ? 'bg-blue-500/15 border-blue-500/35 text-blue-400'
                      : 'border-white/[0.1] text-gray-500 hover:border-white/20 hover:text-gray-300'
                  }`}
                >
                  {n.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description (optional)</label>
            <input
              type="text"
              placeholder="Ex: Deposit for gaming"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500/60"
            />
          </div>

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/[0.1] text-gray-400 hover:text-gray-200 hover:bg-white/5 text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !amount}
              className={`neon-btn flex-1 py-2.5 ${
                isDeposit
                  ? 'bg-amber-500 hover:bg-amber-400 text-gray-900 shadow-[0_0_5px_rgba(245,158,11,0.3)] hover:shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                  : 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_5px_rgba(239,68,68,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.6)]'
              }`}
            >
              {mutation.isPending ? 'Processing...' : isDeposit ? 'Deposit' : 'Withdraw'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TxRow({ tx }: { tx: Transaction }) {
  const meta = TX_META[tx.type]
  const isPositive = tx.amount >= 0
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${meta.bgCls}`}>
          {meta.icon}
        </div>
        <div>
          <p className="text-gray-200 text-sm font-medium">{meta.label}</p>
          {tx.description && (
            <p className="text-gray-500 text-xs mt-0.5 truncate max-w-[200px]">{tx.description}</p>
          )}
          <p className="text-gray-600 text-xs mt-0.5">
            {new Date(tx.created_at).toLocaleString('en-US', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{tx.amount.toLocaleString()}
      </span>
    </div>
  )
}

export default function WalletPage() {
  const [offset, setOffset] = useState(0)
  const [modal, setModal] = useState<ModalMode | null>(null)
  const { balance, setBalance } = useWalletStore()

  const { isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const w = await walletApi.getWallet()
      setBalance(w.balance)
      return w
    },
    staleTime: 10_000,
  })

  const { data: txData, isLoading: txLoading, isError: txError, isFetching } = useQuery({
    queryKey: ['wallet-transactions', offset],
    queryFn: () => walletApi.getTransactions(PAGE_SIZE, offset),
    placeholderData: (prev) => prev,
  })

  const totalPages = txData ? Math.ceil(txData.total / PAGE_SIZE) : 0
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  useEffect(() => {
    if (txData && txData.total > 0 && offset >= txData.total) {
      setOffset(Math.floor((txData.total - 1) / PAGE_SIZE) * PAGE_SIZE)
    }
  }, [txData, offset])

  return (
    <div className="min-h-screen text-gray-100">
      <Navbar />

      <main className="pt-20 pb-16 px-4 sm:px-6 max-w-2xl mx-auto">
        {}
        <div className="flex items-center justify-between mt-8 mb-4">
          <h1 className="text-xl font-semibold text-gray-100">Your Wallet</h1>
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] text-gray-400 hover:text-gray-200 hover:border-white/20 hover:bg-white/5 text-sm transition-all"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {}
        <div className="neon-card p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Current Balance</p>
              {walletLoading && balance === null ? (
                <div className="h-9 w-32 bg-white/[0.07] rounded-lg animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-amber-400 tabular-nums">
                  {(balance ?? 0).toLocaleString()}
                </p>
              )}
              <p className="text-gray-600 text-xs mt-1">Coins · CyberFish</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setModal('deposit')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-sm font-medium transition-all"
              >
                <Wallet size={16} /> Deposit
              </button>
              <button
                onClick={() => setModal('withdraw')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/15 text-sm font-medium transition-all"
              >
                <Banknote size={16} /> Withdraw
              </button>
            </div>
          </div>
        </div>

        {}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-100">Transaction History</h3>
            {txData && <span className="text-gray-600 text-xs">{txData.total} transactions</span>}
          </div>

          {txLoading && !txData && (
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          )}

          {txError && (
            <div className="text-center py-10 text-red-400/70 text-sm">
              Failed to load transaction history
            </div>
          )}

          {!txLoading && txData && txData.transactions.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm">No transactions yet</p>
              <p className="text-gray-600 text-xs mt-1">Join a room to earn coins!</p>
            </div>
          )}

          {txData && txData.transactions.length > 0 && (
            <>
              <div className={`neon-card transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                {txData.transactions.map((tx) => <TxRow key={tx.id} tx={tx} />)}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setOffset((p) => Math.max(0, p - PAGE_SIZE))}
                    className="w-8 h-8 rounded-lg border border-white/[0.1] flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page: number
                      if (totalPages <= 5) page = i + 1
                      else if (currentPage <= 3) page = i + 1
                      else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                      else page = currentPage - 2 + i
                      return (
                        <button
                          key={page}
                          onClick={() => setOffset((page - 1) * PAGE_SIZE)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                            page === currentPage
                              ? 'bg-blue-500/15 border border-blue-500/35 text-blue-400'
                              : 'border border-white/[0.1] text-gray-400 hover:text-gray-200 hover:border-white/20'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setOffset((p) => p + PAGE_SIZE)}
                    className="w-8 h-8 rounded-lg border border-white/[0.1] flex items-center justify-center text-gray-400 hover:text-gray-200 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {modal && <TransferModal mode={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
