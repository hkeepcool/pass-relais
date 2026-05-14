import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { resetDbForTests } from '../../shared/db/schema'
import { upsertPatient } from '../../shared/db/patients.db'
import { upsertObservation } from '../../shared/db/observations.db'
import type { Patient, Observation } from '../../shared/db/schema'

vi.mock('@react-pdf/renderer', () => ({
  pdf: vi.fn(() => ({ toBlob: vi.fn().mockResolvedValue(new Blob(['%PDF'])) })),
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page:     ({ children }: { children: React.ReactNode }) => children,
  View:     ({ children }: { children: React.ReactNode }) => children,
  Text:     ({ children }: { children: React.ReactNode }) => children,
  StyleSheet: { create: (s: unknown) => s },
}))

vi.mock('./sharePdf', () => ({ sharePdf: vi.fn() }))

vi.mock('../auth/useAuth', () => ({
  useAuth: vi.fn(() => ({
    session: { user: { email: 'nurse@test.com', user_metadata: {}, id: 'u1' } },
    state: 'authenticated',
    signOut: vi.fn(),
  })),
}))

vi.mock('./PatientReportDocument', () => ({ PatientReportDocument: () => null }))
vi.mock('./TourReportDocument',    () => ({ TourReportDocument: () => null }))

import { usePdfExport } from './usePdfExport'
import { sharePdf } from './sharePdf'
import { pdf } from '@react-pdf/renderer'
import type { PatientSummary } from './TourReportDocument'

const mockSharePdf = vi.mocked(sharePdf)
const mockPdf      = vi.mocked(pdf)

const mkPatient = (id: string, name: string): Patient => ({
  id, full_name: name, birth_date: null, care_level: 'standard',
  created_by: 'u1', created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z',
})

const mkObs = (id: string, patientId: string, hoursAgo: number, overrides: Partial<Observation> = {}): Observation => ({
  id, patient_id: patientId, caregiver_id: 'u1',
  recorded_at: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
  updated_at: new Date().toISOString(),
  sleep: 'rested', appetite: 'normal', pain: 1, mood: 'stable',
  bowel_movements: null, bowel_note: null,
  note_text: null, note_audio_url: null,
  status_color: 'green',
  ...overrides,
})

describe('usePdfExport — patient type', () => {
  beforeEach(async () => {
    await resetDbForTests()
    vi.clearAllMocks()
    await upsertPatient(mkPatient('p1', 'Martin Dupont'))
    await upsertObservation(mkObs('o1', 'p1', 2))   // 2h ago — inside 8h window
    await upsertObservation(mkObs('o2', 'p1', 10))  // 10h ago — outside 8h window
  })

  it('calls pdf() once and sharePdf with a matching filename', async () => {
    const { result } = renderHook(() => usePdfExport('patient', 'p1'))
    await act(async () => { await result.current.generate({ preset: 8 }) })
    expect(mockPdf).toHaveBeenCalledOnce()
    expect(mockSharePdf).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/^transmission-martin-dupont-\d{4}-\d{2}-\d{2}\.pdf$/),
    )
  })

  it('passes only in-window observations to PatientReportDocument', async () => {
    const { result } = renderHook(() => usePdfExport('patient', 'p1'))
    await act(async () => { await result.current.generate({ preset: 8 }) })
    const docProps = mockPdf.mock.calls[0]![0]!.props as { observations: Observation[] }
    expect(docProps.observations).toHaveLength(1)
    expect(docProps.observations[0]!.id).toBe('o1')
  })

  it('accepts a custom since window', async () => {
    const since = new Date(Date.now() - 3 * 3_600_000) // 3h ago — only o1 qualifies
    const { result } = renderHook(() => usePdfExport('patient', 'p1'))
    await act(async () => { await result.current.generate({ since }) })
    const docProps = mockPdf.mock.calls[0]![0]!.props as { observations: Observation[] }
    expect(docProps.observations).toHaveLength(1)
  })

  it('isGenerating is false before and after generating', async () => {
    const { result } = renderHook(() => usePdfExport('patient', 'p1'))
    expect(result.current.isGenerating).toBe(false)
    await act(async () => { await result.current.generate({ preset: 8 }) })
    expect(result.current.isGenerating).toBe(false)
  })
})

describe('usePdfExport — tour type', () => {
  beforeEach(async () => {
    await resetDbForTests()
    vi.clearAllMocks()
    await upsertPatient(mkPatient('p1', 'Dupont Martin'))
    await upsertPatient(mkPatient('p2', 'Bernard Claire'))
    await upsertObservation(mkObs('o1', 'p1', 2))   // p1 has obs in 8h window
    await upsertObservation(mkObs('o2', 'p2', 20))  // p2 obs outside window
  })

  it('excludes patients with no observations in the window', async () => {
    const { result } = renderHook(() => usePdfExport('tour'))
    await act(async () => { await result.current.generate({ preset: 8 }) })
    const docProps = mockPdf.mock.calls[0]![0]!.props as { patientSummaries: PatientSummary[] }
    expect(docProps.patientSummaries).toHaveLength(1)
    expect(docProps.patientSummaries[0]!.patient.id).toBe('p1')
  })

  it('uses rapport-garde filename', async () => {
    const { result } = renderHook(() => usePdfExport('tour'))
    await act(async () => { await result.current.generate({ preset: 8 }) })
    expect(mockSharePdf).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/^rapport-garde-\d{4}-\d{2}-\d{2}\.pdf$/),
    )
  })
})
