import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateAuthenticationOptions } from 'npm:@simplewebauthn/server@9'

serve(async (req) => {
  // Auth flow: caller is unauthenticated (no session yet). userId is provided by the client.
  // The challenge is stored per-userId; even if guessed, the attacker cannot complete
  // the WebAuthn response without the user's registered authenticator device.
  const { userId } = await req.json()
  const rpID = new URL(req.headers.get('origin') ?? 'http://localhost').hostname

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('webauthn_credentials')
    .eq('id', userId)
    .single()

  const credentials = (profile?.webauthn_credentials ?? []) as Array<{ id: string }>

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: credentials.map((c) => ({
      id: c.id,
      type: 'public-key' as const,
    })),
  })

  await supabase.from('webauthn_challenges').insert({
    user_id: userId,
    challenge: options.challenge,
  })

  return new Response(JSON.stringify({ options }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
