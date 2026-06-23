import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { LocationBalanceCard } from '@/components/balance/LocationBalanceCard'
import { server } from './msw-server'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('LocationBalanceCard', () => {
  it('shows stale badge when balance data is older than 90 seconds', () => {
    render(
      createElement(LocationBalanceCard, {
        balance: {
          employeeId: 'emp-1',
          locationId: 'NYC',
          locationName: 'New York',
          daysAvailable: 12,
          version: 1,
          updatedAt: new Date(Date.now() - 120_000).toISOString(),
        },
      })
    )

    expect(screen.getByText('Stale')).toBeInTheDocument()
    expect(screen.getByText('12.0')).toBeInTheDocument()
  })
})