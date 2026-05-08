import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { saveSession, getSession, clearSession, isSessionValid } from '../../shared/db/session-cache.db'

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

export function useAuth() {
  const [state, setState] = useState<AuthState>('loading')
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session && !cancelled) {
        setSession(data.session)
        setState('authenticated')
        await saveSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at ?? 0,
        })
        return
      }
      const cached = await getSession()
      if (cached && isSessionValid(cached) && !cancelled) {
        setState('authenticated')
        return
      }
      if (!cancelled) setState('unauthenticated')
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (s) {
        setSession(s)
        setState('authenticated')
        await saveSession({
          access_token: s.access_token,
          refresh_token: s.refresh_token,
          expires_at: s.expires_at ?? 0,
        })
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setState('unauthenticated')
        await clearSession()
      }
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    await clearSession()
  }

  return { state, session, signOut }
}
