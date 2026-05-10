# Theming Guide — Pass-Relais Design System

## How to create a new client theme

The design system uses a CSS-variable-driven Tailwind architecture. **All components reference
CSS variables — changing the theme requires zero component changes.**

### 5-step process

1. **Copy an existing theme as a starting point:**
   ```
   src/design-system/themes/v2-clinical.css  → themes/client-name.css
   ```

2. **Update all `--*-rgb` values** for your client's color palette (all values are RGB channels,
   not hex, to support Tailwind opacity modifiers like `bg-accent/50`):
   ```css
   --accent-rgb:    45, 212, 191;   /* change to client brand color */
   --ok-rgb:        52, 211, 153;   /* status-ok must be green */
   --warn-rgb:      251, 191, 36;   /* status-warn must be orange/yellow */
   --alert-rgb:     248, 113, 113;  /* status-alert must be red */
   ```
   **Note:** `--ok/warn/alert-rgb` are medical status colors and should stay
   green/orange/red for clinical clarity (WCAG + patient safety).

3. **Update font names** to match your brand typography:
   ```css
   --font-display-name: 'Your Heading Font';
   --font-ui-name:      'Your Body Font';
   --font-mono-name:    'Your Mono Font';
   ```

4. **Update border radius** for brand personality:
   ```css
   --r-xs: 2px; --r-sm: 4px; --r-md: 6px;  /* sharp (clinical) */
   /* or */
   --r-xs: 4px; --r-sm: 8px; --r-md: 12px; /* rounded (warm) */
   ```

5. **Activate the theme** — change ONE line in `src/design-system/tokens.css`:
   ```css
   @import './themes/client-name.css';  /* ← swap here */
   ```
   Then swap the font `@import` lines in `src/index.css` to load your new fonts.

6. **Run `npm run build`** — done. All components update automatically.

---

## Theme variable reference

| Variable | Usage | Tailwind class |
|---|---|---|
| `--bg-rgb` | Page background | `bg-bg` |
| `--bg-tint-rgb` | Section bands | `bg-bg-tint` |
| `--surface-rgb` | Card / list row backgrounds | `bg-surface` |
| `--surface-2-rgb` | Elevated cards, hover states | `bg-surface-2` |
| `--surface-inset-rgb` | Input backgrounds | `bg-surface-inset` |
| `--ink-rgb` | Primary text | `text-ink` |
| `--ink-2-rgb` | Secondary text | `text-ink-2` |
| `--ink-mute-rgb` | Muted text, timestamps | `text-ink-mute` |
| `--ink-faint-rgb` | Disabled, placeholders | `text-ink-faint` |
| `--line-rgb` | Default borders | `border-line` |
| `--line-soft-rgb` | Subtle dividers | `border-line-soft` |
| `--line-strong-rgb` | Emphasized borders | `border-line-strong` |
| `--accent-rgb` | Brand CTAs, selections | `bg-accent`, `text-accent` |
| `--accent-2-rgb` | Hover accent | `bg-accent-2` |
| `--on-accent-rgb` | Text on accent backgrounds | `text-on-accent` |
| `--ok-rgb` | Patient stable | `bg-status-ok`, `text-status-ok` |
| `--warn-rgb` | Needs attention | `bg-status-warn`, `text-status-warn` |
| `--alert-rgb` | Urgent | `bg-status-alert`, `text-status-alert` |

All Tailwind opacity modifiers work: `bg-accent/10`, `bg-accent/50`, `text-status-ok/60`, etc.

---

## Available themes

| File | Direction | Fonts | Primary mode |
|---|---|---|---|
| `v2-clinical.css` | Dark navy + electric teal | Geist + JetBrains Mono | Dark |
| `v1-editorial.css` | Warm parchment + amber | Newsreader + IBM Plex | Light |

---

## Auto-theme (night shift)

Apply dark mode automatically based on time of day:

```typescript
function applyAutoTheme() {
  const h = new Date().getHours()
  document.documentElement.dataset.theme = (h >= 19 || h < 7) ? 'dark' : 'light'
}
applyAutoTheme()
```

Nurses working night shifts (19:00–07:00) automatically get the dark theme.
