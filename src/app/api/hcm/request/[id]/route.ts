import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { hcmStore } from '@/lib/hcm-store'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'manager') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const request = hcmStore.requests.get(params.id)
  if (!request) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'hcm_conflict' }, { status: 409 })
  }

  const { action } = (await req.json()) as { action: 'approve' | 'deny' }

  if (action === 'approve') {
    const key = `${request.employeeId}:${request.locationId}`
    const balance = hcmStore.balances.get(key)
    if (!balance || balance.daysAvailable < 0) {
      return NextResponse.json({ error: 'insufficient_balance' }, { status: 409 })
    }
    request.status = 'approved'
  } else {
    const key = `${request.employeeId}:${request.locationId}`
    const balance = hcmStore.balances.get(key)
    if (balance) {
      balance.daysAvailable += request.daysRequested
      balance.version += 1
      balance.updatedAt = new Date().toISOString()
    }
    request.status = 'denied'
  }

  hcmStore.requests.set(params.id, request)
  return NextResponse.json(request)
}
