import { useAppStore } from '../../lib/store'

export function Toast() {
  const conflicts = useAppStore((s) => s.conflicts)
  const clearConflict = useAppStore((s) => s.clearConflict)

  if (conflicts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 space-y-2">
      {conflicts.map((conflict) => (
        <div
          key={conflict.id}
          className="flex items-start justify-between gap-3 rounded-lg bg-red-50 border border-red-200 p-4 shadow"
        >
          <p className="text-sm text-red-800">
            <strong>Conflit détecté</strong> sur{' '}
            <span className="font-medium">{conflict.patientName}</span>. Une
            modification plus récente existe sur le serveur.
          </p>
          <button
            onClick={() => clearConflict(conflict.id)}
            aria-label="Fermer"
            className="shrink-0 text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
