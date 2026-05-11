import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConflictToast } from './ConflictToast'
import { useAppStore } from '../../lib/store'

const c1 = { id: 'c1', patientName: 'Mme Dupont', table: 'observations' }
const c2 = { id: 'c2', patientName: 'M. Martin',  table: 'observations' }

beforeEach(() => {
  useAppStore.setState({ isOnline: true, syncQueue: [], conflicts: [] })
})

describe('ConflictToast', () => {
  it('renders nothing when there are no conflicts', () => {
    const { container } = render(<ConflictToast />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders an alert with the patient name when one conflict exists', () => {
    useAppStore.setState({ conflicts: [c1] })
    render(<ConflictToast />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/Mme Dupont/)).toBeInTheDocument()
  })

  it('renders a count message when multiple conflicts exist', () => {
    useAppStore.setState({ conflicts: [c1, c2] })
    render(<ConflictToast />)
    expect(screen.getByText(/2 conflits/)).toBeInTheDocument()
    expect(screen.getByText(/Mme Dupont/)).toBeInTheDocument()
  })

  it('removes the first conflict from the store when OK is tapped', async () => {
    useAppStore.setState({ conflicts: [c1] })
    render(<ConflictToast />)
    await userEvent.click(screen.getByRole('button', { name: /ok/i }))
    expect(useAppStore.getState().conflicts).toHaveLength(0)
  })

  it('removes only the first conflict when multiple exist and OK is tapped', async () => {
    useAppStore.setState({ conflicts: [c1, c2] })
    render(<ConflictToast />)
    await userEvent.click(screen.getByRole('button', { name: /ok/i }))
    const remaining = useAppStore.getState().conflicts
    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.id).toBe('c2')
  })
})
