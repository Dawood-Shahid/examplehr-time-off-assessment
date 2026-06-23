import type { Role } from '@/types/hcm'
import {
  LayoutGrid,
  CalendarPlus,
  History,
  CheckSquare,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  roles: Role[]
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
    roles: ['employee', 'manager'],
  },
  {
    href: '/request-time-off',
    label: 'Request Time Off',
    icon: CalendarPlus,
    roles: ['employee'],
  },
  {
    href: '/my-requests',
    label: 'My Requests',
    icon: History,
    roles: ['employee'],
  },
  {
    href: '/approvals',
    label: 'Time Off Approvals',
    icon: CheckSquare,
    roles: ['manager'],
  },
]

export function getNavItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
