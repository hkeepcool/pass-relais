# PDF Status Labels — Shared Config Design

**Date:** 2026-05-15  
**Status:** Approved

## Problem

Status labels are duplicated in three places with inconsistent values:
- `FeedPage.tsx` — inline strings: `'Vigilance'`, `'Urgent'`
- `PatientReportDocument.tsx` — local constant: `{ green: 'VERT', orange: 'ORANGE', red: 'ROUGE' }`
- `TourReportDocument.tsx` — local constant: `{ green: 'VERT', orange: 'ORANGE', red: 'ROUGE' }`

The PDF shows `'ORANGE'` where the feed page shows `'Vigilance'`. Green has no label on the feed page but shows `'VERT'` in the PDF.

## Decision

**Extend `src/shared/utils/status.ts`** with a single exported constant. All consumers import from there. No new files.

## Design

### `src/shared/utils/status.ts`

Add one export:

```ts
export const STATUS_LABELS: Record<'green' | 'orange' | 'red', string | null> = {
  green:  null,        // no badge — consistent with feed page
  orange: 'Vigilance',
  red:    'Urgent',
}
```

`null` means "no badge rendered." Consumers check for null before rendering.

### `src/features/transmissions/FeedPage.tsx`

Replace inline label strings with `STATUS_LABELS`:

```tsx
import { colorToTone, STATUS_LABELS } from '../../shared/utils/status'

tag={STATUS_LABELS[obs.status_color] != null
  ? { label: STATUS_LABELS[obs.status_color]!, status: colorToTone(obs.status_color) }
  : undefined}
```

### `src/features/pdf/PatientReportDocument.tsx`

- Remove local `STATUS_LABEL` constant
- Import `STATUS_LABELS` from `../../shared/utils/status`
- Only render the badge `View` when `STATUS_LABELS[statusColor] != null`

### `src/features/pdf/TourReportDocument.tsx`

- Remove local `STATUS_LABEL` constant  
- Import `STATUS_LABELS` from `../../shared/utils/status`
- Only render the badge `View` when `STATUS_LABELS[color] != null`
- Update `alerts` filter: currently includes orange and red — no change needed since those still have labels

## Label mapping

| status_color | Feed page tag | PDF badge |
|---|---|---|
| `green` | none | none |
| `orange` | Vigilance | Vigilance |
| `red` | Urgent | Urgent |

## Out of scope

- Internationalisation — labels are French-only for now
- Per-client label overrides — out of scope for this change
- The `STATUS_BORDER` and `STATUS_BG`/`STATUS_FG` color maps in the PDF documents stay local — only labels are shared
