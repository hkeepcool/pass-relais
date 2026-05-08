import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { mockGetSession, mockOnAuthStateChange } from '../../test/mocks/supabase'
import { AuthGuard } from './AuthGuard'
import { resetDbForTests } from '../../shared/db/schema'
import { saveSession } from '../../shared/db/session-cache.db'

function renderWithRouter(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/protected"
          element={
            <AuthGuard>
              <div>Protected Content</div>
            </AuthGuard>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDbForTests()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('redirects to /login when not authenticated', async () => {
    renderWithRouter('/protected')
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('renders children when authenticated via live session', async () => {
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
    renderWithRouter('/protected')
    expect(await screen.findByText('Protected Content')).toBeInTheDocument()
  })

  it('renders children when authenticated via cached session', async () => {
    await saveSession({ access_token: 'tok', refresh_token: 'ref', expires_at: 9999999999 })
    renderWithRouter('/protected')
    expect(await screen.findByText('Protected Content')).toBeInTheDocument()
  })
})
