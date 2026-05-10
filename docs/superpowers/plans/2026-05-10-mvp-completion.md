# Pass-Relais MVP Completion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement PatientDetailPage (Quick-Tap form), useTranscription hook, and FeedPage to satisfy all PRD §6 acceptance criteria.

**Architecture:** Six tasks in dependency order — shared utilities first, then hooks, then pages. Each task is test-first. All UI uses only `src/design-system/index.ts` exports; no new CSS classes outside design tokens.

**Tech Stack:** React 18, TypeScript, Vitest + jsdom + fake-indexeddb, @testing-library/react, react-router-dom v7, idb (IndexedDB), design system from `src/design-system/index.ts`

---

## File Map

| Action  | Path                                                          | Responsibility                                              |
|---------|---------------------------------------------------------------|-------------------------------------------------------------|
| Create  | `src/shared/utils/status.ts`                                 | `colorToTone`, `deriveStatusColor` — pure functions         |
| Create  | `src/shared/utils/status.test.ts`                            |                                                             |
| Modify  | `src/features/patients/usePatients.ts`                       | import `colorToTone` from `status.ts`, remove local copy   |
| Create  | `src/shared/utils/summarize.ts`                              | `summarizeObservations` — rule-based 24h summary            |
| Create  | `src/shared/utils/summarize.test.ts`                         |                                                             |
| Create  | `src/shared/hooks/useTranscription.ts`                       | adapter-agnostic hook + `TranscriptionAdapter` interface    |
| Create  | `src/shared/hooks/useTranscription.test.ts`                  |                                                             |
| Create  | `src/shared/hooks/transcription/WebSpeechAdapter.ts`         | Web Speech API implementation, fr-FR                        |
| Create  | `src/shared/hooks/transcription/WhisperAdapter.ts`           | stub — not yet implemented                                  |
| Create  | `src/features/patients/useSaveObservation.ts`                | write obs to IndexedDB + sync queue + navigate              |
| Create  | `src/features/patients/useSaveObservation.test.tsx`          |                                                             |
| Replace | `src/features/patients/PatientDetailPage.tsx`                | Quick-Tap form (sleep / appetite / pain / mood + voice)     |
| Create  | `src/features/patients/PatientDetailPage.test.tsx`           |                                                             |
| Replace | `src/features/transmissions/FeedPage.tsx`                    | timeline feed + summary card + filter chips                 |
| Create  | `src/features/transmissions/FeedPage.test.tsx`               |                                                             |

---

### Task 1: Shared status utilities

**Files:**
- Create: `src/shared/utils/status.ts`
- Create: `src/shared/utils/status.test.ts`
- Modify: `src/features/patients/usePatients.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/shared/utils/status.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run src/shared/utils/status.test.ts
```
Expected: FAIL — "Cannot find module './status'"

- [ ] **Step 3: Implement `src/shared/utils/status.ts`**

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run src/shared/utils/status.test.ts
```
Expected: PASS — 11 tests

- [ ] **Step 5: Update `usePatients.ts` to import from `status.ts`**

At the top of `src/features/patients/usePatients.ts`, add this import and remove the local `colorToTone` function (lines 14–19):

```typescript
// Add with the other imports at the top:
import { colorToTone } from '../../shared/utils/status'
```

Remove this block from `usePatients.ts` (no longer needed):
```typescript
function colorToTone(color: 'red' | 'orange' | 'green' | null | undefined): StatusTone {
  if (color === 'red') return 'alert'
  if (color === 'orange') return 'warn'
  if (color === 'green') return 'ok'
  return 'info'
}
```

Also remove the now-unused `StatusTone` import from `'../../design-system'` in `usePatients.ts` if TypeScript warns about it (the type is re-exported via `status.ts` but not re-imported).

- [ ] **Step 6: Run existing usePatients tests to confirm no regression**

```
npx vitest run src/features/patients/usePatients.test.ts
```
Expected: PASS — all existing tests

- [ ] **Step 7: Commit**

```
git add src/shared/utils/status.ts src/shared/utils/status.test.ts src/features/patients/usePatients.ts
git commit -m "refactor: extract colorToTone and deriveStatusColor to shared/utils/status"
```

---

### Task 2: Rule-based summary utility

**Files:**
- Create: `src/shared/utils/summarize.ts`
- Create: `src/shared/utils/summarize.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/shared/utils/summarize.test.ts
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

  it('uses most-recent value when multiple observations exist', () => {
    const earlier = mkObs({ id: 'o1', recorded_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), sleep: 'agitated' })
    const latest  = mkObs({ id: 'o2', recorded_at: now, sleep: 'rested' })
    const r = summarizeObservations([earlier, latest])
    expect(r.text).toMatch(/sommeil reposé/i)
    expect(r.text).not.toMatch(/agité/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run src/shared/utils/summarize.test.ts
```
Expected: FAIL — "Cannot find module './summarize'"

- [ ] **Step 3: Implement `src/shared/utils/summarize.ts`**

```typescript
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

  const sorted        = [...recent].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
  const latestSleep   = sorted.find((o) => o.sleep    != null)?.sleep    ?? null
  const latestAppetite= sorted.find((o) => o.appetite != null)?.appetite ?? null
  const latestPain    = sorted.find((o) => o.pain     != null)?.pain     ?? null
  const latestMood    = sorted.find((o) => o.mood     != null)?.mood     ?? null

  const parts: string[] = []
  if (latestSleep)    parts.push(SLEEP_LABELS[latestSleep])
  if (latestAppetite) parts.push(APPETITE_LABELS[latestAppetite])
  if (latestPain)     parts.push(`Douleur ${latestPain}/5`)
  if (latestMood)     parts.push(MOOD_LABELS[latestMood])

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
```

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run src/shared/utils/summarize.test.ts
```
Expected: PASS — 8 tests

- [ ] **Step 5: Commit**

```
git add src/shared/utils/summarize.ts src/shared/utils/summarize.test.ts
git commit -m "feat: add rule-based summarizeObservations utility"
```

---

### Task 3: `useTranscription` hook + `WebSpeechAdapter`

**Files:**
- Create: `src/shared/hooks/useTranscription.ts`
- Create: `src/shared/hooks/useTranscription.test.ts`
- Create: `src/shared/hooks/transcription/WebSpeechAdapter.ts`
- Create: `src/shared/hooks/transcription/WhisperAdapter.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/shared/hooks/useTranscription.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTranscription } from './useTranscription'
import type { TranscriptionAdapter } from './useTranscription'

function makeMockAdapter(supported = true): TranscriptionAdapter {
  return { isSupported: () => supported, start: vi.fn(), stop: vi.fn() }
}

describe('useTranscription', () => {
  it('state is unsupported when adapter.isSupported() returns false', () => {
    const { result } = renderHook(() => useTranscription(makeMockAdapter(false)))
    expect(result.current.state).toBe('unsupported')
  })

  it('state is idle when adapter is supported', () => {
    const { result } = renderHook(() => useTranscription(makeMockAdapter()))
    expect(result.current.state).toBe('idle')
  })

  it('calls adapter.start() and transitions to recording on start()', () => {
    const adapter = makeMockAdapter()
    const { result } = renderHook(() => useTranscription(adapter))
    act(() => result.current.start())
    expect(adapter.start).toHaveBeenCalledOnce()
    expect(result.current.state).toBe('recording')
  })

  it('transitions to done and sets transcript when onFinal fires', () => {
    let capturedOnFinal: ((t: string) => void) | null = null
    const adapter: TranscriptionAdapter = {
      isSupported: () => true,
      start: vi.fn((_onInterim, onFinal) => { capturedOnFinal = onFinal }),
      stop: vi.fn(),
    }
    const { result } = renderHook(() => useTranscription(adapter))
    act(() => result.current.start())
    act(() => capturedOnFinal!('bonjour le patient'))
    expect(result.current.state).toBe('done')
    expect(result.current.transcript).toBe('bonjour le patient')
  })

  it('calls adapter.stop() and transitions to done on stop()', () => {
    const adapter = makeMockAdapter()
    const { result } = renderHook(() => useTranscription(adapter))
    act(() => result.current.start())
    act(() => result.current.stop())
    expect(adapter.stop).toHaveBeenCalledOnce()
    expect(result.current.state).toBe('done')
  })

  it('reset() returns state to idle and clears transcript', () => {
    let capturedOnFinal: ((t: string) => void) | null = null
    const adapter: TranscriptionAdapter = {
      isSupported: () => true,
      start: vi.fn((_onInterim, onFinal) => { capturedOnFinal = onFinal }),
      stop: vi.fn(),
    }
    const { result } = renderHook(() => useTranscription(adapter))
    act(() => result.current.start())
    act(() => capturedOnFinal!('test transcript'))
    act(() => result.current.reset())
    expect(result.current.state).toBe('idle')
    expect(result.current.transcript).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run src/shared/hooks/useTranscription.test.ts
```
Expected: FAIL — "Cannot find module './useTranscription'"

- [ ] **Step 3: Implement `src/shared/hooks/useTranscription.ts`**

```typescript
import { useState, useEffect, useRef, useCallback } from 'react'

export interface TranscriptionAdapter {
  start(onInterim: (t: string) => void, onFinal: (t: string) => void): void
  stop(): void
  isSupported(): boolean
}

export interface TranscriptionResult {
  state:      'idle' | 'recording' | 'done' | 'unsupported'
  transcript: string
  duration:   number
  start:      () => void
  stop:       () => void
  reset:      () => void
}

export function useTranscription(adapter: TranscriptionAdapter): TranscriptionResult {
  const [state,      setState]      = useState<TranscriptionResult['state']>(
    () => (adapter.isSupported() ? 'idle' : 'unsupported'),
  )
  const [transcript, setTranscript] = useState('')
  const [duration,   setDuration]   = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    if (state !== 'idle') return
    setState('recording')
    setTranscript('')
    setDuration(0)
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    adapter.start(
      (interim) => setTranscript(interim),
      (final) => {
        setTranscript(final)
        setState('done')
        if (timerRef.current) clearInterval(timerRef.current)
      },
    )
  }, [state, adapter])

  const stop = useCallback(() => {
    if (state !== 'recording') return
    adapter.stop()
    setState('done')
    if (timerRef.current) clearInterval(timerRef.current)
  }, [state, adapter])

  const reset = useCallback(() => {
    setState(adapter.isSupported() ? 'idle' : 'unsupported')
    setTranscript('')
    setDuration(0)
  }, [adapter])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  return { state, transcript, duration, start, stop, reset }
}
```

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run src/shared/hooks/useTranscription.test.ts
```
Expected: PASS — 6 tests

- [ ] **Step 5: Implement `src/shared/hooks/transcription/WebSpeechAdapter.ts`**

```typescript
import type { TranscriptionAdapter } from '../useTranscription'

export class WebSpeechAdapter implements TranscriptionAdapter {
  private recognition: SpeechRecognition | null = null

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    )
  }

  start(onInterim: (t: string) => void, onFinal: (t: string) => void): void {
    const Impl =
      window.SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!Impl) return

    this.recognition = new Impl()
    this.recognition.continuous     = true
    this.recognition.interimResults = true
    this.recognition.lang           = 'fr-FR'

    this.recognition.onresult = (event) => {
      let interim = ''
      let final   = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (!r) continue
        if (r.isFinal) final   += r[0]?.transcript ?? ''
        else           interim += r[0]?.transcript ?? ''
      }
      if (final)        onFinal(final.trim())
      else if (interim) onInterim(interim.trim())
    }

    this.recognition.onspeechend = () => this.stop()
    this.recognition.start()
  }

  stop(): void {
    this.recognition?.stop()
    this.recognition = null
  }
}
```

- [ ] **Step 6: Create the WhisperAdapter stub**

```typescript
// src/shared/hooks/transcription/WhisperAdapter.ts
import type { TranscriptionAdapter } from '../useTranscription'

export class WhisperAdapter implements TranscriptionAdapter {
  isSupported(): boolean { return true }

  start(_onInterim: (t: string) => void, _onFinal: (t: string) => void): void {
    throw new Error('WhisperAdapter not yet implemented — wire up the transcribe-audio Edge Function first')
  }

  stop(): void {}
}
```

- [ ] **Step 7: Commit**

```
git add src/shared/hooks/useTranscription.ts src/shared/hooks/useTranscription.test.ts src/shared/hooks/transcription/WebSpeechAdapter.ts src/shared/hooks/transcription/WhisperAdapter.ts
git commit -m "feat: add useTranscription hook with WebSpeechAdapter (fr-FR, Whisper-upgradeable)"
```

---

### Task 4: `useSaveObservation` hook

**Files:**
- Create: `src/features/patients/useSaveObservation.ts`
- Create: `src/features/patients/useSaveObservation.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/patients/useSaveObservation.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSaveObservation } from './useSaveObservation'
import { resetDbForTests } from '../../shared/db/schema'
import { getObservationsByPatient } from '../../shared/db/observations.db'
import { getAllQueuedItems } from '../../shared/db/sync-queue.db'

vi.mock('../../shared/sync/flush', () => ({
  flushQueue: vi.fn().mockResolvedValue(undefined),
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
)

const fields = {
  sleep:          'agitated' as const,
  appetite:       'low'      as const,
  pain:           5          as const,
  mood:           'stable'   as const,
  note_text:      null,
  note_audio_url: null,
}

describe('useSaveObservation', () => {
  beforeEach(async () => {
    await resetDbForTests()
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
  })

  it('writes observation to IndexedDB with derived status_color', async () => {
    const { result } = renderHook(() => useSaveObservation('p1', 'u1'), { wrapper })
    await act(async () => { await result.current.save(fields) })

    const obs = await getObservationsByPatient('p1')
    expect(obs).toHaveLength(1)
    expect(obs[0]?.status_color).toBe('red')   // pain === 5 → red
    expect(obs[0]?.sleep).toBe('agitated')
    expect(obs[0]?.patient_id).toBe('p1')
    expect(obs[0]?.caregiver_id).toBe('u1')
  })

  it('enqueues the observation for sync', async () => {
    const { result } = renderHook(() => useSaveObservation('p1', 'u1'), { wrapper })
    await act(async () => { await result.current.save(fields) })

    const queued = await getAllQueuedItems()
    expect(queued).toHaveLength(1)
    expect(queued[0]?.table).toBe('observations')
    expect(queued[0]?.operation).toBe('INSERT')
  })

  it('sets isSaving to false after completion', async () => {
    const { result } = renderHook(() => useSaveObservation('p1', 'u1'), { wrapper })
    await act(async () => { await result.current.save(fields) })
    expect(result.current.isSaving).toBe(false)
  })

  it('derives green status_color for a benign observation', async () => {
    const { result } = renderHook(() => useSaveObservation('p1', 'u1'), { wrapper })
    await act(async () => {
      await result.current.save({ ...fields, pain: 2, mood: 'stable' })
    })
    const obs = await getObservationsByPatient('p1')
    expect(obs[0]?.status_color).toBe('green')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run src/features/patients/useSaveObservation.test.tsx
```
Expected: FAIL — "Cannot find module './useSaveObservation'"

- [ ] **Step 3: Implement `src/features/patients/useSaveObservation.ts`**

```typescript
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { upsertObservation } from '../../shared/db/observations.db'
import { enqueueItem } from '../../shared/db/sync-queue.db'
import { flushQueue } from '../../shared/sync/flush'
import { deriveStatusColor } from '../../shared/utils/status'
import type { Observation } from '../../shared/db/schema'

export interface ObservationFields {
  sleep:          Observation['sleep']
  appetite:       Observation['appetite']
  pain:           Observation['pain']
  mood:           Observation['mood']
  note_text:      string | null
  note_audio_url: string | null
}

export function useSaveObservation(patientId: string, caregiverId: string) {
  const [isSaving, setIsSaving] = useState(false)
  const navigate = useNavigate()

  const save = useCallback(
    async (fields: ObservationFields) => {
      setIsSaving(true)
      try {
        const now = new Date().toISOString()
        const obs: Observation = {
          id:           crypto.randomUUID(),
          patient_id:   patientId,
          caregiver_id: caregiverId,
          recorded_at:  now,
          updated_at:   now,
          status_color: deriveStatusColor(fields),
          ...fields,
        }
        await upsertObservation(obs)
        await enqueueItem({
          operation: 'INSERT',
          table:     'observations',
          payload:   obs as Record<string, unknown>,
        })
        if (navigator.onLine) await flushQueue()
        navigate(`/patients/${patientId}/feed`)
      } finally {
        setIsSaving(false)
      }
    },
    [patientId, caregiverId, navigate],
  )

  return { save, isSaving }
}
```

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run src/features/patients/useSaveObservation.test.tsx
```
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```
git add src/features/patients/useSaveObservation.ts src/features/patients/useSaveObservation.test.tsx
git commit -m "feat: add useSaveObservation — writes to IndexedDB and enqueues sync"
```

---

### Task 5: PatientDetailPage — Quick-Tap form

**Files:**
- Replace: `src/features/patients/PatientDetailPage.tsx`
- Create: `src/features/patients/PatientDetailPage.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/patients/PatientDetailPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PatientDetailPage } from './PatientDetailPage'

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'u1' } }, state: 'authenticated', signOut: vi.fn() }),
}))

const mockSave = vi.fn().mockResolvedValue(undefined)
vi.mock('./useSaveObservation', () => ({
  useSaveObservation: () => ({ save: mockSave, isSaving: false }),
}))

vi.mock('../../shared/hooks/useTranscription', () => ({
  useTranscription: () => ({
    state: 'unsupported', transcript: '', duration: 0,
    start: vi.fn(), stop: vi.fn(), reset: vi.fn(),
  }),
}))

vi.mock('../../shared/hooks/transcription/WebSpeechAdapter', () => ({
  WebSpeechAdapter: vi.fn().mockImplementation(() => ({
    isSupported: () => false, start: vi.fn(), stop: vi.fn(),
  })),
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/patients/p1']}>
      <Routes>
        <Route path="/patients/:id" element={<PatientDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PatientDetailPage', () => {
  beforeEach(() => { vi.clearAllMocks(); mockSave.mockResolvedValue(undefined) })

  it('renders all four Quick-Tap radiogroups', () => {
    renderPage()
    expect(screen.getByRole('radiogroup', { name: /sommeil/i })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /appétit/i })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /douleur/i })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /humeur/i })).toBeInTheDocument()
  })

  it('submit button is disabled before any selection', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled()
  })

  it('enables submit button after selecting a sleep value', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('radio', { name: /reposé/i }))
    expect(screen.getByRole('button', { name: /enregistrer/i })).not.toBeDisabled()
  })

  it('calls save() with selected fields on submit', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('radio', { name: /reposé/i }))
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ sleep: 'rested' }),
    )
  })

  it('deselects a value when the same button is clicked again', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('radio', { name: /reposé/i }))
    await userEvent.click(screen.getByRole('radio', { name: /reposé/i }))
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run src/features/patients/PatientDetailPage.test.tsx
```
Expected: FAIL — elements not found (stub renders "À implémenter")

- [ ] **Step 3: Implement `src/features/patients/PatientDetailPage.tsx`**

```tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QuickTapButton, Button, VoiceButton } from '../../design-system'
import type { TapTone } from '../../design-system'
import { useTranscription } from '../../shared/hooks/useTranscription'
import { WebSpeechAdapter } from '../../shared/hooks/transcription/WebSpeechAdapter'
import { useSaveObservation } from './useSaveObservation'
import { useAuth } from '../auth/useAuth'
import type { Observation } from '../../shared/db/schema'

type SleepValue    = Observation['sleep']
type AppetiteValue = Observation['appetite']
type PainValue     = Observation['pain']
type MoodValue     = Observation['mood']

const adapter = new WebSpeechAdapter()

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-ink-mute mb-2">
      {children}
    </p>
  )
}

const SLEEP_OPTIONS: [SleepValue, string, string, TapTone][] = [
  ['rested',   'Reposé',  '☾', 'ok'],
  ['agitated', 'Agité',   '〜', 'warn'],
  ['insomnia', 'Insomnie','◎', 'alert'],
]

const APPETITE_OPTIONS: [AppetiteValue, string, string, TapTone][] = [
  ['normal',  'Normal', '◉', 'ok'],
  ['low',     'Faible', '◌', 'warn'],
  ['refused', 'Refus',  '✕', 'alert'],
]

const MOOD_OPTIONS: [MoodValue, string, string, TapTone][] = [
  ['stable',   'Stable', '◆', 'ok'],
  ['confused', 'Confus', '?', 'warn'],
  ['anxious',  'Anxieux','!', 'warn'],
]

const PAIN_GLYPHS:    Record<number, string>           = { 1: '●', 2: '●●', 3: '●●●', 4: '▲', 5: '⚠' }
const PAIN_SUBLABELS: Partial<Record<number, string>>  = { 1: 'Légère', 3: 'Modérée', 5: 'Sévère' }
const PAIN_TONES:     Record<number, TapTone>          = { 1: 'ok', 2: 'ok', 3: 'warn', 4: 'alert', 5: 'alert' }

export function PatientDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const { session } = useAuth()
  const caregiverId = session?.user.id ?? 'offline'

  const [sleep,    setSleep]    = useState<SleepValue>(null)
  const [appetite, setAppetite] = useState<AppetiteValue>(null)
  const [pain,     setPain]     = useState<PainValue>(null)
  const [mood,     setMood]     = useState<MoodValue>(null)

  const transcription          = useTranscription(adapter)
  const { save, isSaving }     = useSaveObservation(id, caregiverId)
  const hasSelection           = sleep !== null || appetite !== null || pain !== null || mood !== null

  const handleSubmit = async () => {
    await save({
      sleep,
      appetite,
      pain,
      mood,
      note_text:      transcription.transcript || null,
      note_audio_url: null,
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-line-soft">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          ← Retour
        </Button>
        <h1 className="font-display text-xl font-semibold text-ink">Nouvelle observation</h1>
      </header>

      <main className="flex-1 px-4 py-5 space-y-6">
        {/* Sommeil */}
        <div>
          <SectionLabel>Sommeil</SectionLabel>
          <div role="radiogroup" aria-label="Sommeil" className="flex gap-2">
            {SLEEP_OPTIONS.map(([val, label, glyph, tone]) => (
              <QuickTapButton
                key={String(val)}
                label={label}
                glyph={glyph}
                tone={tone}
                selected={sleep === val}
                onSelect={() => setSleep((v) => (v === val ? null : val))}
              />
            ))}
          </div>
        </div>

        {/* Appétit */}
        <div>
          <SectionLabel>Appétit</SectionLabel>
          <div role="radiogroup" aria-label="Appétit" className="flex gap-2">
            {APPETITE_OPTIONS.map(([val, label, glyph, tone]) => (
              <QuickTapButton
                key={String(val)}
                label={label}
                glyph={glyph}
                tone={tone}
                selected={appetite === val}
                onSelect={() => setAppetite((v) => (v === val ? null : val))}
              />
            ))}
          </div>
        </div>

        {/* Douleur */}
        <div>
          <SectionLabel>Douleur</SectionLabel>
          <div role="radiogroup" aria-label="Douleur" className="flex gap-2">
            {([1, 2, 3, 4, 5] as NonNullable<PainValue>[]).map((val) => (
              <QuickTapButton
                key={val}
                label={String(val)}
                glyph={PAIN_GLYPHS[val]}
                sublabel={PAIN_SUBLABELS[val]}
                tone={PAIN_TONES[val]}
                selected={pain === val}
                onSelect={() => setPain((v) => (v === val ? null : val))}
              />
            ))}
          </div>
        </div>

        {/* Humeur */}
        <div>
          <SectionLabel>Humeur</SectionLabel>
          <div role="radiogroup" aria-label="Humeur" className="flex gap-2">
            {MOOD_OPTIONS.map(([val, label, glyph, tone]) => (
              <QuickTapButton
                key={String(val)}
                label={label}
                glyph={glyph}
                tone={tone}
                selected={mood === val}
                onSelect={() => setMood((v) => (v === val ? null : val))}
              />
            ))}
          </div>
        </div>

        {/* Note vocale — hidden when Web Speech API is unavailable */}
        {transcription.state !== 'unsupported' && (
          <div>
            <SectionLabel>Note vocale</SectionLabel>
            <VoiceButton
              state={transcription.state}
              onToggle={
                transcription.state === 'recording'
                  ? transcription.stop
                  : transcription.start
              }
              duration={transcription.duration}
              fullWidth
            />
            {transcription.transcript && (
              <p className="mt-2 text-sm text-ink-2 px-1">{transcription.transcript}</p>
            )}
          </div>
        )}
      </main>

      <footer className="px-4 pb-6 pt-3 border-t border-line-soft">
        <Button
          variant="accent"
          size="lg"
          fullWidth
          disabled={!hasSelection}
          loading={isSaving}
          onClick={handleSubmit}
        >
          Enregistrer
        </Button>
      </footer>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run src/features/patients/PatientDetailPage.test.tsx
```
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```
git add src/features/patients/PatientDetailPage.tsx src/features/patients/PatientDetailPage.test.tsx
git commit -m "feat: implement PatientDetailPage — Quick-Tap form with voice note"
```

---

### Task 6: FeedPage — timeline feed + summary card + filters

**Files:**
- Replace: `src/features/transmissions/FeedPage.tsx`
- Create: `src/features/transmissions/FeedPage.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/transmissions/FeedPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { FeedPage } from './FeedPage'
import { resetDbForTests } from '../../shared/db/schema'
import { upsertPatient } from '../../shared/db/patients.db'
import { upsertObservation } from '../../shared/db/observations.db'

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'u1' } }, state: 'authenticated', signOut: vi.fn() }),
}))

const patient = {
  id: 'p1', full_name: 'Alice Dupont', birth_date: null,
  care_level: 'standard', created_by: 'u1',
  created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z',
}

const mkObs = (overrides: Record<string, unknown> = {}) => ({
  id: 'o1', patient_id: 'p1', caregiver_id: 'u1',
  recorded_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  sleep: 'rested' as const, appetite: 'normal' as const,
  pain: 1 as const, mood: 'stable' as const,
  note_text: null, note_audio_url: null, status_color: 'green' as const,
  ...overrides,
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/patients/p1/feed']}>
      <Routes>
        <Route path="/patients/:id/feed" element={<FeedPage />} />
        <Route path="/patients/:id"      element={<div>Detail Page</div>} />
        <Route path="/patients"          element={<div>List Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FeedPage', () => {
  beforeEach(async () => { vi.clearAllMocks(); await resetDbForTests() })

  it('shows empty state when no observations exist', async () => {
    await upsertPatient(patient)
    renderPage()
    expect(await screen.findByText(/aucune transmission/i)).toBeInTheDocument()
  })

  it('renders FeedEntry text that includes the note', async () => {
    await upsertPatient(patient)
    await upsertObservation(mkObs({ note_text: 'Patient calme ce matin' }))
    renderPage()
    expect(await screen.findByText(/patient calme ce matin/i)).toBeInTheDocument()
  })

  it('renders the summary card when observations exist', async () => {
    await upsertPatient(patient)
    await upsertObservation(mkObs())
    renderPage()
    expect(await screen.findByText(/résumé 24h/i)).toBeInTheDocument()
  })

  it('Incidents filter hides green observations and shows red ones', async () => {
    await upsertPatient(patient)
    await upsertObservation(mkObs({ id: 'o1', status_color: 'green',  note_text: 'Tout va bien'      }))
    await upsertObservation(mkObs({ id: 'o2', status_color: 'red', pain: 5, note_text: 'Urgence signalée' }))
    renderPage()
    await screen.findByText(/tout va bien/i)
    await userEvent.click(screen.getByRole('button', { name: /incidents/i }))
    expect(screen.queryByText(/tout va bien/i)).not.toBeInTheDocument()
    expect(screen.getByText(/urgence signalée/i)).toBeInTheDocument()
  })

  it('Notes filter shows only observations that have note_text', async () => {
    await upsertPatient(patient)
    await upsertObservation(mkObs({ id: 'o1', note_text: 'Note importante', sleep: null, appetite: null, pain: null, mood: null }))
    await upsertObservation(mkObs({ id: 'o2', note_text: null, sleep: 'agitated', appetite: null, pain: null, mood: null }))
    renderPage()
    await screen.findByText(/note importante/i)
    await userEvent.click(screen.getByRole('button', { name: /notes/i }))
    expect(screen.getByText(/note importante/i)).toBeInTheDocument()
    expect(screen.queryByText(/sommeil agité/i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run src/features/transmissions/FeedPage.test.tsx
```
Expected: FAIL — stub renders "À implémenter", elements not found

- [ ] **Step 3: Implement `src/features/transmissions/FeedPage.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FeedEntry, Button, Badge } from '../../design-system'
import type { FeedMetric } from '../../design-system'
import { getObservationsByPatient } from '../../shared/db/observations.db'
import { getPatient } from '../../shared/db/patients.db'
import { summarizeObservations } from '../../shared/utils/summarize'
import { colorToTone } from '../../shared/utils/status'
import { useAuth } from '../auth/useAuth'
import type { Observation } from '../../shared/db/schema'

type FilterKey = 'all' | 'incidents' | 'notes'

function buildText(obs: Observation): string {
  const parts: string[] = []
  if (obs.sleep === 'agitated')       parts.push('Sommeil agité')
  else if (obs.sleep === 'insomnia')  parts.push('Insomnie')
  else if (obs.sleep === 'rested')    parts.push('Sommeil reposé')
  if (obs.appetite === 'low')         parts.push('appétit faible')
  else if (obs.appetite === 'refused')parts.push('alimentation refusée')
  if (obs.pain != null)               parts.push(`douleur ${obs.pain}/5`)
  if (obs.mood === 'confused')        parts.push('état confusionnel')
  else if (obs.mood === 'anxious')    parts.push('anxieux')
  if (obs.note_text)                  parts.push(obs.note_text)
  return parts.length > 0 ? parts.join(', ') + '.' : 'Observation enregistrée.'
}

function buildMetrics(obs: Observation): FeedMetric[] {
  const m: FeedMetric[] = []
  if (obs.sleep    != null) m.push({ label: 'Sommeil', value: obs.sleep })
  if (obs.appetite != null) m.push({ label: 'Appétit', value: obs.appetite })
  if (obs.pain     != null) m.push({ label: 'Douleur', value: `${obs.pain}/5` })
  if (obs.mood     != null) m.push({ label: 'Humeur',  value: obs.mood })
  return m
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function applyFilter(obs: Observation[], filter: FilterKey): Observation[] {
  if (filter === 'incidents') return obs.filter((o) => o.status_color !== 'green')
  if (filter === 'notes')     return obs.filter((o) => o.note_text != null || o.note_audio_url != null)
  return obs
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: 'Tout' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'notes',     label: 'Notes' },
]

export function FeedPage() {
  const { id = '' }  = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const { session }  = useAuth()
  const currentUserId = session?.user.id ?? ''

  const [observations, setObservations] = useState<Observation[]>([])
  const [patientName,  setPatientName]  = useState('')
  const [filter,       setFilter]       = useState<FilterKey>('all')
  const [isLoading,    setIsLoading]    = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const [obs, patient] = await Promise.all([
      getObservationsByPatient(id),
      getPatient(id),
    ])
    setObservations([...obs].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)))
    setPatientName(patient?.full_name ?? '')
    setIsLoading(false)
  }, [id])

  useEffect(() => {
    load()
    window.addEventListener('sync:complete', load)
    return () => window.removeEventListener('sync:complete', load)
  }, [load])

  const summary  = summarizeObservations(observations)
  const filtered = applyFilter(observations, filter)

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-line-soft">
        <Button variant="ghost" size="sm" onClick={() => navigate('/patients')}>
          ← Retour
        </Button>
        <h1 className="font-display text-xl font-semibold text-ink flex-1 truncate">
          {patientName}
        </h1>
        <Button variant="accent" size="sm" onClick={() => navigate(`/patients/${id}`)}>
          + Obs.
        </Button>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Summary card */}
        {observations.length > 0 && (
          <div className="bg-surface border border-line rounded-xl px-4 py-3 space-y-1.5">
            <Badge status={summary.tone} label="Résumé 24h" size="sm" />
            <p className="text-sm text-ink leading-relaxed">{summary.text}</p>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'accent' : 'secondary'}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-surface animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <p className="text-center py-8 text-ink-mute">
            Aucune transmission pour ce filtre.
          </p>
        )}

        {/* Feed entries */}
        {!isLoading && filtered.map((obs, idx) => {
          const authorName =
            obs.caregiver_id === currentUserId ? 'Vous' : obs.caregiver_id.slice(0, 8)
          return (
            <FeedEntry
              key={obs.id}
              timestamp={formatTime(obs.recorded_at)}
              authorName={authorName}
              authorInitials={initials(authorName)}
              text={buildText(obs)}
              status={colorToTone(obs.status_color)}
              tag={
                obs.status_color === 'red'
                  ? { label: 'Urgent',    status: 'alert' }
                  : obs.status_color === 'orange'
                  ? { label: 'Vigilance', status: 'warn'  }
                  : undefined
              }
              metrics={buildMetrics(obs)}
              isLast={idx === filtered.length - 1}
            />
          )
        })}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run src/features/transmissions/FeedPage.test.tsx
```
Expected: PASS — 5 tests

- [ ] **Step 5: Run the full test suite**

```
npx vitest run
```
Expected: all tests pass, no regressions

- [ ] **Step 6: TypeScript check**

```
npx tsc -b
```
Expected: only the two pre-existing errors in `flush.ts:30` and `vite.config.ts:47` (documented in CLAUDE.md). Zero new errors from this work.

- [ ] **Step 7: Commit**

```
git add src/features/transmissions/FeedPage.tsx src/features/transmissions/FeedPage.test.tsx
git commit -m "feat: implement FeedPage — timeline feed, 24h summary card, and filter chips"
```

---

## Self-Review

**Spec coverage:**
- ✅ `colorToTone` extracted to shared — Task 1
- ✅ `deriveStatusColor` auto-derives red/orange/green — Task 1
- ✅ Rule-based `summarizeObservations`, tone-aware, 24h window — Task 2
- ✅ `useTranscription` adapter interface + Web Speech API (fr-FR) — Task 3
- ✅ WhisperAdapter stub for future upgrade — Task 3
- ✅ `useSaveObservation`: IndexedDB write + sync queue + flush if online — Task 4
- ✅ PatientDetailPage: all 4 Quick-Tap sections (sleep/appetite/pain/mood) — Task 5
- ✅ VoiceButton wired, hidden gracefully when speech API unavailable — Task 5
- ✅ Submit disabled until selection; loading state on save — Task 5
- ✅ FeedPage: chronological list using `FeedEntry` from design system — Task 6
- ✅ FeedPage: summary card using `Badge` — Task 6
- ✅ FeedPage: filter chips using `Button` — Task 6
- ✅ `authorName` resolution ("Vous" for own entries) — Task 6
- ✅ All UI exclusively uses `src/design-system/index.ts` exports — Tasks 5, 6

**Placeholder scan:** No TBD, TODO, or "implement later" in any task. All code blocks are complete and runnable.

**Type consistency:**
- `ObservationFields` defined in Task 4, consumed in Task 5 — identical shape
- `TranscriptionAdapter` defined in Task 3, implemented in `WebSpeechAdapter` / `WhisperAdapter` — consistent
- `summarizeObservations` returns `{ text: string; tone: StatusTone }` — consumed with that exact destructuring in Task 6
- `colorToTone` defined in Task 1 — imported in Tasks 2 and 6 from same path `../../shared/utils/status`
