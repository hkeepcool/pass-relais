# Pass-Relais — Squelette MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the complete technical skeleton for Pass-Relais: Vite+React project, Supabase auth (Magic Link + WebAuthn), IndexedDB offline layer, sync write queue, and PWA config — no business features yet.

**Architecture:** Feature-based Vite + React + TypeScript SPA. Auth via Supabase Magic Link (first login) + WebAuthn (subsequent logins with biometrics); JWT cached in IndexedDB for offline read access. Write queue in IndexedDB flushes to Supabase on reconnect; conflicts trigger a toast. Stub pages for patients and transmissions — to be filled in later feature tasks.

**Tech Stack:** Vite 5, React 18, TypeScript (strict), Tailwind CSS 3, React Router v6, TanStack React Query v5, Zustand 5, idb 8, Supabase JS v2, @simplewebauthn/browser 9, vite-plugin-pwa 0.20, Vitest 2, @testing-library/react 16, fake-indexeddb 6

---

## File Map

```
src/
  main.tsx
  vite-env.d.ts
  app/
    App.tsx
    Router.tsx
    providers.tsx
  features/
    auth/
      LoginPage.tsx
      AuthCallbackPage.tsx
      AuthGuard.tsx
      useAuth.ts
      webauthn.ts
    patients/
      PatientListPage.tsx
      PatientDetailPage.tsx
    transmissions/
      FeedPage.tsx
  shared/
    db/
      schema.ts
      session-cache.db.ts
      patients.db.ts
      observations.db.ts
      sync-queue.db.ts
    sync/
      flush.ts
    hooks/
      useOnlineStatus.ts
      useSyncQueue.ts
    components/
      SyncIndicator.tsx
      Toast.tsx
  lib/
    supabase.ts
    queryClient.ts
    store.ts

supabase/
  migrations/
    20260507000000_init.sql
  functions/
    webauthn-register-options/index.ts
    webauthn-register-verify/index.ts
    webauthn-auth-options/index.ts
    webauthn-auth-verify/index.ts

src/test/
  setup.ts
  mocks/supabase.ts
  mocks/webauthn.ts

vite.config.ts
tailwind.config.ts
postcss.config.ts
tsconfig.json
tsconfig.app.json
index.html
.env.example
.gitignore
```

---

### Task 1: Bootstrap project, install dependencies, configure tooling

**Files:**
- Create: `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tailwind.config.ts`, `postcss.config.ts`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `src/test/setup.ts`

- [ ] **Step 1: Initialise Vite in current directory**

Run in `C:\Projets\ReactProjects\Pass_Relais`:

```powershell
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty. Remove existing files and continue?", enter `y`. When prompted to select framework/variant, the `--template react-ts` flag skips interactive prompts.

Expected output: `✔ Scaffolding project in …\Pass_Relais…`

- [ ] **Step 2: Install all production + dev dependencies**

```powershell
npm install @supabase/supabase-js @tanstack/react-query zustand idb react-router-dom @simplewebauthn/browser

npm install -D tailwindcss@3 postcss autoprefixer @tailwindcss/forms vite-plugin-pwa vitest @vitest/ui @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom fake-indexeddb @types/node
```

Expected: no peer-dependency errors.

- [ ] **Step 3: Initialise Tailwind**

```powershell
npx tailwindcss init -p
```

Expected: creates `tailwind.config.js` and `postcss.config.js`. We'll overwrite them in the next step.

- [ ] **Step 4: Write `tailwind.config.ts`**

Delete `tailwind.config.js`, then create `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [forms],
} satisfies Config
```

- [ ] **Step 5: Write `postcss.config.ts`**

Delete `postcss.config.js`, then create `postcss.config.ts`:

```typescript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Replace `vite.config.ts` with test + PWA placeholder**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

(PWA plugin added in Task 11.)

- [ ] **Step 7: Update `tsconfig.app.json` — enable strict mode**

Open `tsconfig.app.json`. Ensure the `compilerOptions` block contains:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

- [ ] **Step 8: Write `src/test/setup.ts`**

```typescript
import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
```

- [ ] **Step 9: Replace `src/main.tsx` with placeholder**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div>Pass-Relais bootstrapping…</div>
  </React.StrictMode>,
)
```

- [ ] **Step 10: Replace `src/index.css` with Tailwind directives**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 11: Write smoke test — `src/test/smoke.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'

describe('bootstrap', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 12: Run the smoke test**

```powershell
npx vitest run src/test/smoke.test.ts
```

Expected: `✓ src/test/smoke.test.ts (1)`

- [ ] **Step 13: Verify dev server starts**

```powershell
npx vite build
```

Expected: `✓ built in …`

- [ ] **Step 14: Commit**

```powershell
git init
git add .
git commit -m "chore: bootstrap Vite React TS project with Tailwind, Vitest, all deps"
```

---

### Task 2: Environment config + Supabase client + DB migrations

**Files:**
- Create: `.env.example`, `src/lib/supabase.ts`, `supabase/migrations/20260507000000_init.sql`
- Test: `src/lib/supabase.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/lib/supabase.test.ts
import { describe, it, expect, beforeEach } from 'vitest'

describe('supabase client', () => {
  beforeEach(() => {
    import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-key'
  })

  it('exports a supabase client', async () => {
    const { supabase } = await import('./supabase')
    expect(supabase).toBeDefined()
    expect(typeof supabase.auth.getSession).toBe('function')
  })
})
```

- [ ] **Step 2: Run test — confirm FAIL**

```powershell
npx vitest run src/lib/supabase.test.ts
```

Expected: `FAIL` — module not found.

- [ ] **Step 3: Write `.env.example`**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 4: Write `src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, key)
```

- [ ] **Step 5: Run test — confirm PASS**

```powershell
npx vitest run src/lib/supabase.test.ts
```

Expected: `✓ src/lib/supabase.test.ts (1)`

- [ ] **Step 6: Write DB migration `supabase/migrations/20260507000000_init.sql`**

```sql
-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Profiles (linked to auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  webauthn_credentials jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Patients
create table patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  birth_date date,
  care_level text not null default 'standard',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rounds
create table rounds (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  caregiver_id uuid not null references profiles(id),
  patient_ids uuid[] not null default '{}'
);

-- Observations
create table observations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  caregiver_id uuid not null references profiles(id),
  recorded_at timestamptz not null default now(),
  sleep text check (sleep in ('rested', 'agitated', 'insomnia')),
  appetite text check (appetite in ('normal', 'low', 'refused')),
  pain smallint check (pain between 1 and 5),
  mood text check (mood in ('stable', 'confused', 'anxious')),
  note_text text,
  note_audio_url text,
  status_color text not null default 'green'
    check (status_color in ('green', 'orange', 'red')),
  updated_at timestamptz not null default now()
);

-- WebAuthn challenges (short-lived, 5min TTL enforced in Edge Functions)
create table webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  challenge text not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table profiles enable row level security;
alter table patients enable row level security;
alter table rounds enable row level security;
alter table observations enable row level security;
alter table webauthn_challenges enable row level security;

-- Profiles: users manage their own row
create policy "own profile" on profiles
  for all using (auth.uid() = id);

-- Patients: authenticated users can read; creator can write
-- NOTE: tighten to rounds-based access when rounds feature is implemented
create policy "authenticated read patients" on patients
  for select using (auth.role() = 'authenticated');
create policy "creator write patients" on patients
  for insert with check (auth.uid() = created_by);

-- Rounds: user sees and manages own rounds
create policy "own rounds" on rounds
  for all using (auth.uid() = caregiver_id);

-- Observations: user manages own observations
create policy "own observations" on observations
  for all using (auth.uid() = caregiver_id);

-- WebAuthn challenges: service role only (Edge Functions use service role key)
create policy "service role challenges" on webauthn_challenges
  for all using (false);
```

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat: add Supabase client, .env.example, DB migration"
```

---

### Task 3: React Query client + Zustand store

**Files:**
- Create: `src/lib/queryClient.ts`, `src/lib/store.ts`
- Test: `src/lib/store.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './store'

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      isOnline: true,
      syncQueue: [],
      conflicts: [],
    })
  })

  it('enqueues a sync item with generated id and timestamp', () => {
    useAppStore.getState().enqueue({ operation: 'INSERT', table: 'observations', payload: { id: 'abc' } })
    const queue = useAppStore.getState().syncQueue
    expect(queue).toHaveLength(1)
    expect(queue[0]?.id).toBeDefined()
    expect(queue[0]?.retries).toBe(0)
    expect(queue[0]?.table).toBe('observations')
  })

  it('removes item from queue by id', () => {
    useAppStore.getState().enqueue({ operation: 'INSERT', table: 'observations', payload: {} })
    const id = useAppStore.getState().syncQueue[0]!.id
    useAppStore.getState().removeFromQueue(id)
    expect(useAppStore.getState().syncQueue).toHaveLength(0)
  })

  it('increments retries', () => {
    useAppStore.getState().enqueue({ operation: 'INSERT', table: 'observations', payload: {} })
    const id = useAppStore.getState().syncQueue[0]!.id
    useAppStore.getState().incrementRetries(id)
    expect(useAppStore.getState().syncQueue[0]?.retries).toBe(1)
  })

  it('adds and clears conflicts', () => {
    useAppStore.getState().addConflict({ patientName: 'Alice', table: 'observations', id: 'x1' })
    expect(useAppStore.getState().conflicts).toHaveLength(1)
    useAppStore.getState().clearConflict('x1')
    expect(useAppStore.getState().conflicts).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests — confirm FAIL**

```powershell
npx vitest run src/lib/store.test.ts
```

Expected: `FAIL` — module not found.

- [ ] **Step 3: Write `src/lib/queryClient.ts`**

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: Infinity,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})
```

- [ ] **Step 4: Write `src/lib/store.ts`**

```typescript
import { create } from 'zustand'

export interface SyncItem {
  id: string
  operation: 'INSERT' | 'UPDATE'
  table: string
  payload: Record<string, unknown>
  created_at: number
  retries: number
}

export interface ConflictItem {
  patientName: string
  table: string
  id: string
}

interface AppStore {
  isOnline: boolean
  syncQueue: SyncItem[]
  conflicts: ConflictItem[]
  setOnline: (online: boolean) => void
  enqueue: (item: Pick<SyncItem, 'operation' | 'table' | 'payload'>) => void
  removeFromQueue: (id: string) => void
  incrementRetries: (id: string) => void
  addConflict: (conflict: ConflictItem) => void
  clearConflict: (id: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncQueue: [],
  conflicts: [],
  setOnline: (isOnline) => set({ isOnline }),
  enqueue: (item) =>
    set((s) => ({
      syncQueue: [
        ...s.syncQueue,
        { ...item, id: crypto.randomUUID(), created_at: Date.now(), retries: 0 },
      ],
    })),
  removeFromQueue: (id) =>
    set((s) => ({ syncQueue: s.syncQueue.filter((i) => i.id !== id) })),
  incrementRetries: (id) =>
    set((s) => ({
      syncQueue: s.syncQueue.map((i) =>
        i.id === id ? { ...i, retries: i.retries + 1 } : i,
      ),
    })),
  addConflict: (conflict) =>
    set((s) => ({ conflicts: [...s.conflicts, conflict] })),
  clearConflict: (id) =>
    set((s) => ({ conflicts: s.conflicts.filter((c) => c.id !== id) })),
}))
```

- [ ] **Step 5: Run tests — confirm PASS**

```powershell
npx vitest run src/lib/store.test.ts
```

Expected: `✓ src/lib/store.test.ts (4)`

- [ ] **Step 6: Commit**

```powershell
git add src/lib/queryClient.ts src/lib/store.ts src/lib/store.test.ts
git commit -m "feat: add React Query client and Zustand store"
```

---

### Task 4: IndexedDB schema + session cache operations

**Files:**
- Create: `src/shared/db/schema.ts`, `src/shared/db/session-cache.db.ts`
- Test: `src/shared/db/schema.test.ts`, `src/shared/db/session-cache.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/db/schema.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getDb } from './schema'

describe('IndexedDB schema', () => {
  beforeEach(async () => {
    // fake-indexeddb/auto resets between test files but not tests.
    // Re-open is fine — same singleton.
  })

  it('opens the database with all four stores', async () => {
    const db = await getDb()
    expect(db.objectStoreNames).toContain('patients')
    expect(db.objectStoreNames).toContain('observations')
    expect(db.objectStoreNames).toContain('sync_queue')
    expect(db.objectStoreNames).toContain('session_cache')
  })
})
```

```typescript
// src/shared/db/session-cache.test.ts
import { describe, it, expect } from 'vitest'
import { saveSession, getSession, clearSession, isSessionValid } from './session-cache.db'

describe('session cache', () => {
  it('saves and retrieves a session', async () => {
    await saveSession({ access_token: 'tok', refresh_token: 'ref', expires_at: 9999999999 })
    const session = await getSession()
    expect(session?.access_token).toBe('tok')
  })

  it('clears the session', async () => {
    await saveSession({ access_token: 'tok', refresh_token: 'ref', expires_at: 9999999999 })
    await clearSession()
    const session = await getSession()
    expect(session).toBeUndefined()
  })

  it('isSessionValid returns false for expired token', () => {
    const expired = { key: 'session' as const, access_token: '', refresh_token: '', expires_at: 1 }
    expect(isSessionValid(expired)).toBe(false)
  })

  it('isSessionValid returns true for future expiry', () => {
    const valid = { key: 'session' as const, access_token: '', refresh_token: '', expires_at: 9999999999 }
    expect(isSessionValid(valid)).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — confirm FAIL**

```powershell
npx vitest run src/shared/db/schema.test.ts src/shared/db/session-cache.test.ts
```

Expected: `FAIL` — modules not found.

- [ ] **Step 3: Write `src/shared/db/schema.ts`**

```typescript
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface Patient {
  id: string
  full_name: string
  birth_date: string | null
  care_level: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Observation {
  id: string
  patient_id: string
  caregiver_id: string
  recorded_at: string
  sleep: 'rested' | 'agitated' | 'insomnia' | null
  appetite: 'normal' | 'low' | 'refused' | null
  pain: 1 | 2 | 3 | 4 | 5 | null
  mood: 'stable' | 'confused' | 'anxious' | null
  note_text: string | null
  note_audio_url: string | null
  status_color: 'green' | 'orange' | 'red'
  updated_at: string
}

export interface SyncQueueRecord {
  id?: number
  operation: 'INSERT' | 'UPDATE'
  table: string
  payload: Record<string, unknown>
  created_at: number
  retries: number
}

export interface SessionCacheRecord {
  key: 'session'
  access_token: string
  refresh_token: string
  expires_at: number
}

interface PassRelaisDB extends DBSchema {
  patients: { key: string; value: Patient; indexes: { updated_at: string } }
  observations: {
    key: string
    value: Observation
    indexes: { patient_id: string; recorded_at: string }
  }
  sync_queue: {
    key: number
    value: SyncQueueRecord
    indexes: { created_at: number }
  }
  session_cache: { key: string; value: SessionCacheRecord }
}

let _db: Promise<IDBPDatabase<PassRelaisDB>> | null = null

export function getDb(): Promise<IDBPDatabase<PassRelaisDB>> {
  if (!_db) {
    _db = openDB<PassRelaisDB>('pass-relais', 1, {
      upgrade(db) {
        const patients = db.createObjectStore('patients', { keyPath: 'id' })
        patients.createIndex('updated_at', 'updated_at')

        const obs = db.createObjectStore('observations', { keyPath: 'id' })
        obs.createIndex('patient_id', 'patient_id')
        obs.createIndex('recorded_at', 'recorded_at')

        const queue = db.createObjectStore('sync_queue', {
          keyPath: 'id',
          autoIncrement: true,
        })
        queue.createIndex('created_at', 'created_at')

        db.createObjectStore('session_cache', { keyPath: 'key' })
      },
    })
  }
  return _db
}

export function resetDbForTests(): void {
  _db = null
}
```

- [ ] **Step 4: Write `src/shared/db/session-cache.db.ts`**

```typescript
import { getDb, type SessionCacheRecord } from './schema'

export async function saveSession(
  session: Omit<SessionCacheRecord, 'key'>,
): Promise<void> {
  const db = await getDb()
  await db.put('session_cache', { key: 'session', ...session })
}

export async function getSession(): Promise<SessionCacheRecord | undefined> {
  const db = await getDb()
  return db.get('session_cache', 'session')
}

export async function clearSession(): Promise<void> {
  const db = await getDb()
  await db.delete('session_cache', 'session')
}

export function isSessionValid(session: SessionCacheRecord): boolean {
  return Date.now() / 1000 < session.expires_at
}
```

- [ ] **Step 5: Update `src/shared/db/schema.test.ts` to call `resetDbForTests`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { getDb, resetDbForTests } from './schema'

describe('IndexedDB schema', () => {
  beforeEach(() => resetDbForTests())

  it('opens the database with all four stores', async () => {
    const db = await getDb()
    expect(db.objectStoreNames).toContain('patients')
    expect(db.objectStoreNames).toContain('observations')
    expect(db.objectStoreNames).toContain('sync_queue')
    expect(db.objectStoreNames).toContain('session_cache')
  })
})
```

- [ ] **Step 6: Run tests — confirm PASS**

```powershell
npx vitest run src/shared/db/schema.test.ts src/shared/db/session-cache.test.ts
```

Expected: `✓ (5 tests)`

- [ ] **Step 7: Commit**

```powershell
git add src/shared/db/
git commit -m "feat: IndexedDB schema and session cache operations"
```

---

### Task 5: Auth — Magic Link flow (useAuth, LoginPage, AuthCallbackPage)

**Files:**
- Create: `src/features/auth/useAuth.ts`, `src/features/auth/LoginPage.tsx`, `src/features/auth/AuthCallbackPage.tsx`, `src/test/mocks/supabase.ts`
- Test: `src/features/auth/useAuth.test.ts`, `src/features/auth/LoginPage.test.tsx`

- [ ] **Step 1: Write `src/test/mocks/supabase.ts`**

```typescript
import { vi } from 'vitest'

export const mockGetSession = vi.fn()
export const mockSendMagicLink = vi.fn()
export const mockSignOut = vi.fn()
export const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      signInWithOtp: mockSendMagicLink,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}))
```

- [ ] **Step 2: Write failing tests**

```typescript
// src/features/auth/useAuth.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import '../../test/mocks/supabase'
import { mockGetSession, mockOnAuthStateChange } from '../../test/mocks/supabase'
import { useAuth } from './useAuth'
import { resetDbForTests } from '../../shared/db/schema'
import { saveSession } from '../../shared/db/session-cache.db'

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDbForTests()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('starts in loading state', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.state).toBe('loading')
  })

  it('transitions to unauthenticated when no session and no cache', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    expect(result.current.state).toBe('unauthenticated')
  })

  it('transitions to authenticated when Supabase session exists', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'tok',
          refresh_token: 'ref',
          expires_at: 9999999999,
          user: { id: 'uid' },
        },
      },
      error: null,
    })
    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    expect(result.current.state).toBe('authenticated')
  })

  it('transitions to authenticated from cached session when offline', async () => {
    await saveSession({ access_token: 'tok', refresh_token: 'ref', expires_at: 9999999999 })
    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    expect(result.current.state).toBe('authenticated')
  })
})
```

- [ ] **Step 3: Run tests — confirm FAIL**

```powershell
npx vitest run src/features/auth/useAuth.test.ts
```

Expected: `FAIL` — module not found.

- [ ] **Step 4: Write `src/features/auth/useAuth.ts`**

```typescript
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { saveSession, getSession, clearSession, isSessionValid } from '../../shared/db/session-cache.db'

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

export function useAuth() {
  const [state, setState] = useState<AuthState>('loading')
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session && !cancelled) {
        setSession(data.session)
        setState('authenticated')
        await saveSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at ?? 0,
        })
        return
      }
      const cached = await getSession()
      if (cached && isSessionValid(cached) && !cancelled) {
        setState('authenticated')
        return
      }
      if (!cancelled) setState('unauthenticated')
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (s) {
        setSession(s)
        setState('authenticated')
        await saveSession({
          access_token: s.access_token,
          refresh_token: s.refresh_token,
          expires_at: s.expires_at ?? 0,
        })
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setState('unauthenticated')
        await clearSession()
      }
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    await clearSession()
  }

  return { state, session, signOut }
}
```

- [ ] **Step 5: Run useAuth tests — confirm PASS**

```powershell
npx vitest run src/features/auth/useAuth.test.ts
```

Expected: `✓ (4 tests)`

- [ ] **Step 6: Write `src/features/auth/LoginPage.tsx`**

```tsx
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Vérifiez votre email</h1>
          <p className="mt-2 text-gray-600">
            Un lien de connexion a été envoyé à <strong>{email}</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Pass-Relais</h1>
        <p className="text-gray-600">Entrez votre email pour vous connecter.</p>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.fr"
          className="w-full rounded-lg border px-4 py-3 text-lg"
          aria-label="Adresse email"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-3 text-lg font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Envoi…' : 'Recevoir le lien'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 7: Write LoginPage test**

```tsx
// src/features/auth/LoginPage.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '../../test/mocks/supabase'
import { mockSendMagicLink } from '../../test/mocks/supabase'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders email input and submit button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /lien/i })).toBeInTheDocument()
  })

  it('calls signInWithOtp on submit and shows confirmation', async () => {
    mockSendMagicLink.mockResolvedValue({ error: null })
    render(<LoginPage />)
    await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com')
    await userEvent.click(screen.getByRole('button', { name: /lien/i }))
    expect(mockSendMagicLink).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' }),
    )
    expect(await screen.findByText(/vérifiez votre email/i)).toBeInTheDocument()
  })

  it('shows error message on failure', async () => {
    mockSendMagicLink.mockResolvedValue({ error: { message: 'Rate limit' } })
    render(<LoginPage />)
    await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com')
    await userEvent.click(screen.getByRole('button', { name: /lien/i }))
    expect(await screen.findByText('Rate limit')).toBeInTheDocument()
  })
})
```

- [ ] **Step 8: Write `src/features/auth/AuthCallbackPage.tsx`**

(WebAuthn registration prompt is wired in Task 6. For now, process session and redirect.)

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error: err }) => {
      if (err || !data.session) {
        setError(err?.message ?? 'Session invalide')
        return
      }
      // WebAuthn registration prompt injected in Task 6
      navigate('/patients', { replace: true })
    })
  }, [navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Connexion en cours…</p>
    </div>
  )
}
```

- [ ] **Step 9: Run all auth tests — confirm PASS**

```powershell
npx vitest run src/features/auth/
```

Expected: `✓ (7 tests)`

- [ ] **Step 10: Commit**

```powershell
git add src/features/auth/ src/test/mocks/supabase.ts
git commit -m "feat: Magic Link auth — useAuth hook, LoginPage, AuthCallbackPage"
```

---

### Task 6: Auth — WebAuthn (browser + Supabase Edge Functions)

**Files:**
- Create: `src/features/auth/webauthn.ts`, `src/test/mocks/webauthn.ts`
- Modify: `src/features/auth/AuthCallbackPage.tsx`
- Create: `supabase/functions/webauthn-register-options/index.ts`, `supabase/functions/webauthn-register-verify/index.ts`, `supabase/functions/webauthn-auth-options/index.ts`, `supabase/functions/webauthn-auth-verify/index.ts`
- Test: `src/features/auth/webauthn.test.ts`

- [ ] **Step 1: Write `src/test/mocks/webauthn.ts`**

```typescript
import { vi } from 'vitest'

export const mockStartRegistration = vi.fn()
export const mockStartAuthentication = vi.fn()

vi.mock('@simplewebauthn/browser', () => ({
  startRegistration: mockStartRegistration,
  startAuthentication: mockStartAuthentication,
}))
```

- [ ] **Step 2: Write failing tests**

```typescript
// src/features/auth/webauthn.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../../test/mocks/supabase'
import '../../test/mocks/webauthn'
import { mockStartRegistration, mockStartAuthentication } from '../../test/mocks/webauthn'

// mock supabase.functions.invoke
import { supabase } from '../../lib/supabase'
const mockInvoke = vi.fn()
;(supabase as any).functions = { invoke: mockInvoke }

import { isWebAuthnSupported, registerWebAuthn, authenticateWithWebAuthn } from './webauthn'

describe('webauthn', () => {
  beforeEach(() => vi.clearAllMocks())

  it('registerWebAuthn returns false when Edge Function errors', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('not found') })
    const result = await registerWebAuthn('user-id')
    expect(result).toBe(false)
  })

  it('registerWebAuthn returns true on success', async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: { options: {} }, error: null })
      .mockResolvedValueOnce({ data: {}, error: null })
    mockStartRegistration.mockResolvedValue({ id: 'cred' })
    const result = await registerWebAuthn('user-id')
    expect(result).toBe(true)
  })

  it('authenticateWithWebAuthn returns false when Edge Function errors', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('fail') })
    const result = await authenticateWithWebAuthn('user-id')
    expect(result).toBe(false)
  })

  it('authenticateWithWebAuthn returns true on success', async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: { options: {} }, error: null })
      .mockResolvedValueOnce({ data: { token_hash: 'tok_hash' }, error: null })
    mockStartAuthentication.mockResolvedValue({ id: 'cred' })
    ;(supabase as any).auth.verifyOtp = vi.fn().mockResolvedValue({ error: null })
    const result = await authenticateWithWebAuthn('user-id')
    expect(result).toBe(true)
  })
})
```

- [ ] **Step 3: Run tests — confirm FAIL**

```powershell
npx vitest run src/features/auth/webauthn.test.ts
```

Expected: `FAIL` — module not found.

- [ ] **Step 4: Write `src/features/auth/webauthn.ts`**

```typescript
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser'
import { supabase } from '../../lib/supabase'

export async function isWebAuthnSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export async function registerWebAuthn(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'webauthn-register-options',
      { body: { userId } },
    )
    if (error || !data) return false

    const credential = await startRegistration(data.options)

    const { error: verifyError } = await supabase.functions.invoke(
      'webauthn-register-verify',
      { body: { userId, credential } },
    )
    return !verifyError
  } catch {
    return false
  }
}

export async function authenticateWithWebAuthn(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'webauthn-auth-options',
      { body: { userId } },
    )
    if (error || !data) return false

    const credential = await startAuthentication(data.options)

    const { data: result, error: verifyError } = await supabase.functions.invoke(
      'webauthn-auth-verify',
      { body: { userId, credential } },
    )
    if (verifyError || !result?.token_hash) return false

    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash: result.token_hash,
      type: 'email',
    })
    return !otpError
  } catch {
    return false
  }
}
```

- [ ] **Step 5: Run webauthn tests — confirm PASS**

```powershell
npx vitest run src/features/auth/webauthn.test.ts
```

Expected: `✓ (4 tests)`

- [ ] **Step 6: Write `supabase/functions/webauthn-register-options/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateRegistrationOptions } from 'npm:@simplewebauthn/server@9'

const CHALLENGE_TTL_SECONDS = 300

serve(async (req) => {
  const { userId } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, webauthn_credentials')
    .eq('id', userId)
    .single()

  const existingCredentials = (profile?.webauthn_credentials ?? []) as Array<{ id: string }>

  const options = await generateRegistrationOptions({
    rpName: 'Pass-Relais',
    rpID: new URL(req.headers.get('origin') ?? 'http://localhost').hostname,
    userID: userId,
    userName: profile?.full_name ?? userId,
    excludeCredentials: existingCredentials.map((c) => ({
      id: c.id,
      type: 'public-key' as const,
    })),
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
    },
  })

  await supabase.from('webauthn_challenges').insert({
    user_id: userId,
    challenge: options.challenge,
  })

  // Prune stale challenges
  await supabase
    .from('webauthn_challenges')
    .delete()
    .eq('user_id', userId)
    .lt('created_at', new Date(Date.now() - CHALLENGE_TTL_SECONDS * 1000).toISOString())

  return new Response(JSON.stringify({ options }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 7: Write `supabase/functions/webauthn-register-verify/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyRegistrationResponse } from 'npm:@simplewebauthn/server@9'

serve(async (req) => {
  const { userId, credential } = await req.json()
  const origin = req.headers.get('origin') ?? 'http://localhost'
  const rpID = new URL(origin).hostname

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: challengeRow } = await supabase
    .from('webauthn_challenges')
    .select('challenge, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!challengeRow) {
    return new Response(JSON.stringify({ error: 'Challenge not found' }), { status: 400 })
  }

  const ageMs = Date.now() - new Date(challengeRow.created_at).getTime()
  if (ageMs > 300_000) {
    return new Response(JSON.stringify({ error: 'Challenge expired' }), { status: 400 })
  }

  const verification = await verifyRegistrationResponse({
    response: credential,
    expectedChallenge: challengeRow.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  })

  if (!verification.verified || !verification.registrationInfo) {
    return new Response(JSON.stringify({ error: 'Verification failed' }), { status: 400 })
  }

  const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

  const { data: profile } = await supabase
    .from('profiles')
    .select('webauthn_credentials')
    .eq('id', userId)
    .single()

  const existing = (profile?.webauthn_credentials ?? []) as unknown[]
  await supabase.from('profiles').update({
    webauthn_credentials: [
      ...existing,
      {
        id: Buffer.from(credentialID).toString('base64url'),
        publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
      },
    ],
  }).eq('id', userId)

  await supabase.from('webauthn_challenges').delete().eq('user_id', userId)

  return new Response(JSON.stringify({ verified: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 8: Write `supabase/functions/webauthn-auth-options/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateAuthenticationOptions } from 'npm:@simplewebauthn/server@9'

serve(async (req) => {
  const { userId } = await req.json()
  const rpID = new URL(req.headers.get('origin') ?? 'http://localhost').hostname

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('webauthn_credentials')
    .eq('id', userId)
    .single()

  const credentials = (profile?.webauthn_credentials ?? []) as Array<{ id: string }>

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: credentials.map((c) => ({
      id: c.id,
      type: 'public-key' as const,
    })),
  })

  await supabase.from('webauthn_challenges').insert({
    user_id: userId,
    challenge: options.challenge,
  })

  return new Response(JSON.stringify({ options }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 9: Write `supabase/functions/webauthn-auth-verify/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyAuthenticationResponse } from 'npm:@simplewebauthn/server@9'

serve(async (req) => {
  const { userId, credential } = await req.json()
  const origin = req.headers.get('origin') ?? 'http://localhost'
  const rpID = new URL(origin).hostname

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: challengeRow } = await supabase
    .from('webauthn_challenges')
    .select('challenge, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!challengeRow) {
    return new Response(JSON.stringify({ error: 'Challenge not found' }), { status: 400 })
  }

  const ageMs = Date.now() - new Date(challengeRow.created_at).getTime()
  if (ageMs > 300_000) {
    return new Response(JSON.stringify({ error: 'Challenge expired' }), { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('webauthn_credentials')
    .eq('id', userId)
    .single()

  const storedCredentials = (profile?.webauthn_credentials ?? []) as Array<{
    id: string; publicKey: string; counter: number
  }>
  const storedCred = storedCredentials.find((c) => c.id === credential.id)
  if (!storedCred) {
    return new Response(JSON.stringify({ error: 'Credential not found' }), { status: 400 })
  }

  const verification = await verifyAuthenticationResponse({
    response: credential,
    expectedChallenge: challengeRow.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: Buffer.from(storedCred.id, 'base64url'),
      credentialPublicKey: Buffer.from(storedCred.publicKey, 'base64url'),
      counter: storedCred.counter,
    },
  })

  if (!verification.verified) {
    return new Response(JSON.stringify({ error: 'Verification failed' }), { status: 400 })
  }

  // Update counter
  const updatedCredentials = storedCredentials.map((c) =>
    c.id === storedCred.id
      ? { ...c, counter: verification.authenticationInfo.newCounter }
      : c,
  )
  await supabase.from('profiles').update({ webauthn_credentials: updatedCredentials }).eq('id', userId)
  await supabase.from('webauthn_challenges').delete().eq('user_id', userId)

  // Generate a one-time token the client can exchange for a full session via verifyOtp
  const { data: userData } = await supabase.auth.admin.getUserById(userId)
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: userData.user?.email ?? '',
    options: { shouldSendEmail: false },
  })

  if (linkError || !linkData) {
    return new Response(JSON.stringify({ error: 'Session creation failed' }), { status: 500 })
  }

  return new Response(
    JSON.stringify({ token_hash: linkData.properties?.hashed_token }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
```

- [ ] **Step 10: Update `AuthCallbackPage.tsx` — add WebAuthn registration prompt after first login**

Replace the file:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { isWebAuthnSupported, registerWebAuthn } from './webauthn'

type Step = 'processing' | 'webauthn-prompt' | 'error'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('processing')
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data, error: err }) => {
      if (err || !data.session) {
        setError(err?.message ?? 'Session invalide')
        setStep('error')
        return
      }
      const uid = data.session.user.id
      setUserId(uid)

      const supported = await isWebAuthnSupported()
      const { data: profile } = await supabase
        .from('profiles')
        .select('webauthn_credentials')
        .eq('id', uid)
        .single()

      const hasCredential =
        Array.isArray(profile?.webauthn_credentials) &&
        profile.webauthn_credentials.length > 0

      if (supported && !hasCredential) {
        setStep('webauthn-prompt')
      } else {
        navigate('/patients', { replace: true })
      }
    })
  }, [navigate])

  const handleRegister = async () => {
    if (!userId) return
    await registerWebAuthn(userId)
    navigate('/patients', { replace: true })
  }

  if (step === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (step === 'webauthn-prompt') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h2 className="text-xl font-semibold">Activer la connexion biométrique ?</h2>
          <p className="text-gray-600">
            Utilisez votre empreinte ou Face ID pour vous connecter rapidement la prochaine fois.
          </p>
          <button
            onClick={handleRegister}
            className="w-full rounded-lg bg-blue-600 py-3 text-lg font-medium text-white"
          >
            Activer
          </button>
          <button
            onClick={() => navigate('/patients', { replace: true })}
            className="w-full rounded-lg border py-3 text-lg text-gray-600"
          >
            Plus tard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Connexion en cours…</p>
    </div>
  )
}
```

- [ ] **Step 11: Run all auth tests**

```powershell
npx vitest run src/features/auth/
```

Expected: `✓ (11 tests)`

- [ ] **Step 12: Commit**

```powershell
git add src/features/auth/ src/test/mocks/webauthn.ts supabase/functions/
git commit -m "feat: WebAuthn registration and authentication (browser + Edge Functions)"
```

---

### Task 7: AuthGuard + Routing + stub pages + App shell

**Files:**
- Create: `src/features/auth/AuthGuard.tsx`, `src/features/patients/PatientListPage.tsx`, `src/features/patients/PatientDetailPage.tsx`, `src/features/transmissions/FeedPage.tsx`, `src/app/providers.tsx`, `src/app/Router.tsx`, `src/app/App.tsx`
- Modify: `src/main.tsx`
- Test: `src/features/auth/AuthGuard.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/features/auth/AuthGuard.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import '../../test/mocks/supabase'
import { mockGetSession, mockOnAuthStateChange } from '../../test/mocks/supabase'
import { AuthGuard } from './AuthGuard'
import { resetDbForTests } from '../../shared/db/schema'
import { saveSession } from '../../shared/db/session-cache.db'

function renderWithRouter(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/protected"
          element={
            <AuthGuard>
              <div>Protected Content</div>
            </AuthGuard>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDbForTests()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('redirects to /login when not authenticated', async () => {
    renderWithRouter('/protected')
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('renders children when authenticated via live session', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'tok',
          refresh_token: 'ref',
          expires_at: 9999999999,
          user: { id: 'uid' },
        },
      },
      error: null,
    })
    renderWithRouter('/protected')
    expect(await screen.findByText('Protected Content')).toBeInTheDocument()
  })

  it('renders children when authenticated via cached session', async () => {
    await saveSession({ access_token: 'tok', refresh_token: 'ref', expires_at: 9999999999 })
    renderWithRouter('/protected')
    expect(await screen.findByText('Protected Content')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — confirm FAIL**

```powershell
npx vitest run src/features/auth/AuthGuard.test.tsx
```

Expected: `FAIL` — module not found.

- [ ] **Step 3: Write `src/features/auth/AuthGuard.tsx`**

```tsx
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { state } = useAuth()

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Chargement…</p>
      </div>
    )
  }

  if (state === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

- [ ] **Step 4: Run AuthGuard tests — confirm PASS**

```powershell
npx vitest run src/features/auth/AuthGuard.test.tsx
```

Expected: `✓ (3 tests)`

- [ ] **Step 5: Write stub pages**

```tsx
// src/features/patients/PatientListPage.tsx
export function PatientListPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Mes patients</h1>
      <p className="mt-2 text-gray-500">Liste à implémenter.</p>
    </div>
  )
}
```

```tsx
// src/features/patients/PatientDetailPage.tsx
export function PatientDetailPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Détail patient</h1>
      <p className="mt-2 text-gray-500">À implémenter.</p>
    </div>
  )
}
```

```tsx
// src/features/transmissions/FeedPage.tsx
export function FeedPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Transmissions</h1>
      <p className="mt-2 text-gray-500">À implémenter.</p>
    </div>
  )
}
```

- [ ] **Step 6: Write `src/app/providers.tsx`**

```tsx
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../lib/queryClient'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

- [ ] **Step 7: Write `src/app/Router.tsx`**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '../features/auth/LoginPage'
import { AuthCallbackPage } from '../features/auth/AuthCallbackPage'
import { AuthGuard } from '../features/auth/AuthGuard'
import { PatientListPage } from '../features/patients/PatientListPage'
import { PatientDetailPage } from '../features/patients/PatientDetailPage'
import { FeedPage } from '../features/transmissions/FeedPage'

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/patients" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/patients"
        element={
          <AuthGuard>
            <PatientListPage />
          </AuthGuard>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <AuthGuard>
            <PatientDetailPage />
          </AuthGuard>
        }
      />
      <Route
        path="/patients/:id/feed"
        element={
          <AuthGuard>
            <FeedPage />
          </AuthGuard>
        }
      />
    </Routes>
  )
}
```

- [ ] **Step 8: Write `src/app/App.tsx`**

```tsx
import { BrowserRouter } from 'react-router-dom'
import { Providers } from './providers'
import { Router } from './Router'

export function App() {
  return (
    <BrowserRouter>
      <Providers>
        <Router />
      </Providers>
    </BrowserRouter>
  )
}
```

- [ ] **Step 9: Update `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app/App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 10: Verify dev server builds**

```powershell
npx vite build
```

Expected: `✓ built in …` — no TypeScript errors.

- [ ] **Step 11: Commit**

```powershell
git add src/
git commit -m "feat: AuthGuard, routing, stub pages, App shell"
```

---

### Task 8: IndexedDB CRUD operations — patients, observations, sync_queue

**Files:**
- Create: `src/shared/db/patients.db.ts`, `src/shared/db/observations.db.ts`, `src/shared/db/sync-queue.db.ts`
- Test: `src/shared/db/patients.test.ts`, `src/shared/db/observations.test.ts`, `src/shared/db/sync-queue.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/db/patients.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { resetDbForTests } from './schema'
import { upsertPatient, getPatient, getAllPatients } from './patients.db'

const patient = {
  id: 'p1',
  full_name: 'Alice Dupont',
  birth_date: '1960-05-12',
  care_level: 'standard',
  created_by: 'u1',
  created_at: '2026-05-07T00:00:00Z',
  updated_at: '2026-05-07T00:00:00Z',
}

describe('patients.db', () => {
  beforeEach(() => resetDbForTests())

  it('upserts and retrieves a patient', async () => {
    await upsertPatient(patient)
    const result = await getPatient('p1')
    expect(result?.full_name).toBe('Alice Dupont')
  })

  it('getAllPatients returns all stored patients', async () => {
    await upsertPatient(patient)
    await upsertPatient({ ...patient, id: 'p2', full_name: 'Bob Martin' })
    const all = await getAllPatients()
    expect(all).toHaveLength(2)
  })

  it('upsert overwrites existing patient', async () => {
    await upsertPatient(patient)
    await upsertPatient({ ...patient, full_name: 'Alice Renommée' })
    const result = await getPatient('p1')
    expect(result?.full_name).toBe('Alice Renommée')
  })
})
```

```typescript
// src/shared/db/observations.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { resetDbForTests } from './schema'
import { upsertObservation, getObservationsByPatient } from './observations.db'

const obs = {
  id: 'o1',
  patient_id: 'p1',
  caregiver_id: 'u1',
  recorded_at: '2026-05-07T08:00:00Z',
  sleep: 'rested' as const,
  appetite: 'normal' as const,
  pain: 2 as const,
  mood: 'stable' as const,
  note_text: null,
  note_audio_url: null,
  status_color: 'green' as const,
  updated_at: '2026-05-07T08:00:00Z',
}

describe('observations.db', () => {
  beforeEach(() => resetDbForTests())

  it('upserts and retrieves observations by patient', async () => {
    await upsertObservation(obs)
    const results = await getObservationsByPatient('p1')
    expect(results).toHaveLength(1)
    expect(results[0]?.sleep).toBe('rested')
  })

  it('returns empty array for unknown patient', async () => {
    const results = await getObservationsByPatient('unknown')
    expect(results).toHaveLength(0)
  })
})
```

```typescript
// src/shared/db/sync-queue.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { resetDbForTests } from './schema'
import { enqueueItem, getAllQueuedItems, removeQueuedItem, incrementQueuedItemRetries } from './sync-queue.db'

describe('sync-queue.db', () => {
  beforeEach(() => resetDbForTests())

  it('enqueues and retrieves items sorted by created_at', async () => {
    await enqueueItem({ operation: 'INSERT', table: 'observations', payload: { id: 'a' } })
    await enqueueItem({ operation: 'UPDATE', table: 'observations', payload: { id: 'b' } })
    const items = await getAllQueuedItems()
    expect(items).toHaveLength(2)
    expect(items[0]!.created_at).toBeLessThanOrEqual(items[1]!.created_at)
  })

  it('removes an item by key', async () => {
    await enqueueItem({ operation: 'INSERT', table: 'observations', payload: {} })
    const items = await getAllQueuedItems()
    const key = items[0]!.id!
    await removeQueuedItem(key)
    expect(await getAllQueuedItems()).toHaveLength(0)
  })

  it('increments retries', async () => {
    await enqueueItem({ operation: 'INSERT', table: 'observations', payload: {} })
    const items = await getAllQueuedItems()
    const key = items[0]!.id!
    await incrementQueuedItemRetries(key)
    const updated = await getAllQueuedItems()
    expect(updated[0]?.retries).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests — confirm FAIL**

```powershell
npx vitest run src/shared/db/patients.test.ts src/shared/db/observations.test.ts src/shared/db/sync-queue.test.ts
```

Expected: `FAIL` — modules not found.

- [ ] **Step 3: Write `src/shared/db/patients.db.ts`**

```typescript
import { getDb, type Patient } from './schema'

export async function upsertPatient(patient: Patient): Promise<void> {
  const db = await getDb()
  await db.put('patients', patient)
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  const db = await getDb()
  return db.get('patients', id)
}

export async function getAllPatients(): Promise<Patient[]> {
  const db = await getDb()
  return db.getAll('patients')
}
```

- [ ] **Step 4: Write `src/shared/db/observations.db.ts`**

```typescript
import { getDb, type Observation } from './schema'

export async function upsertObservation(observation: Observation): Promise<void> {
  const db = await getDb()
  await db.put('observations', observation)
}

export async function getObservationsByPatient(patientId: string): Promise<Observation[]> {
  const db = await getDb()
  return db.getAllFromIndex('observations', 'patient_id', patientId)
}
```

- [ ] **Step 5: Write `src/shared/db/sync-queue.db.ts`**

```typescript
import { getDb, type SyncQueueRecord } from './schema'

export async function enqueueItem(
  item: Pick<SyncQueueRecord, 'operation' | 'table' | 'payload'>,
): Promise<void> {
  const db = await getDb()
  await db.add('sync_queue', { ...item, created_at: Date.now(), retries: 0 })
}

export async function getAllQueuedItems(): Promise<SyncQueueRecord[]> {
  const db = await getDb()
  return db.getAllFromIndex('sync_queue', 'created_at')
}

export async function removeQueuedItem(key: number): Promise<void> {
  const db = await getDb()
  await db.delete('sync_queue', key)
}

export async function incrementQueuedItemRetries(key: number): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('sync_queue', 'readwrite')
  const item = await tx.store.get(key)
  if (item) {
    await tx.store.put({ ...item, retries: item.retries + 1 })
  }
  await tx.done
}
```

- [ ] **Step 6: Run tests — confirm PASS**

```powershell
npx vitest run src/shared/db/patients.test.ts src/shared/db/observations.test.ts src/shared/db/sync-queue.test.ts
```

Expected: `✓ (8 tests)`

- [ ] **Step 7: Commit**

```powershell
git add src/shared/db/
git commit -m "feat: IndexedDB CRUD operations for patients, observations, sync_queue"
```

---

### Task 9: Sync layer — useOnlineStatus, flush logic, useSyncQueue

**Files:**
- Create: `src/shared/hooks/useOnlineStatus.ts`, `src/shared/sync/flush.ts`, `src/shared/hooks/useSyncQueue.ts`
- Test: `src/shared/hooks/useOnlineStatus.test.ts`, `src/shared/sync/flush.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/hooks/useOnlineStatus.test.ts
import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnlineStatus } from './useOnlineStatus'

describe('useOnlineStatus', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns true when navigator.onLine is true', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)
  })

  it('updates when online event fires', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(false)
    act(() => window.dispatchEvent(new Event('online')))
    expect(result.current).toBe(true)
  })

  it('updates when offline event fires', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const { result } = renderHook(() => useOnlineStatus())
    act(() => window.dispatchEvent(new Event('offline')))
    expect(result.current).toBe(false)
  })
})
```

```typescript
// src/shared/sync/flush.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../../test/mocks/supabase'
import { resetDbForTests } from '../db/schema'
import { enqueueItem, getAllQueuedItems } from '../db/sync-queue.db'
import { flushQueue } from './flush'
import { useAppStore } from '../../lib/store'

// Mock supabase.from().upsert()
const mockUpsert = vi.fn()
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }))
vi.mock('../../lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

import { queryClient } from '../../lib/queryClient'
vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined)

describe('flushQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDbForTests()
    useAppStore.setState({ syncQueue: [], conflicts: [] })
  })

  it('removes item from queue on successful upsert', async () => {
    await enqueueItem({ operation: 'INSERT', table: 'observations', payload: { id: 'o1', updated_at: '2026-05-07T09:00:00Z' } })
    mockUpsert.mockResolvedValue({ data: [{ updated_at: '2026-05-07T09:00:00Z' }], error: null })
    await flushQueue()
    expect(await getAllQueuedItems()).toHaveLength(0)
  })

  it('increments retries on network failure', async () => {
    await enqueueItem({ operation: 'INSERT', table: 'observations', payload: { id: 'o1', updated_at: '2026-05-07T09:00:00Z' } })
    mockUpsert.mockResolvedValue({ data: null, error: { message: 'Network error' } })
    await flushQueue()
    const items = await getAllQueuedItems()
    expect(items[0]?.retries).toBe(1)
  })

  it('adds conflict when server updated_at is newer', async () => {
    await enqueueItem({
      operation: 'UPDATE',
      table: 'observations',
      payload: { id: 'o1', patient_id: 'p1', updated_at: '2026-05-07T08:00:00Z' },
    })
    mockUpsert.mockResolvedValue({
      data: [{ updated_at: '2026-05-07T09:00:00Z' }],
      error: null,
    })
    // We need a patient in DB for the name lookup — skip name, check conflict added
    await flushQueue()
    const conflicts = useAppStore.getState().conflicts
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]?.table).toBe('observations')
  })
})
```

- [ ] **Step 2: Run tests — confirm FAIL**

```powershell
npx vitest run src/shared/hooks/useOnlineStatus.test.ts src/shared/sync/flush.test.ts
```

Expected: `FAIL` — modules not found.

- [ ] **Step 3: Write `src/shared/hooks/useOnlineStatus.ts`**

```typescript
import { useEffect, useState } from 'react'

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

- [ ] **Step 4: Write `src/shared/sync/flush.ts`**

```typescript
import { supabase } from '../../lib/supabase'
import { queryClient } from '../../lib/queryClient'
import { useAppStore } from '../../lib/store'
import { getAllQueuedItems, removeQueuedItem, incrementQueuedItemRetries } from '../db/sync-queue.db'
import { getPatient } from '../db/patients.db'

const MAX_RETRIES = 5

export async function flushQueue(): Promise<void> {
  const items = await getAllQueuedItems()
  if (items.length === 0) return

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
      .select('updated_at')

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
  }
}
```

- [ ] **Step 5: Write `src/shared/hooks/useSyncQueue.ts`**

```typescript
import { useEffect } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { flushQueue } from '../sync/flush'

export function useSyncQueue(): void {
  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (isOnline) {
      flushQueue()
    }
  }, [isOnline])
}
```

- [ ] **Step 6: Run tests — confirm PASS**

```powershell
npx vitest run src/shared/hooks/useOnlineStatus.test.ts src/shared/sync/flush.test.ts
```

Expected: `✓ (6 tests)`

- [ ] **Step 7: Commit**

```powershell
git add src/shared/
git commit -m "feat: online status hook, flush queue logic, useSyncQueue"
```

---

### Task 10: SyncIndicator and Toast components

**Files:**
- Create: `src/shared/components/SyncIndicator.tsx`, `src/shared/components/Toast.tsx`
- Modify: `src/app/App.tsx` — mount SyncIndicator and wire useSyncQueue
- Test: `src/shared/components/SyncIndicator.test.tsx`, `src/shared/components/Toast.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/shared/components/SyncIndicator.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAppStore } from '../../lib/store'
import { SyncIndicator } from './SyncIndicator'

describe('SyncIndicator', () => {
  beforeEach(() => useAppStore.setState({ isOnline: true, syncQueue: [], conflicts: [] }))

  it('shows green indicator when online and queue empty', () => {
    render(<SyncIndicator />)
    expect(screen.getByRole('status')).toHaveClass('bg-green-500')
  })

  it('shows orange indicator with count when offline with queued items', () => {
    useAppStore.setState({
      isOnline: false,
      syncQueue: [{ id: '1', operation: 'INSERT', table: 'observations', payload: {}, created_at: 1, retries: 0 }],
    })
    render(<SyncIndicator />)
    expect(screen.getByRole('status')).toHaveClass('bg-orange-400')
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows red indicator when conflicts exist', () => {
    useAppStore.setState({ conflicts: [{ patientName: 'Alice', table: 'observations', id: 'x' }] })
    render(<SyncIndicator />)
    expect(screen.getByRole('status')).toHaveClass('bg-red-500')
  })
})
```

```tsx
// src/shared/components/Toast.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAppStore } from '../../lib/store'
import { Toast } from './Toast'

describe('Toast', () => {
  beforeEach(() => useAppStore.setState({ conflicts: [] }))

  it('renders nothing when no conflicts', () => {
    const { container } = render(<Toast />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders conflict message and dismiss button', () => {
    useAppStore.setState({
      conflicts: [{ patientName: 'Alice', table: 'observations', id: 'c1' }],
    })
    render(<Toast />)
    expect(screen.getByText(/conflit/i)).toBeInTheDocument()
    expect(screen.getByText(/alice/i)).toBeInTheDocument()
  })

  it('clears conflict on dismiss', async () => {
    useAppStore.setState({
      conflicts: [{ patientName: 'Bob', table: 'observations', id: 'c2' }],
    })
    render(<Toast />)
    await userEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(useAppStore.getState().conflicts).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests — confirm FAIL**

```powershell
npx vitest run src/shared/components/SyncIndicator.test.tsx src/shared/components/Toast.test.tsx
```

Expected: `FAIL` — modules not found.

- [ ] **Step 3: Write `src/shared/components/SyncIndicator.tsx`**

```tsx
import { useAppStore } from '../../lib/store'

export function SyncIndicator() {
  const isOnline = useAppStore((s) => s.isOnline)
  const queueLength = useAppStore((s) => s.syncQueue.length)
  const hasConflicts = useAppStore((s) => s.conflicts.length > 0)

  const colorClass = hasConflicts
    ? 'bg-red-500'
    : !isOnline || queueLength > 0
      ? 'bg-orange-400'
      : 'bg-green-500'

  const label = hasConflicts
    ? 'Conflit'
    : !isOnline
      ? 'Offline'
      : 'En ligne'

  return (
    <div className="flex items-center gap-1.5">
      <span role="status" className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
      <span className="text-xs text-gray-600">{label}</span>
      {!isOnline && queueLength > 0 && (
        <span className="text-xs font-medium text-orange-600">{queueLength}</span>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Write `src/shared/components/Toast.tsx`**

```tsx
import { useAppStore } from '../../lib/store'

export function Toast() {
  const conflicts = useAppStore((s) => s.conflicts)
  const clearConflict = useAppStore((s) => s.clearConflict)

  if (conflicts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 space-y-2">
      {conflicts.map((conflict) => (
        <div
          key={conflict.id}
          className="flex items-start justify-between gap-3 rounded-lg bg-red-50 border border-red-200 p-4 shadow"
        >
          <p className="text-sm text-red-800">
            <strong>Conflit détecté</strong> sur{' '}
            <span className="font-medium">{conflict.patientName}</span>. Une
            modification plus récente existe sur le serveur.
          </p>
          <button
            onClick={() => clearConflict(conflict.id)}
            aria-label="Fermer"
            className="shrink-0 text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Update `src/app/App.tsx` — mount SyncIndicator, Toast, useSyncQueue**

```tsx
import { BrowserRouter } from 'react-router-dom'
import { Providers } from './providers'
import { Router } from './Router'
import { SyncIndicator } from '../shared/components/SyncIndicator'
import { Toast } from '../shared/components/Toast'
import { useSyncQueue } from '../shared/hooks/useSyncQueue'

function AppShell() {
  useSyncQueue()
  return (
    <>
      <header className="flex items-center justify-between border-b px-4 py-2">
        <span className="font-semibold text-blue-700">Pass-Relais</span>
        <SyncIndicator />
      </header>
      <main>
        <Router />
      </main>
      <Toast />
    </>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Providers>
        <AppShell />
      </Providers>
    </BrowserRouter>
  )
}
```

- [ ] **Step 6: Run tests — confirm PASS**

```powershell
npx vitest run src/shared/components/
```

Expected: `✓ (7 tests)`

- [ ] **Step 7: Commit**

```powershell
git add src/shared/components/ src/app/App.tsx
git commit -m "feat: SyncIndicator, Toast, wire useSyncQueue into App shell"
```

---

### Task 11: PWA configuration (vite-plugin-pwa + Workbox)

**Files:**
- Modify: `vite.config.ts`
- Create: `public/icon-192.png`, `public/icon-512.png` (placeholder)
- Test: verify build output

- [ ] **Step 1: Add placeholder icons**

Run in `public/`:

```powershell
# Create 192x192 placeholder PNG (blue square) using canvas trick via node
node -e "
const { createCanvas } = require('canvas');
" 
```

Since Node canvas may not be installed, use a simpler approach — copy any 192×192 and 512×512 PNG as placeholders:

```powershell
# Create minimal valid PNG files as placeholders
# (Replace with real icons before production)
$base64_192 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
[Convert]::FromBase64String($base64_192) | Set-Content -Path 'public\icon-192.png' -AsByteStream
[Convert]::FromBase64String($base64_192) | Set-Content -Path 'public\icon-512.png' -AsByteStream
```

Note: These are 1×1 px placeholder PNGs. Replace with proper 192×192 and 512×512 branded icons before shipping.

- [ ] **Step 2: Update `vite.config.ts` with PWA plugin**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Pass-Relais',
        short_name: 'Pass-Relais',
        description: 'Transmissions soignants — rapide, offline, sécurisé',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 3: Build and verify PWA artifacts**

```powershell
npx vite build
```

Expected output includes:
```
dist/sw.js           (Workbox service worker)
dist/manifest.webmanifest
dist/registerSW.js
```

Verify:

```powershell
Get-ChildItem dist | Select-Object Name
```

Expected: `sw.js`, `manifest.webmanifest`, `registerSW.js` present alongside the JS bundle.

- [ ] **Step 4: Run full test suite — confirm all green**

```powershell
npx vitest run
```

Expected: all tests pass, no failures.

- [ ] **Step 5: Commit**

```powershell
git add vite.config.ts public/icon-192.png public/icon-512.png
git commit -m "feat: PWA config with vite-plugin-pwa and Workbox service worker"
```

---

## Acceptance Checklist

After all tasks complete, verify each criterion from the spec:

- [ ] `npx vite dev` starts without TypeScript errors
- [ ] `/login` page renders, submitting email calls `supabase.auth.signInWithOtp`
- [ ] `/auth/callback` creates session and prompts WebAuthn if supported and not yet registered
- [ ] `AuthGuard` redirects to `/login` with no valid session
- [ ] `AuthGuard` allows access with a valid cached JWT in IndexedDB (disconnect network, reload)
- [ ] `useSyncQueue` flushes pending items on reconnect (verify via browser DevTools → IndexedDB)
- [ ] `SyncIndicator` shows green/orange/red states correctly
- [ ] `npx vite build && ls dist/sw.js` — service worker exists
- [ ] App can be installed as PWA in Chrome (Install icon in address bar)
