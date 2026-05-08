import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { mockGetSession, mockOnAuthStateChange } from '../../test/mocks/supabase'
import { useAuth } from './useAuth'
import { resetDbForTests } from '../../shared/db/schema'
import { saveSession } from '../../shared/db/session-cache.db'

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDbForTests()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('starts in loading state', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.state).toBe('loading')
  })

  it('transitions to unauthenticated when no session and no cache', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    await waitFor(() => expect(result.current.state).toBe('unauthenticated'))
  })

  it('transitions to authenticated when Supabase session exists', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'tok',
          refresh_token: 'ref',
          expires_at: 9999999999,
          user: { id: 'uid' },
        },
      },
      error: null,
    })
    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    await waitFor(() => expect(result.current.state).toBe('authenticated'))
  })

  it('transitions to authenticated from cached session when offline', async () => {
    await saveSession({ access_token: 'tok', refresh_token: 'ref', expires_at: 9999999999 })
    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    await waitFor(() => expect(result.current.state).toBe('authenticated'))
  })
})
