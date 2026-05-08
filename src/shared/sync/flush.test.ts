import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetDbForTests } from '../db/schema'
import { enqueueItem, getAllQueuedItems } from '../db/sync-queue.db'
import { flushQueue } from './flush'
import { useAppStore } from '../../lib/store'

// Mock supabase.from().upsert()
const { mockUpsert, mockFrom } = vi.hoisted(() => {
  const mockUpsert = vi.fn()
  const mockFrom = vi.fn(() => ({ upsert: mockUpsert }))
  return { mockUpsert, mockFrom }
})

vi.mock('../../lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

import { queryClient } from '../../lib/queryClient'

describe('flushQueue', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined)
    await resetDbForTests()
    useAppStore.setState({ syncQueue: [], conflicts: [] })
  })

  it('removes item from queue on successful upsert', async () => {
    await enqueueItem({ operation: 'INSERT', table: 'observations', payload: { id: 'o1', updated_at: '2026-05-07T09:00:00Z' } })
    mockUpsert.mockResolvedValue({ data: [{ updated_at: '2026-05-07T09:00:00Z' }], error: null })
    await flushQueue()
    expect(await getAllQueuedItems()).toHaveLength(0)
  })

  it('increments retries on network failure', async () => {
    await enqueueItem({ operation: 'INSERT', table: 'observations', payload: { id: 'o1', updated_at: '2026-05-07T09:00:00Z' } })
    mockUpsert.mockResolvedValue({ data: null, error: { message: 'Network error' } })
    await flushQueue()
    const items = await getAllQueuedItems()
    expect(items[0]?.retries).toBe(1)
  })

  it('adds conflict when server updated_at is newer', async () => {
    await enqueueItem({
      operation: 'UPDATE',
      table: 'observations',
      payload: { id: 'o1', patient_id: 'p1', updated_at: '2026-05-07T08:00:00Z' },
    })
    mockUpsert.mockResolvedValue({
      data: [{ updated_at: '2026-05-07T09:00:00Z' }],
      error: null,
    })
    await flushQueue()
    const conflicts = useAppStore.getState().conflicts
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]?.table).toBe('observations')
  })
})
