import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error: err }) => {
      if (err || !data.session) {
        setError(err?.message ?? 'Session invalide')
        return
      }
      // WebAuthn registration prompt injected in Task 6
      navigate('/patients', { replace: true })
    })
  }, [navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Connexion en cours…</p>
    </div>
  )
}
