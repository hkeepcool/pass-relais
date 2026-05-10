import { describe, it, expect } from 'vitest'
import { colorToTone, deriveStatusColor } from './status'

describe('colorToTone', () => {
  it('maps red → alert',       () => expect(colorToTone('red')).toBe('alert'))
  it('maps orange → warn',     () => expect(colorToTone('orange')).toBe('warn'))
  it('maps green → ok',        () => expect(colorToTone('green')).toBe('ok'))
  it('maps null → info',       () => expect(colorToTone(null)).toBe('info'))
  it('maps undefined → info',  () => expect(colorToTone(undefined)).toBe('info'))
})

describe('deriveStatusColor', () => {
  it('returns red when pain is 5',              () => expect(deriveStatusColor({ pain: 5,    mood: 'stable'   })).toBe('red'))
  it('returns orange when pain is 4',           () => expect(deriveStatusColor({ pain: 4,    mood: 'stable'   })).toBe('orange'))
  it('returns orange when mood is confused',    () => expect(deriveStatusColor({ pain: 2,    mood: 'confused' })).toBe('orange'))
  it('returns orange when mood is anxious',     () => expect(deriveStatusColor({ pain: null, mood: 'anxious'  })).toBe('orange'))
  it('returns green for normal values',         () => expect(deriveStatusColor({ pain: 2,    mood: 'stable'   })).toBe('green'))
  it('returns green when all fields are null',  () => expect(deriveStatusColor({ pain: null, mood: null       })).toBe('green'))
})
