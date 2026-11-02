# Rulings: `apps/desktop/src/styles/05-machina.css`

Ruling histories moved verbatim out of the CSS by #13 step 7 (Fable's comment ruling, Oct 29). A comment in the CSS that
cites `[machina §n]` points here.

## machina §1

From `apps/desktop/src/styles/05-machina.css`, line 1 at `25112784` (the comment that stays: "MACHINA - the third theme, strictly additive under [data-theme='machina'] (docs/theme-foundations/machina/machina-foundations.md, docs/plans/machina-build.md). Two casts: COOL is the base block, NEUTRAL lists only what changes. The page pref flips only the paper and card tokens; the chrome stays dark. Orange is scarce in both casts. --text-low is lifted above the mockup's muted value to clear the 4.5:1 text floor").

```css
/* ============================================================================
   MACHINA - the third theme (docs/theme-foundations/machina/machina-foundations.md, LOCKED Jul 14; the approved mockup cursor/machina-v1-mockup @ 360f3db3;
   docs/plans/machina-build.md). "The machine's room": neutral, precise, professional. Strictly additive under [data-theme='machina'] - the seam working as designed.
   TWO TEMPERAMENTS (CAST, store/themeCast.ts; data-cast is on <html> ONLY while the theme is Machina): COOL is the BASE block (steel active lines, sparks off), NEUTRAL
   only lists what changes (the active carrier turns orange, sparks on). PAGE INK IS INDEPENDENT OF ROOM INK: the Page pref (data-page) flips only the paper trio and the card
   tokens - the chrome stays dark in the light frame. Orange is scarce in BOTH casts: the caret, Finalize, the mark and the Run notch (--brass, invariant).
   Values: the mockup's own (--ground/--chrome/--rail/--line/--strong/--active/--live/--ink/--meta/--muted/--page/--edge/--pageink), mapped onto the app's slots (docs/plans/machina-build.md
   §1a). DERIVED (the mockup gives no value): --lamp-glow, --ink-800, --paper-dim, --accent-door, the light page's --ink-on-paper-low and the card family - measured, below.
   ONE DEVIATION FROM THE MOCKUP, for the 4.5:1 text floor (faint-text-sweep): the mockup's --muted (#6C7482 cool / #6F6F6F neutral) measures 3.8-4.2:1 on the chrome surfaces, so
   --text-low (the app's "muted" text tier) is lifted to #7A8290 / #7D7D7D (4.75 / 4.55:1 on --chrome-surface, higher on the ground and rail).
   MEASURED (WCAG): page text 14.6:1 cool-dark, 17.2:1 cool-light, 14.9:1 neutral-dark, 17.7:1 neutral-light (floor 7:1); meta on paper 5.4 / 5.67 / 5.2 / 6.7:1 (floor 4.5:1).
   ============================================================================ */
```

## machina §2

From `apps/desktop/src/styles/05-machina.css`, line 42 at `25112784` (the comment that stays: "Machina's default writing face").

```css
/* TOOLS #10 item 10 (Nick, Oct 24): Machina's default writing face. Was 'IBM Plex Serif', Georgia, serif. */
```

## machina §3

From `apps/desktop/src/styles/05-machina.css`, line 104 at `25112784` (the comment that stays: "Finalize and the Plan door are plain: quiet at rest, --text-hi on hover; the carrier colour only where it means current. Orange is for the notch, the closed strip and a chosen state, never a resting label").

```css
/* FINALIZE and the PLAN door are PLAIN (Nick, Oct 24): the mockup drew Finalize orange at rest and the page's Plan door wears --accent-rest (orange under NEUTRAL, steel under COOL); both now read like every other mode -
   quiet at rest (--text-mid), --text-hi on hover (the shared .desk-mode-tab:hover / .page-plan-door:hover), and the carrier colour only where it already means "current" (the active tab's underline, --accent-rest).
   Orange is for the notch, the closed strip and a chosen state - not a resting label. */
```

## machina §4

From `apps/desktop/src/styles/05-machina.css`, line 112 at `25112784` (the comment that stays: "the mark: WRIZ in the content-label face and the outlined square in the active carrier (steel in COOL, orange in NEUTRAL); Arbor's PNG mask is switched off as Flux's is").

```css
/* THE MARK (Fable's ruling, Oct 23: "ship the approved mockup's WRIZ▢ wordmark - the mockup wins over the plan prose"): the corporate wordmark, top left like Flux's - WRIZ in the content-label face
   (Plex Sans 600, 13px, .08em) and the OUTLINED SQUARE (the O) in the active carrier (Fable, Oct 29: steel in COOL, orange in NEUTRAL - --line-active). Arbor's hand-drawn PNG mask is switched off exactly as Flux's is. Orange is one of its few homes. */
```

## machina §5

From `apps/desktop/src/styles/05-machina.css`, line 126 at `25112784` (the comment that stays: "the vignette sits behind the content: it shades the room, never the page").

```css
/* the vignette sits BEHIND the content (the rule Flux's flux-inputs gave itself, Oct 23): it shades the room, never the page - the empty light page showed grey bands top and bottom */
```

## machina §6

From `apps/desktop/src/styles/05-machina.css`, line 127 at `25112784` (no comment stays: the rule reads plainly).

```css
/* (Machina's own vignette line that stood here is COLLAPSED into the one base rule - body::after, under the atmosphere overlays - which puts
   the vignette behind the page in EVERY theme: page-size, Fable Oct 23. th-machina-source.mjs M18 [page-size successor] checks the base rule.) */
```
