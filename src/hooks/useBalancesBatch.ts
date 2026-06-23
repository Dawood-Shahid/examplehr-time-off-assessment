'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BALANCE_POLL_MS } from '@/lib/poll-interval'
import { hcmClient } from '@/lib/hcm-client'
import { queryKeys } from '@/lib/query-keys'
import type { BalancesResponse, HcmError } from '@/types/hcm'

export function useBalancesBatch(enabled = true) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: queryKeys.balances('batch'),
    queryFn: async () => {
      try {
        return await hcmClient.getBalances()
      } catch (err) {
        const error = err as HcmError
        if (error.error === 'rate_limited') {
          const cached = queryClient.getQueryData<BalancesResponse>(
            queryKeys.balances('batch')
          )
          if (cached) return cached
        }
        throw err
      }
    },
    staleTime: 30_000,
    refetchInterval: BALANCE_POLL_MS,
    refetchOnWindowFocus: true,
    gcTime: 300_000,
    enabled,
    retry: (failureCount, error) => {
      const hcmError = error as HcmError
      if (hcmError?.error === 'rate_limited') return false
      return failureCount < 2
    },
  })
}
