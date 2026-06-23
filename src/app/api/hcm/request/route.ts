import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { hcmStore } from '@/lib/hcm-store'
import { getEmployeeName, getEmployeeTitle } from '@/lib/mock-users'
import { LOCATION_LABELS, type LeaveType, type SubmitRequestInput } from '@/types/hcm'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as SubmitRequestInput
  const { employeeId, locationId, daysRequested, leaveType, startDate, endDate, notes } =
    body

  if (session.user.role !== 'employee' || session.user.id !== employeeId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const requestDelay = Number(process.env.HCM_REQUEST_DELAY_MS ?? 0)
  if (requestDelay > 0) {
    await new Promise((r) => setTimeout(r, requestDelay))
  }

  const key = `${employeeId}:${locationId}`
  const balance = hcmStore.balances.get(key)

  const timeoutRate = Number(process.env.HCM_TIMEOUT_RATE ?? 0.05)
  if (Math.random() < timeoutRate) {
    await new Promise((r) => setTimeout(r, 10_000))
    return NextResponse.json({ error: 'timeout' }, { status: 504 })
  }

  const silentFailRate = Number(process.env.HCM_SILENT_FAIL_RATE ?? 0.1)
  if (Math.random() < silentFailRate) {
    return NextResponse.json(
      { requestId: crypto.randomUUID(), status: 'created' },
      { status: 201 }
    )
  }

  const conflictRate = Number(process.env.HCM_CONFLICT_RATE ?? 0.08)
  if (Math.random() < conflictRate) {
    return NextResponse.json({ error: 'hcm_conflict' }, { status: 409 })
  }

  if (!balance || balance.daysAvailable < daysRequested) {
    return NextResponse.json({ error: 'insufficient_balance' }, { status: 409 })
  }

  balance.daysAvailable -= daysRequested
  balance.version += 1
  balance.updatedAt = new Date().toISOString()

  const id = crypto.randomUUID()
  hcmStore.requests.set(id, {
    id,
    employeeId,
    employeeName: getEmployeeName(employeeId),
    employeeTitle: getEmployeeTitle(employeeId),
    locationId,
    locationName: LOCATION_LABELS[locationId] ?? locationId,
    leaveType: leaveType as LeaveType,
    daysRequested,
    startDate,
    endDate,
    notes,
    status: 'pending',
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ requestId: id, status: 'created' }, { status: 201 })
}
