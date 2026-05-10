import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePatients } from './usePatients'
import { resetDbForTests } from '../../shared/db/schema'
import { upsertPatient } from '../../shared/db/patients.db'
import { upsertObservation } from '../../shared/db/observations.db'
import * as patientsDb from '../../shared/db/patients.db'

const mkPatient = (id: string, full_name: string) => ({
  id,
  full_name,
  birth_date: null,
  care_level: 'standard',
  created_by: 'u1',
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
})

const mkObservation = (
  id: string,
  patient_id: string,
  status_color: 'green' | 'orange' | 'red',
  recorded_at: string,
) => ({
  id,
  patient_id,
  caregiver_id: 'u1',
  recorded_at,
  sleep: null,
  appetite: null,
  pain: null,
  mood: null,
  note_text: null,
  note_audio_url: null,
  status_color,
  updated_at: recorded_at,
})

describe('usePatients', () => {
  beforeEach(async () => await resetDbForTests())

  it('returns patients sorted red → orange → green', async () => {
    await upsertPatient(mkPatient('p1', 'Alice'))
    await upsertPatient(mkPatient('p2', 'Bob'))
    await upsertPatient(mkPatient('p3', 'Carol'))
    await upsertObservation(mkObservation('o1', 'p1', 'green', '2026-05-10T08:00:00Z'))
    await upsertObservation(mkObservation('o2', 'p2', 'red', '2026-05-10T09:00:00Z'))
    await upsertObservation(mkObservation('o3', 'p3', 'orange', '2026-05-10T10:00:00Z'))

    const { result } = renderHook(() => usePatients())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.patients[0].full_name).toBe('Bob')
    expect(result.current.patients[1].full_name).toBe('Carol')
    expect(result.current.patients[2].full_name).toBe('Alice')
    expect(result.current.error).toBeNull()
  })

  it('returns empty array with no error when no patients exist', async () => {
    const { result } = renderHook(() => usePatients())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.patients).toHaveLength(0)
    expect(result.current.error).toBeNull()
  })

  it('returns error state when getAllPatients throws', async () => {
    const spy = vi.spyOn(patientsDb, 'getAllPatients').mockRejectedValue(new Error('db failure'))
    const { result } = renderHook(() => usePatients())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error?.message).toBe('db failure')
    expect(result.current.patients).toHaveLength(0)
    spy.mockRestore()
  })
})
