# Rulings: `apps/desktop/src/components/ThemePicker.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[ThemePicker §n]` points here.

## ThemePicker §1

From `apps/desktop/src/components/ThemePicker.tsx`, line 10 at `7f1c6a84` (the comment that stays: "the theme picker's body: one card per BUILT theme (absent, never greyed); card art is keyed by the card's own theme, so it shows that theme's look from inside another").

```ts
// THEME PICKER (step 2 of the Oct 21 build queue; theme-menu-brief.md / theme-rules.md §C,
// cursor/theme-picker-mockup @ 1a057bea). Replaces CascadePanels.tsx's own button-list
// CascadeThemePanel (THEME_OPTS) — this component owns only the panel BODY (the cards + the
// Dark/Light toggle); the panel's own head (title + close) is Cascade.tsx's, unchanged, and
// already reads the per-theme "Mood"/"Skin" word (deskLexicon's own cascadeThemeTitle).
//
// ABSENT, NOT GRAYED: THEME_CARDS below lists one entry per BUILT theme — today exactly
// `ThemeId`'s own three members (Machina joined with its build). Nomad/Volant do not appear at all
// until each gains its own ThemeId and its own entry here; this list is never hand-filtered at render time.
//
// EACH CARD IS BRAND ART, NOT A THEME-SCOPED COMPONENT: unlike every other per-theme override
// in this codebase (a `[data-theme="x"]` CSS block), a card must show FLUX'S look while the
// writer is sitting IN Arbor — the picker's whole job is letting you see where you'd be going.
// So card art is keyed by the CARD's own theme (a plain class), never by the ambient active
// theme; only the picker's own CHROME (the panel itself) follows the ambient theme, via the
// existing wz-cascade-panel-body it already renders inside.
```

## ThemePicker §2

From `apps/desktop/src/components/ThemePicker.tsx`, line 33 at `7f1c6a84` (the comment that stays: "Arbor's plate: base strokes always visible, the grow layer revealed on hover/focus").

```ts
// Arbor — the rhizome. Base strokes always visible; the "grow" layer reveals on hover/focus
// (stroke-dashoffset, CSS below), over the word "Arbor" (Nick's own correction: fuller/messier
// than the existing rhizome mark, ported from the approved mockup's own path data).
```

## ThemePicker §3

From `apps/desktop/src/components/ThemePicker.tsx`, line 97 at `7f1c6a84` (the comment that stays: "order follows the theme arc's narrative progression (Arbor -> Machina -> Flux), not launch order").

```ts
// ORDER follows theme-arc.md's narrative progression (Arbor -> Machina -> Flux; Fable's A3 ruling on TH2) - not launch order.
```
