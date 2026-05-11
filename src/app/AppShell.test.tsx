import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'
import { useAppStore } from '../lib/store'

beforeEach(() => {
  useAppStore.setState({ isOnline: true, syncQueue: [], conflicts: [] })
})

describe('AppShell', () => {
  it('renders the PASS·RELAIS brand mark', () => {
    render(<AppShell><div>content</div></AppShell>)
    expect(screen.getByText('PASS·RELAIS')).toBeInTheDocument()
  })

  it('renders its children', () => {
    render(<AppShell><div>page content</div></AppShell>)
    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('renders the sync indicator dot', () => {
    render(<AppShell><div>content</div></AppShell>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders the conflict toast when conflicts exist', () => {
    useAppStore.setState({
      conflicts: [{ id: 'c1', patientName: 'Mme Dupont', table: 'observations' }],
    })
    render(<AppShell><div>content</div></AppShell>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders no alert when there are no conflicts', () => {
    render(<AppShell><div>content</div></AppShell>)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
