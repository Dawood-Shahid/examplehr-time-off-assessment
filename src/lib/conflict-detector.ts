import type { OptimisticMutation } from '@/types/optimistic'

export type BackgroundUpdateDecision = 'apply' | 'surface_conflict'

export function shouldApplyBackgroundUpdate(
  employeeId: string,
  locationId: string,
  _incomingVersion: number,
  pendingMutations: OptimisticMutation[]
): BackgroundUpdateDecision {
  const hasPendingForCell = pendingMutations.some(
    (m) =>
      m.employeeId === employeeId &&
      m.locationId === locationId &&
      m.status === 'pending'
  )
  return hasPendingForCell ? 'surface_conflict' : 'apply'
}
