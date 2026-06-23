'use client'

import { useQuery } from '@tanstack/react-query'
import { BALANCE_POLL_MS } from '@/lib/poll-interval'
import { hcmClient } from '@/lib/hcm-client'
import { queryKeys } from '@/lib/query-keys'
import { useOptimisticStore } from '@/store/optimistic-store'
import { detectSilentFailure } from '@/lib/silent-failure-detector'
import { useEffect } from 'react'
import type { BalanceWithMeta } from '@/types/hcm'

export function useBalanceQuery(employeeId: string, locationId: string) {
  const { getPendingForCell, getConfirmedForCell, markUnconfirmed } =
    useOptimisticStore()

  const query = useQuery({
    queryKey: queryKeys.balance(employeeId, locationId),
    queryFn: () => hcmClient.getBalance(employeeId, locationId),
    staleTime: 30_000,
    refetchInterval: BALANCE_POLL_MS,
    refetchOnWindowFocus: true,
    gcTime: 300_000,
    select: (incoming): BalanceWithMeta => {
      const pending = getPendingForCell(employeeId, locationId)
      if (pending.length > 0) {
        return { ...incoming, reconciliationPending: true }
      }
      return { ...incoming, reconciliationPending: false }
    },
  })

  useEffect(() => {
    if (!query.data) return
    const confirmed = getConfirmedForCell(employeeId, locationId)
    for (const mutation of confirmed) {
      if (mutation.status === 'confirmed' && detectSilentFailure(query.data, mutation)) {
        markUnconfirmed(mutation.id)
      }
    }
  }, [query.data, employeeId, locationId, getConfirmedForCell, markUnconfirmed])

  return query
}
