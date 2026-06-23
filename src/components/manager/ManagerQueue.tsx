'use client'

import { usePendingRequests } from '@/hooks/useRequests'
import { ApprovalHistory } from './ApprovalHistory'
import { ManagerControls } from './ManagerControls'
import { PendingRequestRow } from './PendingRequestRow'

export function ManagerQueue() {
  const { data: requests = [], isLoading } = usePendingRequests()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Pending</p>
          <p className="text-3xl font-bold text-gray-900">
            {String(requests.length).padStart(2, '0')}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Team Capacity</p>
          <p className="text-3xl font-bold text-blue-600">88%</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Next Holiday</p>
          <p className="text-lg font-semibold text-gray-900">Memorial Day</p>
          <p className="text-xs text-gray-500">May 27, 2024</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Pending Approval Queue</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No pending requests — you&apos;re all caught up.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                  Employee
                </th>
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                  Type & Dates
                </th>
                <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <PendingRequestRow key={req.id} request={req} />
              ))}
            </tbody>
          </table>
        )}

        <div className="border-t border-gray-100 px-6 py-3 text-xs text-gray-400">
          Showing {requests.length} of {requests.length} pending requests
        </div>
      </div>

      <ManagerControls />

      <ApprovalHistory />
    </div>
  )
}
