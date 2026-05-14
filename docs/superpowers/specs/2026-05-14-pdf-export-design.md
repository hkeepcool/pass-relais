# PDF Export Feature

**Date:** 2026-05-14  
**Status:** Approved

## Context

Nurses need to hand off patient information at shift change. Pass-Relais stores all observation data locally and can generate a professional PDF without any network dependency. This is a key marketing differentiator: nurses working in facilities that still require paper trails or shared handoff documents get a one-tap export that looks official.

## Scope

Two export types:
- **Single patient** — triggered from FeedPage, produces a per-patient transmission report
- **Full tour** — triggered from PatientListPage, produces a shift handoff document covering all patients

Both work fully offline. Both deliver via native share sheet on mobile and auto-download on desktop.

## Technical Approach

Client-side PDF generation using `@react-pdf/renderer`. The library renders a separate React component tree (PDF DSL) to a `.pdf` blob in the browser. The blob is passed to `navigator.share({ files })` on mobile or downloaded via `<a download>` on desktop.

Dependency: `@react-pdf/renderer` (~350KB gzipped). No server changes needed.

---

## Feature Folder: `src/features/pdf/`

### `PatientReportDocument.tsx`

Single-patient PDF component. Layout (chosen design C):

1. **Header** — "Pass-Relais" wordmark, patient `full_name`, `birth_date`, `care_level`, nurse display name (`session.user.user_metadata?.full_name ?? session.user.email`), export date, shift window label (e.g. "Garde 06h00 → 18h00")
2. **Badge strip** — last known `status_color` pill + chips for last pain value, sleep, appetite
3. **AI summary block** — output of `summarizeObservations()` (reuses `src/shared/utils/summarize.ts`, no new logic)
4. **Observation table** — one row per observation: `recorded_at`, `sleep`, `appetite`, `pain`, `mood`, `bowel_movements`, `note_text` (truncated to 60 chars if present)
5. **Footer** — "Généré le [date] par Pass-Relais" + page number

### `TourReportDocument.tsx`

Full-tour PDF component. Layout (chosen design B):

1. **Header** — "Pass-Relais — Rapport de garde", nurse display name (`session.user.user_metadata?.full_name ?? session.user.email`), date, shift window label
2. **Alert block** — patients with `status_color` red or orange only; shows name, last pain value, last `note_text` snippet. Omitted if no alerts.
3. **Patient cards** — all patients sorted red → orange → green; each card shows name, status badge, last sleep / pain / mood values. No per-patient observation table (nurse opens the app for detail).
4. **Footer** — generation date + page number

### `usePdfExport.ts`

```ts
type ShiftWindow =
  | { preset: 8 | 10 | 12 | 24 }   // hours before now
  | { since: Date }                  // exact shift start

usePdfExport(type: 'patient' | 'tour', patientId?: string)
// returns: { generate(window: ShiftWindow): Promise<void>, isGenerating: boolean }
```

- Fetches observations from IndexedDB at generation time using existing `getObservationsByPatient` / `getPatients` functions
- Filters observations to those whose `recorded_at` falls within the shift window; for the tour export, includes only patients who have at least one observation in the window
- Renders the appropriate document with `pdf(doc).toBlob()`
- Calls `sharePdf(blob, filename)`

### `sharePdf.ts`

```ts
sharePdf(blob: Blob, filename: string): Promise<void>
```

1. If `navigator.canShare({ files: [...] })` → `navigator.share({ files: [new File([blob], filename, { type: 'application/pdf' })] })`
2. Else → `URL.createObjectURL(blob)` + programmatic `<a download>` click + `revokeObjectURL`
3. Share cancellation (user dismisses share sheet) → caught and swallowed silently

### `ExportModal.tsx`

Bottom sheet component used by both call sites:

- **Time window segmented control:** `8h | 10h | 12h | 24h` (default: 12h)
- **Custom option:** "Heure de début" → `<input type="datetime-local">` to enter exact shift start
- **Disabled state:** if no observations exist within the selected window, shows "Aucune observation sur cette période" and disables "Générer"
- **Generating state:** spinner replaces button label; sheet is not dismissible
- **Error state:** on generation failure, dismisses sheet and shows a toast

### `index.ts`

Barrel export of `ExportModal`, `usePdfExport`.

---

## Call Site Changes

### `FeedPage.tsx`

- Add "Exporter PDF" ghost button to the page header (alongside the existing "+ Obs." button)
- Button opens `ExportModal` with `type="patient"` and the current `patientId`
- Button is hidden while observations are loading

### `PatientListPage.tsx`

- Add "Rapport de garde" ghost button to the page header
- Opens `ExportModal` with `type="tour"`

---

## PDF Filenames

| Export type | Filename pattern |
|---|---|
| Single patient | `transmission-{slug}-{YYYY-MM-DD}.pdf` |
| Full tour | `rapport-garde-{YYYY-MM-DD}.pdf` |

`{slug}` = patient `full_name` lowercased, spaces replaced with hyphens, diacritics stripped.

---

## Edge Cases

| Situation | Behaviour |
|---|---|
| No observations in window | "Générer" disabled, warning message shown in modal |
| `navigator.share` not supported | Falls back to `<a download>` |
| User dismisses share sheet | Silently ignored |
| PDF generation throws | Toast: "Erreur lors de la génération du PDF" |
| Patient has no AI summary | Summary block is omitted from PDF |

---

## Testing

- `usePdfExport.test.ts` — mock `@react-pdf/renderer`'s `pdf()`, verify blob is passed to `sharePdf`, verify shift window filtering logic
- `sharePdf.test.ts` — test share path and download fallback with `navigator.canShare` mocked both ways
- `ExportModal.test.tsx` — verify disabled state when no observations, generating state during export

---

## Out of Scope

- Per-patient date range picker (preset + shift start is sufficient for MVP)
- Emailing the PDF from within the app
- Official medical dossier formatting (post-MVP, when "dossier médical officiel" layout is specified by a regulatory body)
- PDF preview before sharing
