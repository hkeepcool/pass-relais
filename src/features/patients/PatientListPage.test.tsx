import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { PatientListPage } from './PatientListPage'
import type { PatientWithStatus } from './usePatients'

vi.mock('./usePatients')
vi.mock('../../shared/components/SyncIndicator', () => ({
  SyncIndicator: () => null,
}))

import { usePatients } from './usePatients'
const mockUsePatients = vi.mocked(usePatients)

const mkPatient = (
  id: string,
  full_name: string,
  statusTone: PatientWithStatus['statusTone'],
): PatientWithStatus => ({
  id,
  full_name,
  birth_date: null,
  care_level: 'standard',
  created_by: 'u1',
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
  statusTone,
  latestObservationAt: '2026-05-10T09:00:00Z',
})

function renderPage() {
  return render(
    <MemoryRouter>
      <PatientListPage />
    </MemoryRouter>,
  )
}

describe('PatientListPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows 3 skeleton cards while loading', () => {
    mockUsePatients.mockReturnValue({ patients: [], isLoading: true, error: null, reload: vi.fn() })
    renderPage()
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3)
  })

  it('renders a card per patient in the order provided by the hook', () => {
    mockUsePatients.mockReturnValue({
      patients: [
        mkPatient('p1', 'Bob Martin', 'alert'),
        mkPatient('p2', 'Carol Petit', 'warn'),
        mkPatient('p3', 'Alice Dupont', 'ok'),
      ],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    })
    renderPage()
    const names = screen.getAllByText(/bob martin|carol petit|alice dupont/i)
    expect(names[0].textContent).toMatch(/bob martin/i)
    expect(names[1].textContent).toMatch(/carol petit/i)
    expect(names[2].textContent).toMatch(/alice dupont/i)
  })

  it('shows empty state when patient list is empty', () => {
    mockUsePatients.mockReturnValue({ patients: [], isLoading: false, error: null, reload: vi.fn() })
    renderPage()
    expect(screen.getByText(/aucun patient enregistré/i)).toBeInTheDocument()
  })

  it('shows error message and retry button on error', async () => {
    const reload = vi.fn()
    mockUsePatients.mockReturnValue({ patients: [], isLoading: false, error: new Error('fail'), reload })
    renderPage()
    expect(screen.getByText(/impossible de charger les patients/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }))
    expect(reload).toHaveBeenCalledOnce()
  })
})
