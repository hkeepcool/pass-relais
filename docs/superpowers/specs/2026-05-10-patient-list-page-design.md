# PatientListPage — Design Spec

**Date:** 2026-05-10
**Status:** Approved

---

## Overview

The `PatientListPage` is the home screen nurses see after login. It lists all patients sorted by urgency and provides two navigation actions per patient: a quick tap to log an observation, and a secondary tap to view the patient detail page.

---

## Architecture & Data Flow

- A new `usePatients()` hook reads all patients from IndexedDB via the existing `getAllPatients()` in `src/shared/db/patients.db.ts`.
- The hook sorts patients by status color: `red → orange → green`.
- Returns `{ patients, isLoading, error }`.
- Re-runs on:
  - initial mount
  - `window` `focus` event
  - custom `sync:complete` event dispatched by `flushQueue` after a successful sync
- No Supabase call — IndexedDB is the source of truth for reads (offline-first contract).

---

## Components

`PatientListPage` composes entirely from existing design system components. No new components required.

**Layout:**
- Header bar: app title + `SyncIndicator`
- Scrollable list of `PatientCard` components

**PatientCard props:**
| Prop | Value |
|---|---|
| `name` | patient name |
| `statusTone` | mapped from `status_color` (`red→alert`, `orange→warn`, `green→ok`) |
| `lastUpdated` | relative time string (e.g. "2h ago") |
| `onClick` | navigate to `/patients/:id/feed` (QuickTap form) |
| info icon button | navigate to `/patients/:id` (patient detail) |

**States:**
- **Loading:** 3 placeholder skeleton cards while `isLoading` is true
- **Empty:** inline message "Aucun patient enregistré" when list is empty
- **Error:** inline message "Impossible de charger les patients" with a retry button

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| IndexedDB read fails | Show inline error message with retry button. `Toast` is NOT used — errors here are local and recoverable. |
| No patients (fresh install) | Show empty state. Not treated as an error. |

The existing `Toast` component remains reserved for sync conflicts only.

---

## Testing

File: `src/features/patients/PatientListPage.test.tsx`

Uses `fake-indexeddb` shim and `resetDbForTests()` in `beforeEach`.

| # | Test | Setup | Assert |
|---|---|---|---|
| 1 | Renders cards sorted by urgency | Seed 1 red, 1 orange, 1 green patient | Red first, orange second, green last |
| 2 | Shows loading skeleton then resolves | Mock delayed `getAllPatients()` | Skeletons visible → cards appear after resolution |
| 3 | Shows empty state | Empty IndexedDB | Empty state message visible |

---

## Out of Scope

- Search or filter bar (list is small, < 20 patients per nurse)
- Pagination
- Pull-to-refresh (re-fetch on focus covers the use case)
