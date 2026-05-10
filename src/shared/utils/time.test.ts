import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatRelativeTime } from './time'

describe('formatRelativeTime', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns "à l\'instant" for under 1 minute ago', () => {
    vi.setSystemTime(new Date('2026-05-10T10:00:30Z'))
    expect(formatRelativeTime('2026-05-10T10:00:00Z')).toBe("à l'instant")
  })

  it('returns minutes for under 1 hour ago', () => {
    vi.setSystemTime(new Date('2026-05-10T10:45:00Z'))
    expect(formatRelativeTime('2026-05-10T10:00:00Z')).toBe('il y a 45 min')
  })

  it('returns hours for under 24 hours ago', () => {
    vi.setSystemTime(new Date('2026-05-10T16:00:00Z'))
    expect(formatRelativeTime('2026-05-10T10:00:00Z')).toBe('il y a 6h')
  })

  it('returns days for 24+ hours ago', () => {
    vi.setSystemTime(new Date('2026-05-12T10:00:00Z'))
    expect(formatRelativeTime('2026-05-10T10:00:00Z')).toBe('il y a 2j')
  })
})
