import { describe, it, expect } from 'vitest'
import { computeBalanceDisplayState } from '@/lib/balance-state'

describe('computeBalanceDisplayState', () => {
  it('returns fresh for recent data', () => {
    expect(
      computeBalanceDisplayState({
        updatedAt: new Date().toISOString(),
      })
    ).toBe('fresh')
  })

  it('returns stale for old data', () => {
    const old = new Date(Date.now() - 120_000).toISOString()
    expect(computeBalanceDisplayState({ updatedAt: old })).toBe('stale')
  })

  it('returns optimistic-pending when mutation pending', () => {
    expect(
      computeBalanceDisplayState({ mutationStatus: 'pending' })
    ).toBe('optimistic-pending')
  })

  it('returns hcm-unavailable on error', () => {
    expect(computeBalanceDisplayState({ isError: true })).toBe('hcm-unavailable')
  })
})
