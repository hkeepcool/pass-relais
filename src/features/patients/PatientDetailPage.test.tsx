import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PatientDetailPage } from './PatientDetailPage'

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'u1' } }, state: 'authenticated', signOut: vi.fn() }),
}))

const mockSave = vi.fn().mockResolvedValue(undefined)
vi.mock('./useSaveObservation', () => ({
  useSaveObservation: () => ({ save: mockSave, isSaving: false }),
}))

vi.mock('../../shared/hooks/useTranscription', () => ({
  useTranscription: () => ({
    state: 'unsupported', transcript: '', duration: 0,
    start: vi.fn(), stop: vi.fn(), reset: vi.fn(),
  }),
}))

vi.mock('../../shared/hooks/transcription/WebSpeechAdapter', () => ({
  WebSpeechAdapter: vi.fn().mockImplementation(() => ({
    isSupported: () => false, start: vi.fn(), stop: vi.fn(),
  })),
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/patients/p1']}>
      <Routes>
        <Route path="/patients/:id" element={<PatientDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PatientDetailPage', () => {
  beforeEach(() => { vi.clearAllMocks(); mockSave.mockResolvedValue(undefined) })

  it('renders all four Quick-Tap radiogroups', () => {
    renderPage()
    expect(screen.getByRole('radiogroup', { name: /sommeil/i })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /appétit/i })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /douleur/i })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /humeur/i })).toBeInTheDocument()
  })

  it('submit button is disabled before any selection', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled()
  })

  it('enables submit button after selecting a sleep value', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('radio', { name: /reposé/i }))
    expect(screen.getByRole('button', { name: /enregistrer/i })).not.toBeDisabled()
  })

  it('calls save() with selected fields on submit', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('radio', { name: /reposé/i }))
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ sleep: 'rested' }),
    )
  })

  it('deselects a value when the same button is clicked again', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('radio', { name: /reposé/i }))
    await userEvent.click(screen.getByRole('radio', { name: /reposé/i }))
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled()
  })
})
