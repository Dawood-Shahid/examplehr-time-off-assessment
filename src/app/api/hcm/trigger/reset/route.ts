import { NextResponse } from 'next/server'
import { resetHcmStore } from '@/lib/hcm-store'

export async function POST() {
  resetHcmStore()
  return NextResponse.json({ ok: true })
}
