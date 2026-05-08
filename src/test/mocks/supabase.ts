import { vi } from 'vitest'

export const mockGetSession = vi.fn()
export const mockSendMagicLink = vi.fn()
export const mockSignOut = vi.fn()
export const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      signInWithOtp: mockSendMagicLink,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}))
