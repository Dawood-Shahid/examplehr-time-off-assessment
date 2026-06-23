'use client'

import { useEffect, useRef } from 'react'
import type { Balance, BalanceCell } from '@/types/hcm'
import { detectBackgroundBonus } from '@/lib/reconciliation-detector'
import { useReconciliationStore } from '@/store/reconciliation-store'
import { useOptimisticStore } from '@/store/optimistic-store'

function toBalance(cell: BalanceCell | Balance): Balance {
  return {
    daysAvailable: cell.daysAvailable,
    version: cell.version,
    updatedAt: cell.updatedAt,
  }
}

export function useBalanceReconciliation(
  balances: BalanceCell[] | undefined,
  employeeId?: string,
  locationId?: string,
  singleBalance?: Balance
) {
  const prevRef = useRef<Map<string, Balance>>(new Map())
  const setEntry = useReconciliationStore((s) => s.setEntry)
  const getPendingForCell = useOptimisticStore((s) => s.getPendingForCell)

  useEffect(() => {
    const cells: Array<{ employeeId: string; locationId: string; balance: Balance }> = []

    if (balances) {
      for (const b of balances) {
        cells.push({
          employeeId: b.employeeId,
          locationId: b.locationId,
          balance: toBalance(b),
        })
      }
    } else if (employeeId && locationId && singleBalance) {
      cells.push({ employeeId, locationId, balance: singleBalance })
    }

    for (const { employeeId: emp, locationId: loc, balance } of cells) {
      const key = `${emp}:${loc}`
      const prev = prevRef.current.get(key)

      if (prev && detectBackgroundBonus(prev, balance)) {
        const hasPendingMutation = getPendingForCell(emp, loc).length > 0
        const existing = useReconciliationStore.getState().getEntry(emp, loc)
        if (!existing?.acknowledged) {
          setEntry({
            employeeId: emp,
            locationId: loc,
            previousBalance: prev,
            incomingBalance: balance,
            mode: hasPendingMutation ? 'held_during_mutation' : 'bonus_only',
            acknowledged: false,
          })
        }
      }

      prevRef.current.set(key, balance)
    }
  }, [balances, employeeId, locationId, singleBalance, setEntry, getPendingForCell])
}

export function useDisplayBalance(
  employeeId: string,
  locationId: string,
  serverBalance: Balance
): {
  displayDays: number
  showReview: boolean
  reviewMode: 'bonus_only' | 'held_during_mutation' | null
  onReview: () => void
} {
  const entry = useReconciliationStore((s) => s.getEntry(employeeId, locationId))
  const acknowledge = useReconciliationStore((s) => s.acknowledge)
  const mutations = useOptimisticStore((s) => s.mutations)

  const activeMutations = mutations.filter(
    (m) =>
      m.employeeId === employeeId &&
      m.locationId === locationId &&
      m.status === 'pending'
  )

  const pendingDelta = activeMutations.reduce((sum, m) => sum + m.delta, 0)

  if (!entry) {
    return {
      displayDays: Math.max(0, serverBalance.daysAvailable + pendingDelta),
      showReview: false,
      reviewMode: null,
      onReview: () => acknowledge(employeeId, locationId),
    }
  }

  if (entry.acknowledged) {
    const base = entry.incomingBalance.daysAvailable
    const days =
      entry.mode === 'held_during_mutation'
        ? Math.max(0, base + pendingDelta)
        : base
    return {
      displayDays: days,
      showReview: false,
      reviewMode: null,
      onReview: () => acknowledge(employeeId, locationId),
    }
  }

  if (entry.mode === 'held_during_mutation') {
    return {
      displayDays: entry.previousBalance.daysAvailable,
      showReview: true,
      reviewMode: 'held_during_mutation',
      onReview: () => acknowledge(employeeId, locationId),
    }
  }

  return {
    displayDays: entry.previousBalance.daysAvailable,
    showReview: true,
    reviewMode: 'bonus_only',
    onReview: () => acknowledge(employeeId, locationId),
  }
}
