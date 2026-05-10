import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { upsertObservation } from '../../shared/db/observations.db'
import { enqueueItem } from '../../shared/db/sync-queue.db'
import { flushQueue } from '../../shared/sync/flush'
import { deriveStatusColor } from '../../shared/utils/status'
import type { Observation } from '../../shared/db/schema'

export interface ObservationFields {
  sleep:          Observation['sleep']
  appetite:       Observation['appetite']
  pain:           Observation['pain']
  mood:           Observation['mood']
  note_text:      string | null
  note_audio_url: string | null
}

export function useSaveObservation(patientId: string, caregiverId: string) {
  const [isSaving, setIsSaving] = useState(false)
  const navigate = useNavigate()

  const save = useCallback(
    async (fields: ObservationFields) => {
      setIsSaving(true)
      try {
        const now = new Date().toISOString()
        const obs: Observation = {
          id:           crypto.randomUUID(),
          patient_id:   patientId,
          caregiver_id: caregiverId,
          recorded_at:  now,
          updated_at:   now,
          status_color: deriveStatusColor(fields),
          ...fields,
        }
        await upsertObservation(obs)
        await enqueueItem({
          operation: 'INSERT',
          table:     'observations',
          payload:   obs as unknown as Record<string, unknown>,
        })
        if (navigator.onLine) await flushQueue()
        navigate(`/patients/${patientId}/feed`)
      } finally {
        setIsSaving(false)
      }
    },
    [patientId, caregiverId, navigate],
  )

  return { save, isSaving }
}
