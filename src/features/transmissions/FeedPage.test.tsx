import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { FeedPage } from './FeedPage'
import { resetDbForTests } from '../../shared/db/schema'
import { upsertPatient } from '../../shared/db/patients.db'
import { upsertObservation } from '../../shared/db/observations.db'

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'u1' } }, state: 'authenticated', signOut: vi.fn() }),
}))

const patient = {
  id: 'p1', full_name: 'Alice Dupont', birth_date: null,
  care_level: 'standard', created_by: 'u1',
  created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z',
}

const mkObs = (overrides: Record<string, unknown> = {}) => ({
  id: 'o1', patient_id: 'p1', caregiver_id: 'u1',
  recorded_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  sleep: 'rested' as const, appetite: 'normal' as const,
  pain: 1 as const, mood: 'stable' as const,
  note_text: null, note_audio_url: null, status_color: 'green' as const,
  ...overrides,
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/patients/p1/feed']}>
      <Routes>
        <Route path="/patients/:id/feed" element={<FeedPage />} />
        <Route path="/patients/:id"      element={<div>Detail Page</div>} />
        <Route path="/patients"          element={<div>List Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FeedPage', () => {
  beforeEach(async () => { vi.clearAllMocks(); await resetDbForTests() })

  it('shows empty state when no observations exist', async () => {
    await upsertPatient(patient)
    renderPage()
    expect(await screen.findByText(/aucune transmission/i)).toBeInTheDocument()
  })

  it('renders FeedEntry text that includes the note', async () => {
    await upsertPatient(patient)
    await upsertObservation(mkObs({ note_text: 'Patient calme ce matin' }))
    renderPage()
    expect(await screen.findByText(/patient calme ce matin/i)).toBeInTheDocument()
  })

  it('renders the summary card when observations exist', async () => {
    await upsertPatient(patient)
    await upsertObservation(mkObs())
    renderPage()
    expect(await screen.findByText(/résumé 24h/i)).toBeInTheDocument()
  })

  it('Incidents filter hides green observations and shows red ones', async () => {
    await upsertPatient(patient)
    await upsertObservation(mkObs({ id: 'o1', status_color: 'green',  note_text: 'Tout va bien'      }))
    await upsertObservation(mkObs({ id: 'o2', status_color: 'red', pain: 5, note_text: 'Urgence signalée' }))
    renderPage()
    await screen.findByText(/tout va bien/i)
    await userEvent.click(screen.getByRole('button', { name: /incidents/i }))
    expect(screen.queryByText(/tout va bien/i)).not.toBeInTheDocument()
    expect(screen.getByText(/urgence signalée/i)).toBeInTheDocument()
  })

  it('Notes filter shows only observations that have note_text', async () => {
    await upsertPatient(patient)
    await upsertObservation(mkObs({ id: 'o1', note_text: 'Note importante', sleep: null, appetite: null, pain: null, mood: null }))
    await upsertObservation(mkObs({ id: 'o2', note_text: null, sleep: 'agitated', appetite: null, pain: null, mood: null }))
    renderPage()
    await screen.findByText(/note importante/i)
    await userEvent.click(screen.getByRole('button', { name: /notes/i }))
    expect(screen.getByText(/note importante/i)).toBeInTheDocument()
    expect(screen.queryByText(/sommeil agité/i)).not.toBeInTheDocument()
  })
})
