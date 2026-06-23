'use client'

import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/Header'
import { MyRequestsView } from '@/components/request/MyRequestsView'
import { useBalancesBatch } from '@/hooks/useBalancesBatch'

import type { BalanceCell } from '@/types/hcm'

export default function MyRequestsPage() {
  const { data: session } = useSession()
  const { data } = useBalancesBatch()

  if (!session) return null

  const totalBalance = data?.balances.reduce(
    (sum: number, b: BalanceCell) => sum + b.daysAvailable,
    0
  ) ?? 18

  return (
    <>
      <Header title="My Requests" />
      <main className="flex-1 overflow-y-auto p-8">
        <MyRequestsView
          employeeId={session.user.id}
          totalBalance={Math.round(totalBalance)}
        />
      </main>
    </>
  )
}
