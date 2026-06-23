import type { Role } from '@/types/hcm'

export type MockUser = {
  id: string
  email: string
  password: string
  name: string
  role: Role
  title: string
  locationIds: string[]
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 'emp-1',
    email: 'alice@example.com',
    password: 'password',
    name: 'Alex Rivera',
    role: 'employee',
    title: 'Senior Engineer',
    locationIds: ['LON', 'NYC'],
  },
  {
    id: 'emp-2',
    email: 'bob@example.com',
    password: 'password',
    name: 'Bob Smith',
    role: 'employee',
    title: 'Frontend Developer',
    locationIds: ['NYC', 'SYD'],
  },
  {
    id: 'mgr-1',
    email: 'carol@example.com',
    password: 'password',
    name: 'Marcus Chen',
    role: 'manager',
    title: 'Engineering Manager',
    locationIds: ['NYC', 'LON', 'SYD', 'SEA'],
  },
]

export function getMockUserById(id: string): MockUser | undefined {
  return MOCK_USERS.find((u) => u.id === id)
}

export function getEmployeeName(id: string): string {
  return getMockUserById(id)?.name ?? id
}

export function getEmployeeTitle(id: string): string {
  return getMockUserById(id)?.title ?? 'Employee'
}
