'use client'

import { useManagerApproval } from '@/hooks/useManagerApproval'
import { BalanceAtApprovalTime } from './BalanceAtApprovalTime'
import { LEAVE_TYPE_LABELS, type HcmRequest } from '@/types/hcm'

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  const s = new Date(start).toLocaleDateString('en-US', opts)
  const e = new Date(end).toLocaleDateString('en-US', opts)
  return start === end ? s : `${s} – ${e}`
}

type PendingRequestRowProps = {
  request: HcmRequest
}

export function PendingRequestRow({ request }: PendingRequestRowProps) {
  const approval = useManagerApproval()

  return (
    <tr className="border-b border-gray-50">
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-gray-900">{request.employeeName}</p>
        <p className="text-xs text-gray-500">{request.employeeTitle}</p>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-gray-900">
          {LEAVE_TYPE_LABELS[request.leaveType]}
        </p>
        <p className="text-xs text-gray-500">
          {formatDateRange(request.startDate, request.endDate)}
        </p>
        <BalanceAtApprovalTime
          employeeId={request.employeeId}
          locationId={request.locationId}
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={approval.isPending}
            onClick={() =>
              approval.mutate({ requestId: request.id, action: 'deny' })
            }
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {approval.isPending ? '…' : 'Deny'}
          </button>
          <button
            type="button"
            disabled={approval.isPending}
            onClick={() =>
              approval.mutate({ requestId: request.id, action: 'approve' })
            }
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {approval.isPending ? 'Approving…' : 'Approve'}
          </button>
        </div>
        {approval.isError && (
          <p className="mt-1 text-xs text-red-600">
            Action failed — please retry.
          </p>
        )}
      </td>
    </tr>
  )
}
