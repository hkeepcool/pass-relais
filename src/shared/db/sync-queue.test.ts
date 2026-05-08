import { describe, it, expect, beforeEach } from 'vitest'
import { resetDbForTests } from './schema'
import { enqueueItem, getAllQueuedItems, removeQueuedItem, incrementQueuedItemRetries } from './sync-queue.db'

describe('sync-queue.db', () => {
  beforeEach(async () => await resetDbForTests())

  it('enqueues and retrieves items sorted by created_at', async () => {
    await enqueueItem({ operation: 'INSERT', table: 'observations', payload: { id: 'a' } })
    await enqueueItem({ operation: 'UPDATE', table: 'observations', payload: { id: 'b' } })
    const items = await getAllQueuedItems()
    expect(items).toHaveLength(2)
    expect(items[0]!.created_at).toBeLessThanOrEqual(items[1]!.created_at)
  })

  it('removes an item by key', async () => {
    await enqueueItem({ operation: 'INSERT', table: 'observations', payload: {} })
    const items = await getAllQueuedItems()
    const key = items[0]!.id!
    await removeQueuedItem(key)
    expect(await getAllQueuedItems()).toHaveLength(0)
  })

  it('increments retries', async () => {
    await enqueueItem({ operation: 'INSERT', table: 'observations', payload: {} })
    const items = await getAllQueuedItems()
    const key = items[0]!.id!
    await incrementQueuedItemRetries(key)
    const updated = await getAllQueuedItems()
    expect(updated[0]?.retries).toBe(1)
  })
})
