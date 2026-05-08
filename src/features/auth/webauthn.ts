import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser'
import { supabase } from '../../lib/supabase'

export async function isWebAuthnSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export async function registerWebAuthn(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'webauthn-register-options',
      { body: { userId } },
    )
    if (error || !data) return false

    const credential = await startRegistration(data.options)

    const { error: verifyError } = await supabase.functions.invoke(
      'webauthn-register-verify',
      { body: { userId, credential } },
    )
    return !verifyError
  } catch {
    return false
  }
}

export async function authenticateWithWebAuthn(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'webauthn-auth-options',
      { body: { userId } },
    )
    if (error || !data) return false

    const credential = await startAuthentication(data.options)

    const { data: result, error: verifyError } = await supabase.functions.invoke(
      'webauthn-auth-verify',
      { body: { userId, credential } },
    )
    if (verifyError || !result?.token_hash) return false

    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash: result.token_hash,
      type: 'email',
    })
    return !otpError
  } catch {
    return false
  }
}
