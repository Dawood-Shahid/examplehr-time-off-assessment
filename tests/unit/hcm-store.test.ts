import { describe, it, expect, beforeEach } from 'vitest'
import { hcmStore, resetHcmStore, getBalanceKey } from '@/lib/hcm-store'

describe('hcmStore', () => {
  beforeEach(() => {
    resetHcmStore()
  })

  it('seeds employee balances', () => {
    expect(hcmStore.balances.get('emp-1:LON')?.daysAvailable).toBe(5)
    expect(hcmStore.balances.get('emp-2:NYC')?.daysAvailable).toBe(8)
  })

  it('deducts balance on successful mutation simulation', () => {
    const key = getBalanceKey('emp-1', 'LON')
    const balance = hcmStore.balances.get(key)!
    const original = balance.daysAvailable
    balance.daysAvailable -= 5
    balance.version += 1
    expect(hcmStore.balances.get(key)?.daysAvailable).toBe(original - 5)
    expect(hcmStore.balances.get(key)?.version).toBe(2)
  })

  it('seeds pending requests', () => {
    expect(hcmStore.requests.size).toBeGreaterThan(0)
  })
})
