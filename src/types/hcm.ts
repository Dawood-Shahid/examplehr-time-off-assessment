export type Role = 'employee' | 'manager'

export type Balance = {
  daysAvailable: number
  version: number
  updatedAt: string
}

export type BalanceCell = Balance & {
  employeeId: string
  locationId: string
  locationName: string
  reconciliationPending?: boolean
}

export type LeaveType =
  | 'annual'
  | 'sick'
  | 'personal'
  | 'professional_dev'
  | 'unpaid'

export type RequestStatus = 'pending' | 'approved' | 'denied'

export type HcmRequest = {
  id: string
  employeeId: string
  employeeName: string
  employeeTitle: string
  locationId: string
  locationName: string
  leaveType: LeaveType
  daysRequested: number
  startDate: string
  endDate: string
  notes?: string
  status: RequestStatus
  createdAt: string
}

export type SubmitRequestInput = {
  employeeId: string
  locationId: string
  leaveType: LeaveType
  daysRequested: number
  startDate: string
  endDate: string
  notes?: string
}

export type SubmitRequestResult = {
  requestId: string
  status: 'created'
}

export type UpdateRequestInput = {
  requestId: string
  action: 'approve' | 'deny'
}

export type HcmErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'insufficient_balance'
  | 'hcm_conflict'
  | 'timeout'
  | 'rate_limited'

export type HcmError = {
  error: HcmErrorCode
  message?: string
}

export type BalancesResponse = {
  balances: BalanceCell[]
}

export type BalanceWithMeta = Balance & {
  reconciliationPending?: boolean
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual Leave (Vacation)',
  sick: 'Sick Leave',
  personal: 'Personal Leave',
  professional_dev: 'Professional Dev',
  unpaid: 'Unpaid Leave',
}

export const LOCATION_LABELS: Record<string, string> = {
  NYC: 'New York',
  LON: 'London Tech Hub (HQ)',
  SYD: 'Sydney',
  SEA: 'Seattle HQ',
}
