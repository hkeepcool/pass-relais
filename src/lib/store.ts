import { create } from 'zustand'

export interface SyncItem {
  id: string
  operation: 'INSERT' | 'UPDATE'
  table: string
  payload: Record<string, unknown>
  created_at: number
  retries: number
}

export interface ConflictItem {
  patientName: string
  table: string
  id: string
}

interface AppStore {
  isOnline: boolean
  syncQueue: SyncItem[]
  conflicts: ConflictItem[]
  setOnline: (online: boolean) => void
  enqueue: (item: Pick<SyncItem, 'operation' | 'table' | 'payload'>) => void
  removeFromQueue: (id: string) => void
  incrementRetries: (id: string) => void
  addConflict: (conflict: ConflictItem) => void
  clearConflict: (id: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncQueue: [],
  conflicts: [],
  setOnline: (isOnline) => set({ isOnline }),
  enqueue: (item) =>
    set((s) => ({
      syncQueue: [
        ...s.syncQueue,
        { ...item, id: crypto.randomUUID(), created_at: Date.now(), retries: 0 },
      ],
    })),
  removeFromQueue: (id) =>
    set((s) => ({ syncQueue: s.syncQueue.filter((i) => i.id !== id) })),
  incrementRetries: (id) =>
    set((s) => ({
      syncQueue: s.syncQueue.map((i) =>
        i.id === id ? { ...i, retries: i.retries + 1 } : i,
      ),
    })),
  addConflict: (conflict) =>
    set((s) => ({ conflicts: [...s.conflicts, conflict] })),
  clearConflict: (id) =>
    set((s) => ({ conflicts: s.conflicts.filter((c) => c.id !== id) })),
}))
