import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateRegistrationOptions } from 'npm:@simplewebauthn/server@9'

const CHALLENGE_TTL_SECONDS = 300

serve(async (req) => {
  const { userId } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, webauthn_credentials')
    .eq('id', userId)
    .single()

  const existingCredentials = (profile?.webauthn_credentials ?? []) as Array<{ id: string }>

  const options = await generateRegistrationOptions({
    rpName: 'Pass-Relais',
    rpID: new URL(req.headers.get('origin') ?? 'http://localhost').hostname,
    userID: userId,
    userName: profile?.full_name ?? userId,
    excludeCredentials: existingCredentials.map((c) => ({
      id: c.id,
      type: 'public-key' as const,
    })),
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
    },
  })

  await supabase.from('webauthn_challenges').insert({
    user_id: userId,
    challenge: options.challenge,
  })

  // Prune stale challenges
  await supabase
    .from('webauthn_challenges')
    .delete()
    .eq('user_id', userId)
    .lt('created_at', new Date(Date.now() - CHALLENGE_TTL_SECONDS * 1000).toISOString())

  return new Response(JSON.stringify({ options }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
