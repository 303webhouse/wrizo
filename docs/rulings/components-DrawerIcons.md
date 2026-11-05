# Rulings: `apps/desktop/src/components/DrawerIcons.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[DrawerIcons §n]` points here.

## DrawerIcons §1

From `apps/desktop/src/components/DrawerIcons.tsx`, line 1 at `7f1c6a84` (the comment that stays: "drawn icons, not glyphs (an emoji or font glyph wears whatever the OS chooses): 16x16, currentColor, stroke-only; decorative, the button carries the name").

```ts
// PHASE 1 - the drawer's inline icons ("icons over words" for TOOLS and ACTIONS; the tab words stay words, per Nick). Drawn, not typed: an
// emoji or a font glyph would wear whatever the OS decided today. 16x16, currentColor, stroke-only, so they take the control's own rest and
// chosen colours. Decorative: the button carries the name (aria-label + title).
```
