import type { Observation } from '../db/schema'
import type { StatusTone } from '../../design-system'
import { colorToTone } from './status'

const SLEEP_LABELS: Record<NonNullable<Observation['sleep']>, string> = {
  rested:   'Sommeil reposé',
  agitated: 'Sommeil agité',
  insomnia: 'Insomnie signalée',
}
const APPETITE_LABELS: Record<NonNullable<Observation['appetite']>, string> = {
  normal:  'Appétit normal',
  low:     'Appétit faible',
  refused: 'Alimentation refusée',
}
const MOOD_LABELS: Record<NonNullable<Observation['mood']>, string> = {
  stable:   'Humeur stable',
  confused: 'État confusionnel',
  anxious:  'Anxiété observée',
}

export function summarizeObservations(
  observations: Observation[],
): { text: string; tone: StatusTone } {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const recent = observations.filter((o) => o.recorded_at >= cutoff)

  if (recent.length === 0) {
    return { text: 'Aucune observation dans les dernières 24h.', tone: 'info' }
  }

  const sorted         = [...recent].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
  const latestSleep    = sorted.find((o) => o.sleep    != null)?.sleep    ?? null
  const latestAppetite = sorted.find((o) => o.appetite != null)?.appetite ?? null
  const latestPain     = sorted.find((o) => o.pain     != null)?.pain     ?? null
  const latestMood     = sorted.find((o) => o.mood     != null)?.mood     ?? null

  const parts: string[] = []
  if (latestSleep != null)    parts.push(SLEEP_LABELS[latestSleep])
  if (latestAppetite != null) parts.push(APPETITE_LABELS[latestAppetite])
  if (latestPain != null)     parts.push(`Douleur ${latestPain}/5`)
  if (latestMood != null)     parts.push(MOOD_LABELS[latestMood])

  const worstColor = recent.reduce<'red' | 'orange' | 'green'>((worst, o) => {
    if (o.status_color === 'red') return 'red'
    if (o.status_color === 'orange' && worst !== 'red') return 'orange'
    return worst
  }, 'green')

  return {
    text: parts.length > 0 ? parts.join('. ') + '.' : 'Aucune donnée significative.',
    tone: colorToTone(worstColor),
  }
}
