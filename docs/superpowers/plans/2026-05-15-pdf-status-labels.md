# PDF Status Labels — Shared Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace duplicated status label strings in two PDF documents and FeedPage with a single `STATUS_LABELS` constant in `status.ts`.

**Architecture:** Add `STATUS_LABELS` to the existing `src/shared/utils/status.ts` utility, then update `FeedPage.tsx`, `PatientReportDocument.tsx`, and `TourReportDocument.tsx` to import from it. Green maps to `null` (no badge rendered). Orange → `'Vigilance'`, Red → `'Urgent'`.

**Tech Stack:** TypeScript, React, `@react-pdf/renderer`, Vitest, Testing Library

---

## File Map

| File | Change |
|---|---|
| `src/shared/utils/status.ts` | Add `STATUS_LABELS` export |
| `src/shared/utils/status.test.ts` | Add `STATUS_LABELS` tests |
| `src/features/transmissions/FeedPage.tsx` | Import `STATUS_LABELS`, replace inline strings |
| `src/features/transmissions/FeedPage.test.tsx` | Add tag-label tests |
| `src/features/pdf/PatientReportDocument.tsx` | Remove local `STATUS_LABEL`, use `STATUS_LABELS`, conditional badge |
| `src/features/pdf/TourReportDocument.tsx` | Remove local `STATUS_LABEL`, use `STATUS_LABELS`, conditional badge |

---

## Task 1: Add STATUS_LABELS to status.ts

**Files:**
- Modify: `src/shared/utils/status.ts`
- Modify: `src/shared/utils/status.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/shared/utils/status.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { colorToTone, deriveStatusColor, STATUS_LABELS } from './status'

// existing describe blocks stay unchanged …

describe('STATUS_LABELS', () => {
  it('returns null for green',        () => expect(STATUS_LABELS.green).toBeNull())
  it('returns Vigilance for orange',  () => expect(STATUS_LABELS.orange).toBe('Vigilance'))
  it('returns Urgent for red',        () => expect(STATUS_LABELS.red).toBe('Urgent'))
})
```

- [ ] **Step 2: Run to verify the tests fail**

```
npx vitest run src/shared/utils/status.test.ts
```

Expected: FAIL — `STATUS_LABELS` is not exported from `./status`.

- [ ] **Step 3: Add STATUS_LABELS to status.ts**

Append after the existing exports in `src/shared/utils/status.ts`:

```ts
export const STATUS_LABELS: Record<'green' | 'orange' | 'red', string | null> = {
  green:  null,
  orange: 'Vigilance',
  red:    'Urgent',
}
```

- [ ] **Step 4: Run to verify the tests pass**

```
npx vitest run src/shared/utils/status.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/status.ts src/shared/utils/status.test.ts
git commit -m "feat(status): add STATUS_LABELS shared constant"
```

---

## Task 2: Update FeedPage to use STATUS_LABELS

**Files:**
- Modify: `src/features/transmissions/FeedPage.tsx`
- Modify: `src/features/transmissions/FeedPage.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add three tests inside the existing `describe('FeedPage', ...)` block in `src/features/transmissions/FeedPage.test.tsx`:

```ts
it('shows Vigilance tag for orange observation', async () => {
  await upsertPatient(patient)
  await upsertObservation(mkObs({ status_color: 'orange' }))
  renderPage()
  expect(await screen.findByText('Vigilance')).toBeInTheDocument()
})

it('shows Urgent tag for red observation', async () => {
  await upsertPatient(patient)
  await upsertObservation(mkObs({ status_color: 'red', pain: 5 }))
  renderPage()
  expect(await screen.findByText('Urgent')).toBeInTheDocument()
})

it('shows no status tag for green observation', async () => {
  await upsertPatient(patient)
  await upsertObservation(mkObs({ status_color: 'green', note_text: 'Tout va bien' }))
  renderPage()
  await screen.findByText(/tout va bien/i)
  expect(screen.queryByText('Vigilance')).not.toBeInTheDocument()
  expect(screen.queryByText('Urgent')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify the tests fail**

```
npx vitest run src/features/transmissions/FeedPage.test.tsx
```

Expected: the three new tests FAIL (the existing tests still pass).

- [ ] **Step 3: Update the import in FeedPage.tsx**

In `src/features/transmissions/FeedPage.tsx`, find the import line:

```ts
import { colorToTone } from '../../shared/utils/status'
```

Replace with:

```ts
import { colorToTone, STATUS_LABELS } from '../../shared/utils/status'
```

- [ ] **Step 4: Replace the inline tag expression**

Find the `tag={...}` prop (around line 191–197):

```tsx
tag={
  obs.status_color === 'red'
    ? { label: 'Urgent',    status: 'alert' }
    : obs.status_color === 'orange'
    ? { label: 'Vigilance', status: 'warn'  }
    : undefined
}
```

Replace with:

```tsx
tag={
  STATUS_LABELS[obs.status_color] != null
    ? { label: STATUS_LABELS[obs.status_color]!, status: colorToTone(obs.status_color) }
    : undefined
}
```

- [ ] **Step 5: Run to verify all tests pass**

```
npx vitest run src/features/transmissions/FeedPage.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/transmissions/FeedPage.tsx src/features/transmissions/FeedPage.test.tsx
git commit -m "refactor(feed): use STATUS_LABELS for tag labels"
```

---

## Task 3: Update PatientReportDocument to use STATUS_LABELS

**Files:**
- Modify: `src/features/pdf/PatientReportDocument.tsx`

- [ ] **Step 1: Add the import**

In `src/features/pdf/PatientReportDocument.tsx`, add to the existing imports:

```ts
import { STATUS_LABELS } from '../../shared/utils/status'
```

- [ ] **Step 2: Remove the local STATUS_LABEL constant**

Delete this line:

```ts
const STATUS_LABEL: Record<string, string> = { green: 'VERT',    orange: 'ORANGE',   red: 'ROUGE' }
```

- [ ] **Step 3: Make the status badge conditional**

Find the badge View in the badge strip (it is the first child of the `badgeStrip` View):

```tsx
<View style={[S.chip, { backgroundColor: STATUS_BG[statusColor] }]}>
  <Text style={{ fontSize: 9, color: STATUS_FG[statusColor] }}>
    {STATUS_LABEL[statusColor]}
  </Text>
</View>
```

Replace with:

```tsx
{STATUS_LABELS[statusColor] != null && (
  <View style={[S.chip, { backgroundColor: STATUS_BG[statusColor] }]}>
    <Text style={{ fontSize: 9, color: STATUS_FG[statusColor] }}>
      {STATUS_LABELS[statusColor]}
    </Text>
  </View>
)}
```

- [ ] **Step 4: Run the full test suite**

```
npx vitest run
```

Expected: all tests PASS. (PatientReportDocument has no dedicated unit test; the suite verifies no regressions in the PDF export hook.)

- [ ] **Step 5: Commit**

```bash
git add src/features/pdf/PatientReportDocument.tsx
git commit -m "refactor(pdf): use shared STATUS_LABELS in PatientReportDocument"
```

---

## Task 4: Update TourReportDocument to use STATUS_LABELS

**Files:**
- Modify: `src/features/pdf/TourReportDocument.tsx`

- [ ] **Step 1: Add the import**

In `src/features/pdf/TourReportDocument.tsx`, add to the existing imports:

```ts
import { STATUS_LABELS } from '../../shared/utils/status'
```

- [ ] **Step 2: Remove the local STATUS_LABEL constant**

Delete this line:

```ts
const STATUS_LABEL:  Record<string, string> = { green: 'VERT',    orange: 'ORANGE',   red: 'ROUGE' }
```

- [ ] **Step 3: Make the badge conditional in each patient card**

Find the badge View inside the `sorted.map(...)` render:

```tsx
<View style={[S.badge, { backgroundColor: STATUS_BG[color] }]}>
  <Text style={[S.badgeText, { color: STATUS_FG[color] }]}>
    {STATUS_LABEL[color]}
  </Text>
</View>
```

Replace with:

```tsx
{STATUS_LABELS[color] != null && (
  <View style={[S.badge, { backgroundColor: STATUS_BG[color] }]}>
    <Text style={[S.badgeText, { color: STATUS_FG[color] }]}>
      {STATUS_LABELS[color]}
    </Text>
  </View>
)}
```

- [ ] **Step 4: Run the full test suite**

```
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/pdf/TourReportDocument.tsx
git commit -m "refactor(pdf): use shared STATUS_LABELS in TourReportDocument"
```
