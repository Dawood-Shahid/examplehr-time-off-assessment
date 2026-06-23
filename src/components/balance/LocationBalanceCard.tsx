'use client'

import { MapPin, Building2 } from 'lucide-react'
import { BalanceDisplay } from './BalanceDisplay'
import { computeBalanceDisplayState } from '@/lib/balance-state'
import { useOptimisticStore } from '@/store/optimistic-store'
import { useDisplayBalance } from '@/hooks/useBalanceReconciliation'
import type { BalanceCell } from '@/types/hcm'

type LocationBalanceCardProps = {
  balance: BalanceCell
  isFetching?: boolean
  isError?: boolean
  previousBalance?: number
}

export function LocationBalanceCard({
  balance,
  isFetching,
  isError,
  previousBalance,
}: LocationBalanceCardProps) {
  const mutations = useOptimisticStore((s) => s.mutations)
  const { displayDays, showReview, reviewMode, onReview } = useDisplayBalance(
    balance.employeeId,
    balance.locationId,
    balance
  )

  const cellMutation = mutations.find(
    (m) =>
      m.employeeId === balance.employeeId &&
      m.locationId === balance.locationId &&
      m.status !== 'rolled_back'
  )

  const state = computeBalanceDisplayState({
    updatedAt: balance.updatedAt,
    isFetching,
    isError,
    reconciliationPending:
      balance.reconciliationPending || reviewMode === 'held_during_mutation',
    mutationStatus: cellMutation?.status ?? null,
    previousBalance,
    currentBalance: balance.daysAvailable,
  })

  const displayState =
    showReview && reviewMode === 'bonus_only'
      ? 'balance-refreshed'
      : showReview && reviewMode === 'held_during_mutation'
        ? 'reconciliation-pending'
        : state

  const Icon =
    balance.locationId === 'SEA' || balance.locationId === 'NYC'
      ? MapPin
      : Building2

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">
          {balance.locationName}
        </h3>
      </div>
      <BalanceDisplay
        daysAvailable={displayDays}
        state={displayState}
        updatedAt={balance.updatedAt}
        showProgress
        showReview={showReview}
        onReview={onReview}
      />
    </div>
  )
}

export function LocationBalanceCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 h-4 w-32 rounded bg-gray-200" />
      <div className="h-8 w-24 rounded bg-gray-200" />
      <div className="mt-3 h-1.5 w-full rounded bg-gray-100" />
    </div>
  )
}
