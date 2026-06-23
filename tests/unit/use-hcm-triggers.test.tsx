import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import {
  useTriggerAnniversary,
  useTriggerYearReset,
  useTriggerReset,
} from '@/hooks/useHcmTriggers'
import { hcmClient } from '@/lib/hcm-client'

vi.mock('@/lib/hcm-client', () => ({
  hcmClient: {
    triggerAnniversary: vi.fn().mockResolvedValue({
      daysAvailable: 17,
      version: 2,
      updatedAt: new Date().toISOString(),
      key: 'emp-1:NYC',
    }),
    triggerYearReset: vi
      .fn()
      .mockResolvedValue({ allocationDays: 20, updated: [] }),
    triggerReset: vi.fn().mockResolvedValue({ ok: true }),
  },
}))

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { wrapper, invalidateSpy }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useHcmTriggers', () => {
  it('anniversary trigger calls the client and invalidates balance/request caches', async () => {
    const { wrapper, invalidateSpy } = makeWrapper()
    const { result } = renderHook(() => useTriggerAnniversary(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        employeeId: 'emp-1',
        locationId: 'NYC',
        bonusDays: 5,
      })
    })

    expect(hcmClient.triggerAnniversary).toHaveBeenCalledWith('emp-1', 'NYC', 5)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['balance'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['balances'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['requests'] })
  })

  it('year-reset trigger forwards the allocation and invalidates caches', async () => {
    const { wrapper, invalidateSpy } = makeWrapper()
    const { result } = renderHook(() => useTriggerYearReset(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(25)
    })

    expect(hcmClient.triggerYearReset).toHaveBeenCalledWith(25)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['balance'] })
  })

  it('reset trigger calls the client and invalidates caches', async () => {
    const { wrapper, invalidateSpy } = makeWrapper()
    const { result } = renderHook(() => useTriggerReset(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(hcmClient.triggerReset).toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['requests'] })
  })

  it('does not invalidate caches when the trigger fails', async () => {
    ;(hcmClient.triggerReset as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      error: 'not_found',
    })
    const { wrapper, invalidateSpy } = makeWrapper()
    const { result } = renderHook(() => useTriggerReset(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync().catch(() => undefined)
    })

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
