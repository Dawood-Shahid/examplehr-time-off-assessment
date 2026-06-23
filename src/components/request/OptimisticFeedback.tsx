import type { HcmErrorCode } from '@/types/hcm'

type OptimisticFeedbackProps = {
  error?: HcmErrorCode | null
  isPending?: boolean
  isSuccess?: boolean
  isUnconfirmed?: boolean
  isTimeout?: boolean
  onRetry?: () => void
  isRetrying?: boolean
}

const ERROR_MESSAGES: Partial<Record<HcmErrorCode, string>> = {
  insufficient_balance: 'Insufficient balance for this request.',
  hcm_conflict: 'HCM rejected this request due to a conflict.',
  timeout: 'Request timed out — status is unknown. Please check My Requests.',
  forbidden: 'You are not authorized to submit this request.',
}

export function OptimisticFeedback({
  error,
  isPending,
  isSuccess,
  isUnconfirmed,
  isTimeout,
  onRetry,
  isRetrying,
}: OptimisticFeedbackProps) {
  if (isPending) {
    return (
      <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Submitting your request…
      </div>
    )
  }

  if (isUnconfirmed) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <span>
          Unconfirmed — re-verifying with HCM… The request may not have been
          recorded.
        </span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
          >
            {isRetrying ? 'Re-syncing…' : 'Retry / re-sync'}
          </button>
        )}
      </div>
    )
  }

  if (isTimeout) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Request timed out after 10 seconds. The request may or may not have been
        submitted.
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {ERROR_MESSAGES[error] ?? 'Something went wrong. Please try again.'}
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Request submitted — pending manager approval.
      </div>
    )
  }

  return null
}
