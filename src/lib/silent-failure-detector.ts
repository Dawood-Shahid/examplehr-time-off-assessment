import type { Balance } from '@/types/hcm'
import type { OptimisticMutation } from '@/types/optimistic'

export function detectSilentFailure(
  serverBalance: Balance,
  confirmedMutation: OptimisticMutation
): boolean {
  if (confirmedMutation.status !== 'confirmed') return false
  if (confirmedMutation.snapshotVersion === undefined) return false
  return serverBalance.version === confirmedMutation.snapshotVersion
}
