'use client'

import { useRef } from 'react'
import { useBalanceQuery } from '@/hooks/useBalanceQuery'
import { formatRelativeTime, getBalanceAgeMs } from '@/lib/balance-state'

type BalanceAtApprovalTimeProps = {
  employeeId: string
  locationId: string
}

export function BalanceAtApprovalTime({
  employeeId,
  locationId,
}: BalanceAtApprovalTimeProps) {
  const liveData = useBalanceQuery(employeeId, locationId)
  const snapshotRef = useRef(liveData.data)
  if (!snapshotRef.current && liveData.data) {
    snapshotRef.current = liveData.data
  }
  const snapshot = snapshotRef.current

  if (!snapshot) {
    return <span className="text-sm text-gray-400">Loading balance…</span>
  }

  const ageMs = getBalanceAgeMs(snapshot.updatedAt)
  const isStale = ageMs > 5 * 60 * 1000

  return (
    <div className="text-sm text-gray-600">
      <span className="font-medium text-gray-900">
        {snapshot.daysAvailable.toFixed(1)} days available
      </span>
      {isStale && (
        <span className="ml-2 text-amber-600">
          (snapshot may be stale — {formatRelativeTime(snapshot.updatedAt)})
        </span>
      )}
      <span className="ml-1 text-gray-400">
        as of {formatRelativeTime(snapshot.updatedAt)}
      </span>
    </div>
  )
}
