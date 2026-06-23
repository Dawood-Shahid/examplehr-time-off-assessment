'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hcmClient } from '@/lib/hcm-client'
import { queryKeys } from '@/lib/query-keys'
import { useOptimisticStore } from '@/store/optimistic-store'
import type { SubmitRequestInput, Balance } from '@/types/hcm'

export function useSubmitRequest() {
  const queryClient = useQueryClient()
  const { addMutation, confirmMutation, rollbackMutation } = useOptimisticStore()

  return useMutation({
    mutationFn: (vars: SubmitRequestInput) => hcmClient.submitRequest(vars),

    onMutate: async (vars) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.balance(vars.employeeId, vars.locationId),
      })

      const snapshot = queryClient.getQueryData<Balance>(
        queryKeys.balance(vars.employeeId, vars.locationId)
      )

      queryClient.setQueryData(
        queryKeys.balance(vars.employeeId, vars.locationId),
        (old: Balance | undefined) =>
          old
            ? { ...old, daysAvailable: old.daysAvailable - vars.daysRequested }
            : old
      )

      const clientId = crypto.randomUUID()
      addMutation({
        id: clientId,
        employeeId: vars.employeeId,
        locationId: vars.locationId,
        delta: -vars.daysRequested,
        status: 'pending',
        submittedAt: Date.now(),
        snapshotVersion: snapshot?.version,
      })

      return { snapshot, clientId }
    },

    onSuccess: (data, _vars, ctx) => {
      if (ctx) confirmMutation(ctx.clientId, data.requestId)
    },

    onError: (_err, vars, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(
          queryKeys.balance(vars.employeeId, vars.locationId),
          ctx.snapshot
        )
      }
      if (ctx) rollbackMutation(ctx.clientId)
    },

    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.balance(vars.employeeId, vars.locationId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.balances('batch') })
      queryClient.invalidateQueries({
        queryKey: queryKeys.requests(vars.employeeId),
      })
    },
  })
}
