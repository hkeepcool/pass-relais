import type { StatusTone } from '../../design-system'
import type { Observation } from '../db/schema'

export function colorToTone(color: 'red' | 'orange' | 'green' | null | undefined): StatusTone {
  if (color === 'red')    return 'alert'
  if (color === 'orange') return 'warn'
  if (color === 'green')  return 'ok'
  return 'info'
}

export function deriveStatusColor(
  fields: Pick<Observation, 'pain' | 'mood'>,
): 'red' | 'orange' | 'green' {
  if (fields.pain === 5) return 'red'
  if (fields.pain === 4 || fields.mood === 'confused' || fields.mood === 'anxious') return 'orange'
  return 'green'
}
