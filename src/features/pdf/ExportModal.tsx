import { useState, useEffect } from 'react'
import { getObservationsByPatient } from '../../shared/db/observations.db'
import { getAllPatients } from '../../shared/db/patients.db'
import { usePdfExport } from './usePdfExport'
import { windowStart } from './pdfUtils'
import type { ShiftWindow } from './pdfUtils'

type PresetHours = 8 | 10 | 12 | 24
const PRESETS: PresetHours[] = [8, 10, 12, 24]

export interface ExportModalProps {
  type:       'patient' | 'tour'
  patientId?: string
  onClose:    () => void
}

export function ExportModal({ type, patientId, onClose }: ExportModalProps) {
  const [preset,      setPreset]      = useState<PresetHours>(12)
  const [useCustom,   setUseCustom]   = useState(false)
  const [customSince, setCustomSince] = useState('')
  const [obsCount,    setObsCount]    = useState<number | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const { generate, isGenerating }    = usePdfExport(type, patientId)

  const currentWindow: ShiftWindow = useCustom && customSince
    ? { since: new Date(customSince) }
    : { preset }

  useEffect(() => {
    let cancelled = false
    if (useCustom && !customSince) { setObsCount(null); return }

    const since = windowStart(currentWindow)

    const count = async () => {
      if (type === 'patient' && patientId) {
        const obs = await getObservationsByPatient(patientId)
        if (!cancelled)
          setObsCount(obs.filter(o => new Date(o.recorded_at) >= since).length)
      } else {
        const patients = await getAllPatients()
        const counts   = await Promise.all(
          patients.map(p =>
            getObservationsByPatient(p.id).then(obs =>
              obs.filter(o => new Date(o.recorded_at) >= since).length,
            ),
          ),
        )
        if (!cancelled) setObsCount(counts.reduce((a, b) => a + b, 0))
      }
    }

    setObsCount(null)
    void count()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, useCustom, customSince, type, patientId])

  const isReady = obsCount !== null && obsCount > 0

  async function handleGenerate() {
    try {
      await generate(currentWindow)
      onClose()
    } catch {
      setError('Erreur lors de la génération du PDF')
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={isGenerating ? undefined : onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl px-5 py-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            {type === 'patient' ? 'Exporter la transmission' : 'Rapport de garde'}
          </h2>
          <button
            type="button"
            aria-label="Fermer"
            className="text-ink-mute hover:text-ink p-1"
            onClick={onClose}
            disabled={isGenerating}
          >
            ✕
          </button>
        </div>

        {/* Preset buttons */}
        <div>
          <p className="text-xs text-ink-mute mb-2 font-medium">Fenêtre de garde</p>
          <div className="flex gap-2">
            {PRESETS.map(h => (
              <button
                key={h}
                type="button"
                onClick={() => { setPreset(h); setUseCustom(false) }}
                className={[
                  'flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors',
                  !useCustom && preset === h
                    ? 'bg-accent border-accent text-white'
                    : 'bg-surface-2 border-line text-ink-mute',
                ].join(' ')}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {/* Custom datetime */}
        <div>
          <button
            type="button"
            onClick={() => setUseCustom(v => !v)}
            className="text-sm text-accent underline"
          >
            {useCustom ? '← Utiliser un preset' : 'Heure de début personnalisée'}
          </button>
          {useCustom && (
            <input
              type="datetime-local"
              value={customSince}
              onChange={e => setCustomSince(e.target.value)}
              className="mt-2 w-full bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm text-ink"
            />
          )}
        </div>

        {/* Count feedback */}
        {obsCount === null && (
          <p className="text-xs text-ink-mute">Calcul en cours…</p>
        )}
        {obsCount !== null && obsCount === 0 && (
          <p className="text-xs text-status-warn">
            Aucune observation sur cette période
          </p>
        )}
        {obsCount !== null && obsCount > 0 && (
          <p className="text-xs text-ink-mute">
            {obsCount} observation{obsCount !== 1 ? 's' : ''} dans la fenêtre
          </p>
        )}

        {/* Error */}
        {error && <p className="text-xs text-status-alert">{error}</p>}

        {/* Generate button */}
        <button
          type="button"
          disabled={!isReady || isGenerating}
          onClick={handleGenerate}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-accent text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {isGenerating ? 'Génération…' : 'Générer'}
        </button>
      </div>
    </>
  )
}
