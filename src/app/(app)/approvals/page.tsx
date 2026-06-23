'use client'

import { Header } from '@/components/layout/Header'
import { ManagerQueue } from '@/components/manager/ManagerQueue'

export default function ApprovalsPage() {
  return (
    <>
      <Header title="Time Off Approvals" />
      <main className="flex-1 space-y-6 overflow-y-auto p-8">
        <ManagerQueue />
      </main>
    </>
  )
}
