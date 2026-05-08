import { Buffer } from 'node:buffer'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyAuthenticationResponse } from 'npm:@simplewebauthn/server@9'

serve(async (req) => {
  const { userId, credential } = await req.json()
  const origin = req.headers.get('origin') ?? 'http://localhost'
  const rpID = new URL(origin).hostname

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: challengeRow } = await supabase
    .from('webauthn_challenges')
    .select('challenge, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!challengeRow) {
    return new Response(JSON.stringify({ error: 'Challenge not found' }), { status: 400 })
  }

  const ageMs = Date.now() - new Date(challengeRow.created_at).getTime()
  if (ageMs > 300_000) {
    return new Response(JSON.stringify({ error: 'Challenge expired' }), { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('webauthn_credentials')
    .eq('id', userId)
    .single()

  const storedCredentials = (profile?.webauthn_credentials ?? []) as Array<{
    id: string; publicKey: string; counter: number
  }>
  const storedCred = storedCredentials.find((c) => c.id === credential.id)
  if (!storedCred) {
    return new Response(JSON.stringify({ error: 'Credential not found' }), { status: 400 })
  }

  const verification = await verifyAuthenticationResponse({
    response: credential,
    expectedChallenge: challengeRow.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: Buffer.from(storedCred.id, 'base64url'),
      credentialPublicKey: Buffer.from(storedCred.publicKey, 'base64url'),
      counter: storedCred.counter,
    },
  })

  if (!verification.verified) {
    return new Response(JSON.stringify({ error: 'Verification failed' }), { status: 400 })
  }

  // Update counter
  const updatedCredentials = storedCredentials.map((c) =>
    c.id === storedCred.id
      ? { ...c, counter: verification.authenticationInfo.newCounter }
      : c,
  )
  await supabase.from('profiles').update({ webauthn_credentials: updatedCredentials }).eq('id', userId)
  await supabase.from('webauthn_challenges').delete().eq('user_id', userId)

  // Generate a one-time token the client can exchange for a full session via verifyOtp
  const { data: userData } = await supabase.auth.admin.getUserById(userId)
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: userData.user?.email ?? '',
    options: { shouldSendEmail: false },
  })

  if (linkError || !linkData) {
    return new Response(JSON.stringify({ error: 'Session creation failed' }), { status: 500 })
  }

  return new Response(
    JSON.stringify({ token_hash: linkData.properties?.hashed_token }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
