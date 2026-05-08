import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockSendMagicLink } from '../../test/mocks/supabase'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders email input and submit button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /lien/i })).toBeInTheDocument()
  })

  it('calls signInWithOtp on submit and shows confirmation', async () => {
    mockSendMagicLink.mockResolvedValue({ error: null })
    render(<LoginPage />)
    await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com')
    await userEvent.click(screen.getByRole('button', { name: /lien/i }))
    expect(mockSendMagicLink).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' }),
    )
    expect(await screen.findByText(/vérifiez votre email/i)).toBeInTheDocument()
  })

  it('shows error message on failure', async () => {
    mockSendMagicLink.mockResolvedValue({ error: { message: 'Rate limit' } })
    render(<LoginPage />)
    await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com')
    await userEvent.click(screen.getByRole('button', { name: /lien/i }))
    expect(await screen.findByText('Rate limit')).toBeInTheDocument()
  })
})
