import { describe, it, expect } from 'vitest'
import {
  detectBackgroundBonus,
  computeReconciledBalance,
} from '@/lib/reconciliation-detector'

describe('detectBackgroundBonus', () => {
  it('returns true when version increments and balance changes', () => {
    const prev = { daysAvailable: 12, version: 1, updatedAt: '' }
    const incoming = { daysAvailable: 17, version: 2, updatedAt: '' }
    expect(detectBackgroundBonus(prev, incoming)).toBe(true)
  })

  it('returns false when version unchanged', () => {
    const prev = { daysAvailable: 12, version: 1, updatedAt: '' }
    const incoming = { daysAvailable: 12, version: 1, updatedAt: '' }
    expect(detectBackgroundBonus(prev, incoming)).toBe(false)
  })

  it('returns false when no previous balance', () => {
    const incoming = { daysAvailable: 17, version: 2, updatedAt: '' }
    expect(detectBackgroundBonus(undefined, incoming)).toBe(false)
  })
})

describe('computeReconciledBalance', () => {
  it('combines incoming balance with pending mutation delta', () => {
    expect(computeReconciledBalance(17, -2)).toBe(15)
  })

  it('does not go below zero', () => {
    expect(computeReconciledBalance(1, -5)).toBe(0)
  })
})
