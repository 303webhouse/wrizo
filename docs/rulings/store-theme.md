# Rulings: `apps/desktop/src/store/theme.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[theme §n]` points here.

## theme §1

From `apps/desktop/src/store/theme.ts`, line 16 at `7f1c6a84` (the comment that stays: "per-theme config: a new page's typewriter default is the theme's call; marked slots, not registered (each joins the union and this table in the same edit): nomad: { typewriterDefault: true }, volant: TBD (do not guess)").

```ts
// PHASE 1 (S5) - PER-THEME CONFIG. What a NEW page opens with is the theme's call. Today the one field is the typewriter's default for a page that has no
// remembered value (store/writingSettings.ts, enterPageTypewriter): plateau (shown as "Arbor") on, flux off.
//   MARKED SLOTS - these themes are not registered yet (ThemeId above); each joins the union and this table in the same edit:
//     nomad:   { typewriterDefault: true },
//     volant:  TBD - Nick has a different mode in mind; do NOT guess a boolean here.
```
