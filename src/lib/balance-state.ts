export type BalanceDisplayState =
  | 'fresh'
  | 'stale'
  | 'refreshing'
  | 'optimistic-pending'
  | 'optimistic-confirmed'
  | 'optimistic-rolled-back'
  | 'unconfirmed'
  | 'reconciliation-pending'
  | 'balance-refreshed'
  | 'hcm-unavailable'

export function getBalanceAgeMs(updatedAt: string): number {
  return Date.now() - new Date(updatedAt).getTime()
}

export function formatRelativeTime(updatedAt: string): string {
  const ageMs = getBalanceAgeMs(updatedAt)
  const seconds = Math.floor(ageMs / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export function computeBalanceDisplayState(opts: {
  updatedAt?: string
  isFetching?: boolean
  isError?: boolean
  reconciliationPending?: boolean
  mutationStatus?: 'pending' | 'confirmed' | 'rolled_back' | 'unconfirmed' | null
  previousBalance?: number
  currentBalance?: number
}): BalanceDisplayState {
  if (opts.isError) return 'hcm-unavailable'
  if (opts.mutationStatus === 'pending') return 'optimistic-pending'
  if (opts.mutationStatus === 'rolled_back') return 'optimistic-rolled-back'
  if (opts.mutationStatus === 'unconfirmed') return 'unconfirmed'
  if (opts.mutationStatus === 'confirmed') return 'optimistic-confirmed'
  if (opts.reconciliationPending) return 'reconciliation-pending'
  if (opts.isFetching) return 'refreshing'
  if (
    opts.previousBalance !== undefined &&
    opts.currentBalance !== undefined &&
    opts.currentBalance > opts.previousBalance
  ) {
    return 'balance-refreshed'
  }
  if (opts.updatedAt && getBalanceAgeMs(opts.updatedAt) > 90_000) return 'stale'
  return 'fresh'
}
