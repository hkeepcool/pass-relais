import { describe, it, expect, beforeEach } from 'vitest'
import { resetDbForTests } from './schema'
import { upsertObservation, getObservationsByPatient } from './observations.db'

const obs = {
  id: 'o1',
  patient_id: 'p1',
  caregiver_id: 'u1',
  recorded_at: '2026-05-07T08:00:00Z',
  sleep: 'rested' as const,
  appetite: 'normal' as const,
  pain: 2 as const,
  mood: 'stable' as const,
  note_text: null,
  note_audio_url: null,
  status_color: 'green' as const,
  updated_at: '2026-05-07T08:00:00Z',
}

describe('observations.db', () => {
  beforeEach(async () => await resetDbForTests())

  it('upserts and retrieves observations by patient', async () => {
    await upsertObservation(obs)
    const results = await getObservationsByPatient('p1')
    expect(results).toHaveLength(1)
    expect(results[0]?.sleep).toBe('rested')
  })

  it('returns empty array for unknown patient', async () => {
    const results = await getObservationsByPatient('unknown')
    expect(results).toHaveLength(0)
  })
})
