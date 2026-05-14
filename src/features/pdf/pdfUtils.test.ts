import { describe, it, expect, vi, afterEach } from 'vitest'
import { windowStart, formatWindowLabel, toSlug, todayISO } from './pdfUtils'

describe('windowStart', () => {
  it('returns a date approximately N hours ago for preset', () => {
    const before = Date.now()
    const d = windowStart({ preset: 8 })
    const after = Date.now()
    const expected = before - 8 * 3_600_000
    expect(d.getTime()).toBeGreaterThanOrEqual(expected - 50)
    expect(d.getTime()).toBeLessThanOrEqual(after - 8 * 3_600_000 + 50)
  })

  it('returns the exact date for since', () => {
    const since = new Date('2026-05-14T06:00:00Z')
    expect(windowStart({ since })).toBe(since)
  })
})

describe('toSlug', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(toSlug('Martin Dupont')).toBe('martin-dupont')
  })

  it('strips diacritics', () => {
    expect(toSlug('Élodie Léger')).toBe('elodie-leger')
  })

  it('removes non-alphanumeric characters', () => {
    expect(toSlug("O'Brien")).toBe('obrien')
  })

  it('returns empty string for empty input', () => {
    expect(toSlug('')).toBe('')
  })
})

describe('todayISO', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('formatWindowLabel', () => {
  afterEach(() => vi.useRealTimers())

  it('returns a string containing an arrow', () => {
    expect(formatWindowLabel({ preset: 12 })).toContain('→')
  })

  it('accepts a since window', () => {
    expect(formatWindowLabel({ since: new Date() })).toContain('→')
  })

  it('formats as "Garde HH:MM → HH:MM" for preset window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T14:30:00Z'))
    const label = formatWindowLabel({ preset: 8 })
    expect(label).toMatch(/^Garde \d{2}:\d{2} → \d{2}:\d{2}$/)
  })
})
