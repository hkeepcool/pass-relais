import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { mockGetSession } from '../../test/mocks/supabase'
import { AuthCallbackPage } from './AuthCallbackPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('navigates to /patients when getSession returns a valid session', async () => {
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

    render(
      <MemoryRouter>
        <AuthCallbackPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/patients', { replace: true })
    })
  })

  it('renders French error message when getSession returns an error', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Session invalide' },
    })

    render(
      <MemoryRouter>
        <AuthCallbackPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Session invalide')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('renders French error message when session is null with no error', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(
      <MemoryRouter>
        <AuthCallbackPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Session invalide')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
