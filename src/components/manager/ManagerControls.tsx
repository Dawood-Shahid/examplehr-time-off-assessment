'use client'

import { useState } from 'react'
import { Gift, RotateCcw, Trash2 } from 'lucide-react'
import {
  useTriggerAnniversary,
  useTriggerYearReset,
  useTriggerReset,
} from '@/hooks/useHcmTriggers'
import { MOCK_USERS } from '@/lib/mock-users'
import { LOCATION_LABELS } from '@/types/hcm'

const EMPLOYEES = MOCK_USERS.filter((u) => u.role === 'employee')

function StatusLine({
  isPending,
  isSuccess,
  isError,
  successText,
}: {
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  successText: string
}) {
  if (isPending)
    return <p className="text-xs text-blue-600">Sending to HCM…</p>
  if (isSuccess)
    return <p className="text-xs text-emerald-600">{successText}</p>
  if (isError)
    return <p className="text-xs text-red-600">HCM rejected the request.</p>
  return null
}

export function ManagerControls() {
  const anniversary = useTriggerAnniversary()
  const yearReset = useTriggerYearReset()
  const reset = useTriggerReset()

  const [employeeId, setEmployeeId] = useState(EMPLOYEES[0]?.id ?? 'emp-1')
  const selectedEmployee = EMPLOYEES.find((e) => e.id === employeeId)
  const locationIds = selectedEmployee?.locationIds ?? []
  const [locationId, setLocationId] = useState(locationIds[0] ?? 'NYC')
  const [bonusDays, setBonusDays] = useState(5)
  const [allocationDays, setAllocationDays] = useState(20)

  // Keep the location selection valid when the employee changes.
  const effectiveLocation = locationIds.includes(locationId)
    ? locationId
    : locationIds[0] ?? ''

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="font-semibold text-gray-900">HCM Admin Controls</h2>
        <p className="text-xs text-gray-500">
          Simulate out-of-band HCM events. Changes appear in employee dashboards
          on the next balance poll.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px bg-gray-100 lg:grid-cols-3">
        {/* Anniversary bonus */}
        <div className="space-y-3 bg-white p-6">
          <div className="flex items-center gap-2 text-gray-900">
            <Gift className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold">Anniversary Bonus</h3>
          </div>
          <div className="space-y-2">
            <select
              aria-label="Employee"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {EMPLOYEES.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Location"
              value={effectiveLocation}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {locationIds.map((id) => (
                <option key={id} value={id}>
                  {LOCATION_LABELS[id] ?? id}
                </option>
              ))}
            </select>
            <label className="block text-xs text-gray-500">
              Bonus days
              <input
                type="number"
                min={1}
                value={bonusDays}
                onChange={(e) => setBonusDays(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() =>
              anniversary.mutate({
                employeeId,
                locationId: effectiveLocation,
                bonusDays,
              })
            }
            disabled={anniversary.isPending || !effectiveLocation}
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Grant bonus
          </button>
          <StatusLine
            isPending={anniversary.isPending}
            isSuccess={anniversary.isSuccess}
            isError={anniversary.isError}
            successText={`+${bonusDays} days granted.`}
          />
        </div>

        {/* Year reset */}
        <div className="space-y-3 bg-white p-6">
          <div className="flex items-center gap-2 text-gray-900">
            <RotateCcw className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold">Year-Start Reset</h3>
          </div>
          <p className="text-xs text-gray-500">
            Resets every employee balance to the allocation below.
          </p>
          <label className="block text-xs text-gray-500">
            Allocation days
            <input
              type="number"
              min={0}
              value={allocationDays}
              onChange={(e) => setAllocationDays(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <button
            type="button"
            onClick={() => yearReset.mutate(allocationDays)}
            disabled={yearReset.isPending}
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Reset all to allocation
          </button>
          <StatusLine
            isPending={yearReset.isPending}
            isSuccess={yearReset.isSuccess}
            isError={yearReset.isError}
            successText={`All balances set to ${allocationDays} days.`}
          />
        </div>

        {/* Full reset */}
        <div className="space-y-3 bg-white p-6">
          <div className="flex items-center gap-2 text-gray-900">
            <Trash2 className="h-4 w-4 text-red-600" />
            <h3 className="text-sm font-semibold">Reset to Seed</h3>
          </div>
          <p className="text-xs text-gray-500">
            Restores the demo store to its original seed balances and requests.
          </p>
          <button
            type="button"
            onClick={() => reset.mutate()}
            disabled={reset.isPending}
            className="w-full rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Reset store
          </button>
          <StatusLine
            isPending={reset.isPending}
            isSuccess={reset.isSuccess}
            isError={reset.isError}
            successText="Store reset to seed data."
          />
        </div>
      </div>
    </div>
  )
}
