import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSaveObservation } from './useSaveObservation'
import { resetDbForTests } from '../../shared/db/schema'
import { getObservationsByPatient } from '../../shared/db/observations.db'
import { getAllQueuedItems } from '../../shared/db/sync-queue.db'

vi.mock('../../shared/sync/flush', () => ({
  flushQueue: vi.fn().mockResolvedValue(undefined),
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
)

const fields = {
  sleep:          'agitated' as const,
  appetite:       'low'      as const,
  pain:           5          as const,
  mood:           'stable'   as const,
  note_text:      null,
  note_audio_url: null,
}

describe('useSaveObservation', () => {
  beforeEach(async () => {
    await resetDbForTests()
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
  })

  it('writes observation to IndexedDB with derived status_color', async () => {
    const { result } = renderHook(() => useSaveObservation('p1', 'u1'), { wrapper })
    await act(async () => { await result.current.save(fields) })

    const obs = await getObservationsByPatient('p1')
    expect(obs).toHaveLength(1)
    expect(obs[0]?.status_color).toBe('red')   // pain === 5 → red
    expect(obs[0]?.sleep).toBe('agitated')
    expect(obs[0]?.patient_id).toBe('p1')
    expect(obs[0]?.caregiver_id).toBe('u1')
  })

  it('enqueues the observation for sync', async () => {
    const { result } = renderHook(() => useSaveObservation('p1', 'u1'), { wrapper })
    await act(async () => { await result.current.save(fields) })

    const queued = await getAllQueuedItems()
    expect(queued).toHaveLength(1)
    expect(queued[0]?.table).toBe('observations')
    expect(queued[0]?.operation).toBe('INSERT')
  })

  it('sets isSaving to false after completion', async () => {
    const { result } = renderHook(() => useSaveObservation('p1', 'u1'), { wrapper })
    await act(async () => { await result.current.save(fields) })
    expect(result.current.isSaving).toBe(false)
  })

  it('derives green status_color for a benign observation', async () => {
    const { result } = renderHook(() => useSaveObservation('p1', 'u1'), { wrapper })
    await act(async () => {
      await result.current.save({ ...fields, pain: 2, mood: 'stable' })
    })
    const obs = await getObservationsByPatient('p1')
    expect(obs[0]?.status_color).toBe('green')
  })
})
