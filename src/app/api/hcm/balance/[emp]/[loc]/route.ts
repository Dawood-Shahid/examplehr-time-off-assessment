import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { hcmStore } from '@/lib/hcm-store'

export async function GET(
  _req: Request,
  { params }: { params: { emp: string; loc: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (
    session.user.role === 'employee' &&
    params.emp !== session.user.id
  ) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const delay = Number(process.env.HCM_REAL_TIME_DELAY_MS ?? 100)
  await new Promise((r) => setTimeout(r, delay))

  const key = `${params.emp}:${params.loc}`
  const balance = hcmStore.balances.get(key)
  if (!balance) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json(balance)
}
