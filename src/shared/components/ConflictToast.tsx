import { useAppStore } from '../../lib/store'

export function ConflictToast() {
  const conflicts     = useAppStore((s) => s.conflicts)
  const clearConflict = useAppStore((s) => s.clearConflict)

  if (conflicts.length === 0) return null

  const first = conflicts[0]!
  const message =
    conflicts.length === 1
      ? `Conflit détecté — données de ${first.patientName} mises à jour par un autre soignant.`
      : `${conflicts.length} conflits détectés — données de ${first.patientName} et d'autres mises à jour par d'autres soignants.`

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 z-50 flex items-start gap-3 rounded-xl bg-surface border border-status-alert px-4 py-3 shadow-lg"
    >
      <span className="text-status-alert mt-0.5 shrink-0" aria-hidden="true">⚠</span>
      <p className="flex-1 text-sm text-ink leading-relaxed">{message}</p>
      <button
        type="button"
        aria-label="Ignorer le conflit"
        onClick={() => clearConflict(first.id)}
        className="text-sm font-semibold text-accent shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        OK
      </button>
    </div>
  )
}
