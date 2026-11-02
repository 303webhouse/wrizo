# Rulings: `apps/desktop/src/styles/12-studio-chrome.css`

Ruling histories moved verbatim out of the CSS by #13 step 7 (Fable's comment ruling, Oct 29). A comment in the CSS that
cites `[studio-chrome §n]` points here.

## studio-chrome §1

From `apps/desktop/src/styles/12-studio-chrome.css`, line 8 at `25112784` (the comment that stays: "the narrow layout follows the full recede").

```css
/* Nick's ruling (via Fable, Oct 25): "Recede depth" is REMOVED - the narrow layout follows the full recede (was .08, the "partial" floor) */
```

## studio-chrome §2

From `apps/desktop/src/styles/12-studio-chrome.css`, line 113 at `25112784` (the comment that stays: "the bar's fill is --chrome-surface, the chrome token every theme overrides (--ink-900 is Arbor's raw surface and would leave this strip half-themed)").

```css
/* theme-leftovers (Fable, Oct 17) — --ink-900 has no Flux override (it is the
   raw Arbor surface token, not --chrome-surface, which Flux DOES override),
   so this bar's own fill stayed Arbor-brown while its --ink-border-derived
   border already read teal: a half-themed strip. --chrome-surface is the
   token this comment already calls this bar ("chrome at the top of the
   page"), so it is the one to reuse here, not a new value. */
```

## studio-chrome §3

From `apps/desktop/src/styles/12-studio-chrome.css`, line 133 at `25112784` (no comment stays: the rule reads plainly).

```css
/* SWEPT (the narrow shell's rename, 2026-09-09) — `.mode-nib` styled the
   unframed pen bar's `nib · fine ▾` button, which was `title="Nib styles —
   coming soon"`: a control promising a capability the narrow shell does not
   have. G3 in miniature, so it went ABSENT rather than grayed, and its rule
   goes with it rather than lingering as dead weight. Item 131 (phone ink)
   brings real nibs to that surface and will dress them then. The CD1 comment
   further down still NAMES .mode-nib as one of the looks the sliver ported
   verbatim — that sentence is history and stays true of what was ported; only
   the live rule is gone. */
```

## studio-chrome §4

From `apps/desktop/src/styles/12-studio-chrome.css`, line 158 at `25112784` (the comment that stays: "the scrollbar is flush with the paper's outer right edge: a scrollbar renders at its element's border box, so .mode-scroll extends its box across the page's right padding with a negative margin and puts the same amount back as its own padding (the text stays where it was). Both read --wz-page-pad-x, the page's own margin setting, so the cancellation is exact at every margin").

```css
/* FX10 S4 — flush the scrollbar to the paper's own OUTER right edge, zero
   gap (Nick: "I want it flush at the outer edge of the right side of the
   page with no space between it and the edge" — it was rendering ~38-39px
   inboard, confirmed live via getBoundingClientRect before writing this
   fix). A scrollable element's own scrollbar always renders at that
   element's BORDER-BOX edge, ignoring its own padding — `.mode-scroll` sits
   INSIDE `.mode-page`'s own right padding, so its scrollbar rendered that
   far inboard of the paper's true edge. Fix: extend THIS element's own
   border box across that same padding (a negative right margin cancelling
   `.mode-page`'s padding exactly) and re-apply the identical amount as
   `.mode-scroll`'s OWN padding instead — the scrollbar now renders flush
   against the paper (at the border box this extends to), while the TEXT
   inside is still inset by the SAME amount from that new edge, landing at
   the byte-identical screen position it always occupied.
   SCROLLBAR-FLUSH (Fable Oct 23, Nick live on Flux: "bulky and floats
   INSIDE the page" — Arbor had the same glitch): this cancellation was
   hardcoded to the literal `38px`, `.mode-page`'s OWN pad-x value at the
   time FX10 was written. ITEM 83 M3 (R6), two weeks later, made that
   padding a per-page SETTING (`--wz-page-pad-x`, PAGE SETUP's margin
   choice: narrow 26px / normal 38px / wide 58px — `.desk-frame-stage
   .mode-page`'s own padding rule below reads this same variable) but
   never touched this rule's own literal. Any page set to narrow or wide
   margins broke the cancellation (wide: 20px of gap still inboard of the
   true edge — exactly "floats inside the page"; narrow: overshoots past
   it by 12px) while `normal` (the default) stayed byte-identical, which
   is why this went unnoticed until a writer changed the margin. Reading
   the SAME variable `.mode-page` itself reads, instead of a stale
   literal, restores exact cancellation at every margin and every
   --paper-scale step — zero behavior change when unset (the fallback is
   still 38px either side). FX2's clearance law: the writing's own line
   length (the text measure) is untouched by this move — only the
   scrollbar's own screen position changes. Left edge/measure untouched
   (Nick's own words name the RIGHT side only).
   AGREED WITH FIX (docs/plans/page-size.md §2, Fable Oct 23): page-size's
   own build turns `--wz-page-pad-x` into a FINISHED length (already
   scaled, built from `--wz-letter-in: calc(72.94px * var(--paper-scale))`)
   rather than today's base measure that `.mode-page`'s own padding rule
   (and this rule) multiply by `--paper-scale` themselves. FIX's plan
   explicitly does not touch this rule — whoever merges SECOND must drop
   the ` * var(--paper-scale)` factor below (both the margin-right and the
   padding-right) in the SAME commit that changes `.mode-page`'s own
   padding rule, or the two will double-scale against each other. Re-run
   both scrollbar-flush-source.mjs and page-size.mjs after that merge. */
```

## studio-chrome §5

From `apps/desktop/src/styles/12-studio-chrome.css`, line 220 at `25112784` (the comment that stays: "the typewriter fade is monotonic: the topmost line sits at the floor through --tw-fade-start, then the ramp climbs to fully shown over --tw-fade-band, so no newer line is ever fainter than an older one (typewriter-fade.mjs)").

```css
/* TYPEWRITER-FADE-ORDER (Nick's live bug, 2026-10-10: "lines fade out of order - a newer line dims while the older one above it
   stays dark"). FX5 S1(b)'s fully-shown lead-in did exactly that: the topmost (OLDEST) line read whole while the line under it
   dropped to the 15% floor. The fade is now MONOTONIC - the topmost line sits at the floor through --tw-fade-start (one line, so
   the band still "starts one line lower"), then the ramp climbs to fully shown over --tw-fade-band, so the top ~4 lines carry the
   fade (FX5 S1(c)) and no newer line is ever fainter than an older one. Proved by scripts/harness/typewriter-fade.mjs. */
```

## studio-chrome §6

From `apps/desktop/src/styles/12-studio-chrome.css`, line 261 at `25112784` (the comment that stays: "three selectors (an attribute and two classes), so the celebrate fill wins over the lime base rule whatever the source order").

```css
/* Fable's R1 (TH2 review) — Plateau's `.mode-pfill.celebrate` rule (below,
   two classes) and the lime base rule above (one attribute + one class)
   are EQUAL specificity, so source order alone decided the winner — and
   this Flux block, being later in the file, was silently keeping the fill
   lime straight through the celebrate window (ignition sweep, orange
   notch, and sparks all rendering over a lime bar). A three-selector rule
   (attribute + two classes) beats both cleanly regardless of source order. */
```
