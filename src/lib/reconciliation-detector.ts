import type { Balance } from '@/types/hcm'

export function detectBackgroundBonus(
  previous: Balance | undefined,
  incoming: Balance
): boolean {
  if (!previous) return false
  return (
    incoming.version > previous.version &&
    incoming.daysAvailable !== previous.daysAvailable
  )
}

export function computeReconciledBalance(
  incomingDays: number,
  mutationDelta: number
): number {
  return Math.max(0, incomingDays + mutationDelta)
}
