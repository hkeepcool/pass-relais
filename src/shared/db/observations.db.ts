import { getDb, type Observation } from './schema'

export async function upsertObservation(observation: Observation): Promise<void> {
  const db = await getDb()
  await db.put('observations', observation)
}

export async function getObservationsByPatient(patientId: string): Promise<Observation[]> {
  const db = await getDb()
  return db.getAllFromIndex('observations', 'patient_id', patientId)
}
