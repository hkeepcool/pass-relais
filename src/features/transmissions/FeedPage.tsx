import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FeedEntry, Button, Badge } from '../../design-system'
import { ExportModal } from '../pdf'
import type { FeedMetric } from '../../design-system'
import { getObservationsByPatient } from '../../shared/db/observations.db'
import { getPatient } from '../../shared/db/patients.db'
import { summarizeObservations } from '../../shared/utils/summarize'
import { colorToTone } from '../../shared/utils/status'
import { useAuth } from '../auth/useAuth'
import type { Observation } from '../../shared/db/schema'

type FilterKey = 'all' | 'incidents' | 'notes'

function buildText(obs: Observation): string {
  const parts: string[] = []
  if (obs.sleep === 'agitated')        parts.push('Sommeil agité')
  else if (obs.sleep === 'insomnia')   parts.push('Insomnie')
  else if (obs.sleep === 'rested')     parts.push('Sommeil reposé')
  if (obs.appetite === 'low')          parts.push('appétit faible')
  else if (obs.appetite === 'refused') parts.push('alimentation refusée')
  else if (obs.appetite === 'normal')  parts.push('appétit normal')
  if (obs.pain != null)                parts.push(`douleur ${obs.pain}/5`)
  if (obs.mood === 'confused')         parts.push('état confusionnel')
  else if (obs.mood === 'anxious')     parts.push('anxieux')
  if (obs.bowel_movements != null) {
    const label = obs.bowel_movements === 3 ? '3+ selles' : `${obs.bowel_movements} selle${obs.bowel_movements !== 1 ? 's' : ''}`
    parts.push(obs.bowel_note ? `${label} (${obs.bowel_note})` : label)
  }
  if (obs.note_text)                   parts.push(obs.note_text)
  return parts.length > 0 ? parts.join(', ') + '.' : 'Observation enregistrée.'
}

function buildMetrics(obs: Observation): FeedMetric[] {
  const m: FeedMetric[] = []
  if (obs.sleep           != null) m.push({ label: 'Sommeil', value: obs.sleep })
  if (obs.appetite        != null) m.push({ label: 'Appétit', value: obs.appetite })
  if (obs.pain            != null) m.push({ label: 'Douleur', value: `${obs.pain}/5` })
  if (obs.mood            != null) m.push({ label: 'Humeur',  value: obs.mood })
  if (obs.bowel_movements != null) m.push({ label: 'Selles',  value: obs.bowel_movements === 3 ? '3+' : String(obs.bowel_movements) })
  return m
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function initials(name: string): string {
  return name.split(' ').flatMap((w) => (w[0] ? [w[0]] : [])).slice(0, 2).join('').toUpperCase()
}

function applyFilter(obs: Observation[], filter: FilterKey): Observation[] {
  if (filter === 'incidents') return obs.filter((o) => o.status_color !== 'green')
  if (filter === 'notes')     return obs.filter((o) => o.note_text != null || o.note_audio_url != null)
  return obs
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: 'Tout' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'notes',     label: 'Notes' },
]

export function FeedPage() {
  const { id = '' }   = useParams<{ id: string }>()
  const navigate      = useNavigate()
  const { session }   = useAuth()
  const currentUserId = session?.user.id ?? ''

  const [observations, setObservations] = useState<Observation[]>([])
  const [patientName,  setPatientName]  = useState('')
  const [filter,       setFilter]       = useState<FilterKey>('all')
  const [isLoading,    setIsLoading]    = useState(true)
  const [exportOpen, setExportOpen] = useState(false)

  const load = useCallback(async () => {
    const [obs, patient] = await Promise.all([
      getObservationsByPatient(id),
      getPatient(id),
    ])
    return { obs, patient }
  }, [id])

  useEffect(() => {
    let ignored = false
    setIsLoading(true)

    load()
      .then(({ obs, patient }) => {
        if (!ignored) {
          setObservations([...obs].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)))
          setPatientName(patient?.full_name ?? '')
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!ignored) setIsLoading(false)
      })

    const onSync = () => {
      load()
        .then(({ obs, patient }) => {
          if (!ignored) {
            setObservations([...obs].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)))
            setPatientName(patient?.full_name ?? '')
          }
        })
        .catch(() => {})
    }

    window.addEventListener('sync:complete', onSync)
    return () => {
      ignored = true
      window.removeEventListener('sync:complete', onSync)
    }
  }, [load])

  const summary = useMemo(() => summarizeObservations(observations), [observations])
  const filtered = applyFilter(observations, filter)

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-line-soft">
        <Button variant="ghost" size="sm" onClick={() => navigate('/patients')}>
          ← Retour
        </Button>
        <h1 className="font-display text-xl font-semibold text-ink flex-1 truncate">
          {patientName}
        </h1>
        {!isLoading && (
          <Button variant="ghost" size="sm" onClick={() => setExportOpen(true)}>
            PDF
          </Button>
        )}
        <Button variant="accent" size="sm" onClick={() => navigate(`/patients/${id}`)}>
          + Obs.
        </Button>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Summary card — shown only in "all" view */}
        {filter === 'all' && observations.length > 0 && (
          <div className="bg-surface border border-line rounded-xl px-4 py-3 space-y-1.5">
            <Badge status={summary.tone} label="Résumé 24h" size="sm" />
            <p className="text-sm text-ink leading-relaxed">{summary.text}</p>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'accent' : 'secondary'}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-surface animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <p className="text-center py-8 text-ink-mute">
            Aucune transmission pour ce filtre.
          </p>
        )}

        {/* Feed entries */}
        {!isLoading && filtered.map((obs, idx) => {
          const authorName =
            obs.caregiver_id === currentUserId ? 'Vous' : obs.caregiver_id.slice(0, 8)
          return (
            <FeedEntry
              key={obs.id}
              timestamp={formatTime(obs.recorded_at)}
              authorName={authorName}
              authorInitials={initials(authorName)}
              text={buildText(obs)}
              status={colorToTone(obs.status_color)}
              tag={
                obs.status_color === 'red'
                  ? { label: 'Urgent',    status: 'alert' }
                  : obs.status_color === 'orange'
                  ? { label: 'Vigilance', status: 'warn'  }
                  : undefined
              }
              metrics={buildMetrics(obs)}
              isLast={idx === filtered.length - 1}
            />
          )
        })}
      </main>
      {exportOpen && (
        <ExportModal
          type="patient"
          patientId={id}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  )
}
