import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeedEntry } from './FeedEntry'

describe('FeedEntry', () => {
  it('renders a single-line timestamp', () => {
    render(
      <FeedEntry
        timestamp="13:08"
        authorName="Alice Dupont"
        authorInitials="AD"
        text="Patient calme ce matin"
      />
    )
    expect(screen.getByText('13:08')).toBeInTheDocument()
  })

  it('applies whitespace-pre-line so multi-line timestamps render both parts', () => {
    const { container } = render(
      <FeedEntry
        timestamp={"14/05\n13:08"}
        authorName="Alice Dupont"
        authorInitials="AD"
        text="Patient calme ce matin"
      />
    )
    const el = container.querySelector('[class*="whitespace-pre-line"]')
    expect(el).toBeInTheDocument()
    expect(el?.textContent).toContain('14/05')
    expect(el?.textContent).toContain('13:08')
  })
})
