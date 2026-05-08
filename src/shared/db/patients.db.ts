import { getDb, type Patient } from './schema'

export async function upsertPatient(patient: Patient): Promise<void> {
  const db = await getDb()
  await db.put('patients', patient)
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  const db = await getDb()
  return db.get('patients', id)
}

export async function getAllPatients(): Promise<Patient[]> {
  const db = await getDb()
  return db.getAll('patients')
}
