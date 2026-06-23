'use client'

import { useState, useMemo, useRef } from 'react'
import { Info } from 'lucide-react'
import { useSubmitRequest } from '@/hooks/useSubmitRequest'
import { useBalanceQuery } from '@/hooks/useBalanceQuery'
import {
  useBalanceReconciliation,
  useDisplayBalance,
} from '@/hooks/useBalanceReconciliation'
import { OptimisticFeedback } from './OptimisticFeedback'
import { ProjectedBalancePanel } from '@/components/dashboard/ProjectedBalancePanel'
import { PolicyGuidelines } from '@/components/dashboard/PolicyGuidelines'
import {
  LEAVE_TYPE_LABELS,
  LOCATION_LABELS,
  type HcmError,
  type HcmErrorCode,
  type LeaveType,
  type SubmitRequestInput,
} from '@/types/hcm'
import { useOptimisticStore } from '@/store/optimistic-store'

type RequestFormProps = {
  employeeId: string
  locationIds: string[]
  approverName?: string
}

function calculateDays(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  const diff = e.getTime() - s.getTime()
  if (diff < 0) return 0
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}

export function RequestForm({
  employeeId,
  locationIds,
  approverName = 'Sarah Jenkins (Lead Manager)',
}: RequestFormProps) {
  const [locationId, setLocationId] = useState(locationIds[0] ?? 'LON')
  const [leaveType, setLeaveType] = useState<LeaveType>('annual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [submissionError, setSubmissionError] = useState<HcmErrorCode | undefined>()

  const daysRequested = useMemo(
    () => calculateDays(startDate, endDate),
    [startDate, endDate]
  )

  const { data: balance } = useBalanceQuery(employeeId, locationId)
  useBalanceReconciliation(undefined, employeeId, locationId, balance)
  const { displayDays, showReview, reviewMode, onReview } = useDisplayBalance(
    employeeId,
    locationId,
    balance ?? { daysAvailable: 0, version: 0, updatedAt: '' }
  )
  const submit = useSubmitRequest()
  const mutations = useOptimisticStore((s) => s.mutations)
  const updateStatus = useOptimisticStore((s) => s.updateStatus)
  const lastSubmitted = useRef<SubmitRequestInput | null>(null)

  const cellMutation = mutations.find(
    (m) =>
      m.employeeId === employeeId &&
      m.locationId === locationId &&
      (m.status === 'pending' || m.status === 'confirmed' || m.status === 'unconfirmed')
  )

  const hcmError = submit.error as HcmError | null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (daysRequested <= 0) return
    const payload: SubmitRequestInput = {
      employeeId,
      locationId,
      leaveType,
      daysRequested,
      startDate,
      endDate,
      notes: notes || undefined,
    }
    lastSubmitted.current = payload
    setSubmissionError(undefined)
    submit.mutate(payload, {
      onError: (err) => {
        const code = (err as HcmError)?.error
        if (code) setSubmissionError(code)
      },
    })
  }

  const handleRetry = () => {
    const payload = lastSubmitted.current
    if (!payload) return
    // Retire the stale unconfirmed mutation so it stops driving the UI,
    // then resubmit the original request to HCM.
    if (cellMutation?.status === 'unconfirmed') {
      updateStatus(cellMutation.id, 'rolled_back')
    }
    submit.mutate(payload)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">New Request</h2>
            <p className="text-sm text-gray-500">
              Submit your absence details for approval.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-gray-700">
                Work Location
              </label>
              <select
                id="location"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {locationIds.map((id) => (
                  <option key={id} value={id}>
                    {LOCATION_LABELS[id] ?? id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="leaveType" className="mb-1.5 block text-sm font-medium text-gray-700">
                Leave Type
              </label>
              <select
                id="leaveType"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Object.entries(LEAVE_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="mb-1.5 block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-gray-700">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Briefly explain the reason for your request if necessary..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <OptimisticFeedback
              error={submissionError ?? hcmError?.error}
              isPending={submit.isPending || cellMutation?.status === 'pending'}
              isSuccess={submit.isSuccess && cellMutation?.status === 'confirmed'}
              isUnconfirmed={cellMutation?.status === 'unconfirmed'}
              isTimeout={hcmError?.error === 'timeout'}
              onRetry={handleRetry}
              isRetrying={submit.isPending}
            />

            <div className="flex items-center justify-between border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Info className="h-4 w-4" />
                Approver: {approverName}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('')
                    setEndDate('')
                    setNotes('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={submit.isPending || daysRequested <= 0}
                  className="rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {submit.isPending ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        <ProjectedBalancePanel
          currentBalance={displayDays}
          deduction={daysRequested}
          showReconciliationNotice={showReview}
          reconciliationLabel={
            reviewMode === 'held_during_mutation'
              ? 'Balance updated — tap to review'
              : 'Balance updated'
          }
          showReview={showReview}
          onReview={onReview}
        />
        <PolicyGuidelines />
      </div>
    </div>
  )
}

export { calculateDays }
