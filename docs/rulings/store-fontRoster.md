# Rulings: `apps/desktop/src/store/fontRoster.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[fontRoster §n]` points here.

## fontRoster §1

From `apps/desktop/src/store/fontRoster.ts`, line 1 at `7f1c6a84` (the comment that stays: "the font roster: nine faces, one table, one resolver, one loader; Times New Roman and Arial are named, never shipped (metric-compatible open fallbacks keep line breaks identical); default faces eager, the rest load on choose").

```ts
// ITEM 207 (phase 1, 207a) — THE FONT ROSTER: nine faces, one data table, one resolver, one loader.
//
// THE NINE (Nick approved the list; PLAN desk's amendment §11): Crimson Pro (the default) · Lora · EB Garamond ·
// Source Serif 4 · Times New Roman · Figtree · Atkinson Hyperlegible · Arial · Courier Prime.
//
// TIMES NEW ROMAN AND ARIAL ARE NAMED, NEVER SHIPPED (proprietary). Each stack names the installed font first
// and falls back to a metric-compatible open face - Tinos for Times New Roman, Arimo for Arial - so a machine that
// lacks the font breaks the same text at the same places (identical advance widths). What that buys is line-break
// identity across machines, NOT a match to a style guide's line length (that is a property of the sheet).
//
// LOAD ON CHOOSE, DEFAULT EAGER. Crimson Pro, Figtree and Courier Prime are imported eagerly in main.tsx (unchanged
// - the default face is present at first paint, and Courier is the screenplay face). Every other face is a dynamic
// import of its CSS, fired when the writer CHOOSES it or when a page that uses it OPENS - never at startup. The
// eager list does not grow (item207.mjs checks that against main.tsx).
//
// SIZE-ADJUST (Fable's ruling, 2026-09-24): every face carries `sizeAdjust`, and every one is 1. The size number is
// LITERAL printed points - a writer following a style guide types 12 and means 12 - so no face is normalised to
// another's x-height. The field is the seam: changing a face's apparent size later is one number in this table.
```

## fontRoster §2

From `apps/desktop/src/store/fontRoster.ts`, line 47 at `7f1c6a84` (the comment that stays: "Arbor's default writing face: it loads with the theme (themeFontFaces.ts) or when chosen, never eagerly").

```ts
  // EB Garamond is ARBOR'S DEFAULT writing face (TOOLS #10 item 10): it loads WITH the theme (store/themeFontFaces.ts) or when chosen - never eagerly.
```

## fontRoster §3

From `apps/desktop/src/store/fontRoster.ts`, line 59 at `7f1c6a84` (the comment that stays: "the defaults Flux (Titillium Web) and Machina (Source Sans 3) wear: load on choose or with their theme, never eager").

```ts
  // TOOLS #10 item 10: two new roster faces - the theme defaults Flux (Titillium Web) and Machina (Source Sans 3) wear. Load on choose, or with their theme (store/themeFontFaces.ts); never eager.
```

## fontRoster §4

From `apps/desktop/src/store/fontRoster.ts`, line 78 at `7f1c6a84` (the comment that stays: "each theme's default writing face, by voice; kept in step with the CSS tokens (theme-fonts-source.mjs fails on drift), so "Default (<face>)" never needs a DOM read").

```ts
/** TOOLS #10 item 10 - the face each theme's DEFAULT writing face is, by voice (Nick, Oct 24): serif voice = the theme's default, sans voice = its sans. Kept in step with index.css's --font-proseSerif / --font-proseSans per theme
 *  (theme-fonts-source.mjs reads both and fails on drift). It is what "Default (<face>)" names, so the row never depends on a DOM read to say a name. */
```

## fontRoster §5

From `apps/desktop/src/store/fontRoster.ts`, line 115 at `7f1c6a84` (the comment that stays: "the stored form of a face added from this device's own fonts: the existing record, `source: 'device'`").

```ts
/** The stored form of a face the writer added from this device's own fonts (TOOLS #10 item 11): the record that already existed, `source: 'device'`. */
```

## fontRoster §6

From `apps/desktop/src/store/fontRoster.ts`, line 136 at `7f1c6a84` (the comment that stays: "a device face missing here falls back to the theme's default, never to a generic class").

```ts
  // TOOLS #10 item 11: a face the writer added from THIS device (store/installedFonts.ts) falls back to the THEME'S DEFAULT when it is not installed (another device) - never to a generic class of its own.
```

## fontRoster §7

From `apps/desktop/src/store/fontRoster.ts`, line 177 at `7f1c6a84` (the comment that stays: "a page's face and size as inline style; size is real points in page units (n x --wz-pt), so the type scales with the page").

```ts
/** The inline style a writing surface applies for its page's own face and size; empty when the page never chose (the host then draws
 *  PAGE_SIZE_DEFAULT). `size` is points. PAGE-SIZE (ruling a): real points in page units, `n x --wz-pt`, so the type scales with the page.
 *  (Before page-size: `17px x n/11 x --paper-scale`, with 11 the default - PROSE_BASE_PX / SIZE_DEFAULT, now the card's record only.) */
```
