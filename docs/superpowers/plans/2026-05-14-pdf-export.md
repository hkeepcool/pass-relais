# PDF Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add offline-capable client-side PDF export — single-patient transmission report from FeedPage and full-tour shift handoff from PatientListPage, delivered via native share sheet (mobile) or auto-download (desktop).

**Architecture:** `@react-pdf/renderer` renders a React component tree (its own DSL, not Tailwind/HTML) to a PDF blob entirely in the browser. A `usePdfExport` hook fetches data from IndexedDB, filters by shift window, renders the blob, and calls a `sharePdf` utility that tries `navigator.share` then falls back to `<a download>`. An `ExportModal` bottom sheet collects the shift window preference.

**Tech Stack:** `@react-pdf/renderer` v3, React 18, Vitest + `@testing-library/react`, fake-indexeddb (already shimmed in `src/test/setup.ts`)

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `src/features/pdf/pdfUtils.ts` | Create | `ShiftWindow` type + pure helpers: `windowStart`, `formatWindowLabel`, `toSlug`, `todayISO` |
| `src/features/pdf/sharePdf.ts` | Create | Share blob via `navigator.share` → fallback `<a download>` |
| `src/features/pdf/PatientReportDocument.tsx` | Create | PDF DSL component — single patient (badge strip + summary + table) |
| `src/features/pdf/TourReportDocument.tsx` | Create | PDF DSL component — full tour (alerts + patient cards by severity) |
| `src/features/pdf/usePdfExport.tsx` | Create | Hook — fetch IndexedDB, filter window, render blob, call sharePdf |
| `src/features/pdf/ExportModal.tsx` | Create | Bottom-sheet UI — window selector (presets + custom datetime) + generate button |
| `src/features/pdf/index.ts` | Create | Barrel: `ExportModal`, `usePdfExport` |
| `src/features/transmissions/FeedPage.tsx` | Modify | Add "Exporter PDF" ghost button + `ExportModal` |
| `src/features/patients/PatientListPage.tsx` | Modify | Add "Rapport de garde" ghost button + `ExportModal` |

---

## Task 1: Install @react-pdf/renderer

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the dependency**

```bash
npm install @react-pdf/renderer
```

- [ ] **Step 2: Verify it resolves**

```bash
node -e "require('@react-pdf/renderer')" && echo OK
```
Expected: `OK` (no error).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @react-pdf/renderer dependency"
```

---

## Task 2: pdfUtils — shift window helpers (TDD)

**Files:**
- Create: `src/features/pdf/pdfUtils.ts`
- Test: `src/features/pdf/pdfUtils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/features/pdf/pdfUtils.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
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
})

describe('todayISO', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('formatWindowLabel', () => {
  it('returns a string containing an arrow', () => {
    expect(formatWindowLabel({ preset: 12 })).toContain('→')
  })

  it('accepts a since window', () => {
    expect(formatWindowLabel({ since: new Date() })).toContain('→')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/features/pdf/pdfUtils.test.ts
```
Expected: fail with "Cannot find module './pdfUtils'".

- [ ] **Step 3: Implement pdfUtils.ts**

Create `src/features/pdf/pdfUtils.ts`:

```ts
export type ShiftWindow =
  | { preset: 8 | 10 | 12 | 24 }
  | { since: Date }

export function windowStart(w: ShiftWindow): Date {
  if ('preset' in w) return new Date(Date.now() - w.preset * 3_600_000)
  return w.since
}

export function formatWindowLabel(w: ShiftWindow): string {
  const since = windowStart(w)
  const now   = new Date()
  const fmt   = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `Garde ${fmt(since)} → ${fmt(now)}`
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]!
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/features/pdf/pdfUtils.test.ts
```
Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/pdf/pdfUtils.ts src/features/pdf/pdfUtils.test.ts
git commit -m "feat(pdf): add shift window helpers (pdfUtils)"
```

---

## Task 3: sharePdf — share/download utility (TDD)

**Files:**
- Create: `src/features/pdf/sharePdf.ts`
- Test: `src/features/pdf/sharePdf.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/features/pdf/sharePdf.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sharePdf } from './sharePdf'

const blob     = new Blob(['%PDF'], { type: 'application/pdf' })
const filename = 'test.pdf'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('sharePdf — share path', () => {
  it('calls navigator.share when canShare returns true', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn().mockReturnValue(true), configurable: true,
    })
    Object.defineProperty(navigator, 'share', {
      value: shareMock, configurable: true,
    })

    await sharePdf(blob, filename)

    expect(shareMock).toHaveBeenCalledOnce()
    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: filename }),
    )
  })

  it('swallows AbortError silently (user dismissed share sheet)', async () => {
    const err  = new Error('cancelled')
    err.name   = 'AbortError'
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn().mockReturnValue(true), configurable: true,
    })
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockRejectedValue(err), configurable: true,
    })

    await expect(sharePdf(blob, filename)).resolves.toBeUndefined()
  })
})

describe('sharePdf — download fallback', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn().mockReturnValue(false), configurable: true,
    })
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn().mockReturnValue('blob:mock'), configurable: true,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(), configurable: true,
    })
  })

  it('clicks a hidden anchor and revokes the object URL', async () => {
    const clickMock = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '', download: '', click: clickMock,
    } as unknown as HTMLAnchorElement)

    await sharePdf(blob, filename)

    expect(clickMock).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })

  it('falls back to download when canShare is undefined', async () => {
    Object.defineProperty(navigator, 'canShare', {
      value: undefined, configurable: true,
    })
    const clickMock = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '', download: '', click: clickMock,
    } as unknown as HTMLAnchorElement)

    await sharePdf(blob, filename)

    expect(clickMock).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/features/pdf/sharePdf.test.ts
```
Expected: fail with "Cannot find module './sharePdf'".

- [ ] **Step 3: Implement sharePdf.ts**

Create `src/features/pdf/sharePdf.ts`:

```ts
export async function sharePdf(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: 'application/pdf' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      throw err
    }
    return
  }

  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/features/pdf/sharePdf.test.ts
```
Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/pdf/sharePdf.ts src/features/pdf/sharePdf.test.ts
git commit -m "feat(pdf): add sharePdf utility (share sheet + download fallback)"
```

---

## Task 4: PatientReportDocument — single-patient PDF component

`@react-pdf/renderer` uses its own DSL — `Document`, `Page`, `View`, `Text` from the library. Regular HTML elements (`div`, `p`, `span`) do not work inside these components. Tailwind classes do not work; all styles use `StyleSheet.create`.

**Files:**
- Create: `src/features/pdf/PatientReportDocument.tsx`

No unit test for this task — `@react-pdf/renderer` doesn't render to jsdom. Visual correctness is verified by opening the app and generating a real PDF.

- [ ] **Step 1: Create PatientReportDocument.tsx**

Create `src/features/pdf/PatientReportDocument.tsx`:

```tsx
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { Patient, Observation } from '../../shared/db/schema'
import { summarizeObservations } from '../../shared/utils/summarize'

export interface PatientReportProps {
  patient:     Patient
  observations: Observation[]
  nurseName:   string
  windowLabel: string
  exportDate:  string
}

const C = {
  brand:       '#38bdf8',
  bg:          '#0f172a',
  surface:     '#1e293b',
  border:      '#334155',
  ink:         '#e2e8f0',
  inkMute:     '#94a3b8',
  inkSub:      '#cbd5e1',
  green:       '#166534',
  greenFg:     '#bbf7d0',
  orange:      '#92400e',
  orangeFg:    '#fde68a',
  red:         '#7f1d1d',
  redFg:       '#fca5a5',
  amber:       '#fbbf24',
}

const S = StyleSheet.create({
  page:         { backgroundColor: C.bg, color: C.ink, fontFamily: 'Helvetica', padding: 32, fontSize: 10 },
  header:       { borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: 'solid', paddingBottom: 8, marginBottom: 12 },
  title:        { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.brand, marginBottom: 2 },
  subtitle:     { fontSize: 9, color: C.inkMute, marginBottom: 1 },
  badgeStrip:   { flexDirection: 'row', marginBottom: 10, flexWrap: 'wrap' },
  chip:         { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 5, marginBottom: 4 },
  chipMuted:    { backgroundColor: C.surface },
  chipMutedFg:  { fontSize: 9, color: C.inkMute },
  summaryBox:   { backgroundColor: C.surface, borderLeftWidth: 3, borderLeftColor: C.brand, borderLeftStyle: 'solid', padding: 8, marginBottom: 12, borderRadius: 2 },
  summaryLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.brand, marginBottom: 3 },
  summaryText:  { fontSize: 9, color: C.inkSub, lineHeight: 1.5 },
  sectionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.inkMute, marginBottom: 4, letterSpacing: 0.5 },
  tableHeader:  { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: 'solid', paddingBottom: 3, marginBottom: 3 },
  tableRow:     { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.surface, borderBottomStyle: 'solid', paddingVertical: 3 },
  headerCell:   { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.inkMute },
  cell:         { fontSize: 8, color: C.ink },
  cellMute:     { fontSize: 8, color: C.inkMute },
  cellAmber:    { fontSize: 8, color: C.amber },
  colTime:      { width: 40 },
  colSm:        { width: 36 },
  colMd:        { width: 60 },
  colNote:      { flex: 1 },
  footer:       { position: 'absolute', bottom: 16, left: 32, right: 32, borderTopWidth: 1, borderTopColor: C.border, borderTopStyle: 'solid', paddingTop: 4 },
  footerText:   { fontSize: 8, color: C.inkMute },
})

const STATUS_BG:    Record<string, string> = { green: C.green,   orange: C.orange,   red: C.red   }
const STATUS_FG:    Record<string, string> = { green: C.greenFg, orange: C.orangeFg, red: C.redFg }
const STATUS_LABEL: Record<string, string> = { green: 'VERT',    orange: 'ORANGE',   red: 'ROUGE' }
const SLEEP_FR:  Record<string, string> = { rested: 'Reposé',  agitated: 'Agité',   insomnia: 'Insomnie' }
const APP_FR:    Record<string, string> = { normal: 'Normal',  low: 'Faible',       refused: 'Refus'     }
const MOOD_FR:   Record<string, string> = { stable: 'Stable',  confused: 'Confus',  anxious: 'Anxieux'   }

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function truncate(s: string, n = 60): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}

export function PatientReportDocument({
  patient, observations, nurseName, windowLabel, exportDate,
}: PatientReportProps) {
  const sorted = [...observations].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
  const latest = sorted[0]
  const statusColor = latest?.status_color ?? 'green'
  const lastPain    = sorted.find(o => o.pain            != null)?.pain
  const lastSleep   = sorted.find(o => o.sleep           != null)?.sleep
  const lastApp     = sorted.find(o => o.appetite        != null)?.appetite
  const summary     = summarizeObservations(observations)

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>Pass-Relais</Text>
          <Text style={S.subtitle}>Transmission — {patient.full_name}</Text>
          <Text style={S.subtitle}>{nurseName} · {exportDate} · {windowLabel}</Text>
          {patient.birth_date && (
            <Text style={S.subtitle}>Né(e) le {patient.birth_date} · {patient.care_level}</Text>
          )}
        </View>

        {/* Badge strip */}
        <View style={S.badgeStrip}>
          <View style={[S.chip, { backgroundColor: STATUS_BG[statusColor] }]}>
            <Text style={{ fontSize: 9, color: STATUS_FG[statusColor] }}>
              {STATUS_LABEL[statusColor]}
            </Text>
          </View>
          {lastPain != null && (
            <View style={[S.chip, S.chipMuted]}>
              <Text style={S.chipMutedFg}>Douleur {lastPain}/5</Text>
            </View>
          )}
          {lastSleep != null && (
            <View style={[S.chip, S.chipMuted]}>
              <Text style={S.chipMutedFg}>{SLEEP_FR[lastSleep]}</Text>
            </View>
          )}
          {lastApp != null && (
            <View style={[S.chip, S.chipMuted]}>
              <Text style={S.chipMutedFg}>{APP_FR[lastApp]}</Text>
            </View>
          )}
        </View>

        {/* AI summary */}
        {observations.length > 0 && (
          <View style={S.summaryBox}>
            <Text style={S.summaryLabel}>RÉSUMÉ</Text>
            <Text style={S.summaryText}>{summary.text}</Text>
          </View>
        )}

        {/* Observation table */}
        <Text style={S.sectionLabel}>OBSERVATIONS ({sorted.length})</Text>
        <View style={S.tableHeader}>
          <Text style={[S.colTime, S.headerCell]}>Heure</Text>
          <Text style={[S.colMd,   S.headerCell]}>Sommeil</Text>
          <Text style={[S.colMd,   S.headerCell]}>Appétit</Text>
          <Text style={[S.colSm,   S.headerCell]}>Douleur</Text>
          <Text style={[S.colMd,   S.headerCell]}>Humeur</Text>
          <Text style={[S.colSm,   S.headerCell]}>Selles</Text>
          <Text style={[S.colNote, S.headerCell]}>Note</Text>
        </View>
        {sorted.map((obs) => (
          <View key={obs.id} style={S.tableRow} wrap={false}>
            <Text style={[S.colTime, S.cellMute]}>{fmtTime(obs.recorded_at)}</Text>
            <Text style={[S.colMd,   S.cell]}>{obs.sleep     ? SLEEP_FR[obs.sleep]     : '—'}</Text>
            <Text style={[S.colMd,   S.cell]}>{obs.appetite  ? APP_FR[obs.appetite]    : '—'}</Text>
            <Text style={[S.colSm,   S.cell]}>{obs.pain      != null ? `${obs.pain}/5` : '—'}</Text>
            <Text style={[S.colMd,   S.cell]}>{obs.mood      ? MOOD_FR[obs.mood]       : '—'}</Text>
            <Text style={[S.colSm,   S.cell]}>
              {obs.bowel_movements != null
                ? (obs.bowel_movements === 3 ? '3+' : String(obs.bowel_movements))
                : '—'}
            </Text>
            <Text style={[S.colNote, obs.note_text ? S.cellAmber : S.cellMute]}>
              {obs.note_text ? truncate(obs.note_text) : '—'}
            </Text>
          </View>
        ))}

        {/* Footer */}
        <Text
          style={[S.footer, S.footerText]}
          fixed
          render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Généré le ${exportDate} par Pass-Relais · ${pageNumber}/${totalPages}`
          }
        />
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/pdf/PatientReportDocument.tsx
git commit -m "feat(pdf): add PatientReportDocument PDF component"
```

---

## Task 5: TourReportDocument — full-tour PDF component

**Files:**
- Create: `src/features/pdf/TourReportDocument.tsx`

No unit test — same rationale as Task 4.

- [ ] **Step 1: Create TourReportDocument.tsx**

Create `src/features/pdf/TourReportDocument.tsx`:

```tsx
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { Patient, Observation } from '../../shared/db/schema'

export interface PatientSummary {
  patient:      Patient
  observations: Observation[]
}

export interface TourReportProps {
  patientSummaries: PatientSummary[]
  nurseName:        string
  windowLabel:      string
  exportDate:       string
}

const C = {
  brand:    '#38bdf8',
  bg:       '#0f172a',
  surface:  '#1e293b',
  border:   '#334155',
  ink:      '#e2e8f0',
  inkMute:  '#94a3b8',
  green:    '#166534', greenFg: '#bbf7d0',
  orange:   '#92400e', orangeFg: '#fde68a',
  red:      '#7f1d1d', redFg: '#fca5a5',
  redAlert: '#450a0a',
  amber:    '#fbbf24',
}

const S = StyleSheet.create({
  page:        { backgroundColor: C.bg, color: C.ink, fontFamily: 'Helvetica', padding: 32, fontSize: 10 },
  header:      { borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: 'solid', paddingBottom: 8, marginBottom: 12 },
  title:       { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.brand, marginBottom: 2 },
  subtitle:    { fontSize: 9, color: C.inkMute },
  alertBox:    { backgroundColor: C.redAlert, borderRadius: 4, padding: 8, marginBottom: 10 },
  alertTitle:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.redFg, marginBottom: 4 },
  alertRow:    { fontSize: 9, color: '#fecaca', marginBottom: 2 },
  cardRow:     { flexDirection: 'row', alignItems: 'center', borderRadius: 4, borderLeftWidth: 3, padding: 7, marginBottom: 5 },
  cardName:    { fontSize: 10, fontFamily: 'Helvetica-Bold', flex: 1, color: C.ink },
  badge:       { borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2, marginRight: 6 },
  badgeText:   { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  cardMeta:    { fontSize: 8, color: C.inkMute, marginTop: 1 },
  footer:      { position: 'absolute', bottom: 16, left: 32, right: 32, borderTopWidth: 1, borderTopColor: C.border, borderTopStyle: 'solid', paddingTop: 4 },
  footerText:  { fontSize: 8, color: C.inkMute },
  sectionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.inkMute, marginBottom: 6, letterSpacing: 0.5 },
})

const STATUS_BG:     Record<string, string> = { green: C.green,   orange: C.orange,   red: C.red   }
const STATUS_FG:     Record<string, string> = { green: C.greenFg, orange: C.orangeFg, red: C.redFg }
const STATUS_LABEL:  Record<string, string> = { green: 'VERT',    orange: 'ORANGE',   red: 'ROUGE' }
const STATUS_BORDER: Record<string, string> = { green: '#22c55e', orange: '#f59e0b',  red: '#ef4444' }
const SEVERITY:      Record<string, number> = { red: 0, orange: 1, green: 2 }
const SLEEP_FR:  Record<string, string> = { rested: 'Reposé',  agitated: 'Agité',   insomnia: 'Insomnie' }
const MOOD_FR:   Record<string, string> = { stable: 'Stable',  confused: 'Confus',  anxious: 'Anxieux'   }

function worstColor(obs: Observation[]): 'red' | 'orange' | 'green' {
  if (obs.some(o => o.status_color === 'red'))    return 'red'
  if (obs.some(o => o.status_color === 'orange')) return 'orange'
  return 'green'
}

function latest<K extends keyof Observation>(obs: Observation[], key: K): Observation[K] | null {
  return [...obs]
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
    .find(o => o[key] != null)?.[key] ?? null
}

export function TourReportDocument({
  patientSummaries, nurseName, windowLabel, exportDate,
}: TourReportProps) {
  const sorted = [...patientSummaries].sort(
    (a, b) => SEVERITY[worstColor(a.observations)]! - SEVERITY[worstColor(b.observations)]!,
  )
  const alerts = sorted.filter(
    ps => worstColor(ps.observations) === 'red' || worstColor(ps.observations) === 'orange',
  )

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>Pass-Relais — Rapport de garde</Text>
          <Text style={S.subtitle}>{nurseName} · {exportDate} · {windowLabel}</Text>
          <Text style={S.subtitle}>{sorted.length} patient{sorted.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* Alert block */}
        {alerts.length > 0 && (
          <View style={S.alertBox}>
            <Text style={S.alertTitle}>⚠ ALERTES ({alerts.length})</Text>
            {alerts.map(({ patient, observations }) => {
              const pain = latest(observations, 'pain')
              const note = [...observations]
                .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
                .find(o => o.note_text)?.note_text
              return (
                <Text key={patient.id} style={S.alertRow}>
                  {patient.full_name}
                  {pain != null ? ` — Douleur ${pain}/5` : ''}
                  {note ? ` — "${note.slice(0, 50)}"` : ''}
                </Text>
              )
            })}
          </View>
        )}

        {/* Patient cards */}
        <Text style={S.sectionLabel}>PATIENTS ({sorted.length})</Text>
        {sorted.map(({ patient, observations }) => {
          const color    = worstColor(observations)
          const pain     = latest(observations, 'pain')
          const sleep    = latest(observations, 'sleep')
          const mood     = latest(observations, 'mood')
          const metaParts: string[] = []
          if (sleep != null) metaParts.push(SLEEP_FR[sleep] ?? sleep)
          if (pain  != null) metaParts.push(`Douleur ${pain}/5`)
          if (mood  != null) metaParts.push(MOOD_FR[mood] ?? mood)

          return (
            <View
              key={patient.id}
              style={[S.cardRow, { backgroundColor: C.surface, borderLeftColor: STATUS_BORDER[color] }]}
              wrap={false}
            >
              <View style={{ flex: 1 }}>
                <Text style={S.cardName}>{patient.full_name}</Text>
                {metaParts.length > 0 && (
                  <Text style={S.cardMeta}>{metaParts.join(' · ')}</Text>
                )}
              </View>
              <View style={[S.badge, { backgroundColor: STATUS_BG[color] }]}>
                <Text style={[S.badgeText, { color: STATUS_FG[color] }]}>
                  {STATUS_LABEL[color]}
                </Text>
              </View>
            </View>
          )
        })}

        {/* Footer */}
        <Text
          style={[S.footer, S.footerText]}
          fixed
          render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Généré le ${exportDate} par Pass-Relais · ${pageNumber}/${totalPages}`
          }
        />
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/pdf/TourReportDocument.tsx
git commit -m "feat(pdf): add TourReportDocument PDF component"
```

---

## Task 6: usePdfExport hook (TDD)

**Files:**
- Create: `src/features/pdf/usePdfExport.tsx`
- Test: `src/features/pdf/usePdfExport.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/features/pdf/usePdfExport.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { resetDbForTests } from '../../shared/db/schema'
import { upsertPatient } from '../../shared/db/patients.db'
import { upsertObservation } from '../../shared/db/observations.db'
import type { Patient, Observation } from '../../shared/db/schema'

vi.mock('@react-pdf/renderer', () => ({
  pdf: vi.fn(() => ({ toBlob: vi.fn().mockResolvedValue(new Blob(['%PDF'])) })),
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page:     ({ children }: { children: React.ReactNode }) => children,
  View:     ({ children }: { children: React.ReactNode }) => children,
  Text:     ({ children }: { children: React.ReactNode }) => children,
  StyleSheet: { create: (s: unknown) => s },
}))

vi.mock('./sharePdf', () => ({ sharePdf: vi.fn() }))

vi.mock('../auth/useAuth', () => ({
  useAuth: vi.fn(() => ({
    session: { user: { email: 'nurse@test.com', user_metadata: {}, id: 'u1' } },
    state: 'authenticated',
    signOut: vi.fn(),
  })),
}))

vi.mock('./PatientReportDocument', () => ({ PatientReportDocument: () => null }))
vi.mock('./TourReportDocument',    () => ({ TourReportDocument: () => null }))

import { usePdfExport } from './usePdfExport'
import { sharePdf } from './sharePdf'
import { pdf } from '@react-pdf/renderer'
import type { PatientSummary } from './TourReportDocument'
const mockSharePdf = vi.mocked(sharePdf)
const mockPdf      = vi.mocked(pdf)

const mkPatient = (id: string, name: string): Patient => ({
  id, full_name: name, birth_date: null, care_level: 'standard',
  created_by: 'u1', created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z',
})

const mkObs = (id: string, patientId: string, hoursAgo: number, overrides: Partial<Observation> = {}): Observation => ({
  id, patient_id: patientId, caregiver_id: 'u1',
  recorded_at: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
  updated_at: new Date().toISOString(),
  sleep: 'rested', appetite: 'normal', pain: 1, mood: 'stable',
  bowel_movements: null, bowel_note: null,
  note_text: null, note_audio_url: null,
  status_color: 'green',
  ...overrides,
})

describe('usePdfExport — patient type', () => {
  beforeEach(async () => {
    await resetDbForTests()
    vi.clearAllMocks()
    await upsertPatient(mkPatient('p1', 'Martin Dupont'))
    await upsertObservation(mkObs('o1', 'p1', 2))   // 2h ago — inside 8h window
    await upsertObservation(mkObs('o2', 'p1', 10))  // 10h ago — outside 8h window
  })

  it('calls pdf() once and sharePdf with a matching filename', async () => {
    const { result } = renderHook(() => usePdfExport('patient', 'p1'))
    await act(async () => { await result.current.generate({ preset: 8 }) })
    expect(mockPdf).toHaveBeenCalledOnce()
    expect(mockSharePdf).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/^transmission-martin-dupont-\d{4}-\d{2}-\d{2}\.pdf$/),
    )
  })

  it('passes only in-window observations to PatientReportDocument', async () => {
    const { result } = renderHook(() => usePdfExport('patient', 'p1'))
    await act(async () => { await result.current.generate({ preset: 8 }) })
    const docProps = mockPdf.mock.calls[0]![0].props as { observations: Observation[] }
    expect(docProps.observations).toHaveLength(1)
    expect(docProps.observations[0].id).toBe('o1')
  })

  it('accepts a custom since window', async () => {
    const since = new Date(Date.now() - 3 * 3_600_000) // 3h ago — only o1 qualifies
    const { result } = renderHook(() => usePdfExport('patient', 'p1'))
    await act(async () => { await result.current.generate({ since }) })
    const docProps = mockPdf.mock.calls[0]![0].props as { observations: Observation[] }
    expect(docProps.observations).toHaveLength(1)
  })

  it('is false before and after generating, true during', async () => {
    const { result } = renderHook(() => usePdfExport('patient', 'p1'))
    expect(result.current.isGenerating).toBe(false)
    await act(async () => { await result.current.generate({ preset: 8 }) })
    expect(result.current.isGenerating).toBe(false)
  })
})

describe('usePdfExport — tour type', () => {
  beforeEach(async () => {
    await resetDbForTests()
    vi.clearAllMocks()
    await upsertPatient(mkPatient('p1', 'Dupont Martin'))
    await upsertPatient(mkPatient('p2', 'Bernard Claire'))
    await upsertObservation(mkObs('o1', 'p1', 2))   // p1 has obs in 8h window
    await upsertObservation(mkObs('o2', 'p2', 20))  // p2 obs outside window
  })

  it('excludes patients with no observations in the window', async () => {
    const { result } = renderHook(() => usePdfExport('tour'))
    await act(async () => { await result.current.generate({ preset: 8 }) })
    const docProps = mockPdf.mock.calls[0]![0].props as { patientSummaries: PatientSummary[] }
    expect(docProps.patientSummaries).toHaveLength(1)
    expect(docProps.patientSummaries[0].patient.id).toBe('p1')
  })

  it('uses rapport-garde filename', async () => {
    const { result } = renderHook(() => usePdfExport('tour'))
    await act(async () => { await result.current.generate({ preset: 8 }) })
    expect(mockSharePdf).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/^rapport-garde-\d{4}-\d{2}-\d{2}\.pdf$/),
    )
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/features/pdf/usePdfExport.test.tsx
```
Expected: fail with "Cannot find module './usePdfExport'".

- [ ] **Step 3: Implement usePdfExport.tsx**

Create `src/features/pdf/usePdfExport.tsx`:

```tsx
import { useState, useCallback } from 'react'
import { pdf } from '@react-pdf/renderer'
import { getObservationsByPatient } from '../../shared/db/observations.db'
import { getAllPatients, getPatient } from '../../shared/db/patients.db'
import { useAuth } from '../auth/useAuth'
import { sharePdf } from './sharePdf'
import { PatientReportDocument } from './PatientReportDocument'
import { TourReportDocument } from './TourReportDocument'
import { windowStart, formatWindowLabel, toSlug, todayISO } from './pdfUtils'
import type { ShiftWindow } from './pdfUtils'
import type { PatientSummary } from './TourReportDocument'

export type { ShiftWindow }

export function usePdfExport(type: 'patient' | 'tour', patientId?: string) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { session } = useAuth()

  const generate = useCallback(async (window: ShiftWindow) => {
    setIsGenerating(true)
    try {
      const nurseName   = (session?.user.user_metadata?.full_name as string | undefined)
        ?? session?.user.email
        ?? 'Infirmier(ère)'
      const since       = windowStart(window)
      const windowLabel = formatWindowLabel(window)
      const exportDate  = todayISO()

      if (type === 'patient' && patientId) {
        const [allObs, patient] = await Promise.all([
          getObservationsByPatient(patientId),
          getPatient(patientId),
        ])
        if (!patient) throw new Error(`Patient ${patientId} not found in IndexedDB`)
        const observations = allObs.filter(o => new Date(o.recorded_at) >= since)
        const blob = await pdf(
          <PatientReportDocument
            patient={patient}
            observations={observations}
            nurseName={nurseName}
            windowLabel={windowLabel}
            exportDate={exportDate}
          />
        ).toBlob()
        await sharePdf(blob, `transmission-${toSlug(patient.full_name)}-${exportDate}.pdf`)
      } else {
        const patients = await getAllPatients()
        const summaries: PatientSummary[] = await Promise.all(
          patients.map(async (p) => {
            const allObs = await getObservationsByPatient(p.id)
            return {
              patient: p,
              observations: allObs.filter(o => new Date(o.recorded_at) >= since),
            }
          }),
        )
        const patientSummaries = summaries.filter(ps => ps.observations.length > 0)
        const blob = await pdf(
          <TourReportDocument
            patientSummaries={patientSummaries}
            nurseName={nurseName}
            windowLabel={windowLabel}
            exportDate={exportDate}
          />
        ).toBlob()
        await sharePdf(blob, `rapport-garde-${exportDate}.pdf`)
      }
    } finally {
      setIsGenerating(false)
    }
  }, [type, patientId, session])

  return { generate, isGenerating }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/features/pdf/usePdfExport.test.tsx
```
Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/pdf/usePdfExport.tsx src/features/pdf/usePdfExport.test.tsx
git commit -m "feat(pdf): add usePdfExport hook"
```

---

## Task 7: ExportModal component (TDD)

**Files:**
- Create: `src/features/pdf/ExportModal.tsx`
- Test: `src/features/pdf/ExportModal.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/features/pdf/ExportModal.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetDbForTests } from '../../shared/db/schema'
import { upsertPatient } from '../../shared/db/patients.db'
import { upsertObservation } from '../../shared/db/observations.db'
import type { Patient, Observation } from '../../shared/db/schema'

const mockGenerate = vi.fn().mockResolvedValue(undefined)
vi.mock('./usePdfExport', () => ({
  usePdfExport: vi.fn(() => ({ generate: mockGenerate, isGenerating: false })),
}))

import { ExportModal } from './ExportModal'

const mkPatient = (id: string): Patient => ({
  id, full_name: 'Test Patient', birth_date: null, care_level: 'standard',
  created_by: 'u1', created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z',
})

const mkObs = (id: string, patientId: string, hoursAgo: number): Observation => ({
  id, patient_id: patientId, caregiver_id: 'u1',
  recorded_at: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
  updated_at: new Date().toISOString(),
  sleep: 'rested', appetite: 'normal', pain: 1, mood: 'stable',
  bowel_movements: null, bowel_note: null,
  note_text: null, note_audio_url: null,
  status_color: 'green',
})

describe('ExportModal — patient type', () => {
  const onClose = vi.fn()

  beforeEach(async () => {
    await resetDbForTests()
    vi.clearAllMocks()
  })

  it('disables Générer and shows warning when no observations in window', async () => {
    await upsertPatient(mkPatient('p1'))
    // Observation outside all preset windows
    await upsertObservation(mkObs('o1', 'p1', 30))

    render(<ExportModal type="patient" patientId="p1" onClose={onClose} />)

    const btn = await screen.findByRole('button', { name: /générer/i })
    expect(btn).toBeDisabled()
    expect(await screen.findByText(/aucune observation/i)).toBeInTheDocument()
  })

  it('enables Générer when observations exist in the selected window', async () => {
    await upsertPatient(mkPatient('p1'))
    await upsertObservation(mkObs('o1', 'p1', 2)) // within default 12h preset

    render(<ExportModal type="patient" patientId="p1" onClose={onClose} />)

    const btn = await screen.findByRole('button', { name: /générer/i })
    await waitFor(() => expect(btn).not.toBeDisabled())
  })

  it('calls generate with the selected preset window and then onClose', async () => {
    await upsertPatient(mkPatient('p1'))
    await upsertObservation(mkObs('o1', 'p1', 2))

    render(<ExportModal type="patient" patientId="p1" onClose={onClose} />)

    const btn = await screen.findByRole('button', { name: /générer/i })
    await waitFor(() => expect(btn).not.toBeDisabled())
    await userEvent.click(btn)
    await waitFor(() => expect(mockGenerate).toHaveBeenCalledOnce())
    expect(mockGenerate).toHaveBeenCalledWith({ preset: 12 })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the × button is clicked', async () => {
    await upsertPatient(mkPatient('p1'))

    render(<ExportModal type="patient" patientId="p1" onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/features/pdf/ExportModal.test.tsx
```
Expected: fail with "Cannot find module './ExportModal'".

- [ ] **Step 3: Implement ExportModal.tsx**

Create `src/features/pdf/ExportModal.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { getObservationsByPatient } from '../../shared/db/observations.db'
import { getAllPatients } from '../../shared/db/patients.db'
import { usePdfExport } from './usePdfExport'
import { windowStart } from './pdfUtils'
import type { ShiftWindow } from './pdfUtils'

type PresetHours = 8 | 10 | 12 | 24
const PRESETS: PresetHours[] = [8, 10, 12, 24]

export interface ExportModalProps {
  type:       'patient' | 'tour'
  patientId?: string
  onClose:    () => void
}

export function ExportModal({ type, patientId, onClose }: ExportModalProps) {
  const [preset,      setPreset]      = useState<PresetHours>(12)
  const [useCustom,   setUseCustom]   = useState(false)
  const [customSince, setCustomSince] = useState('')
  const [obsCount,    setObsCount]    = useState<number | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const { generate, isGenerating }    = usePdfExport(type, patientId)

  const currentWindow: ShiftWindow = useCustom && customSince
    ? { since: new Date(customSince) }
    : { preset }

  // Count observations in the current window
  useEffect(() => {
    let cancelled = false
    if (useCustom && !customSince) { setObsCount(null); return }

    const since = windowStart(currentWindow)

    const count = async () => {
      if (type === 'patient' && patientId) {
        const obs = await getObservationsByPatient(patientId)
        if (!cancelled)
          setObsCount(obs.filter(o => new Date(o.recorded_at) >= since).length)
      } else {
        const patients = await getAllPatients()
        const counts   = await Promise.all(
          patients.map(p =>
            getObservationsByPatient(p.id).then(obs =>
              obs.filter(o => new Date(o.recorded_at) >= since).length,
            ),
          ),
        )
        if (!cancelled) setObsCount(counts.reduce((a, b) => a + b, 0))
      }
    }

    setObsCount(null)
    void count()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, useCustom, customSince, type, patientId])

  const isReady = obsCount !== null && obsCount > 0

  async function handleGenerate() {
    try {
      await generate(currentWindow)
      onClose()
    } catch {
      setError('Erreur lors de la génération du PDF')
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={isGenerating ? undefined : onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl px-5 py-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            {type === 'patient' ? 'Exporter la transmission' : 'Rapport de garde'}
          </h2>
          <button
            type="button"
            aria-label="Fermer"
            className="text-ink-mute hover:text-ink p-1"
            onClick={onClose}
            disabled={isGenerating}
          >
            ✕
          </button>
        </div>

        {/* Preset buttons */}
        <div>
          <p className="text-xs text-ink-mute mb-2 font-medium">Fenêtre de garde</p>
          <div className="flex gap-2">
            {PRESETS.map(h => (
              <button
                key={h}
                type="button"
                onClick={() => { setPreset(h); setUseCustom(false) }}
                className={[
                  'flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors',
                  !useCustom && preset === h
                    ? 'bg-accent border-accent text-white'
                    : 'bg-surface-2 border-line text-ink-mute',
                ].join(' ')}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {/* Custom datetime */}
        <div>
          <button
            type="button"
            onClick={() => setUseCustom(v => !v)}
            className="text-sm text-accent underline"
          >
            {useCustom ? '← Utiliser un preset' : 'Heure de début personnalisée'}
          </button>
          {useCustom && (
            <input
              type="datetime-local"
              value={customSince}
              onChange={e => setCustomSince(e.target.value)}
              className="mt-2 w-full bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm text-ink"
            />
          )}
        </div>

        {/* Count feedback */}
        {obsCount === null && (
          <p className="text-xs text-ink-mute">Calcul en cours…</p>
        )}
        {obsCount !== null && obsCount === 0 && (
          <p className="text-xs text-status-warn">
            Aucune observation sur cette période
          </p>
        )}
        {obsCount !== null && obsCount > 0 && (
          <p className="text-xs text-ink-mute">
            {obsCount} observation{obsCount !== 1 ? 's' : ''} dans la fenêtre
          </p>
        )}

        {/* Error */}
        {error && <p className="text-xs text-status-alert">{error}</p>}

        {/* Generate button */}
        <button
          type="button"
          disabled={!isReady || isGenerating}
          onClick={handleGenerate}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-accent text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {isGenerating ? 'Génération…' : 'Générer'}
        </button>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/features/pdf/ExportModal.test.tsx
```
Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/pdf/ExportModal.tsx src/features/pdf/ExportModal.test.tsx
git commit -m "feat(pdf): add ExportModal bottom sheet component"
```

---

## Task 8: Barrel export + wire FeedPage and PatientListPage

**Files:**
- Create: `src/features/pdf/index.ts`
- Modify: `src/features/transmissions/FeedPage.tsx`
- Modify: `src/features/patients/PatientListPage.tsx`

- [ ] **Step 1: Create the barrel**

Create `src/features/pdf/index.ts`:

```ts
export { ExportModal } from './ExportModal'
export { usePdfExport } from './usePdfExport'
export type { ShiftWindow } from './pdfUtils'
```

- [ ] **Step 2: Add "Exporter PDF" button to FeedPage**

In `src/features/transmissions/FeedPage.tsx`, make these changes:

Add `useState` to the existing import (it's already imported — just add the state). Add the import for `ExportModal` at the top:

```tsx
import { ExportModal } from '../pdf'
```

Add `exportOpen` state inside the component, after `isLoading`:

```tsx
const [exportOpen, setExportOpen] = useState(false)
```

Replace the `<header>` block (lines 121–131) with:

```tsx
<header className="flex items-center gap-3 px-4 py-3 border-b border-line-soft">
  <Button variant="ghost" size="sm" onClick={() => navigate('/patients')}>
    ← Retour
  </Button>
  <h1 className="font-display text-xl font-semibold text-ink flex-1 truncate">
    {patientName}
  </h1>
  {!isLoading && (
    <Button variant="ghost" size="sm" onClick={() => setExportOpen(true)}>
      PDF
    </Button>
  )}
  <Button variant="accent" size="sm" onClick={() => navigate(`/patients/${id}`)}>
    + Obs.
  </Button>
</header>
```

Add the modal just before the closing `</div>` of the page (after `</main>`):

```tsx
{exportOpen && (
  <ExportModal
    type="patient"
    patientId={id}
    onClose={() => setExportOpen(false)}
  />
)}
```

- [ ] **Step 3: Verify FeedPage still compiles**

```bash
npx tsc -b --noEmit
```
Expected: only the two pre-existing errors in `flush.ts` and `vite.config.ts` — no new errors.

- [ ] **Step 4: Add "Rapport de garde" button to PatientListPage**

In `src/features/patients/PatientListPage.tsx`, add imports:

```tsx
import { useState } from 'react'
import { Button } from '../../design-system'
import { ExportModal } from '../pdf'
```

Add state inside the component, before the return:

```tsx
const [exportOpen, setExportOpen] = useState(false)
```

Replace the `<header>` block with:

```tsx
<header className="flex items-center justify-between px-4 py-3 border-b border-line-soft">
  <h1 className="font-display text-xl font-semibold text-ink">Mes patients</h1>
  <Button variant="ghost" size="sm" onClick={() => setExportOpen(true)}>
    Rapport PDF
  </Button>
</header>
```

Add the modal before the closing `</div>` of the page:

```tsx
{exportOpen && (
  <ExportModal
    type="tour"
    onClose={() => setExportOpen(false)}
  />
)}
```

- [ ] **Step 5: Verify PatientListPage still compiles**

```bash
npx tsc -b --noEmit
```
Expected: same pre-existing errors only.

- [ ] **Step 6: Run the full test suite**

```bash
npx vitest run
```
Expected: all existing tests pass plus the new pdf tests.

- [ ] **Step 7: Commit**

```bash
git add src/features/pdf/index.ts src/features/transmissions/FeedPage.tsx src/features/patients/PatientListPage.tsx
git commit -m "feat(pdf): wire ExportModal into FeedPage and PatientListPage"
```

---

## Verification Checklist

After all tasks complete, manually verify:

1. Start dev server: `npm run dev`
2. Navigate to a patient's feed — confirm "PDF" ghost button appears in the header
3. Tap it — confirm the bottom sheet opens with 4 preset buttons (8h / 10h / 12h / 24h) and "12h" highlighted
4. Select a window with known observations — confirm the count message appears and "Générer" is enabled
5. Select an empty window — confirm "Aucune observation sur cette période" and "Générer" is disabled
6. Toggle custom datetime — confirm the datetime input appears
7. Click "Générer" on a valid window — confirm the share sheet opens (mobile) or a PDF downloads (desktop)
8. Navigate to the patient list — confirm "Rapport PDF" button in the header works the same way
9. Run `npx vitest run` — all tests pass
