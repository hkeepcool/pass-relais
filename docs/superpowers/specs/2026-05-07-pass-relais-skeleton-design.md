# Pass-Relais — Squelette MVP — Design Spec

**Date :** 2026-05-07
**Scope :** Squelette technique (structure projet, routing, auth, data layer, offline/sync)
**Hors scope :** Quick-Tap, feed transmissions, résumé IA, gestion tournées

---

## 1. Stack technique

| Couche | Choix |
|---|---|
| Framework | Vite + React + TypeScript |
| Style | Tailwind CSS |
| Routing | React Router v6 |
| State serveur | TanStack React Query v5 |
| State client | Zustand |
| Cache offline | idb (IndexedDB) |
| Base de données | Supabase (PostgreSQL) |
| Auth | Supabase Magic Link + @simplewebauthn/browser |
| PWA | vite-plugin-pwa (Workbox) |

---

## 2. Structure des dossiers

```
src/
  app/                  # App shell, providers, router root
  features/
    auth/               # LoginPage, AuthCallbackPage, AuthGuard, webauthn utils
    patients/           # PatientListPage, PatientDetailPage (stubs)
    transmissions/      # FeedPage (stub)
  shared/
    db/                 # Schéma IndexedDB (idb), opérations CRUD par store
    sync/               # Write queue, flush, détection conflits
    hooks/              # useOnlineStatus, useSyncQueue
    components/         # Badge, Spinner, SyncIndicator, Toast
  lib/
    supabase.ts         # Client Supabase (singleton)
    queryClient.ts      # React Query config (staleTime, gcTime)
    store.ts            # Zustand — syncQueue + ui state global
```

---

## 3. Routing

Toutes les routes `/patients/*` sont protégées par `<AuthGuard>`.

```
/                       → redirect → /patients (si session) | /login
/login                  → Magic Link form
/auth/callback          → traitement session Supabase + WebAuthn registration prompt
/patients               → liste patients du jour
/patients/:id           → détail patient + Quick-Tap (stub)
/patients/:id/feed      → historique transmissions (stub)
```

`AuthGuard` vérifie dans cet ordre :
1. Session Supabase active en mémoire
2. JWT valide en IndexedDB (`session_cache`) → autorise l'accès lecture offline
3. Sinon → redirect `/login`

---

## 4. Authentification

### Première connexion
1. Soignant entre son email sur `/login`
2. Supabase envoie un Magic Link
3. Clic sur le lien → redirect `/auth/callback` → session créée
4. JWT stocké dans IndexedDB (`session_cache`)
5. Prompt WebAuthn : enregistrement de la credential biométrique sur l'appareil
6. Redirect `/patients`

### Connexions suivantes
1. App ouverte → `AuthGuard` vérifie JWT en cache
2. JWT expiré ou absent → prompt WebAuthn (empreinte / Face ID)
3. WebAuthn valide → Supabase émet un nouveau JWT → stocké en cache
4. **Fallback :** si WebAuthn échoue ou non supporté → Magic Link
5. **Mode offline :** JWT valide en cache + pas de réseau → accès lecture autorisé sans re-auth

---

## 5. Schéma de données

### Supabase (PostgreSQL)

```sql
-- Profils soignants (lié à auth.users)
profiles (id uuid PK, full_name text, webauthn_credentials jsonb, created_at timestamptz)

-- Patients
patients (id uuid PK, full_name text, birth_date date, care_level text,
          created_by uuid FK profiles, created_at timestamptz, updated_at timestamptz)

-- Tournées journalières
rounds (id uuid PK, date date, caregiver_id uuid FK profiles, patient_ids uuid[])

-- Observations (Quick-Tap + notes)
observations (
  id uuid PK,
  patient_id uuid FK patients,
  caregiver_id uuid FK profiles,
  recorded_at timestamptz,
  sleep text,          -- 'rested' | 'agitated' | 'insomnia'
  appetite text,       -- 'normal' | 'low' | 'refused'
  pain smallint,       -- 1-5
  mood text,           -- 'stable' | 'confused' | 'anxious'
  note_text text,
  note_audio_url text,
  status_color text,   -- 'green' | 'orange' | 'red'
  updated_at timestamptz
)
```

RLS activé sur toutes les tables : un soignant ne voit que les patients de sa tournée du jour.

### IndexedDB (idb)

| Store | keyPath | Index |
|---|---|---|
| `patients` | `id` | `updated_at` |
| `observations` | `id` | `patient_id`, `recorded_at` |
| `sync_queue` | auto-increment | `created_at` |
| `session_cache` | `key` | — |

### React Query — conventions

- `queryFn` : lit IndexedDB en premier, Supabase en fallback si online
- `mutationFn` : écrit IndexedDB immédiatement + enqueue `sync_queue`
- `staleTime: 0` — re-fetch systématique si réseau disponible
- `gcTime: Infinity` — données conservées en mémoire pour offline

---

## 6. Couche offline / sync

### Cycle d'une écriture offline

1. `mutationFn` écrit dans IndexedDB (`observations`) + insère dans `sync_queue`
2. `useSyncQueue` écoute `navigator.onLine` + Supabase realtime channel
3. Au retour en ligne : flush de la queue (ordre `created_at` ASC), upsert par `id`
4. Succès → item supprimé de la queue
5. Échec réseau → `retries++`, max 5 tentatives (backoff exponentiel)
6. Conflit (`updated_at` Supabase > timestamp local) → toast d'alerte : "Conflit détecté sur [Patient X]"
7. Post-flush → React Query invalide les queries concernées → re-fetch

### Indicateur réseau (SyncIndicator)

- Vert : en ligne, sync active
- Orange : offline, *N* éléments en attente
- Rouge : conflit détecté, action requise

---

## 7. Critères d'acceptation du squelette

- [ ] `vite dev` démarre sans erreur, TypeScript strict activé
- [ ] `/login` envoie un Magic Link via Supabase
- [ ] `/auth/callback` crée la session, propose WebAuthn si supporté
- [ ] `AuthGuard` redirige vers `/login` si pas de session valide
- [ ] `AuthGuard` autorise l'accès offline si JWT valide en IndexedDB
- [ ] `useSyncQueue` flush automatiquement au retour en ligne
- [ ] `SyncIndicator` affiche l'état réseau en temps réel
- [ ] PWA installable (manifest + service worker Workbox)
