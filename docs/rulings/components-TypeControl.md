# Rulings: `apps/desktop/src/components/TypeControl.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[TypeControl §n]` points here.

## TypeControl §1

From `apps/desktop/src/components/TypeControl.tsx`, line 1 at `ded4321b` (the comment that stays: "the type control: the fewest controls that do the act, the name in the aria-label; 'small' is a face button and - +, 'full' adds a typeable number; choosing is the preview; - + are inert at the ends, never removed; mousedown preventDefault keeps the caret").

```ts
// ITEM 207 (207a step 4) — THE TYPE CONTROL: face and size. ONE component, in the smallest form that does the act.
//
// HIS LAW (Nick, 2026-09-24): "the interface should be as minimal as possible (same goes for all strip menus)."
// Made concrete here, and assertable (item207.mjs counts these): a strip menu carries the fewest controls that do the
// act, each with the fewest marks; no captions, no helper text, no second row - a control's name lives in its
// aria-label. So:
//   form 'small'  (Free Write's strip, a card's strip)   ONE face button + a `-` `+` pair. NO number.
//   form 'full'   (Draft and Revise's drawer)            the face button + `-` [ number ] `+`, the number typeable.
// No "Add a font..." row exists in this component: it arrives with Route A (207b), and an offered door with nothing
// behind it is a mute grey. Free Write never gets it either (Nick's Q2).
//
// The face button shows the CURRENT face's name in its own face. It opens the roster as a listbox, each row set in its
// own face, the current one marked olive (where you are). CHOOSING IS THE PREVIEW (RV4: live on the paper, no Apply,
// no hover preview); reverting is choosing the previous one. `+`/`-` step the ladder (store/fontSize.ts) and are INERT
// at the ends - aria-disabled, never removed (a limit, not an unbuilt capability). The number commits on Enter or blur;
// anything that is not a number is refused and the previous value is kept.
//
// Buttons preventDefault on mousedown so pressing one never steals the caret from a writing surface.
```

## TypeControl §2

From `apps/desktop/src/components/TypeControl.tsx`, line 33 at `ded4321b` (the comment that stays: "a roster face, or `undefined` for Default: the host clears its stored face (no stored face = the theme's default)").

```ts
  /** A roster face, or `undefined` for "Default" (TOOLS #10 item 10): the host CLEARS its stored face - no stored face = the theme's default, which is the rule that already existed. */
```

## TypeControl §3

From `apps/desktop/src/components/TypeControl.tsx`, line 36 at `ded4321b` (the comment that stays: "where words can be highlighted (Draft, a card) the Typeface section carries the two scopes over the roster as a list; absent (Free Write, Revise): the face button").

```ts
  /** FONT-SPAN (Nick approved the font-choices mockup, cursor/font-choices @ 6cc5f529): where words can be highlighted and given their
   *  own face (Draft, a card), the Typeface section carries the two scopes - "Selection" and "Whole document" ("Whole card") - over the
   *  roster shown as a list, the current face in brass. Absent (Free Write, Revise): today's face button. */
```

## TypeControl §4

From `apps/desktop/src/components/TypeControl.tsx`, line 51 at `ded4321b` (the comment that stays: "the highlight's size and the road that sizes only the highlighted words (one undo step), so - [N] + follow the scope as the face list does").

```ts
  /** POLISH #10 item 4 (Nick ruled A, Oct 25): the highlight's size (N, null for the surface's own, 'mixed'), and the road that sizes ONLY the
   *  highlighted words - one undo step. With these, the size's `-` [ N ] `+` follow the scope exactly as the face list does. */
```

## TypeControl §5

From `apps/desktop/src/components/TypeControl.tsx`, line 62 at `ded4321b` (the comment that stays: "the theme's own default first (a table checked against the CSS tokens), so "Default (<face>)" always names the face; the DOM read is the fallback").

```ts
  // TOOLS #10 item 10: the theme's own default first (a table that is checked against the CSS tokens) - "Default (<face>)" must always NAME the face; the DOM read is the fallback for a theme the table does not know.
```

## TypeControl §6

From `apps/desktop/src/components/TypeControl.tsx`, line 71 at `ded4321b` (the comment that stays: "in the scoped form the face list is collapsed until the face button is pressed; it stays mounted (hidden), so it is the same list either way").

```ts
  // TOOLS #10 item 9: in the scoped form (Draft's drawer, a card's dock) the face list is COLLAPSED until the face button is pressed. The list stays mounted (hidden), so it is the same list either way.
```

## TypeControl §7

From `apps/desktop/src/components/TypeControl.tsx`, line 103 at `ded4321b` (the comment that stays: "the face in brass: an unchosen surface marks the "Default (<face>)" row, never a roster row (the theme picked it, not the writer)").

```ts
  // the face in brass: the surface's own face for a whole pick; the highlight's face for a selection (none when it is mixed)
  // TOOLS #10 item 10: an UNCHOSEN surface marks the "Default (<face>)" row, never a roster row - the writer has not picked that face, the theme has. `brassKey` is the row in force: DEFAULT_KEY, a roster face's
  // name, or null (a mixed highlight); `brassName` is only the face button's label (the default's real name when nothing is chosen).
```

## TypeControl §8

From `apps/desktop/src/components/TypeControl.tsx`, line 127 at `ded4321b` (the comment that stays: "the writer's installed fonts (device-local) follow the roster in both lists; a face not installed here shows a quiet note and renders as the default; "Add a font..." only in the scoped form").

```ts
  // TOOLS #10 item 11 - the writer's own installed fonts. The device-local list (store/installedFonts.ts) follows the roster in BOTH lists; the face this surface already wears from another device joins it, so it can be seen and
  // re-picked. A face not installed HERE shows a quiet note and renders as the theme's default (faceStack). "Add a font..." exists only in the scoped form (Draft, a card) - Free Write and Revise never get it (Nick's Q2).
```

## TypeControl §9

From `apps/desktop/src/components/TypeControl.tsx`, line 165 at `ded4321b` (the comment that stays: "under Selection the size is the highlight's and a step sizes only the highlighted words; under Whole document it is the surface's").

```ts
  // POLISH #10 item 4: under the Selection scope the size is the HIGHLIGHT's (its own, or the surface's where it has none) and a step sizes only the
  // highlighted words; under Whole document (or with nothing highlighted) it is the surface's, as before
```
