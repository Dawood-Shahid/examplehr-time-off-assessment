import { create } from 'zustand'
import type { Balance } from '@/types/hcm'

export type ReconciliationMode = 'bonus_only' | 'held_during_mutation'

export type ReconciliationEntry = {
  employeeId: string
  locationId: string
  previousBalance: Balance
  incomingBalance: Balance
  mode: ReconciliationMode
  acknowledged: boolean
}

type ReconciliationStore = {
  entries: Record<string, ReconciliationEntry>
  setEntry: (entry: ReconciliationEntry) => void
  acknowledge: (employeeId: string, locationId: string) => void
  getEntry: (employeeId: string, locationId: string) => ReconciliationEntry | undefined
  clearEntry: (employeeId: string, locationId: string) => void
  clearAll: () => void
}

function cellKey(employeeId: string, locationId: string): string {
  return `${employeeId}:${locationId}`
}

export const useReconciliationStore = create<ReconciliationStore>((set, get) => ({
  entries: {},

  setEntry: (entry) =>
    set((state) => ({
      entries: {
        ...state.entries,
        [cellKey(entry.employeeId, entry.locationId)]: entry,
      },
    })),

  acknowledge: (employeeId, locationId) =>
    set((state) => {
      const key = cellKey(employeeId, locationId)
      const existing = state.entries[key]
      if (!existing) return state
      return {
        entries: {
          ...state.entries,
          [key]: { ...existing, acknowledged: true },
        },
      }
    }),

  getEntry: (employeeId, locationId) =>
    get().entries[cellKey(employeeId, locationId)],

  clearEntry: (employeeId, locationId) =>
    set((state) => {
      const key = cellKey(employeeId, locationId)
      const next = { ...state.entries }
      delete next[key]
      return { entries: next }
    }),

  clearAll: () => set({ entries: {} }),
}))
