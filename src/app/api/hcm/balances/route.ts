import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { hcmStore } from '@/lib/hcm-store'
import { LOCATION_LABELS, type BalanceCell } from '@/types/hcm'

const BATCH_RATE_LIMIT_MS = Number(process.env.HCM_BATCH_RATE_LIMIT_MS ?? 30_000)

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sessionKey = session.user.id
  const lastCall = hcmStore.batchLastCall.get(sessionKey) ?? 0
  const now = Date.now()
  if (BATCH_RATE_LIMIT_MS > 0 && now - lastCall < BATCH_RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: 'rate_limited', message: 'Batch endpoint rate limited' },
      { status: 429 }
    )
  }
  hcmStore.batchLastCall.set(sessionKey, now)

  const delay = Number(process.env.HCM_SLOW_BATCH_MS ?? 600)
  await new Promise((r) => setTimeout(r, delay))

  const employeeId = session.user.id
  const balances: BalanceCell[] = []

  if (session.user.role === 'employee') {
    for (const locId of session.user.locationIds) {
      const key = `${employeeId}:${locId}`
      const balance = hcmStore.balances.get(key)
      if (balance) {
        balances.push({
          ...balance,
          employeeId,
          locationId: locId,
          locationName: LOCATION_LABELS[locId] ?? locId,
        })
      }
    }
  }

  return NextResponse.json({ balances })
}
