'use client'

import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/Header'
import { RequestForm } from '@/components/request/RequestForm'

export default function RequestTimeOffPage() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <>
      <Header title="Request Time Off" />
      <main className="flex-1 overflow-y-auto p-8">
        <RequestForm
          employeeId={session.user.id}
          locationIds={session.user.locationIds}
        />
      </main>
    </>
  )
}
