import { describe, it, expect } from 'vitest'
import { getNavItemsForRole, NAV_ITEMS } from '@/hooks/useNavItems'

describe('getNavItemsForRole', () => {
  it('returns dashboard and employee tabs for employee role', () => {
    const items = getNavItemsForRole('employee')
    const hrefs = items.map((i) => i.href)
    expect(hrefs).toContain('/dashboard')
    expect(hrefs).toContain('/request-time-off')
    expect(hrefs).toContain('/my-requests')
    expect(hrefs).not.toContain('/approvals')
  })

  it('returns dashboard and approvals for manager role', () => {
    const items = getNavItemsForRole('manager')
    const hrefs = items.map((i) => i.href)
    expect(hrefs).toContain('/dashboard')
    expect(hrefs).toContain('/approvals')
    expect(hrefs).not.toContain('/request-time-off')
    expect(hrefs).not.toContain('/my-requests')
  })

  it('has exactly 4 nav items defined', () => {
    expect(NAV_ITEMS).toHaveLength(4)
  })
})
