# Design System Prompt — Pass-Relais

> **Usage:** Paste the prompt below into a new Claude Code session at the project root to generate the full design system.

---

Build a complete design system for **Pass-Relais**, a mobile-first PWA for nurses and home-care workers (infirmiers libéraux, aides-soignants). They use it in the field — often one-handed, sometimes in bright sunlight or a dimly-lit bedroom at night — to log patient observations and hand off care information to the next shift.

## Product Context

- **Core action:** Log a patient observation in under 30 seconds (3 taps + optional voice note)
- **Users:** Healthcare field workers, not tech-savvy, always in a hurry
- **Emotional register:** Calm authority, clarity under pressure, zero cognitive load
- **Screens:** Patient list, Quick-Tap observation form, Transmission feed, Patient detail

## Design Direction

Choose an aesthetic that feels **clinical-human**: not cold hospital white, not consumer-app playful. Think structured urgency — like a well-designed ambulance interior or a premium medical device. It must communicate trust and speed simultaneously.

Commit to one bold direction. Some options to spark ideas (don't copy literally):
- Deep navy + warm amber accents, editorial typography — authority and warmth
- Charcoal dark mode + electric teal — night-shift readability, modern precision
- Slate + safety orange — industrial clarity, field-worker energy

Whatever you choose, make it **unforgettable and purposeful**, not generic.

## Hard Constraints

- **Touch targets:** All interactive elements ≥ 48px height (one-handed thumb use)
- **Contrast:** WCAG AA minimum everywhere, AAA preferred for body text
- **Status colors (non-negotiable):**
  - `status-ok` = Green (patient stable)
  - `status-warning` = Orange (needs attention)
  - `status-alert` = Red (urgent / alert)
- **Typography:** Avoid Inter, Roboto, Arial. Choose a distinctive, legible pair
- **Motion:** Subtle only — micro-interactions on tap feedback, no decorative animations that slow the user
- **Tech:** Tailwind CSS v3 + React (Vite), TypeScript

## Deliverables

### 1. `tailwind.config.ts`
Complete Tailwind config with:
- Custom color palette (all semantic tokens: `surface`, `surface-elevated`, `text-primary`, `text-secondary`, `text-muted`, `border`, `status-ok`, `status-warning`, `status-alert`, `accent`, `accent-hover`)
- Typography scale using the chosen font pair (include Google Fonts import)
- Spacing overrides if needed for touch targets
- Custom `borderRadius`, `boxShadow`, `animation` tokens

### 2. `src/design-system/tokens.css`
CSS custom properties mirroring all Tailwind tokens, supporting both light and dark mode via `[data-theme="dark"]`.

### 3. `src/design-system/components/` — 6 core components

**`Badge.tsx`** — Status indicator dot (ok / warning / alert), used on patient list rows

**`Button.tsx`** — Primary, secondary, ghost variants; always ≥ 48px; loading state

**`QuickTapButton.tsx`** — Large full-width tap button for the Quick-Tap grid (icon + label + selected state)

**`PatientCard.tsx`** — Patient list row with name, status Badge, last-seen timestamp, chevron

**`FeedEntry.tsx`** — Single transmission entry: timestamp, author avatar initials, observation text, expandable

**`VoiceButton.tsx`** — Record button with animated pulse ring while recording, idle / recording / done states

Each component must have:
- TypeScript props interface
- Tailwind classes only (no inline styles)
- `aria-label` and keyboard accessibility
- Exported from `src/design-system/index.ts`

### 4. `src/design-system/DESIGN_SYSTEM.md`
Design rationale doc covering:
- Aesthetic direction + why it fits the healthcare field-worker context
- Color palette with hex values and usage rules
- Typography specimen (sizes, weights, line-heights)
- Do / Don't usage examples for each component
- Accessibility checklist

## Reference Screens to Keep in Mind

**Patient List:**
Scrollable list of 8–15 patients. Each row has a colored status dot (left), patient name (bold), last observation time (muted), and a right chevron. Red-alert patients float to top.

**Quick-Tap Form:**
Full-screen grid of large buttons organized in 4 rows:
- Sommeil: [Reposé] [Agité] [Insomnie]
- Appétit: [Normal] [Faible] [Refus]
- Douleur: [1] [2] [3] [4] [5] (pain icons)
- Humeur: [Stable] [Confus] [Anxieux]

Plus a large VoiceButton at the bottom.

**Transmission Feed:**
Vertical timeline. Each entry has a left-side colored time indicator, author initials circle, and free-text observation. A pinned AI-summary card at top summarizes the last 24h.

---

Make every design decision intentional and specific to the healthcare field-worker context. Show what extraordinary creative work looks like when it serves a real human need.
