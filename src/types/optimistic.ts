export type MutationStatus =
  | 'pending'
  | 'confirmed'
  | 'rolled_back'
  | 'unconfirmed'

export type OptimisticMutation = {
  id: string
  employeeId: string
  locationId: string
  delta: number
  status: MutationStatus
  submittedAt: number
  serverRequestId?: string
  snapshotVersion?: number
}
