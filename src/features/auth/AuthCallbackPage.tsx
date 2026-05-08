import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { isWebAuthnSupported, registerWebAuthn } from './webauthn'

type Step = 'processing' | 'webauthn-prompt' | 'error'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('processing')
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data, error: err }) => {
      if (err || !data.session) {
        setError(err?.message ?? 'Session invalide')
        setStep('error')
        return
      }
      const uid = data.session.user.id
      setUserId(uid)

      const supported = await isWebAuthnSupported()
      const { data: profile } = await supabase
        .from('profiles')
        .select('webauthn_credentials')
        .eq('id', uid)
        .single()

      const hasCredential =
        Array.isArray(profile?.webauthn_credentials) &&
        profile.webauthn_credentials.length > 0

      if (supported && !hasCredential) {
        setStep('webauthn-prompt')
      } else {
        navigate('/patients', { replace: true })
      }
    })
  }, [navigate])

  const handleRegister = async () => {
    if (!userId) return
    const ok = await registerWebAuthn(userId)
    if (!ok) {
      setRegisterError("Échec de l'activation biométrique. Veuillez réessayer.")
      return
    }
    navigate('/patients', { replace: true })
  }

  if (step === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (step === 'webauthn-prompt') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h2 className="text-xl font-semibold">Activer la connexion biométrique ?</h2>
          <p className="text-gray-600">
            Utilisez votre empreinte ou Face ID pour vous connecter rapidement la prochaine fois.
          </p>
          {registerError && <p className="text-red-600 text-sm">{registerError}</p>}
          <button
            onClick={handleRegister}
            className="w-full rounded-lg bg-blue-600 py-3 text-lg font-medium text-white"
          >
            Activer
          </button>
          <button
            onClick={() => navigate('/patients', { replace: true })}
            className="w-full rounded-lg border py-3 text-lg text-gray-600"
          >
            Plus tard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Connexion en cours…</p>
    </div>
  )
}
