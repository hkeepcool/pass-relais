import { getDb, type Observation } from './schema'

export async function upsertObservation(observation: Observation): Promise<void> {
  const db = await getDb()
  await db.put('observations', observation)
}

export async function getObservationsByPatient(patientId: string): Promise<Observation[]> {
  const db = await getDb()
  return db.getAllFromIndex('observations', 'patient_id', patientId)
}

export async function getLatestObservationByPatientId(patientId: string): Promise<Observation | undefined> {
  const db = await getDb()
  const all = await db.getAllFromIndex('observations', 'patient_id', patientId)
  if (all.length === 0) return undefined
  return all.sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0]
}
