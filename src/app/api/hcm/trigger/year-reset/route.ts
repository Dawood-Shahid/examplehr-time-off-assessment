import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { hcmStore } from '@/lib/hcm-store'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { allocationDays = 20 } = await req.json()
  const now = new Date().toISOString()
  const updated: Array<{ key: string; daysAvailable: number; version: number }> = []

  for (const [key, balance] of Array.from(hcmStore.balances.entries())) {
    balance.daysAvailable = allocationDays
    balance.version += 1
    balance.updatedAt = now
    updated.push({
      key,
      daysAvailable: balance.daysAvailable,
      version: balance.version,
    })
  }

  return NextResponse.json({ allocationDays, updated })
}
