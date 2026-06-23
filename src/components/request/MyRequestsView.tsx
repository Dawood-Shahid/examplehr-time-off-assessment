'use client'

import Link from 'next/link'
import { Plus, Filter, MoreVertical } from 'lucide-react'
import { useMyRequests } from '@/hooks/useRequests'
import { LEAVE_TYPE_LABELS, type HcmRequest } from '@/types/hcm'

function StatusBadge({ status }: { status: HcmRequest['status'] }) {
  const styles = {
    approved: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-blue-50 text-blue-700',
    denied: 'bg-red-50 text-red-700',
  }
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  const s = new Date(start).toLocaleDateString('en-US', opts)
  const e = new Date(end).toLocaleDateString('en-US', opts)
  return start === end ? s : `${s} – ${e}`
}

type MyRequestsViewProps = {
  employeeId: string
  totalBalance?: number
}

export function MyRequestsView({ employeeId, totalBalance = 18 }: MyRequestsViewProps) {
  const { data: requests = [], isLoading } = useMyRequests(employeeId)

  const pending = requests.filter((r) => r.status === 'pending').length
  const upcoming = requests.filter(
    (r) => r.status === 'approved' && new Date(r.startDate) > new Date()
  ).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: 'Balance', value: totalBalance, highlight: false },
          { label: 'Pending', value: pending, highlight: true },
          { label: 'Upcoming', value: upcoming, highlight: false },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p
              className={`text-3xl font-bold ${stat.highlight ? 'text-blue-600' : 'text-gray-900'}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
        <Link
          href="/request-time-off"
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 p-5 text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold">New Request</span>
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">History & Status</h2>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No requests yet. Submit your first time-off request.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                  Leave Type
                </th>
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                  Dates
                </th>
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {LEAVE_TYPE_LABELS[req.leaveType]}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDateRange(req.startDate, req.endDate)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4">
                    <button type="button" className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
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
