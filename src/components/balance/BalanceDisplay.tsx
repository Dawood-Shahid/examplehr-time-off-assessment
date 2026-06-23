import { StalenessBadge } from './StalenessBadge'
import type { BalanceDisplayState } from '@/lib/balance-state'
import { formatRelativeTime } from '@/lib/balance-state'

type BalanceDisplayProps = {
  daysAvailable: number
  state: BalanceDisplayState
  updatedAt?: string
  label?: string
  showProgress?: boolean
  maxDays?: number
  showReview?: boolean
  onReview?: () => void
}

export function BalanceDisplay({
  daysAvailable,
  state,
  updatedAt,
  label,
  showProgress = false,
  maxDays = 25,
  showReview = false,
  onReview,
}: BalanceDisplayProps) {
  const progress = Math.min(100, (daysAvailable / maxDays) * 100)

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-medium text-gray-700">{label}</p>
      )}
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-2xl font-semibold text-gray-900">
          {daysAvailable.toFixed(1)}{' '}
          <span className="text-base font-normal text-gray-500">Days</span>
        </p>
        <StalenessBadge state={state} updatedAt={updatedAt} />
      </div>
      {showProgress && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {updatedAt && (
        <p className="text-xs text-gray-400">
          as of {formatRelativeTime(updatedAt)}
        </p>
      )}
      {showReview && onReview && (
        <button
          type="button"
          onClick={onReview}
          className="mt-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
        >
          Review updated balance
        </button>
      )}
    </div>
  )
}
