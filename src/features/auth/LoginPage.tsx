// src/features/auth/LoginPage.tsx
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../design-system'

export function LoginPage() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const sendOtp = async () => {
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (err) setError(err.message)
    else setSent(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendOtp()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="flex w-full max-w-sm flex-col items-center">
        <span className="font-mono text-[10px] font-bold text-accent tracking-widest mb-1">
          PASS·RELAIS
        </span>
        <p className="text-xs text-ink-mute tracking-wide mb-6">
          Transmissions infirmières
        </p>

        <div className="w-full bg-surface border border-line rounded-2xl p-6">
          {sent ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-4xl" aria-hidden="true">✉️</span>
              <h1 className="font-display text-xl font-semibold text-ink">
                Vérifiez votre email
              </h1>
              <p className="text-sm text-ink-2 leading-relaxed">
                Un lien de connexion a été envoyé à{' '}
                <span className="text-accent font-semibold">{email}</span>.
              </p>
              <div className="w-full border-t border-line my-1" />
              <button
                type="button"
                onClick={sendOtp}
                disabled={loading}
                className="text-xs text-ink-mute underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-45 disabled:cursor-not-allowed"
              >
                Renvoyer le lien
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h1 className="font-display text-xl font-semibold text-ink">Connexion</h1>
                <p className="mt-1 text-sm text-ink-2">
                  Entrez votre email pour vous connecter.
                </p>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                aria-label="Adresse email"
                className="w-full rounded-xl bg-bg border border-line px-4 py-3 text-base text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-bg"
              />
              {error && (
                <p className="text-sm text-status-alert">{error}</p>
              )}
              <Button
                type="submit"
                variant="accent"
                size="lg"
                fullWidth
                loading={loading}
              >
                Recevoir le lien
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
