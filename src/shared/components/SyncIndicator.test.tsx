import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAppStore } from '../../lib/store'
import { SyncIndicator } from './SyncIndicator'

describe('SyncIndicator', () => {
  beforeEach(() => useAppStore.setState({ isOnline: true, syncQueue: [], conflicts: [] }))

  it('shows green indicator when online and queue empty', () => {
    render(<SyncIndicator />)
    expect(screen.getByRole('status')).toHaveClass('bg-green-500')
  })

  it('shows orange indicator with count when offline with queued items', () => {
    useAppStore.setState({
      isOnline: false,
      syncQueue: [{ id: '1', operation: 'INSERT', table: 'observations', payload: {}, created_at: 1, retries: 0 }],
    })
    render(<SyncIndicator />)
    expect(screen.getByRole('status')).toHaveClass('bg-orange-400')
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows red indicator when conflicts exist', () => {
    useAppStore.setState({ conflicts: [{ patientName: 'Alice', table: 'observations', id: 'x' }] })
    render(<SyncIndicator />)
    expect(screen.getByRole('status')).toHaveClass('bg-red-500')
  })
})
