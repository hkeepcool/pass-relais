import { useCallback, useEffect, useState } from 'react'
import { getAllPatients } from '../../shared/db/patients.db'
import { getLatestObservationByPatientId } from '../../shared/db/observations.db'
import type { Patient } from '../../shared/db/schema'
import type { StatusTone } from '../../design-system'

export interface PatientWithStatus extends Patient {
  statusTone: StatusTone
  latestObservationAt: string | null
}

const STATUS_ORDER: Record<StatusTone, number> = { alert: 0, warn: 1, ok: 2, info: 3 }

function colorToTone(color: 'red' | 'orange' | 'green' | null | undefined): StatusTone {
  if (color === 'red') return 'alert'
  if (color === 'orange') return 'warn'
  if (color === 'green') return 'ok'
  return 'info'
}

export function usePatients() {
  const [patients, setPatients] = useState<PatientWithStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      const raw = await getAllPatients()
      const enriched = await Promise.all(
        raw.map(async (p) => {
          const latest = await getLatestObservationByPatientId(p.id)
          return {
            ...p,
            statusTone: colorToTone(latest?.status_color),
            latestObservationAt: latest?.recorded_at ?? null,
          }
        }),
      )
      enriched.sort((a, b) => STATUS_ORDER[a.statusTone] - STATUS_ORDER[b.statusTone])
      setPatients(enriched)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    window.addEventListener('focus', load)
    window.addEventListener('sync:complete', load)
    return () => {
      window.removeEventListener('focus', load)
      window.removeEventListener('sync:complete', load)
    }
  }, [load])

  return { patients, isLoading, error, reload: load }
}
