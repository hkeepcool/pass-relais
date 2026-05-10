# Pass-Relais — App Shell & Polish Design Spec

**Date:** 2026-05-10
**Status:** Approved
**Scope:** Global app bar, SyncIndicator token migration, ConflictToast, LoginPage redesign.

---

## Context — What This Fixes

| Area | Current state | Problem |
|---|---|---|
| App shell | None | No persistent branding or sync status; each page manages its own header ad-hoc |
| SyncIndicator | Raw Tailwind (`bg-green-500`, `bg-red-500`, `text-gray-600`) | Bypasses design system tokens; breaks rebranding guarantee |
| ConflictToast | Zustand has `conflicts[]` + `clearConflict()` | Nothing surfaces conflicts to the user |
| LoginPage | Raw Tailwind (`bg-blue-600`, `text-gray-600`, `text-red-600`) | Not using design system at all |

---

## Decisions

| Question | Decision |
|---|---|
| Navigation pattern | **Global App Bar** (no bottom tabs) — thin branded bar always visible above page content |
| Conflict notification | **Bottom snackbar** — fixed position, persists until user taps OK |
| Shell architecture | **`AppShell` wrapper component** — wraps `AuthGuard` routes in Router.tsx |

---

## Feature 1 — AppShell (`src/app/AppShell.tsx`)

### Layout

```
┌─────────────────────────────────────────┐
│ PASS·RELAIS              ● En ligne      │  ← global bar (bg-bg, ~36px)
├─────────────────────────────────────────┤
│  [page-level header — unchanged]         │
├─────────────────────────────────────────┤
│                                          │
│  [page content — {children}]             │
│                                          │
└─────────────────────────────────────────┘
                              [ConflictToast]  ← fixed bottom
```

### Component interface

```tsx
// src/app/AppShell.tsx
export function AppShell({ children }: { children: React.ReactNode })
```

Renders:
1. **Global bar** — `bg-bg border-b border-line-soft`, height ~36px
   - Left: `PASS·RELAIS` in `font-mono text-[10px] font-bold text-accent tracking-widest`
   - Right: `<SyncIndicator />` (redesigned)
2. **`{children}`** — the full page, which includes its own page-level header
3. **`<ConflictToast />`** — rendered once here, reads Zustand globally

### Router integration

In `src/app/Router.tsx`, wrap each `<AuthGuard>` element with `<AppShell>`:

```tsx
// Before:
<AuthGuard><PatientListPage /></AuthGuard>

// After:
<AuthGuard><AppShell><PatientListPage /></AppShell></AuthGuard>
```

All three authenticated routes (`/patients`, `/patients/:id`, `/patients/:id/feed`) get this treatment. LoginPage and AuthCallbackPage are **not** wrapped.

---

## Feature 2 — SyncIndicator redesign (`src/shared/components/SyncIndicator.tsx`)

Full replacement — same logic, all raw Tailwind colors swapped for design tokens.

### Token mapping

| Old class | New class | State |
|---|---|---|
| `bg-green-500` | `bg-status-ok` | Online, no queue |
| `bg-orange-400` | `bg-status-warn` | Offline or queue > 0 |
| `bg-red-500` | `bg-status-alert` | Conflict |
| `text-gray-600` | `text-ink-mute` | Label |
| `text-orange-600` | `text-status-warn` | Queue count |

### Three visual states

Dot color is determined by: `hasConflicts ? alert : (!isOnline || queueLength > 0) ? warn : ok`.
Label is determined by: `hasConflicts ? 'Conflit' : !isOnline ? 'Offline' : 'En ligne'`.
These are independent — an orange dot + "En ligne" label is valid (online but syncing queue).

1. **Online, no queue**: `bg-status-ok` dot · `text-ink-mute` "En ligne"
2. **Offline**: `bg-status-warn` dot · `text-status-warn` "Offline" · queue count badge when `queueLength > 0` (`bg-status-warn/10 border border-status-warn/30 text-status-warn font-mono text-[10px] rounded px-1`)
3. **Online, queue > 0** (actively syncing): `bg-status-warn` dot · `text-ink-mute` "En ligne" (no badge — transient state, clears quickly)
4. **Conflict**: `bg-status-alert` dot · `text-status-alert` "Conflit"

---

## Feature 3 — ConflictToast (`src/shared/components/ConflictToast.tsx`)

### Behaviour

- Reads `conflicts` and `clearConflict` from `useAppStore`
- When `conflicts.length === 0`: renders nothing
- When `conflicts.length > 0`: renders a fixed bottom snackbar

### Layout

```
┌──────────────────────────────────────────────────────┐
│  ⚠  Conflit détecté — données de [patientName]       │  [OK]  │
│     mises à jour par un autre soignant.               │        │
└──────────────────────────────────────────────────────┘
```

- Position: `fixed bottom-4 left-4 right-4 z-50`
- Background: `bg-surface border border-status-alert rounded-xl px-4 py-3`
- Text: `text-sm text-ink` for message, `text-accent font-semibold` for OK button
- Shows `conflicts[0]` only; if `conflicts.length > 1`, message reads "X conflits détectés — données de [patientName] et d'autres mises à jour par d'autres soignants."
- OK tap: calls `clearConflict(conflicts[0].id)`
- No auto-dismiss (nurse must acknowledge)
- No animation required for MVP; can add `transition-transform` later

### Store

`clearConflict(id)` already exists in `src/lib/store.ts` — no store changes needed.

---

## Feature 4 — LoginPage redesign (`src/features/auth/LoginPage.tsx`)

LoginPage is **not** wrapped in AppShell. It gets its own full-screen centered layout.

### Layout

```
bg-bg  min-h-screen  flex items-center justify-center p-6
│
└── flex-col items-center gap-0  max-w-sm w-full
    │
    ├── Brand mark: "PASS·RELAIS"
    │   font-mono text-[10px] font-bold text-accent tracking-widest mb-1
    │
    ├── Tagline: "Transmissions infirmières"
    │   text-xs text-ink-mute tracking-wide mb-6
    │
    └── Card: bg-surface border border-line rounded-2xl p-6 w-full space-y-4
        │
        ├── Title: "Connexion"  font-display text-xl font-semibold text-ink
        ├── Subtitle: "Entrez votre email…"  text-sm text-ink-2
        ├── Input: bg-bg border border-line rounded-xl px-4 py-3 text-base text-ink
        │         placeholder:text-ink-mute
        │         focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1
        │         focus:ring-offset-bg
        ├── Error (conditional): text-xs text-status-alert  (replaces text-red-600)
        └── Submit: <Button variant="accent" size="lg" fullWidth loading={loading}>
                    Recevoir le lien
```

### Sent state

When OTP is sent, replace the card body with:
```
✉️  (large, centered)
"Vérifiez votre email"  font-display text-xl font-semibold text-ink text-center
"Un lien de connexion a été envoyé à"  text-sm text-ink-2 text-center
email address  text-sm text-accent font-semibold
──────────────────────  border-t border-line
"Renvoyer le lien"  text-xs text-ink-mute underline text-center cursor-pointer
```

Resend link calls `handleSubmit` again with the same email. No new state needed.

---

## New Files Summary

```
src/
  app/
    AppShell.tsx                    ← new — global bar + ConflictToast wrapper
  shared/
    components/
      ConflictToast.tsx             ← new — bottom snackbar for sync conflicts
```

**Modified files:**

```
src/app/Router.tsx                  ← wrap AuthGuard routes in <AppShell>
src/shared/components/SyncIndicator.tsx  ← token migration (no logic change)
src/features/auth/LoginPage.tsx     ← full visual redesign (no logic change)
```

No changes to: DB schema, Zustand store, design system components, sync infrastructure, or any other page.

---

## Acceptance Criteria

| Criterion | How it's met |
|---|---|
| Brand mark visible on all authenticated screens | AppShell renders `PASS·RELAIS` in global bar |
| Sync status uses design tokens only | SyncIndicator rewritten with `bg-status-*`, `text-ink-*` |
| Conflicts surfaced to user | ConflictToast appears at bottom; requires explicit OK |
| LoginPage matches design system | All raw Tailwind colors replaced; Button and token classes throughout |
| No regressions to existing pages | AppShell is additive — page-level headers unchanged |
