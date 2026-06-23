'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hcmClient } from '@/lib/hcm-client'

/**
 * Manager-facing controls that drive the mock HCM's out-of-band events
 * (anniversary grant, year-start reset, full store reset). Each trigger mutates
 * the shared in-memory store, so after every action we broadly invalidate all
 * balance and request queries to let the polling UI pick up the change.
 */
function useInvalidateHcm() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['balance'] })
    queryClient.invalidateQueries({ queryKey: ['balances'] })
    queryClient.invalidateQueries({ queryKey: ['requests'] })
  }
}

export function useTriggerAnniversary() {
  const invalidate = useInvalidateHcm()
  return useMutation({
    mutationFn: (vars: {
      employeeId: string
      locationId: string
      bonusDays: number
    }) =>
      hcmClient.triggerAnniversary(
        vars.employeeId,
        vars.locationId,
        vars.bonusDays
      ),
    onSuccess: invalidate,
  })
}

export function useTriggerYearReset() {
  const invalidate = useInvalidateHcm()
  return useMutation({
    mutationFn: (allocationDays: number) =>
      hcmClient.triggerYearReset(allocationDays),
    onSuccess: invalidate,
  })
}

export function useTriggerReset() {
  const invalidate = useInvalidateHcm()
  return useMutation({
    mutationFn: () => hcmClient.triggerReset(),
    onSuccess: invalidate,
  })
}
