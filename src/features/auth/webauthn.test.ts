import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../../test/mocks/supabase'
import '../../test/mocks/webauthn'
import { mockStartRegistration, mockStartAuthentication } from '../../test/mocks/webauthn'

// mock supabase.functions.invoke
import { supabase } from '../../lib/supabase'
const mockInvoke = vi.fn()
;(supabase as any).functions = { invoke: mockInvoke }

import { isWebAuthnSupported, registerWebAuthn, authenticateWithWebAuthn } from './webauthn'

describe('webauthn', () => {
  beforeEach(() => vi.clearAllMocks())

  it('registerWebAuthn returns false when Edge Function errors', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('not found') })
    const result = await registerWebAuthn('user-id')
    expect(result).toBe(false)
  })

  it('registerWebAuthn returns true on success', async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: { options: {} }, error: null })
      .mockResolvedValueOnce({ data: {}, error: null })
    mockStartRegistration.mockResolvedValue({ id: 'cred' })
    const result = await registerWebAuthn('user-id')
    expect(result).toBe(true)
  })

  it('authenticateWithWebAuthn returns false when Edge Function errors', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('fail') })
    const result = await authenticateWithWebAuthn('user-id')
    expect(result).toBe(false)
  })

  it('authenticateWithWebAuthn returns true on success', async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: { options: {} }, error: null })
      .mockResolvedValueOnce({ data: { token_hash: 'tok_hash' }, error: null })
    mockStartAuthentication.mockResolvedValue({ id: 'cred' })
    ;(supabase as any).auth.verifyOtp = vi.fn().mockResolvedValue({ error: null })
    const result = await authenticateWithWebAuthn('user-id')
    expect(result).toBe(true)
  })
})
