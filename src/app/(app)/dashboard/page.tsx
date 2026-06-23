'use client'

import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/Header'
import {
  EmployeeDashboard,
  ManagerDashboard,
} from '@/components/dashboard/DashboardViews'

export default function DashboardPage() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-8">
        {session.user.role === 'manager' ? (
          <ManagerDashboard />
        ) : (
          <EmployeeDashboard />
        )}
      </main>
    </>
  )
}
