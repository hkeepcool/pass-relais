import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyncIndicator } from './SyncIndicator'
import { useAppStore } from '../../lib/store'

beforeEach(() => {
  useAppStore.setState({ isOnline: true, syncQueue: [], conflicts: [] })
})

describe('SyncIndicator', () => {
  it('shows bg-status-ok dot and En ligne label when online with empty queue', () => {
    render(<SyncIndicator />)
    expect(screen.getByRole('status')).toHaveClass('bg-status-ok')
    expect(screen.getByText('En ligne')).toBeInTheDocument()
  })

  it('shows bg-status-warn dot and Offline label when offline', () => {
    useAppStore.setState({ isOnline: false, syncQueue: [], conflicts: [] })
    render(<SyncIndicator />)
    expect(screen.getByRole('status')).toHaveClass('bg-status-warn')
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('shows queue count badge when offline with items queued', () => {
    useAppStore.setState({
      isOnline: false,
      syncQueue: [
        { id: '1', operation: 'INSERT', table: 'observations', payload: {}, created_at: 0, retries: 0 },
        { id: '2', operation: 'INSERT', table: 'observations', payload: {}, created_at: 0, retries: 0 },
      ],
      conflicts: [],
    })
    render(<SyncIndicator />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows warn dot but no badge when online with queue items (transient sync)', () => {
    useAppStore.setState({
      isOnline: true,
      syncQueue: [
        { id: '1', operation: 'INSERT', table: 'observations', payload: {}, created_at: 0, retries: 0 },
      ],
      conflicts: [],
    })
    render(<SyncIndicator />)
    expect(screen.getByRole('status')).toHaveClass('bg-status-warn')
    expect(screen.getByText('En ligne')).toBeInTheDocument()
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })

  it('shows bg-status-alert dot and Conflit label when conflicts exist', () => {
    useAppStore.setState({
      isOnline: true,
      syncQueue: [],
      conflicts: [{ id: 'c1', patientName: 'Mme Dupont', table: 'observations' }],
    })
    render(<SyncIndicator />)
    expect(screen.getByRole('status')).toHaveClass('bg-status-alert')
    expect(screen.getByText('Conflit')).toBeInTheDocument()
  })
})
