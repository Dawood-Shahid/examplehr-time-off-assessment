import { describe, it, expect } from 'vitest'
import { shouldApplyBackgroundUpdate } from '@/lib/conflict-detector'
import type { OptimisticMutation } from '@/types/optimistic'

describe('shouldApplyBackgroundUpdate', () => {
  it('returns apply when no pending mutations', () => {
    expect(shouldApplyBackgroundUpdate('emp-1', 'NYC', 5, [])).toBe('apply')
  })

  it('returns surface_conflict when pending mutation exists for cell', () => {
    const pending: OptimisticMutation[] = [
      {
        id: '1',
        employeeId: 'emp-1',
        locationId: 'NYC',
        delta: -3,
        status: 'pending',
        submittedAt: Date.now(),
      },
    ]
    expect(shouldApplyBackgroundUpdate('emp-1', 'NYC', 5, pending)).toBe(
      'surface_conflict'
    )
  })

  it('returns apply for pending mutation on a different cell', () => {
    const pending: OptimisticMutation[] = [
      {
        id: '1',
        employeeId: 'emp-1',
        locationId: 'LON',
        delta: -3,
        status: 'pending',
        submittedAt: Date.now(),
      },
    ]
    expect(shouldApplyBackgroundUpdate('emp-1', 'NYC', 5, pending)).toBe('apply')
  })
})
