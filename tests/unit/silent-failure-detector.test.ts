import { describe, it, expect } from 'vitest'
import { detectSilentFailure } from '@/lib/silent-failure-detector'
import type { OptimisticMutation } from '@/types/optimistic'

describe('detectSilentFailure', () => {
  it('returns true when version is unchanged after confirmed mutation', () => {
    const serverBalance = { daysAvailable: 12, version: 3, updatedAt: '' }
    const mutation: OptimisticMutation = {
      id: '1',
      employeeId: 'emp-1',
      locationId: 'NYC',
      delta: -2,
      status: 'confirmed',
      submittedAt: Date.now(),
      snapshotVersion: 3,
    }
    expect(detectSilentFailure(serverBalance, mutation)).toBe(true)
  })

  it('returns false when version incremented correctly', () => {
    const serverBalance = { daysAvailable: 10, version: 4, updatedAt: '' }
    const mutation: OptimisticMutation = {
      id: '1',
      employeeId: 'emp-1',
      locationId: 'NYC',
      delta: -2,
      status: 'confirmed',
      submittedAt: Date.now(),
      snapshotVersion: 3,
    }
    expect(detectSilentFailure(serverBalance, mutation)).toBe(false)
  })
})
