import { describe, it, expect } from 'vitest'
import { summarizeObservations } from './summarize'
import type { Observation } from '../db/schema'

const now = new Date().toISOString()
const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()

const mkObs = (overrides: Partial<Observation> = {}): Observation => ({
  id: 'o1', patient_id: 'p1', caregiver_id: 'u1',
  recorded_at: now, updated_at: now,
  sleep: 'rested', appetite: 'normal', pain: 1, mood: 'stable',
  note_text: null, note_audio_url: null, status_color: 'green',
  ...overrides,
})

describe('summarizeObservations', () => {
  it('returns info + no-data message for empty array', () => {
    const r = summarizeObservations([])
    expect(r.tone).toBe('info')
    expect(r.text).toMatch(/aucune observation/i)
  })

  it('returns info for observations older than 24h', () => {
    const r = summarizeObservations([mkObs({ recorded_at: old })])
    expect(r.tone).toBe('info')
    expect(r.text).toMatch(/aucune observation/i)
  })

  it('returns alert tone when any observation is red', () => {
    const r = summarizeObservations([mkObs({ status_color: 'red' })])
    expect(r.tone).toBe('alert')
  })

  it('returns warn tone when worst is orange (not red)', () => {
    const r = summarizeObservations([
      mkObs({ status_color: 'green' }),
      mkObs({ id: 'o2', status_color: 'orange' }),
    ])
    expect(r.tone).toBe('warn')
  })

  it('returns ok tone when all observations are green', () => {
    const r = summarizeObservations([mkObs({ status_color: 'green' })])
    expect(r.tone).toBe('ok')
  })

  it('includes insomnia label in text', () => {
    const r = summarizeObservations([mkObs({ sleep: 'insomnia' })])
    expect(r.text).toMatch(/insomnie/i)
  })

  it('includes pain level in text', () => {
    const r = summarizeObservations([mkObs({ pain: 4 })])
    expect(r.text).toMatch(/douleur 4\/5/i)
  })

  it('includes pain 1/5 in text', () => {
    const r = summarizeObservations([mkObs({ pain: 1 })])
    expect(r.text).toMatch(/douleur 1\/5/i)
  })

  it('uses most-recent value when multiple observations exist', () => {
    const earlier = mkObs({ id: 'o1', recorded_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), sleep: 'agitated' })
    const latest  = mkObs({ id: 'o2', recorded_at: now, sleep: 'rested' })
    const r = summarizeObservations([earlier, latest])
    expect(r.text).toMatch(/sommeil reposé/i)
    expect(r.text).not.toMatch(/agité/i)
  })
})
