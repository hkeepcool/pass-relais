import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { state } = useAuth()

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Chargement…</p>
      </div>
    )
  }

  if (state === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
