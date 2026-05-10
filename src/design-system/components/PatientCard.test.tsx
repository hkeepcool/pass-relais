import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PatientCard } from './PatientCard'

const baseProps = {
  status: 'ok' as const,
  name: 'Alice Dupont',
  lastSeen: 'il y a 2h',
  onClick: vi.fn(),
}

describe('PatientCard', () => {
  it('renders info button when onInfoClick is provided', () => {
    render(<PatientCard {...baseProps} onInfoClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: /voir le dossier de alice dupont/i })).toBeInTheDocument()
  })

  it('calls onInfoClick when info button is clicked', async () => {
    const onInfoClick = vi.fn()
    render(<PatientCard {...baseProps} onInfoClick={onInfoClick} />)
    await userEvent.click(screen.getByRole('button', { name: /voir le dossier de alice dupont/i }))
    expect(onInfoClick).toHaveBeenCalledOnce()
  })

  it('does not call main onClick when info button is clicked', async () => {
    const onClick = vi.fn()
    const onInfoClick = vi.fn()
    render(<PatientCard {...baseProps} onClick={onClick} onInfoClick={onInfoClick} />)
    await userEvent.click(screen.getByRole('button', { name: /voir le dossier de alice dupont/i }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not render info button when onInfoClick is absent', () => {
    render(<PatientCard {...baseProps} />)
    expect(screen.queryByRole('button', { name: /voir le dossier/i })).toBeNull()
  })
})
