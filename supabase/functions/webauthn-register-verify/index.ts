import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyRegistrationResponse } from 'npm:@simplewebauthn/server@9'

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

  const verification = await verifyRegistrationResponse({
    response: credential,
    expectedChallenge: challengeRow.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  })

  if (!verification.verified || !verification.registrationInfo) {
    return new Response(JSON.stringify({ error: 'Verification failed' }), { status: 400 })
  }

  const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

  const { data: profile } = await supabase
    .from('profiles')
    .select('webauthn_credentials')
    .eq('id', userId)
    .single()

  const existing = (profile?.webauthn_credentials ?? []) as unknown[]
  await supabase.from('profiles').update({
    webauthn_credentials: [
      ...existing,
      {
        id: Buffer.from(credentialID).toString('base64url'),
        publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
      },
    ],
  }).eq('id', userId)

  await supabase.from('webauthn_challenges').delete().eq('user_id', userId)

  return new Response(JSON.stringify({ verified: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
