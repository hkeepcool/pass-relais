import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetDbForTests } from '../../shared/db/schema'
import { upsertPatient } from '../../shared/db/patients.db'
import { upsertObservation } from '../../shared/db/observations.db'
import type { Patient, Observation } from '../../shared/db/schema'

const mockGenerate = vi.fn().mockResolvedValue(undefined)
vi.mock('./usePdfExport', () => ({
  usePdfExport: vi.fn(() => ({ generate: mockGenerate, isGenerating: false })),
}))

import { ExportModal } from './ExportModal'

const mkPatient = (id: string): Patient => ({
  id, full_name: 'Test Patient', birth_date: null, care_level: 'standard',
  created_by: 'u1', created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z',
})

const mkObs = (id: string, patientId: string, hoursAgo: number): Observation => ({
  id, patient_id: patientId, caregiver_id: 'u1',
  recorded_at: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
  updated_at: new Date().toISOString(),
  sleep: 'rested', appetite: 'normal', pain: 1, mood: 'stable',
  bowel_movements: null, bowel_note: null,
  note_text: null, note_audio_url: null,
  status_color: 'green',
})

describe('ExportModal — patient type', () => {
  const onClose = vi.fn()

  beforeEach(async () => {
    await resetDbForTests()
    vi.clearAllMocks()
  })

  it('disables Générer and shows warning when no observations in window', async () => {
    await upsertPatient(mkPatient('p1'))
    await upsertObservation(mkObs('o1', 'p1', 30)) // 30h ago — outside all preset windows

    render(<ExportModal type="patient" patientId="p1" onClose={onClose} />)

    const btn = await screen.findByRole('button', { name: /générer/i })
    expect(btn).toBeDisabled()
    expect(await screen.findByText(/aucune observation/i)).toBeInTheDocument()
  })

  it('enables Générer when observations exist in the selected window', async () => {
    await upsertPatient(mkPatient('p1'))
    await upsertObservation(mkObs('o1', 'p1', 2)) // 2h ago — within default 12h preset

    render(<ExportModal type="patient" patientId="p1" onClose={onClose} />)

    const btn = await screen.findByRole('button', { name: /générer/i })
    await waitFor(() => expect(btn).not.toBeDisabled())
  })

  it('calls generate with the selected preset window and then onClose', async () => {
    await upsertPatient(mkPatient('p1'))
    await upsertObservation(mkObs('o1', 'p1', 2))

    render(<ExportModal type="patient" patientId="p1" onClose={onClose} />)

    const btn = await screen.findByRole('button', { name: /générer/i })
    await waitFor(() => expect(btn).not.toBeDisabled())
    await userEvent.click(btn)
    await waitFor(() => expect(mockGenerate).toHaveBeenCalledOnce())
    expect(mockGenerate).toHaveBeenCalledWith({ preset: 12 })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the × button is clicked', async () => {
    await upsertPatient(mkPatient('p1'))

    render(<ExportModal type="patient" patientId="p1" onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
