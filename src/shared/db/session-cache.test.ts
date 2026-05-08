import { describe, it, expect } from 'vitest'
import { saveSession, getSession, clearSession, isSessionValid } from './session-cache.db'

describe('session cache', () => {
  it('saves and retrieves a session', async () => {
    await saveSession({ access_token: 'tok', refresh_token: 'ref', expires_at: 9999999999 })
    const session = await getSession()
    expect(session?.access_token).toBe('tok')
  })

  it('clears the session', async () => {
    await saveSession({ access_token: 'tok', refresh_token: 'ref', expires_at: 9999999999 })
    await clearSession()
    const session = await getSession()
    expect(session).toBeUndefined()
  })

  it('isSessionValid returns false for expired token', () => {
    const expired = { key: 'session' as const, access_token: '', refresh_token: '', expires_at: 1 }
    expect(isSessionValid(expired)).toBe(false)
  })

  it('isSessionValid returns true for future expiry', () => {
    const valid = { key: 'session' as const, access_token: '', refresh_token: '', expires_at: 9999999999 }
    expect(isSessionValid(valid)).toBe(true)
  })
})
