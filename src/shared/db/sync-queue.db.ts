import { getDb, type SyncQueueRecord } from './schema'

export async function enqueueItem(
  item: Pick<SyncQueueRecord, 'operation' | 'table' | 'payload'>,
): Promise<void> {
  const db = await getDb()
  await db.add('sync_queue', { ...item, created_at: Date.now(), retries: 0 })
}

export async function getAllQueuedItems(): Promise<SyncQueueRecord[]> {
  const db = await getDb()
  return db.getAllFromIndex('sync_queue', 'created_at')
}

export async function removeQueuedItem(key: number): Promise<void> {
  const db = await getDb()
  await db.delete('sync_queue', key)
}

export async function incrementQueuedItemRetries(key: number): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('sync_queue', 'readwrite')
  const item = await tx.store.get(key)
  if (item) {
    await tx.store.put({ ...item, retries: item.retries + 1 })
  }
  await tx.done
}
