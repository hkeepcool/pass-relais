import { getDb, type SessionCacheRecord } from './schema'

export async function saveSession(
  session: Omit<SessionCacheRecord, 'key'>,
): Promise<void> {
  const db = await getDb()
  await db.put('session_cache', { key: 'session', ...session })
}

export async function getSession(): Promise<SessionCacheRecord | undefined> {
  const db = await getDb()
  return db.get('session_cache', 'session')
}

export async function clearSession(): Promise<void> {
  const db = await getDb()
  await db.delete('session_cache', 'session')
}

export function isSessionValid(session: SessionCacheRecord): boolean {
  return Date.now() / 1000 < session.expires_at
}
