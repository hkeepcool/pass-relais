import { describe, it, expect, beforeEach } from 'vitest'
import { getDb, resetDbForTests } from './schema'

describe('IndexedDB schema', () => {
  beforeEach(() => resetDbForTests())

  it('opens the database with all four stores', async () => {
    const db = await getDb()
    expect(db.objectStoreNames).toContain('patients')
    expect(db.objectStoreNames).toContain('observations')
    expect(db.objectStoreNames).toContain('sync_queue')
    expect(db.objectStoreNames).toContain('session_cache')
  })
})
