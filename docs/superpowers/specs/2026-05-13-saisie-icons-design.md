# Saisie — Icon Redesign

**Date:** 2026-05-13  
**Status:** Approved  

## Problem

The current `PatientDetailPage` (Saisie) uses arbitrary unicode glyphs as visual indicators on `QuickTapButton` components — e.g. `☾` for "Reposé", `〜` for "Agité", `◆` for "Stable". These symbols are semantically unclear, visually inconsistent, and render differently across fonts and OS platforms.

## Decision

Replace all unicode glyphs with `lucide-react` SVG icons. The `QuickTapButton.glyph` prop type widens from `string` to `ReactNode` to accept icon components. Selles (bowel) uses small inline dot-count SVGs — no Lucide icon needed there.

## Icon Map

### Sommeil
| Value | Icon | Rationale |
|-------|------|-----------|
| `rested` | `Moon` | Clinical sleep symbol |
| `agitated` | `Waves` | Restless / turbulent movement |
| `insomnia` | `EyeOff` | Eyes that won't close |

### Appétit
| Value | Icon | Rationale |
|-------|------|-----------|
| `normal` | `Utensils` | Eating normally |
| `low` | `MinusCircle` | Reduced intake |
| `refused` | `XCircle` | Full refusal |

### Douleur (Pain scale 1–5)
| Value | Icon | Rationale |
|-------|------|-----------|
| 1–2 | `Smile` | Low pain — comfortable |
| 3 | `Meh` | Moderate pain — neutral |
| 4–5 | `Frown` | High pain — distressed |

Numbers remain the primary label; the face icon is a secondary visual cue aligned with the clinical Wong-Baker FACES scale convention.

### Humeur
| Value | Icon | Rationale |
|-------|------|-----------|
| `stable` | `Check` | Clear positive state |
| `confused` | `HelpCircle` | Question / disorientation |
| `anxious` | `Activity` | Elevated physiological stress |

### Selles (Bowel count)
Inline SVG dot patterns — no Lucide needed.
| Value | Visual |
|-------|--------|
| 0 | Horizontal line (none) |
| 1 | Single circle |
| 2 | Two circles |
| 3+ | Three circles |

## Rendering

All Lucide icons: `size={22}`, `strokeWidth={1.75}`. Wrapped in an `aria-hidden` span inside `QuickTapButton` (existing glyph slot) — no accessibility change needed since `aria-label` on the button already describes the value.

## Files

| Action | File | Change |
|--------|------|--------|
| Add dep | `package.json` | `lucide-react` |
| Modify | `src/design-system/components/QuickTapButton.tsx` | `glyph?: string` → `glyph?: ReactNode` |
| Modify | `src/features/patients/PatientDetailPage.tsx` | Replace all glyph strings with Lucide icon components + inline SVGs for Selles |

## Out of scope

- No changes to `QuickTapButton` layout, sizing, or tone logic
- No changes to data model or observation fields
- No changes to any other page
