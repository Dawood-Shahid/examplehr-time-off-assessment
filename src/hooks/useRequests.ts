'use client'

import { useQuery } from '@tanstack/react-query'
import { hcmClient } from '@/lib/hcm-client'
import { queryKeys } from '@/lib/query-keys'

export function useMyRequests(employeeId: string) {
  return useQuery({
    queryKey: queryKeys.requests(employeeId),
    queryFn: () => hcmClient.getRequests(employeeId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function usePendingRequests() {
  return useQuery({
    queryKey: queryKeys.pendingRequests(),
    queryFn: () => hcmClient.getPendingRequests(),
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function useApprovalHistory() {
  return useQuery({
    queryKey: queryKeys.approvalHistory(),
    queryFn: () => hcmClient.getApprovalHistory(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}
