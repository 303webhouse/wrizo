# Rulings: `apps/desktop/src/components/DeskFrame.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[DeskFrame §n]` points here.

## DeskFrame §1

From `apps/desktop/src/components/DeskFrame.tsx`, line 158 at `ded4321b` (the comment that stays: "no caller passes `meter`: the empty track is not drawn; the incentive layer returns through this prop if it returns here").

```ts
  // FX1 S5 — the meter track never got a content prop (AB1 S2: "ALWAYS
  // empty/reserved... do not mount the incentive layer here"), so its
  // desk-ground shell rendered as a wide, purposeless bar along the stage's
  // bottom on every framed page — Nick's "the dead bar" verdict. No caller
  // passes this yet; when the incentive layer eventually returns here, it
  // renders through this prop and the track reappears with it.
```

## DeskFrame §2

From `apps/desktop/src/components/DeskFrame.tsx`, line 169 at `ded4321b` (the comment that stays: "DeskFrame runs no dissolve engine of its own: the host's useChromeDissolve writes --fade-dur on an ancestor, and the strip and corkboard carry `chrome-fade desk-dissolve` like every other receding track").

```ts
// S3 note — DeskFrame does NOT run its own useChromeDissolve; the vanishing
// law stays one engine (no second fade system). Every call site already owns
// a ModeStage-driven (or equivalent) engine and passes ITS OWN outer page
// ref as chromeRootRef, so --fade-dur lands on an ancestor of both the
// editor's own chrome AND this frame's tracks — CSS custom properties
// inherit down the DOM tree, so `.desk-frame-modestrip` /
// `.desk-frame-corkboard` (each carrying `chrome-fade desk-dissolve`) pick
// up the same fast-out/slow-in curve automatically, without DeskFrame
// needing to touch the timing itself.
//
// FX10 S2 — `.desk-frame-strip` JOINS that list now; CD2 S1's original
// "never dissolving, focusable" law is overturned by Nick's own device
// finding: "the far left menu strip is not fading out when I resume
// writing." Root-caused live (scripts/harness/fx10.mjs's own diagnostic
// pass, not guessed): the strip was never wired to the dissolve at all —
// not a broken subscription, a deliberate omission (this comment's own
// prior wording said so outright, "the strip never dissolves... it carries
// neither class"). Nothing about `dissolved`/`--fade-dur`/`data-writing`
// was broken; the strip simply never carried the two classes every other
// dissolving track already does. The fix is exactly that omission, closed
// — `chrome-fade desk-dissolve`, the SAME classes `.desk-frame-corkboard`
// already carries below, riding the SAME one `useChromeDissolve` engine
// every other piece of chrome obeys (the identical first-keystroke trigger,
// the identical reduced-motion branch — no second implementation). The
// cascade's own layers 2-3 (the reach panel/survey) are UNCHANGED by this:
// they still dissolve through the deliberately different, more immediate
// mechanism named below (an explicit keydown reset), which is a real, prior
// design choice this ticket doesn't touch — only the strip's own "exempt
// from the vanishing law entirely" status was the defect.
//
// CD2 S1 (historical, now superseded above) — the cascade's own layers 2-3
// dissolve through a DIFFERENT, more immediate mechanism (an explicit
// keydown reset inside components/Cascade.tsx, the same precedent AB3's
// Drawer already established for its own Place face) rather than the
// ambient opacity fade — see that file's header comment for the full
// reasoning. This part is untouched by FX10 S2.
```

## DeskFrame §3

From `apps/desktop/src/components/DeskFrame.tsx`, line 224 at `ded4321b` (the comment that stays: "the prose page's scale from the stage's size alone (store/pageScale.ts): it lays out at scale 1 and is painted at k by a transform, so line breaks never move; measured on resize in a layout effect, never a container query").

```ts
  // PAGE-SIZE (Nick's ruling c) - the prose page's scale, from the STAGE's size alone (store/pageScale.ts holds the law). One ResizeObserver on the
  // stage writes the numbers the CSS reads: --wz-k (the base scale), --wz-zoom (the Typewriter's further zoom) and --wz-page-hl (the page's
  // LAYOUT height: the letter height, or less where the stage cannot hold it at this scale - ruling d). The page always LAYS OUT at scale 1 and is
  // PAINTED at k by a transform - "same line breaks at every scale" by construction (the lane run on fb1e28fb proved that scaling the type and the
  // box together re-broke lines at 2560 and 3840: glyph advances do not scale exactly linearly). It runs on resize, never on typing, and in a layout
  // effect so the first paint is already at scale. Measured, not a container query: a size container would make the stage the containing block for
  // every position:fixed element inside it. The page's top is read through offsetTop (transforms never move it), so no transform feeds back.
```

## DeskFrame §4

From `apps/desktop/src/components/DeskFrame.tsx`, line 247 at `ded4321b` (the comment that stays: "where the painted page ends, from the stage's top: the page's drawers stop there, never running past the paper").

```ts
      // POLISH #10 item 3 - where the painted page ends, from the stage's top: the page's drawers stop there (index.css), never running past the paper
```

## DeskFrame §5

From `apps/desktop/src/components/DeskFrame.tsx`, line 315 at `ded4321b` (the comment that stays: "the corkboard track is empty and reserved; the capture items live at components/Sliver.tsx (CAPTURE_ITEMS)").

```ts
// AB2 S2 — the interim Journal capture tab (AB1's CorkboardJournalTab /
// CAPTURE_ITEMS) is RETIRED here: the corkboard track returns to
// empty/reserved until AB3, and the capture items (Spark deck / Fragments /
// Send → Drawer) move to their ruled final home, the Free Write tool rail
// (AB2's ToolRail.tsx — see its own CAPTURE_ITEMS export). Parked, not
// deleted: the harness checks that once asserted this stub's presence live
// on in scripts/harness/ab1.mjs's PARKED section (S8), with their successors
// in ab2.mjs. CD1 S7 — ToolRail.tsx itself retires whole; CAPTURE_ITEMS now
// lives at components/Sliver.tsx, verbatim.
```
