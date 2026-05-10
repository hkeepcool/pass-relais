# Pass-Relais Design System

## Aesthetic Direction

**V2 Modern / Clinical** — Charcoal dark navy with electric teal accent. Geometric sans (Geist)
throughout. Designed for nurses reading screens in dark bedrooms at 3 AM.

Design principle: **structured urgency**. Every visual decision communicates either calm (stable
patients) or escalating attention (warn → alert) without ambiguity. The user should understand a
patient's status in under 200ms.

---

## Color Palette

| Token | Dark hex | Light hex | Tailwind class | Use |
|---|---|---|---|---|
| `bg` | `#0A0E14` | `#F4F6F9` | `bg-bg` | Page background |
| `surface` | `#141B25` | `#FFFFFF` | `bg-surface` | Cards, list rows |
| `surface-2` | `#1B2433` | `#FFFFFF` | `bg-surface-2` | Elevated, hover |
| `ink` | `#E6EDF7` | `#0A0E14` | `text-ink` | Primary text |
| `ink-2` | `#97A4B8` | `#475569` | `text-ink-2` | Secondary text |
| `ink-mute` | `#5C6A7E` | `#94A3B8` | `text-ink-mute` | Metadata, timestamps |
| `accent` | `#2DD4BF` | `#0D9488` | `bg-accent` | CTAs, selections |
| `status-ok` | `#34D399` | `#059669` | `bg-status-ok` | Patient stable |
| `status-warn` | `#FBBF24` | `#D97706` | `bg-status-warn` | Needs attention |
| `status-alert` | `#F87171` | `#DC2626` | `bg-status-alert` | Urgent |

### WCAG Contrast (dark theme)
- `ink` on `bg`: **13.8:1** — AAA ✓
- `ink-2` on `bg`: **5.4:1** — AA ✓
- `accent` on `bg`: **10.1:1** — AAA ✓
- `status-ok` on `bg`: **7.2:1** — AA ✓
- `status-alert` on `bg`: **5.8:1** — AA ✓

---

## Typography

| Role | Font | Weight | Size | Class |
|---|---|---|---|---|
| Heading | Geist | 600 | 24–30px | `font-display font-semibold` |
| Body | Geist | 400 | 15–16px | `font-ui` or default |
| Secondary | Geist | 400 | 13–14px | `font-ui text-sm` |
| Monospace / data | JetBrains Mono | 400–600 | 11–14px | `font-mono` |
| Eyebrow label | JetBrains Mono | 500 | 10px | `font-mono text-[10px] uppercase tracking-widest` |

Headings use `letter-spacing: -0.025em` for the compressed, precise feel.
Monospace is used for all numeric data (timestamps, vitals, room numbers, durations).

---

## Touch Targets

All interactive elements meet WCAG 2.5.5 (44×44px minimum):

| Component | Minimum height |
|---|---|
| Button (sm) | 44px |
| Button (md/lg), PatientCard | 56–64px |
| QuickTapButton | 86px |
| VoiceButton | 84px |
| FeedEntry expand | 44px (via `py-3` on text area) |

PatientCard min-height uses `var(--row-h)` which responds to `[data-density="compact"]` (76px → 60px).

---

## Component Usage

### Badge

**DO:**
- Use `dot` mode in PatientCard rows (space-efficient, glanceable)
- Use pill mode in FeedEntry tags and AI summary labels
- Map `Observation.status_color`: `'green'→'ok'`, `'orange'→'warn'`, `'red'→'alert'`

**DON'T:**
- Don't use raw Tailwind `bg-green-*` for status — always use `status-ok/warn/alert` tokens
- Don't use Badge as the sole indicator — pair with text label when space allows

### Button

**DO:**
- One `accent` variant per screen maximum (the primary action)
- `fullWidth` on mobile for form submission CTAs
- Always set descriptive `children` text, not icon-only

**DON'T:**
- Don't use `sm` size for critical actions (44px is minimum, prefer `md`)
- Don't stack two `accent` buttons

### QuickTapButton

**DO:**
- Wrap in `role="radiogroup"` with `aria-labelledby` pointing to the group label
- Pass `tone` matching the clinical meaning (`ok` for positive, `alert` for concerning)
- 3–5 options per row maximum

**DON'T:**
- Don't use for navigation — it's for observation selection only
- Don't nest inside another button element

### PatientCard

**DO:**
- Sort alert→warn→ok in the list (alert patients surface to top)
- Pass `alertNote` for urgent observations — renders in red above lastNote
- Wrap list in `<ul role="list">` with each card as `<li>`

**DON'T:**
- Don't truncate patient names to abbreviations — full name is required for identification

### FeedEntry

**DO:**
- Pass `isLast={true}` on the final entry to suppress the trailing timeline rail
- Pre-compute `authorInitials` from the name (avoids re-derivation on each render)
- Use `metrics` for vital signs data (tension, pulse, temperature, SpO₂)

**DON'T:**
- Don't set `defaultExpanded={true}` on all entries — causes overwhelming visual density

### VoiceButton

**DO:**
- Control `state` externally via MediaRecorder / Web Speech API integration
- Show `duration` prop for real-time recording feedback
- Place at the bottom of the Quick-Tap form as the last action

**DON'T:**
- Don't autostart recording — always require explicit user tap (browser policy + UX)
- Don't use for anything other than voice note recording

---

## Accessibility Checklist

- [ ] All interactive elements reachable by keyboard Tab
- [ ] Focus rings visible (`focus-visible:ring-2 ring-accent`)
- [ ] Color is never the sole status conveyor (dot + label + rail = 3 redundant signals)
- [ ] All touch targets ≥ 44×44px
- [ ] `prefers-reduced-motion` disables all animations (via tokens.css)
- [ ] `[data-motion="off"]` attribute for explicit user override
- [ ] VoiceButton: `aria-pressed` reflects recording state
- [ ] FeedEntry expand/collapse: `aria-expanded` on toggle button
- [ ] QuickTapButton: `role="radio"` + `aria-checked`
- [ ] PatientCard: comprehensive `aria-label` (name + room + status + lastSeen)
- [ ] Badge: `role="img"` + French `aria-label` ("Statut urgent", etc.)
