import { useNavigate } from 'react-router-dom'
import { usePatients } from './usePatients'
import { PatientCard } from '../../design-system'
import { SyncIndicator } from '../../shared/components/SyncIndicator'
import { formatRelativeTime } from '../../shared/utils/time'

export function PatientListPage() {
  const navigate = useNavigate()
  const { patients, isLoading, error, reload } = usePatients()

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <header className="flex items-center justify-between px-4 py-3 border-b border-line-soft">
        <h1 className="font-display text-xl font-semibold text-ink">Mes patients</h1>
        <SyncIndicator />
      </header>

      <main className="flex-1 px-4 py-4 space-y-3">
        {isLoading && (
          <>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                data-testid="skeleton"
                className="h-[76px] rounded-lg bg-surface animate-pulse"
              />
            ))}
          </>
        )}

        {!isLoading && error && (
          <div className="text-center py-8 text-ink-2">
            <p>Impossible de charger les patients</p>
            <button
              type="button"
              onClick={reload}
              className="mt-2 text-accent underline text-sm"
            >
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !error && patients.length === 0 && (
          <p className="text-center py-8 text-ink-mute">Aucun patient enregistré</p>
        )}

        {!isLoading && !error && patients.map((p) => (
          <PatientCard
            key={p.id}
            status={p.statusTone}
            name={p.full_name}
            lastSeen={p.latestObservationAt ? formatRelativeTime(p.latestObservationAt) : '—'}
            onClick={() => navigate(`/patients/${p.id}/feed`)}
            onInfoClick={() => navigate(`/patients/${p.id}`)}
          />
        ))}
      </main>
    </div>
  )
}
