import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

// Use vi.hoisted to declare mocks before vi.mock hoisting
const { mockIsWebAuthnSupported, mockRegisterWebAuthn } = vi.hoisted(() => ({
  mockIsWebAuthnSupported: vi.fn(),
  mockRegisterWebAuthn: vi.fn(),
}))

vi.mock('./webauthn', () => ({
  isWebAuthnSupported: mockIsWebAuthnSupported,
  registerWebAuthn: mockRegisterWebAuthn,
}))

// Mock supabase.from for profile queries
import { supabase } from '../../lib/supabase'
const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))
;(supabase as any).from = mockFrom

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-bind after clearAllMocks
    ;(supabase as any).from = mockFrom
    // Default: WebAuthn not supported
    mockIsWebAuthnSupported.mockResolvedValue(false)
    // Default: profile has no credentials
    mockSingle.mockResolvedValue({ data: { webauthn_credentials: [] }, error: null })
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

  it('shows WebAuthn prompt when supported and no existing credential', async () => {
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
    mockIsWebAuthnSupported.mockResolvedValue(true)
    mockSingle.mockResolvedValue({ data: { webauthn_credentials: [] }, error: null })

    render(
      <MemoryRouter>
        <AuthCallbackPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Activer la connexion biométrique ?')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to /patients when WebAuthn supported but credential already exists', async () => {
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
    mockIsWebAuthnSupported.mockResolvedValue(true)
    mockSingle.mockResolvedValue({
      data: { webauthn_credentials: [{ id: 'cred1' }] },
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

  it('calls registerWebAuthn and navigates when Activer is clicked', async () => {
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
    mockIsWebAuthnSupported.mockResolvedValue(true)
    mockSingle.mockResolvedValue({ data: { webauthn_credentials: [] }, error: null })
    mockRegisterWebAuthn.mockResolvedValue(true)

    render(
      <MemoryRouter>
        <AuthCallbackPage />
      </MemoryRouter>,
    )

    const activerButton = await screen.findByText('Activer')
    await userEvent.click(activerButton)

    await waitFor(() => {
      expect(mockRegisterWebAuthn).toHaveBeenCalledWith('uid')
      expect(mockNavigate).toHaveBeenCalledWith('/patients', { replace: true })
    })
  })

  it('shows error message and does not navigate when registerWebAuthn fails', async () => {
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
    mockIsWebAuthnSupported.mockResolvedValue(true)
    mockSingle.mockResolvedValue({ data: { webauthn_credentials: [] }, error: null })
    mockRegisterWebAuthn.mockResolvedValue(false)

    render(
      <MemoryRouter>
        <AuthCallbackPage />
      </MemoryRouter>,
    )

    const activerButton = await screen.findByText('Activer')
    await userEvent.click(activerButton)

    await waitFor(() => {
      expect(mockRegisterWebAuthn).toHaveBeenCalledWith('uid')
      expect(
        screen.getByText("Échec de l'activation biométrique. Veuillez réessayer."),
      ).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to /patients when Plus tard is clicked', async () => {
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
    mockIsWebAuthnSupported.mockResolvedValue(true)
    mockSingle.mockResolvedValue({ data: { webauthn_credentials: [] }, error: null })

    render(
      <MemoryRouter>
        <AuthCallbackPage />
      </MemoryRouter>,
    )

    const plusTardButton = await screen.findByText('Plus tard')
    await userEvent.click(plusTardButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/patients', { replace: true })
    })
  })
})
