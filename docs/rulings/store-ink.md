# Rulings: `apps/desktop/src/store/ink.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[ink §n]` points here.

## ink §1

From `apps/desktop/src/store/ink.ts`, line 19 at `f079d49e` (the comment that stays: "the read-side defaults ARE the migration: a stroke with no tip/nib/ink renders as pen, regular, the theme's default ink - exactly as before; nothing is written to an old stroke").

```ts
// ITEM 121 I1 — THE READ-SIDE DEFAULTS, and the whole of the migration.
// A stroke with no tip/nib/ink is `pen · regular · the theme's default ink`,
// which is byte-for-byte what every stroke drawn before item 121 already
// renders as. Nothing is ever written to an old stroke to make this true.
```

## ink §2

From `apps/desktop/src/store/ink.ts`, line 68 at `f079d49e` (the comment that stays: "the default pen reads the ink-stroke token, then the text ink, then a hard default; unchanged, so no old page moves a pixel").

```ts
// The default pen reads the dedicated ink-stroke token — a very dark brown,
// almost black — falling back to the text ink token, then a hard default.
// UNCHANGED by item 121, deliberately: every existing stroke paints through
// this exact path, which is why no old page moves a pixel.
```

## ink §3

From `apps/desktop/src/store/ink.ts`, line 94 at `f079d49e` (the comment that stays: "nib widths are per tip; `pen · regular` must stay INK_LINE_WIDTH, the width every older stroke renders at").

```ts
// ITEM 121 I5 — TIP RENDER PROFILES, inside the isolation J9 promised.
//
// NIB WIDTHS ARE PER TIP, three constants each, because a nib is a property of
// the instrument: a broad marker and a broad pen are not the same broad. The
// one number that is NOT free is `pen · regular` — it MUST stay
// INK_LINE_WIDTH, because that is what every stroke drawn before item 121
// renders at, and an old page moving even a fraction of a pixel would falsify
// the no-migration claim this whole wave rests on.
```

## ink §4

From `apps/desktop/src/store/ink.ts`, line 309 at `f079d49e` (the comment that stays: "a move rewrites geometry and returns a new array; no per-group transform field, so the stored shape and every renderer stay unchanged (zero DDL)").

```ts
/**
 * ITEM 126 B4 — translate a group by (dx, dy) in normalized units, returning a
 * NEW strokes array. Pure: the caller owns when this becomes state.
 *
 * A MOVE REWRITES GEOMETRY. It deliberately does NOT add a per-group transform
 * field: that would change the stored shape for no gain and force every renderer
 * — renderStroke, renderThumbnail, the Board's box ink, anything later — to
 * learn about groups it has no other reason to know. Rewriting points keeps the
 * blob exactly as item 121 left it, so a move is zero DDL and zero migration.
 */
```

## ink §5

From `apps/desktop/src/store/ink.ts`, line 361 at `f079d49e` (the comment that stays: "the stroke's own ink when it named one; an erase skips this (destination-out: only alpha matters)").

```ts
  // ITEM 121 I1 — the stroke's OWN ink when it named one, else the caller's
  // default pen. An erase deliberately skips this: J2 paints it
  // `destination-out`, where only the alpha matters and the hue is irrelevant,
  // and an eraser has no ink of its own (nor tip, nor nib) by ruling.
```

## ink §6

From `apps/desktop/src/store/ink.ts`, line 372 at `f079d49e` (the comment that stays: "an erase is exempt: it has no tip, and a reduced alpha would erase only partially").

```ts
  // ITEM 121 I5 — the tip's own hand. An ERASE is exempt from every line of
  // this: it has no tip by ruling, and destination-out with a reduced alpha
  // would erase only partially, which is a rubber that does not rub.
```
