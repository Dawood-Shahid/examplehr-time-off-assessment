import { TrendingDown, Info } from 'lucide-react'

type ProjectedBalancePanelProps = {
  currentBalance: number
  deduction: number
  showReconciliationNotice?: boolean
  reconciliationLabel?: string
  showReview?: boolean
  onReview?: () => void
}

export function ProjectedBalancePanel({
  currentBalance,
  deduction,
  showReconciliationNotice = false,
  reconciliationLabel = 'Balance updated — tap to review',
  showReview = false,
  onReview,
}: ProjectedBalancePanelProps) {
  const remaining = Math.max(0, currentBalance - deduction)
  const progress = Math.min(100, (currentBalance / 25) * 100)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-gray-400">
        Projected Balance
      </p>

      {showReconciliationNotice && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <p>{reconciliationLabel}</p>
            {showReview && onReview && (
              <button
                type="button"
                onClick={onReview}
                className="mt-1.5 font-medium underline hover:no-underline"
              >
                Review updated balance
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500">Current Balance</p>
          <p className="text-2xl font-semibold text-gray-900">
            {currentBalance.toFixed(1)} Days
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {deduction > 0 && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <TrendingDown className="h-4 w-4" />
            <span>Request Deduction</span>
            <span className="font-semibold">- {deduction.toFixed(1)} Days</span>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-500">Estimated Remaining</p>
          <p className="text-xl font-semibold text-blue-600">
            {remaining.toFixed(1)} Days
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Reflects accruals up to the start date.
      </p>
    </div>
  )
}
