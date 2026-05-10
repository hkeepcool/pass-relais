# PatientListPage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build PatientListPage — a sorted list of patients with urgency-based ordering, a single-tap to log an observation, and a secondary info button to view the patient detail page.

**Architecture:** `usePatients()` hook reads from IndexedDB, enriches each patient with their latest observation's `status_color`, sorts `red→orange→green`, and re-runs on mount / window focus / `sync:complete` event. `PatientListPage` composes entirely from existing design system components plus `SyncIndicator`.

**Tech Stack:** React 18, TypeScript, `idb`, `@testing-library/react`, `vitest`, `fake-indexeddb`, react-router-dom v7, Tailwind v3

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/shared/db/observations.db.ts` | Add `getLatestObservationByPatientId` |
| Modify | `src/shared/db/observations.test.ts` | Test the new DB function |
| Create | `src/shared/utils/time.ts` | `formatRelativeTime` — French relative time string |
| Create | `src/shared/utils/time.test.ts` | Unit tests for `formatRelativeTime` |
| Modify | `src/design-system/components/PatientCard.tsx` | Add optional `onInfoClick` prop + info icon button |
| Create | `src/design-system/components/PatientCard.test.tsx` | Test info click behaviour |
| Create | `src/features/patients/usePatients.ts` | Hook: load, enrich, sort patients |
| Create | `src/features/patients/usePatients.test.ts` | Hook tests with real IndexedDB + error spy |
| Modify | `src/shared/sync/flush.ts` | Dispatch `sync:complete` after successful flush |
| Modify | `src/features/patients/PatientListPage.tsx` | Full implementation |
| Create | `src/features/patients/PatientListPage.test.tsx` | Page tests (mocked hook) |

---

## Task 1: Add `getLatestObservationByPatientId` to observations.db

**Files:**
- Modify: `src/shared/db/observations.test.ts`
- Modify: `src/shared/db/observations.db.ts`

- [ ] **Step 1: Add the failing test**

Append to `src/shared/db/observations.test.ts` (inside the existing `describe` block):

```typescript
it('returns the most recent observation for a patient', async () => {
  const older = { ...obs, id: 'o1', recorded_at: '2026-05-07T08:00:00Z' }
  const newer = { ...obs, id: 'o2', recorded_at: '2026-05-09T10:00:00Z', status_color: 'red' as const }
  await upsertObservation(older)
  await upsertObservation(newer)
  const result = await getLatestObservationByPatientId('p1')
  expect(result?.id).toBe('o2')
  expect(result?.status_color).toBe('red')
})

it('returns undefined when patient has no observations', async () => {
  const result = await getLatestObservationByPatientId('unknown')
  expect(result).toBeUndefined()
})
```

Also add `getLatestObservationByPatientId` to the import at the top of the test file:

```typescript
import { upsertObservation, getObservationsByPatient, getLatestObservationByPatientId } from './observations.db'
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run src/shared/db/observations.test.ts
```

Expected: FAIL — `getLatestObservationByPatientId is not a function`

- [ ] **Step 3: Implement `getLatestObservationByPatientId`**

Append to `src/shared/db/observations.db.ts`:

```typescript
export async function getLatestObservationByPatientId(patientId: string): Promise<Observation | undefined> {
  const db = await getDb()
  const all = await db.getAllFromIndex('observations', 'patient_id', patientId)
  if (all.length === 0) return undefined
  return all.sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0]
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run src/shared/db/observations.test.ts
```

Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/shared/db/observations.db.ts src/shared/db/observations.test.ts
git commit -m "feat: add getLatestObservationByPatientId"
```

---

## Task 2: Create `formatRelativeTime` utility

**Files:**
- Create: `src/shared/utils/time.ts`
- Create: `src/shared/utils/time.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/shared/utils/time.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run src/shared/utils/time.test.ts
```

Expected: FAIL — `Cannot find module './time'`

- [ ] **Step 3: Implement `formatRelativeTime`**

Create `src/shared/utils/time.ts`:

```typescript
export function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH}h`
  return `il y a ${Math.floor(diffH / 24)}j`
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run src/shared/utils/time.test.ts
```

Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/time.ts src/shared/utils/time.test.ts
git commit -m "feat: add formatRelativeTime French relative time util"
```

---

## Task 3: Add `onInfoClick` prop to `PatientCard`

**Files:**
- Create: `src/design-system/components/PatientCard.test.tsx`
- Modify: `src/design-system/components/PatientCard.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/design-system/components/PatientCard.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run src/design-system/components/PatientCard.test.tsx
```

Expected: FAIL — info button not found

- [ ] **Step 3: Update `PatientCard`**

Replace the full contents of `src/design-system/components/PatientCard.tsx`:

```tsx
import { Badge, type StatusTone } from './Badge'

export interface PatientCardProps {
  status:       StatusTone
  name:         string
  room?:        string
  lastSeen:     string
  lastNote?:    string
  alertNote?:   string
  onClick:      () => void
  onInfoClick?: () => void
  className?:   string
}

const statusRailClasses: Record<StatusTone, string> = {
  ok:    'bg-status-ok opacity-40',
  warn:  'bg-status-warn',
  alert: 'bg-status-alert',
  info:  'bg-ink-faint',
}

function ChevronIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export function PatientCard({
  status,
  name,
  room,
  lastSeen,
  lastNote,
  alertNote,
  onClick,
  onInfoClick,
  className,
}: PatientCardProps) {
  const displayNote = alertNote || lastNote

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={onClick}
        aria-label={[
          name,
          room ? `chambre ${room}` : null,
          status === 'alert' ? 'urgent' : status === 'warn' ? 'vigilance' : 'stable',
          `dernière observation ${lastSeen}`,
        ].filter(Boolean).join(', ')}
        className={[
          'relative w-full text-left overflow-hidden',
          'flex items-center gap-3.5',
          'min-h-[var(--row-h,76px)] px-[18px] py-[18px]',
          onInfoClick ? 'pr-12' : '',
          'bg-surface border border-line-soft rounded-lg shadow-1',
          'transition-all duration-[var(--t-fast,100ms)]',
          'active:scale-[0.99] hover:bg-surface-2',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          className,
        ].filter(Boolean).join(' ')}
      >
        {/* Status accent rail */}
        <span
          aria-hidden="true"
          className={[
            'absolute left-0 top-2 bottom-2 w-[3px] rounded-pill',
            statusRailClasses[status],
          ].join(' ')}
        />

        <Badge status={status} dot size={status === 'alert' ? 'lg' : 'md'} />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-display text-[20px] font-medium tracking-[-0.01em] truncate text-ink">
              {name}
            </span>
            <span className="font-mono text-[11px] font-medium text-ink-mute shrink-0">
              {lastSeen}
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-[3px] text-[13px] text-ink-2">
            {room && (
              <>
                <span className="font-mono text-xs text-ink-mute">Ch. {room}</span>
                <span className="w-[3px] h-[3px] rounded-full bg-ink-faint" aria-hidden="true" />
              </>
            )}
            {displayNote && (
              <span className={['truncate', alertNote ? 'text-status-alert font-semibold' : 'text-ink-2'].join(' ')}>
                {displayNote}
              </span>
            )}
          </div>
        </div>

        {!onInfoClick && (
          <span className="text-ink-faint shrink-0">
            <ChevronIcon />
          </span>
        )}
      </button>

      {onInfoClick && (
        <button
          type="button"
          onClick={onInfoClick}
          aria-label={`Voir le dossier de ${name}`}
          className="absolute right-3 inset-y-0 flex items-center px-1.5 text-ink-mute hover:text-ink transition-colors"
        >
          <InfoIcon />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run src/design-system/components/PatientCard.test.tsx
```

Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/design-system/components/PatientCard.tsx src/design-system/components/PatientCard.test.tsx
git commit -m "feat: add onInfoClick prop to PatientCard"
```

---

## Task 4: Create `usePatients` hook

**Files:**
- Create: `src/features/patients/usePatients.test.ts`
- Create: `src/features/patients/usePatients.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/features/patients/usePatients.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePatients } from './usePatients'
import { resetDbForTests } from '../../shared/db/schema'
import { upsertPatient } from '../../shared/db/patients.db'
import { upsertObservation } from '../../shared/db/observations.db'
import * as patientsDb from '../../shared/db/patients.db'

const mkPatient = (id: string, full_name: string) => ({
  id,
  full_name,
  birth_date: null,
  care_level: 'standard',
  created_by: 'u1',
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
})

const mkObservation = (
  id: string,
  patient_id: string,
  status_color: 'green' | 'orange' | 'red',
  recorded_at: string,
) => ({
  id,
  patient_id,
  caregiver_id: 'u1',
  recorded_at,
  sleep: null,
  appetite: null,
  pain: null,
  mood: null,
  note_text: null,
  note_audio_url: null,
  status_color,
  updated_at: recorded_at,
})

describe('usePatients', () => {
  beforeEach(async () => await resetDbForTests())

  it('returns patients sorted red → orange → green', async () => {
    await upsertPatient(mkPatient('p1', 'Alice'))
    await upsertPatient(mkPatient('p2', 'Bob'))
    await upsertPatient(mkPatient('p3', 'Carol'))
    await upsertObservation(mkObservation('o1', 'p1', 'green', '2026-05-10T08:00:00Z'))
    await upsertObservation(mkObservation('o2', 'p2', 'red', '2026-05-10T09:00:00Z'))
    await upsertObservation(mkObservation('o3', 'p3', 'orange', '2026-05-10T10:00:00Z'))

    const { result } = renderHook(() => usePatients())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.patients[0].full_name).toBe('Bob')
    expect(result.current.patients[1].full_name).toBe('Carol')
    expect(result.current.patients[2].full_name).toBe('Alice')
    expect(result.current.error).toBeNull()
  })

  it('returns empty array with no error when no patients exist', async () => {
    const { result } = renderHook(() => usePatients())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.patients).toHaveLength(0)
    expect(result.current.error).toBeNull()
  })

  it('returns error state when getAllPatients throws', async () => {
    const spy = vi.spyOn(patientsDb, 'getAllPatients').mockRejectedValue(new Error('db failure'))
    const { result } = renderHook(() => usePatients())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error?.message).toBe('db failure')
    expect(result.current.patients).toHaveLength(0)
    spy.mockRestore()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run src/features/patients/usePatients.test.ts
```

Expected: FAIL — `Cannot find module './usePatients'`

- [ ] **Step 3: Implement `usePatients`**

Create `src/features/patients/usePatients.ts`:

```typescript
import { useCallback, useEffect, useState } from 'react'
import { getAllPatients } from '../../shared/db/patients.db'
import { getLatestObservationByPatientId } from '../../shared/db/observations.db'
import type { Patient } from '../../shared/db/schema'
import type { StatusTone } from '../../design-system'

export interface PatientWithStatus extends Patient {
  statusTone: StatusTone
  latestObservationAt: string | null
}

const STATUS_ORDER: Record<StatusTone, number> = { alert: 0, warn: 1, ok: 2, info: 3 }

function colorToTone(color: 'red' | 'orange' | 'green' | null | undefined): StatusTone {
  if (color === 'red') return 'alert'
  if (color === 'orange') return 'warn'
  if (color === 'green') return 'ok'
  return 'info'
}

export function usePatients() {
  const [patients, setPatients] = useState<PatientWithStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      const raw = await getAllPatients()
      const enriched = await Promise.all(
        raw.map(async (p) => {
          const latest = await getLatestObservationByPatientId(p.id)
          return {
            ...p,
            statusTone: colorToTone(latest?.status_color),
            latestObservationAt: latest?.recorded_at ?? null,
          }
        }),
      )
      enriched.sort((a, b) => STATUS_ORDER[a.statusTone] - STATUS_ORDER[b.statusTone])
      setPatients(enriched)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    window.addEventListener('focus', load)
    window.addEventListener('sync:complete', load)
    return () => {
      window.removeEventListener('focus', load)
      window.removeEventListener('sync:complete', load)
    }
  }, [load])

  return { patients, isLoading, error, reload: load }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run src/features/patients/usePatients.test.ts
```

Expected: PASS (all 3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/patients/usePatients.ts src/features/patients/usePatients.test.ts
git commit -m "feat: usePatients hook — load, enrich, sort from IndexedDB"
```

---

## Task 5: Dispatch `sync:complete` in `flushQueue`

**Files:**
- Modify: `src/shared/sync/flush.ts`

- [ ] **Step 1: Add event dispatch after successful flush**

In `src/shared/sync/flush.ts`, add a `flushed` counter and dispatch the event at the end of `flushQueue`. Replace the function body as follows (only the end changes — add the dispatch after the loop):

```typescript
export async function flushQueue(): Promise<void> {
  const items = await getAllQueuedItems()
  if (items.length === 0) return

  let flushed = 0

  for (const item of items) {
    if (item.id === undefined) continue
    if (item.retries >= MAX_RETRIES) {
      await removeQueuedItem(item.id)
      continue
    }

    const localUpdatedAt = item.payload.updated_at as string | undefined
    const { data, error } = await supabase
      .from(item.table)
      .upsert(item.payload)

    if (error) {
      await incrementQueuedItemRetries(item.id)
      continue
    }

    const serverUpdatedAt = (data as Array<{ updated_at: string }>)[0]?.updated_at
    if (localUpdatedAt && serverUpdatedAt && serverUpdatedAt > localUpdatedAt) {
      const patientId = item.payload.patient_id as string | undefined
      const patientName = patientId
        ? (await getPatient(patientId))?.full_name ?? 'Patient inconnu'
        : 'Patient inconnu'

      useAppStore.getState().addConflict({
        patientName,
        table: item.table,
        id: item.payload.id as string,
      })
    }

    await removeQueuedItem(item.id)
    await queryClient.invalidateQueries({ queryKey: [item.table] })
    flushed++
  }

  if (flushed > 0) {
    window.dispatchEvent(new CustomEvent('sync:complete'))
  }
}
```

- [ ] **Step 2: Run existing tests to confirm nothing broke**

```
npx vitest run
```

Expected: all existing tests pass

- [ ] **Step 3: Commit**

```bash
git add src/shared/sync/flush.ts
git commit -m "feat: dispatch sync:complete event after successful queue flush"
```

---

## Task 6: Implement `PatientListPage`

**Files:**
- Create: `src/features/patients/PatientListPage.test.tsx`
- Modify: `src/features/patients/PatientListPage.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/features/patients/PatientListPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { PatientListPage } from './PatientListPage'
import type { PatientWithStatus } from './usePatients'

vi.mock('./usePatients')
vi.mock('../../shared/components/SyncIndicator', () => ({
  SyncIndicator: () => null,
}))

import { usePatients } from './usePatients'
const mockUsePatients = vi.mocked(usePatients)

const mkPatient = (
  id: string,
  full_name: string,
  statusTone: PatientWithStatus['statusTone'],
): PatientWithStatus => ({
  id,
  full_name,
  birth_date: null,
  care_level: 'standard',
  created_by: 'u1',
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
  statusTone,
  latestObservationAt: '2026-05-10T09:00:00Z',
})

function renderPage() {
  return render(
    <MemoryRouter>
      <PatientListPage />
    </MemoryRouter>,
  )
}

describe('PatientListPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows 3 skeleton cards while loading', () => {
    mockUsePatients.mockReturnValue({ patients: [], isLoading: true, error: null, reload: vi.fn() })
    renderPage()
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3)
  })

  it('renders a card per patient in the order provided by the hook', () => {
    mockUsePatients.mockReturnValue({
      patients: [
        mkPatient('p1', 'Bob Martin', 'alert'),
        mkPatient('p2', 'Carol Petit', 'warn'),
        mkPatient('p3', 'Alice Dupont', 'ok'),
      ],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    })
    renderPage()
    const names = screen.getAllByText(/bob martin|carol petit|alice dupont/i)
    expect(names[0].textContent).toMatch(/bob martin/i)
    expect(names[1].textContent).toMatch(/carol petit/i)
    expect(names[2].textContent).toMatch(/alice dupont/i)
  })

  it('shows empty state when patient list is empty', () => {
    mockUsePatients.mockReturnValue({ patients: [], isLoading: false, error: null, reload: vi.fn() })
    renderPage()
    expect(screen.getByText(/aucun patient enregistré/i)).toBeInTheDocument()
  })

  it('shows error message and retry button on error', async () => {
    const reload = vi.fn()
    mockUsePatients.mockReturnValue({ patients: [], isLoading: false, error: new Error('fail'), reload })
    renderPage()
    expect(screen.getByText(/impossible de charger les patients/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }))
    expect(reload).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run src/features/patients/PatientListPage.test.tsx
```

Expected: FAIL — tests can't find skeleton/empty state/error state

- [ ] **Step 3: Implement `PatientListPage`**

Replace the full contents of `src/features/patients/PatientListPage.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import { usePatients } from './usePatients'
import { PatientCard } from '../../design-system'
import { SyncIndicator } from '../../shared/components/SyncIndicator'
import { formatRelativeTime } from '../../shared/utils/time'

export function PatientListPage() {
  const navigate = useNavigate()
  const { patients, isLoading, error, reload } = usePatients()

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <header className="flex items-center justify-between px-4 py-3 border-b border-line-soft">
        <h1 className="font-display text-xl font-semibold text-ink">Mes patients</h1>
        <SyncIndicator />
      </header>

      <main className="flex-1 px-4 py-4 space-y-3">
        {isLoading && (
          <>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                data-testid="skeleton"
                className="h-[76px] rounded-lg bg-surface animate-pulse"
              />
            ))}
          </>
        )}

        {!isLoading && error && (
          <div className="text-center py-8 text-ink-2">
            <p>Impossible de charger les patients</p>
            <button
              onClick={reload}
              className="mt-2 text-accent underline text-sm"
            >
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !error && patients.length === 0 && (
          <p className="text-center py-8 text-ink-mute">Aucun patient enregistré</p>
        )}

        {!isLoading && !error && patients.map((p) => (
          <PatientCard
            key={p.id}
            status={p.statusTone}
            name={p.full_name}
            lastSeen={p.latestObservationAt ? formatRelativeTime(p.latestObservationAt) : '—'}
            onClick={() => navigate(`/patients/${p.id}/feed`)}
            onInfoClick={() => navigate(`/patients/${p.id}`)}
          />
        ))}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run src/features/patients/PatientListPage.test.tsx
```

Expected: PASS (all 4 tests)

- [ ] **Step 5: Run the full test suite**

```
npx vitest run
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/features/patients/PatientListPage.tsx src/features/patients/PatientListPage.test.tsx
git commit -m "feat: implement PatientListPage — sorted list, quick-tap, info nav"
```
