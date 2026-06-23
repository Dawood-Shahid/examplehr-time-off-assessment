import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { hcmStore } from '@/lib/hcm-store'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { employeeId, locationId, bonusDays = 5 } = await req.json()
  const key = `${employeeId}:${locationId}`
  const balance = hcmStore.balances.get(key)

  if (!balance) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  balance.daysAvailable += bonusDays
  balance.version += 1
  balance.updatedAt = new Date().toISOString()

  return NextResponse.json({ ...balance, key })
}
