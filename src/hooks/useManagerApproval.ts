'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hcmClient } from '@/lib/hcm-client'
import { queryKeys } from '@/lib/query-keys'
import type { UpdateRequestInput } from '@/types/hcm'

export function useManagerApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateRequestInput) => hcmClient.updateRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingRequests() })
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalHistory() })
      queryClient.invalidateQueries({ queryKey: queryKeys.requests('all') })
    },
  })
}
