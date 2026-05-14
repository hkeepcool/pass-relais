# Douleur Button Alignment Fix

**Date:** 2026-05-14  
**Status:** Approved

## Problem

The five Douleur (pain scale) buttons are not vertically aligned. Buttons 1, 3, and 5 carry a sublabel ("Légère", "Modérée", "Sévère"); buttons 2 and 4 do not. Because `QuickTapButton` conditionally renders the sublabel span, buttons with a sublabel have three content rows while buttons without have two. `justify-center` then centers each button's stack independently, placing the icon and number at different vertical positions across the row. Buttons with a sublabel also exceed the `min-h-[86px]` floor, making them physically taller than the unlabelled ones.

## Solution

Always render the sublabel `<span>` in `QuickTapButton`, but apply Tailwind's `invisible` class when `sublabel` is undefined. The span reserves its line height in all cases, making every button the same height and aligning icons and numbers across the row.

## Change

**File:** `src/design-system/components/QuickTapButton.tsx` (lines 104–109)

```tsx
// Before
{sublabel && (
  <span className="text-[11px] font-medium text-ink-mute">
    {sublabel}
  </span>
)}

// After
<span className={['text-[11px] font-medium text-ink-mute', !sublabel && 'invisible'].filter(Boolean).join(' ')}>
  {sublabel}
</span>
```

No call-site changes required. All other uses of `QuickTapButton` (Sommeil, Appétit, Humeur, Selles) already supply a sublabel or will gain a reserved slot with no visible effect.

## Scope

Single component, single property. No data model, routing, or test changes needed beyond verifying the rendered output.
