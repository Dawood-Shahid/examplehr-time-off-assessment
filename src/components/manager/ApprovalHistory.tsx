'use client'

import { useApprovalHistory } from '@/hooks/useRequests'
import { LEAVE_TYPE_LABELS, type HcmRequest } from '@/types/hcm'

function StatusBadge({ status }: { status: HcmRequest['status'] }) {
  const styles = {
    approved: 'bg-emerald-50 text-emerald-700',
    denied: 'bg-red-50 text-red-700',
    pending: 'bg-blue-50 text-blue-700',
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
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
  const s = new Date(start).toLocaleDateString('en-US', opts)
  const e = new Date(end).toLocaleDateString('en-US', opts)
  return start === end ? s : `${s} – ${e}`
}

function formatReviewedAt(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ApprovalHistory() {
  const { data: history = [], isLoading } = useApprovalHistory()

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="font-semibold text-gray-900">Approval History</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Past approve and deny decisions for employee time-off requests.
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
      ) : history.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">
          No approval history yet. Decisions will appear here after you approve or deny requests.
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
                Decision
              </th>
              <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                Reviewed
              </th>
            </tr>
          </thead>
          <tbody>
            {history.map((req) => (
              <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{req.employeeName}</p>
                  <p className="text-xs text-gray-500">{req.employeeTitle}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">
                    {LEAVE_TYPE_LABELS[req.leaveType]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateRange(req.startDate, req.endDate)}
                  </p>
                  <p className="text-xs text-gray-400">{req.locationName}</p>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={req.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatReviewedAt(req.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!isLoading && history.length > 0 && (
        <div className="border-t border-gray-100 px-6 py-3 text-xs text-gray-400">
          Showing {history.length} past decision{history.length === 1 ? '' : 's'}
        </div>
      )}
    </div>
  )
}
