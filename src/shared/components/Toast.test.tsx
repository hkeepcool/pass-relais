import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAppStore } from '../../lib/store'
import { Toast } from './Toast'

describe('Toast', () => {
  beforeEach(() => useAppStore.setState({ conflicts: [] }))

  it('renders nothing when no conflicts', () => {
    const { container } = render(<Toast />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders conflict message and dismiss button', () => {
    useAppStore.setState({
      conflicts: [{ patientName: 'Alice', table: 'observations', id: 'c1' }],
    })
    render(<Toast />)
    expect(screen.getByText(/conflit/i)).toBeInTheDocument()
    expect(screen.getByText(/alice/i)).toBeInTheDocument()
  })

  it('clears conflict on dismiss', async () => {
    useAppStore.setState({
      conflicts: [{ patientName: 'Bob', table: 'observations', id: 'c2' }],
    })
    render(<Toast />)
    await userEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(useAppStore.getState().conflicts).toHaveLength(0)
  })
})
