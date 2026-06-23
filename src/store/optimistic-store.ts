import { create } from 'zustand'
import type { OptimisticMutation, MutationStatus } from '@/types/optimistic'

type OptimisticStore = {
  mutations: OptimisticMutation[]
  addMutation: (mutation: OptimisticMutation) => void
  confirmMutation: (id: string, serverRequestId: string) => void
  rollbackMutation: (id: string) => void
  markUnconfirmed: (id: string) => void
  getPendingForCell: (employeeId: string, locationId: string) => OptimisticMutation[]
  getConfirmedForCell: (employeeId: string, locationId: string) => OptimisticMutation[]
  updateStatus: (id: string, status: MutationStatus) => void
  clearMutations: () => void
}

export const useOptimisticStore = create<OptimisticStore>((set, get) => ({
  mutations: [],

  addMutation: (mutation) =>
    set((state) => ({ mutations: [...state.mutations, mutation] })),

  confirmMutation: (id, serverRequestId) =>
    set((state) => ({
      mutations: state.mutations.map((m) =>
        m.id === id ? { ...m, status: 'confirmed' as const, serverRequestId } : m
      ),
    })),

  rollbackMutation: (id) =>
    set((state) => ({
      mutations: state.mutations.map((m) =>
        m.id === id ? { ...m, status: 'rolled_back' as const } : m
      ),
    })),

  markUnconfirmed: (id) =>
    set((state) => ({
      mutations: state.mutations.map((m) =>
        m.id === id ? { ...m, status: 'unconfirmed' as const } : m
      ),
    })),

  getPendingForCell: (employeeId, locationId) =>
    get().mutations.filter(
      (m) =>
        m.employeeId === employeeId &&
        m.locationId === locationId &&
        m.status === 'pending'
    ),

  getConfirmedForCell: (employeeId, locationId) =>
    get().mutations.filter(
      (m) =>
        m.employeeId === employeeId &&
        m.locationId === locationId &&
        (m.status === 'confirmed' || m.status === 'unconfirmed')
    ),

  updateStatus: (id, status) =>
    set((state) => ({
      mutations: state.mutations.map((m) => (m.id === id ? { ...m, status } : m)),
    })),

  clearMutations: () => set({ mutations: [] }),
}))
