# Timestamp Date Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the date alongside the time on FeedPage entries (only for entries older than today) and in the PatientReportDocument PDF table (always, as full YYYY-MM-DD).

**Architecture:** Add `formatTimestamp` to `src/shared/utils/time.ts` (testable with fake timers, same pattern as `formatRelativeTime`). FeedEntry gets `whitespace-pre-line` so multi-line strings render as stacked lines. FeedPage replaces its local `formatTime` with the shared function. PatientReportDocument updates its local `fmtTime`, column width, and header independently.

**Tech Stack:** TypeScript, React, Vitest, Testing Library, `@react-pdf/renderer`

---

## File Map

| File | Change |
|---|---|
| `src/shared/utils/time.ts` | Add `formatTimestamp` export |
| `src/shared/utils/time.test.ts` | Add `formatTimestamp` tests |
| `src/design-system/components/FeedEntry.tsx` | Add `whitespace-pre-line` to timestamp div |
| `src/design-system/components/FeedEntry.test.tsx` | Create — basic timestamp rendering tests |
| `src/features/transmissions/FeedPage.tsx` | Remove local `formatTime`, import `formatTimestamp` |
| `src/features/pdf/PatientReportDocument.tsx` | Update `fmtTime`, `colTime` width, column header |

---

## Task 1: Add `formatTimestamp` to time.ts

**Files:**
- Modify: `src/shared/utils/time.ts`
- Modify: `src/shared/utils/time.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/shared/utils/time.test.ts` (keep all existing content, add a new describe block):

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatRelativeTime, formatTimestamp } from './time'

// existing describe block stays …

describe('formatTimestamp', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns only HH:MM for today\'s observations', () => {
    vi.setSystemTime(new Date('2026-05-15T14:00:00Z'))
    const result = formatTimestamp('2026-05-15T10:00:00Z')
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('returns DD/MM\\nHH:MM for observations from a different day', () => {
    vi.setSystemTime(new Date('2026-05-15T14:00:00Z'))
    const result = formatTimestamp('2026-01-15T10:00:00Z')
    expect(result).toMatch(/^\d{2}\/\d{2}\n\d{2}:\d{2}$/)
  })
})
```

Note: regex patterns check format only (digits + separators), not exact locale values — this keeps tests timezone-safe.

- [ ] **Step 2: Run to verify the tests fail**

```
npx vitest run src/shared/utils/time.test.ts
```

Expected: FAIL — `formatTimestamp` is not exported from `./time`.

- [ ] **Step 3: Add `formatTimestamp` to time.ts**

Append after `formatRelativeTime` in `src/shared/utils/time.ts`:

```ts
export function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const isToday = d.toDateString() === new Date().toDateString()
  if (isToday) return time
  const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  return `${date}\n${time}`
}
```

- [ ] **Step 4: Run to verify the tests pass**

```
npx vitest run src/shared/utils/time.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/time.ts src/shared/utils/time.test.ts
git commit -m "feat(time): add formatTimestamp — shows date for non-today entries"
```

---

## Task 2: Add `whitespace-pre-line` to FeedEntry + test

**Files:**
- Create: `src/design-system/components/FeedEntry.test.tsx`
- Modify: `src/design-system/components/FeedEntry.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/design-system/components/FeedEntry.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run to verify the second test fails**

```
npx vitest run src/design-system/components/FeedEntry.test.tsx
```

Expected: first test PASSES, second test FAILS (no element with `whitespace-pre-line` found).

- [ ] **Step 3: Add `whitespace-pre-line` to the timestamp div in FeedEntry.tsx**

In `src/design-system/components/FeedEntry.tsx`, find line 67:

```tsx
<div className={['font-mono text-[11px] font-semibold text-right pr-2 pt-1', toneTimeClasses[tone]].join(' ')}>
```

Replace with:

```tsx
<div className={['font-mono text-[11px] font-semibold text-right pr-2 pt-1 whitespace-pre-line', toneTimeClasses[tone]].join(' ')}>
```

- [ ] **Step 4: Run to verify all tests pass**

```
npx vitest run src/design-system/components/FeedEntry.test.tsx
```

Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/design-system/components/FeedEntry.tsx src/design-system/components/FeedEntry.test.tsx
git commit -m "feat(feed-entry): support multi-line timestamps via whitespace-pre-line"
```

---

## Task 3: Wire FeedPage to use `formatTimestamp`

**Files:**
- Modify: `src/features/transmissions/FeedPage.tsx`

- [ ] **Step 1: Remove the local `formatTime` function**

In `src/features/transmissions/FeedPage.tsx`, delete lines 44–46:

```ts
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
```

- [ ] **Step 2: Import `formatTimestamp` from time utils**

Find the existing imports at the top of `src/features/transmissions/FeedPage.tsx`. Add `formatTimestamp` to the import from the time utility:

```ts
import { formatTimestamp } from '../../shared/utils/time'
```

- [ ] **Step 3: Update the call site**

Find (around line 186 after removing `formatTime`):

```tsx
timestamp={formatTime(obs.recorded_at)}
```

Replace with:

```tsx
timestamp={formatTimestamp(obs.recorded_at)}
```

- [ ] **Step 4: Run the full FeedPage test suite**

```
npx vitest run src/features/transmissions/FeedPage.test.tsx
```

Expected: all 8 tests PASS (no regressions — existing tests use `new Date().toISOString()` for `recorded_at`, which is today, so `formatTimestamp` returns just `HH:MM` as before).

- [ ] **Step 5: Commit**

```bash
git add src/features/transmissions/FeedPage.tsx
git commit -m "refactor(feed): use shared formatTimestamp for entry timestamps"
```

---

## Task 4: Update PatientReportDocument — date in PDF table

**Files:**
- Modify: `src/features/pdf/PatientReportDocument.tsx`

- [ ] **Step 1: Replace `fmtTime` to include full date**

In `src/features/pdf/PatientReportDocument.tsx`, find lines 61–63:

```ts
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
```

Replace with:

```ts
function fmtTime(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${date}\n${time}`
}
```

In `fr-FR` locale this produces e.g. `"15/01/2026\n13:08"`. In react-pdf, `\n` inside a `Text` component renders as a visual line break.

- [ ] **Step 2: Widen the `colTime` style**

Find in the `StyleSheet.create({...})` block:

```ts
colTime:      { width: 40 },
```

Replace with:

```ts
colTime:      { width: 70 },
```

Width 70 accommodates `DD/MM/YYYY` (10 chars) at 8px font size.

- [ ] **Step 3: Update the column header**

Find in the table header section:

```tsx
<Text style={[S.colTime, S.headerCell]}>Heure</Text>
```

Replace with:

```tsx
<Text style={[S.colTime, S.headerCell]}>Date/Heure</Text>
```

- [ ] **Step 4: Run the full test suite**

```
npx vitest run
```

Expected: all 2070 tests PASS. (`PatientReportDocument` has no dedicated unit test; the suite verifies no regressions.)

- [ ] **Step 5: Commit**

```bash
git add src/features/pdf/PatientReportDocument.tsx
git commit -m "feat(pdf): show full date in observation table timestamp column"
```
