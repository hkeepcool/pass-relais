import { describe, it, expect, beforeEach } from 'vitest'
import { resetDbForTests } from './schema'
import { upsertPatient, getPatient, getAllPatients } from './patients.db'

const patient = {
  id: 'p1',
  full_name: 'Alice Dupont',
  birth_date: '1960-05-12',
  care_level: 'standard',
  created_by: 'u1',
  created_at: '2026-05-07T00:00:00Z',
  updated_at: '2026-05-07T00:00:00Z',
}

describe('patients.db', () => {
  beforeEach(async () => await resetDbForTests())

  it('upserts and retrieves a patient', async () => {
    await upsertPatient(patient)
    const result = await getPatient('p1')
    expect(result?.full_name).toBe('Alice Dupont')
  })

  it('getAllPatients returns all stored patients', async () => {
    await upsertPatient(patient)
    await upsertPatient({ ...patient, id: 'p2', full_name: 'Bob Martin' })
    const all = await getAllPatients()
    expect(all).toHaveLength(2)
  })

  it('upsert overwrites existing patient', async () => {
    await upsertPatient(patient)
    await upsertPatient({ ...patient, full_name: 'Alice Renommée' })
    const result = await getPatient('p1')
    expect(result?.full_name).toBe('Alice Renommée')
  })
})
