import type { Balance, HcmRequest } from '@/types/hcm'
import { getEmployeeName, getEmployeeTitle } from '@/lib/mock-users'
import { LOCATION_LABELS } from '@/types/hcm'

type GlobalHcm = typeof globalThis & {
  hcmBalances?: Map<string, Balance>
  hcmRequests?: Map<string, HcmRequest>
  hcmBatchLastCall?: Map<string, number>
}

const g = global as GlobalHcm

function seedBalances(): Map<string, Balance> {
  const now = new Date().toISOString()
  return new Map([
    ['emp-1:NYC', { daysAvailable: 12, version: 1, updatedAt: now }],
    ['emp-1:LON', { daysAvailable: 5, version: 1, updatedAt: now }],
    ['emp-2:NYC', { daysAvailable: 8, version: 1, updatedAt: now }],
    ['emp-2:SYD', { daysAvailable: 15, version: 1, updatedAt: now }],
    ['emp-1:SEA', { daysAvailable: 18.5, version: 1, updatedAt: now }],
    ['emp-2:SEA', { daysAvailable: 10, version: 1, updatedAt: now }],
  ])
}

function seedRequests(): Map<string, HcmRequest> {
  return new Map([
    [
      'req-seed-1',
      {
        id: 'req-seed-1',
        employeeId: 'emp-2',
        employeeName: getEmployeeName('emp-2'),
        employeeTitle: getEmployeeTitle('emp-2'),
        locationId: 'NYC',
        locationName: LOCATION_LABELS.NYC,
        leaveType: 'annual',
        daysRequested: 3,
        startDate: '2024-06-12',
        endDate: '2024-06-14',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ],
    [
      'req-seed-2',
      {
        id: 'req-seed-2',
        employeeId: 'emp-1',
        employeeName: getEmployeeName('emp-1'),
        employeeTitle: getEmployeeTitle('emp-1'),
        locationId: 'LON',
        locationName: LOCATION_LABELS.LON,
        leaveType: 'personal',
        daysRequested: 1,
        startDate: '2024-05-24',
        endDate: '2024-05-24',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ],
    [
      'req-history-1',
      {
        id: 'req-history-1',
        employeeId: 'emp-1',
        employeeName: getEmployeeName('emp-1'),
        employeeTitle: getEmployeeTitle('emp-1'),
        locationId: 'LON',
        locationName: LOCATION_LABELS.LON,
        leaveType: 'annual',
        daysRequested: 5,
        startDate: '2023-10-12',
        endDate: '2023-10-17',
        status: 'approved',
        createdAt: '2023-10-01T10:00:00.000Z',
      },
    ],
    [
      'req-history-2',
      {
        id: 'req-history-2',
        employeeId: 'emp-2',
        employeeName: getEmployeeName('emp-2'),
        employeeTitle: getEmployeeTitle('emp-2'),
        locationId: 'NYC',
        locationName: LOCATION_LABELS.NYC,
        leaveType: 'professional_dev',
        daysRequested: 3,
        startDate: '2023-09-20',
        endDate: '2023-09-22',
        status: 'denied',
        createdAt: '2023-09-10T14:30:00.000Z',
      },
    ],
    [
      'req-history-3',
      {
        id: 'req-history-3',
        employeeId: 'emp-1',
        employeeName: getEmployeeName('emp-1'),
        employeeTitle: getEmployeeTitle('emp-1'),
        locationId: 'SEA',
        locationName: LOCATION_LABELS.SEA,
        leaveType: 'sick',
        daysRequested: 1,
        startDate: '2023-11-05',
        endDate: '2023-11-05',
        status: 'approved',
        createdAt: '2023-11-04T09:15:00.000Z',
      },
    ],
  ])
}

g.hcmBalances ??= seedBalances()
g.hcmRequests ??= seedRequests()
g.hcmBatchLastCall ??= new Map()

export const hcmStore = {
  balances: g.hcmBalances,
  requests: g.hcmRequests,
  batchLastCall: g.hcmBatchLastCall,
}

export function resetHcmStore(): void {
  g.hcmBalances = seedBalances()
  g.hcmRequests = seedRequests()
  g.hcmBatchLastCall = new Map()
}

export function getBalanceKey(employeeId: string, locationId: string): string {
  return `${employeeId}:${locationId}`
}
