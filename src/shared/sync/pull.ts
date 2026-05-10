import { supabase } from '../../lib/supabase'
import { upsertPatient } from '../db/patients.db'
import { upsertObservation } from '../db/observations.db'
import type { Patient, Observation } from '../db/schema'

const OBSERVATION_WINDOW_DAYS = 30

export async function pullFromSupabase(): Promise<void> {
  const since = new Date(
    Date.now() - OBSERVATION_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  const [patientsResult, observationsResult] = await Promise.allSettled([
    supabase.from('patients').select('*'),
    supabase.from('observations').select('*').gte('recorded_at', since),
  ])

  if (patientsResult.status === 'fulfilled' && patientsResult.value.data) {
    await Promise.all(
      (patientsResult.value.data as Patient[]).map((p) => upsertPatient(p)),
    )
  }

  if (observationsResult.status === 'fulfilled' && observationsResult.value.data) {
    await Promise.all(
      (observationsResult.value.data as Observation[]).map((o) => upsertObservation(o)),
    )
  }
}
