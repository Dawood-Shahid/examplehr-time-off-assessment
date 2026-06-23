import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { BalanceAtApprovalTime } from '@/components/manager/BalanceAtApprovalTime'
import * as useBalanceQueryModule from '@/hooks/useBalanceQuery'

const snapshotBalance = {
  daysAvailable: 8,
  version: 1,
  updatedAt: new Date().toISOString(),
}

const liveBalance = {
  daysAvailable: 15,
  version: 2,
  updatedAt: new Date().toISOString(),
}

describe('BalanceAtApprovalTime', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps the frozen snapshot when live balance data changes', () => {
    let currentData = snapshotBalance
    vi.spyOn(useBalanceQueryModule, 'useBalanceQuery').mockImplementation(() => ({
      data: currentData,
      isFetching: false,
      isError: false,
    }) as ReturnType<typeof useBalanceQueryModule.useBalanceQuery>)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { rerender } = render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(BalanceAtApprovalTime, { employeeId: 'emp-2', locationId: 'NYC' })
      )
    )

    expect(screen.getByText(/8\.0 days available/i)).toBeInTheDocument()

    currentData = liveBalance

    rerender(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(BalanceAtApprovalTime, { employeeId: 'emp-2', locationId: 'NYC' })
      )
    )

    expect(screen.getByText(/8\.0 days available/i)).toBeInTheDocument()
    expect(screen.queryByText(/15\.0 days available/i)).not.toBeInTheDocument()
  })
})