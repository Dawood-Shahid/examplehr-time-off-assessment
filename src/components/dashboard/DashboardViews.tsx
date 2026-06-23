'use client'

import Link from 'next/link'
import { useBalancesBatch } from '@/hooks/useBalancesBatch'
import { useBalanceReconciliation } from '@/hooks/useBalanceReconciliation'
import { usePendingRequests } from '@/hooks/useRequests'
import {
  LocationBalanceCard,
  LocationBalanceCardSkeleton,
} from '@/components/balance/LocationBalanceCard'
import { formatRelativeTime } from '@/lib/balance-state'
import { LEAVE_TYPE_LABELS, type BalanceCell } from '@/types/hcm'

export function EmployeeDashboard() {
  const { data, isLoading, isPending, isError, dataUpdatedAt } =
    useBalancesBatch()

  const balances: BalanceCell[] = data?.balances ?? []
  const hasBalances = balances.length > 0

  useBalanceReconciliation(balances)

  const lastSyncedLabel =
    dataUpdatedAt > 0
      ? formatRelativeTime(new Date(dataUpdatedAt).toISOString())
      : isPending
        ? 'syncing…'
        : 'not yet'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <p className="text-sm text-gray-500">
          Manage your balances and pending actions.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="h-2 w-2 rounded-full bg-blue-500" />
        Source of Truth: Last synced {lastSyncedLabel}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
            <LocationBalanceCardSkeleton key={i} />
          ))
          : balances.map((balance) => (
            <LocationBalanceCard
              key={`${balance.employeeId}:${balance.locationId}`}
              balance={balance}
              isFetching={isLoading}
              isError={isError && !hasBalances}
            />
          ))}
      </div>
    </div>
  )
}

export function ManagerDashboard() {
  const { data: pending = [], isLoading } = usePendingRequests()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <p className="text-sm text-gray-500">
          Manage your balances and pending team actions.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="h-2 w-2 rounded-full bg-blue-500" />
        Source of Truth: Last synced 2m ago
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:col-span-1">
          <p className="text-sm text-gray-500">Pending Approvals</p>
          <p className="text-4xl font-bold text-gray-900">
            {String(pending.length).padStart(2, '0')}
          </p>
          <p className="mt-1 text-sm text-gray-500">Requests pending review</p>
          <Link
            href="/approvals"
            className="mt-4 inline-block rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            Review Queue
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Recent Approvals Queue</h3>
          <Link href="/approvals" className="text-sm text-blue-600 hover:underline">
            View All Approvals
          </Link>
        </div>
        {isLoading ? (
          <div className="p-6 text-sm text-gray-500">Loading…</div>
        ) : pending.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No pending requests.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                  Employee
                </th>
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {pending.slice(0, 3).map((req) => (
                <tr key={req.id} className="border-b border-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {req.employeeName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {LEAVE_TYPE_LABELS[req.leaveType]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
