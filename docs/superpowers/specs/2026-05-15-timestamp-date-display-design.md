# Timestamp Date Display Design

**Date:** 2026-05-15  
**Status:** Approved

## Problem

Timestamps on the FeedPage and in the PatientReportDocument PDF show only `HH:MM`. When observations span multiple days, there is no way to tell the date of an entry. This is a problem for:
- The feed page, where observations from previous days look identical in time to today's
- The PDF patient report, which can cover multiple days and needs unambiguous date+time in the table

## Decision

**Approach A — pre-format in callers, add `whitespace-pre-line` to `FeedEntry`.** No component API change. Each caller formats for its own context. `FeedEntry` simply renders the string as-is, with line breaks allowed.

## Behaviour

### FeedPage

- **Today's entries:** show only `HH:MM` (unchanged)
- **Older entries:** show `DD/MM` on the first line, `HH:MM` on the second line (stacked in the same narrow column)

Example for an entry from yesterday:
```
14/05
13:08
```

### PDF PatientReportDocument

- **All entries:** always show full ISO date `DD/MM/YYYY` on the first line, `HH:MM` on the second line
- Column header renamed from `Heure` to `Date/Heure`
- Column width increased from 40 to 70 to accommodate `DD/MM/YYYY`

Example:
```
14/05/2026
13:08
```

## Design

### `src/features/transmissions/FeedPage.tsx`

Replace the local `formatTime` function with `formatTimestamp`:

```ts
function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const isToday = d.toDateString() === new Date().toDateString()
  if (isToday) return time
  const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  return `${date}\n${time}`
}
```

Update the call site: `timestamp={formatTimestamp(obs.recorded_at)}`

### `src/design-system/components/FeedEntry.tsx`

Add `whitespace-pre-line` to the timestamp `div` so multi-line strings render as stacked lines:

```tsx
<div className={['font-mono text-[11px] font-semibold text-right pr-2 pt-1 whitespace-pre-line', toneTimeClasses[tone]].join(' ')}>
  {timestamp}
</div>
```

No prop type change. `timestamp: string` continues to accept both single-line (`"13:08"`) and two-line (`"14/05\n13:08"`) values.

### `src/features/pdf/PatientReportDocument.tsx`

Replace `fmtTime`:

```ts
function fmtTime(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${date}\n${time}`
}
```

Update column header and width:
- `colTime: { width: 70 }` (was 40)
- `<Text style={[S.colTime, S.headerCell]}>Date/Heure</Text>` (was "Heure")

In react-pdf, `\n` inside a `Text` component renders as a line break.

## Out of scope

- Showing date on the FeedEntry author line or summary card
- Relative dates ("hier", "il y a 2j") — `formatRelativeTime` in `time.ts` is unaffected
- TourReportDocument — that document shows a summary per patient, not individual timestamped rows
