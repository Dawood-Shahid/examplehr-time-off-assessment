import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { hcmStore } from '@/lib/hcm-store'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employeeId')

  let requests = Array.from(hcmStore.requests.values())

  if (session.user.role === 'employee') {
    requests = requests.filter((r) => r.employeeId === session.user.id)
  } else if (employeeId) {
    requests = requests.filter((r) => r.employeeId === employeeId)
  }

  requests.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return NextResponse.json(requests)
}
