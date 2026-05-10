# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (Vite)
npm run build        # type-check + production build (uses --experimental-global-webcrypto)
npm run lint         # ESLint
npx vitest           # run all tests (watch mode)
npx vitest run       # run all tests once
npx vitest run src/shared/db/observations.test.ts  # run a single test file
npx vitest --ui      # open Vitest browser UI
```

Tests run in jsdom with `fake-indexeddb/auto` already shimmed via `src/test/setup.ts`. No real browser or Supabase connection is needed.

## Environment

Copy `.env.example` → `.env` and fill in:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Architecture

### Offline-first data flow

The app is built around a write-local-then-sync pattern:

1. **Write** → data goes into IndexedDB (`idb`) via `src/shared/db/*.db.ts`
2. **Queue** → mutations are also added to `sync_queue` in IndexedDB and mirrored in Zustand (`src/lib/store.ts`)
3. **Sync** → when `navigator.onLine` transitions to `true`, `useSyncQueue` hook triggers `flushQueue()` (`src/shared/sync/flush.ts`), which upserts each item to Supabase and detects server-wins conflicts
4. **Conflict** → a `ConflictItem` is pushed to the Zustand store; `Toast` displays it

### IndexedDB schema (`src/shared/db/schema.ts`)

Single database `pass-relais` v1 with four object stores:
- `patients` — keyed by `id`, indexed on `updated_at`
- `observations` — keyed by `id`, indexed on `patient_id` and `recorded_at`
- `sync_queue` — autoincrement key, indexed on `created_at`; retries capped at 5
- `session_cache` — single record keyed `'session'`, stores JWT tokens for offline auth

Call `resetDbForTests()` in `beforeEach` to get a clean DB in tests (it clears all stores and nulls the singleton).

### Auth (`src/features/auth/`)

Supabase email OTP is the primary auth method. WebAuthn biometrics (`webauthn.ts`) are available as a second factor — they call four Supabase Edge Functions (`webauthn-register-options`, `webauthn-register-verify`, `webauthn-auth-options`, `webauthn-auth-verify`). `useAuth` checks live session first, then the `session_cache` store for offline access. `AuthGuard` wraps protected routes.

### State management

Zustand (`src/lib/store.ts`) holds only runtime/transient state: `isOnline`, `syncQueue` (in-memory mirror), and `conflicts`. It is **not** persisted. Source of truth for stored data is always IndexedDB; React Query (`src/lib/queryClient.ts`) is the server-state cache layer for Supabase reads.

### Routing

All routes are in `src/app/Router.tsx`. Protected routes are wrapped in `<AuthGuard>`. Current shape:
```
/              → redirect to /patients
/login         → LoginPage
/auth/callback → AuthCallbackPage
/patients      → PatientListPage (stub)
/patients/:id  → PatientDetailPage (stub)
/patients/:id/feed → FeedPage (stub)
```

### PWA

`vite-plugin-pwa` with Workbox generates the service worker. Static assets are precached; Supabase API responses use `NetworkFirst` with a 24 h cache. The manifest lives in `vite.config.ts`.

### Design system

`src/design-system/` (in progress — see `DESIGN_SYSTEM_PROMPT.md` for spec). Uses a **CSS-variable-driven Tailwind** pattern: `tailwind.config.ts` references `rgb(var(--accent-rgb) / <alpha-value>)` rather than hardcoded hex, enabling full opacity-modifier support and one-file client rebranding. Theme files live in `src/design-system/themes/`; swap the `@import` in `src/design-system/tokens.css` to change the active theme. All six core components (`Badge`, `Button`, `QuickTapButton`, `PatientCard`, `FeedEntry`, `VoiceButton`) are exported from `src/design-system/index.ts`.
