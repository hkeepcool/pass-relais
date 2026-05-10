import { vi } from 'vitest'

export const mockGetSession = vi.fn()
export const mockSendMagicLink = vi.fn()
export const mockSignOut = vi.fn()
export const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}))

// Chainable thenable so pullFromSupabase() doesn't throw in auth tests
const makeQuery = () => {
  const resolved = { data: null, error: null }
  const gte = vi.fn(() => Promise.resolve(resolved))
  const select = vi.fn(() => Object.assign(Promise.resolve(resolved), { gte }))
  const upsert = vi.fn(() => Promise.resolve(resolved))
  return { select, upsert }
}
export const mockFrom = vi.fn(() => makeQuery())

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      signInWithOtp: mockSendMagicLink,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  },
}))
