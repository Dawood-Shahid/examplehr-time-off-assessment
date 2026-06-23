import type { BalanceDisplayState } from '@/lib/balance-state'
import { formatRelativeTime } from '@/lib/balance-state'

type StalenessBadgeProps = {
  state: BalanceDisplayState
  updatedAt?: string
}

const STATE_CONFIG: Record<
  BalanceDisplayState,
  { label: string; dotClass: string; badgeClass: string }
> = {
  fresh: {
    label: 'Fresh',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700',
  },
  stale: {
    label: 'Stale',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700',
  },
  refreshing: {
    label: 'Refreshing',
    dotClass: 'bg-blue-400 animate-pulse',
    badgeClass: 'bg-blue-50 text-blue-700',
  },
  'optimistic-pending': {
    label: 'Submitting…',
    dotClass: 'bg-blue-500 animate-pulse',
    badgeClass: 'bg-blue-50 text-blue-700',
  },
  'optimistic-confirmed': {
    label: 'Pending approval',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-50 text-blue-700',
  },
  'optimistic-rolled-back': {
    label: 'Request failed',
    dotClass: 'bg-red-500',
    badgeClass: 'bg-red-50 text-red-700',
  },
  unconfirmed: {
    label: 'Unconfirmed — re-verifying…',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700',
  },
  'reconciliation-pending': {
    label: 'Balance updated — tap to review',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-50 text-blue-700',
  },
  'balance-refreshed': {
    label: 'Balance updated',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700',
  },
  'hcm-unavailable': {
    label: 'HCM unavailable',
    dotClass: 'bg-gray-400',
    badgeClass: 'bg-gray-50 text-gray-600',
  },
}

export function StalenessBadge({ state, updatedAt }: StalenessBadgeProps) {
  const config = STATE_CONFIG[state]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${config.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
      {updatedAt && state === 'stale' && (
        <span className="opacity-70">({formatRelativeTime(updatedAt)})</span>
      )}
    </span>
  )
}
