# Rulings: `apps/desktop/src/components/ModeStage.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[ModeStage §n]` points here.

## ModeStage §1

From `apps/desktop/src/components/ModeStage.tsx`, line 53 at `7f1c6a84` (the comment that stays: "PEN_INKS suits a light page; on Flux's dark page each swatch keeps its hue and lightens to clear 7:1 (the default reuses --ink-on-paper)").

```ts
// FLUX-PAGE-INK — PEN_INKS is a fixed, theme-independent swatch list tuned for
// a light page. Flux's dark page (--paper:#0B2429) is the one combination
// where that assumption breaks: the default swatch measured 1.16:1 against it
// (Chat 1 ledger 62/72). Arbor has no dark-page variant (canon §11 debt,
// themePrefs.ts), so Flux dark is the only tone that needs a substitute. Each
// swatch keeps its hue family; only lightness moves, enough to clear 7:1
// against #0B2429 (black-brown reuses --ink-on-paper itself, ~13.9:1; red and
// blue are hand-lightened, ~7.4:1 and ~7.7:1).
// FLUX V2: the dark page is now #0E1C24 with --ink-on-paper #E8F6FA, so the default swatch follows it (still ~15:1; red and blue only gain contrast on the darker glass).
```

## ModeStage §2

From `apps/desktop/src/components/ModeStage.tsx`, line 68 at `7f1c6a84` (the comment that stays: "on Flux light the default swatch is Flux's own --ink-on-paper").

```ts
// theme-leftovers (Fable, Oct 16): "Flux light Free Write's default pen ink
// is Arbor's #1A0F06; use Flux's ink instead." Not a contrast gap (Arbor's
// black-brown already carries on Flux light's paper) but an identity one —
// the default swatch was never re-pointed to Flux's own ink at all, only its
// dark-page variant was (above). #14231F is Flux light's own --ink-on-paper
// (index.css), the same "reuse the theme's own ink" move the dark case
// already makes. Scoped to the default swatch only, per the ticket's own
// wording — red/blue aren't named and aren't touched.
// FLUX V2: Flux light's --ink-on-paper is now #042632, and the default swatch is still that ink.
```

## ModeStage §3

From `apps/desktop/src/components/ModeStage.tsx`, line 81 at `7f1c6a84` (the comment that stays: "on Machina the default swatch is var(--ink-on-paper), so it follows a cast switch with no JS; red and blue lighten on the dark page; display only - the stored swatch stays the hex").

```ts
// MACHINA (Oct 24; Nick: "Sprint page text is nearly invisible, dark on dark"): the SAME gap Flux's dark page had, and it was never closed for Machina - effectivePenInk only knew Flux, so Free Write
// (the Sprint tab: its rail hands the editor a PEN ink) painted the raw default swatch #1a0f06 on Machina's dark page: 1.06:1 cool / 1.04:1 neutral. The default swatch becomes the theme's OWN ink
// as a CSS variable (var(--ink-on-paper): the page's own text colour in every cast and tone, 14.6-17.7:1, so it follows a cast switch with no JS); red and blue are lightened on the dark page
// like Flux's (8.1-8.7:1) and left alone on the light one. The substitution is display-only - the stored/selected swatch is still the hex.
```

## ModeStage §4

From `apps/desktop/src/components/ModeStage.tsx`, line 107 at `7f1c6a84` (the comment that stays: "RAILS is total over EditorMode and indexed unguarded; Revise's empty `items` is deliberate, and `tools: 'format'` keeps the pen ink away from Revise").

```ts
  // ITEM 112-A — Revise's entry, and it is REQUIRED rather than decorative: this
  // record is TOTAL over EditorMode and is indexed UNGUARDED below (`const rail =
  // RAILS[mode]`), including on the framed path, where `rail.tools` decides whether
  // the editor is handed a pen ink. A missing key here is a TypeError on first
  // render, not a cosmetic gap.
  //
  // EMPTY `items` IS THE POINT, not an oversight. Revise's Desk-hand furniture is
  // 83's Type section, which is 112-C — this ticket ships the room, not the tenants
  // (§1) — and a stub row naming an unbuilt capability is the locked door wearing
  // paint that G3 forbids. `tools: 'format'` is what keeps the pen ink AWAY from
  // Revise (only 'pen' hands one down); it does not give Revise Draft's format bar
  // on the framed surface, where this whole legacy toolbar does not mount at all.
  // `ai: 'open'` matches Draft: the Counsel is never sealed on a surface that
  // accepts writing (item 119).
```

## ModeStage §5

From `apps/desktop/src/components/ModeStage.tsx`, line 186 at `7f1c6a84` (the comment that stays: "this page's own id, so Draft's typewriterOn asks typewriterForPage; absent (QuickSprint) falls back to the shared field").

```ts
  // typewriter-scope (Fable Oct 21) — THIS page's own id, so the 'drafting'
  // branch of `typewriterOn` below can ask typewriterForPage directly instead
  // of the shared `typewriter` mirror. Optional: absent (QuickSprint, which
  // has no durable per-page memory of its own — a scratch surface) falls
  // through to the shared field exactly as every caller did before this.
```

## ModeStage §6

From `apps/desktop/src/components/ModeStage.tsx`, line 208 at `7f1c6a84` (the comment that stays: "Typewriter engages in Free Write and Draft only; Draft reads this page's own value, Free Write and pageId-less callers the shared field").

```ts
  // Typewriter engages in Free Write and Draft (writing postures) — never in
  // Format/Workshop/Publish (convention/delivery, revision-shaped work the
  // hold would fight). Gated by the persisted setting AND the bottom-right
  // icon, both toggling the same value. AB1 S2 froze this out entirely when
  // framed ("do not mount the typewriter effect or its toggle"); AB2 S2
  // returns it from parking — the EFFECT now engages framed too (its own
  // toggle button moves to the sliver, a DeskFrame sibling reading/writing
  // the same shared store — CD1: components/Sliver.tsx), independent of framed.
  // typewriter-scope (Fable Oct 21) — Draft reads THIS page's own value
  // (never the shared mirror another page could have left behind); Free
  // Write and every pageId-less caller (QuickSprint) keep reading the
  // shared field exactly as before.
```

## ModeStage §7

From `apps/desktop/src/components/ModeStage.tsx`, line 223 at `7f1c6a84` (the comment that stays: "the zoom: on the framed prose page Typewriter scales the same page ~1.6x by a transform, so no line reflows and the editor never unmounts (page primacy's one exception); entering tucks both drawers").

```ts
  // PAGE-SIZE (spec point 3) - THE ZOOM: on the framed prose page, Typewriter (Terminal Mode, and the themes' later names) is the SAME page scaled
  // ~1.6x (index.css `.mode-pagecol[data-zoom]`, --wz-zoom from DeskFrame's observer) - a transform, so no line ever reflows and the editor never
  // unmounts. The ruled exception to page primacy (docs/page-primacy-canon.md): the rect changes on purpose, and leaving returns it exactly.
  // Entering tucks both drawers (tools: they collapse, their grips stay); the Flux block caret is told the layout moved under it.
```

## ModeStage §8

From `apps/desktop/src/components/ModeStage.tsx`, line 231 at `7f1c6a84` (the comment that stays: "focus inside a drawer the zoom tucks would be stranded in an inert panel, so it goes to the page").

```ts
    // focus that was INSIDE a drawer the zoom tucks would be stranded in an inert panel (the lane run on fb1e28fb: Enter on the Sliver's own
    // Typewriter toggle turned the zoom on, the drawer tucked, and the next key went nowhere). It goes to the page - where the writer is about to write.
```

## ModeStage §9

From `apps/desktop/src/components/ModeStage.tsx`, line 243 at `7f1c6a84` (the comment that stays: "memoized so useChromeDissolve's rootRef keeps its identity (a fresh array each render tore down the edge-dwell listener); on the framed desk the root element joins, so --fade-dur reaches chrome outside the host").

```ts
  // AB1 S3 fix (found while generalizing the vanishing law to DeskFrame,
  // pre-existing on this surface too — not new here) — this array literal
  // was previously rebuilt on every ModeStage render, so useChromeDissolve's
  // rootRef dependency changed identity every render, tearing down and
  // re-mounting its edge-dwell listener effect constantly and clearing any
  // in-flight dwell timer before EDGE_DWELL_MS could ever elapse — an
  // edge-reach resurface could never actually complete. Memoized on the one
  // input that should matter (chromeRootRef itself, a stable ref object).
  // POLISH #10 item 23: on the framed desk the root element joins the roots, so the engine's fade timing (--fade-dur) reaches the chrome that lives
  // outside the host too (the wordmark, the "...", Flux's glitch meter) - one curve for everything that recedes
```

## ModeStage §10

From `apps/desktop/src/components/ModeStage.tsx`, line 255 at `7f1c6a84` (the comment that stays: "the root everywhere: the narrow layout follows the full recede").

```ts
// Nick's ruling (via Fable, Oct 25): "Recede depth" is REMOVED - the narrow layout follows the full recede: the root everywhere
```

## ModeStage §11

From `apps/desktop/src/components/ModeStage.tsx`, line 263 at `7f1c6a84` (the comment that stays: "while typing, the framed desk marks the root element so chrome outside its own tree (the wordmark, the ember dot, the progress lane, the glitch meter) recedes too").

```ts
  // POLISH #10 item 23 (Nick, Oct 25): WHILE TYPING, EVERYTHING OFF THE PAGE GOES TO 0 - the framed desk announces it on the root element, so the
  // chrome that lives outside the desk's own tree (the wordmark, the ember dot, the progress lane, Flux's glitch meter) recedes with it (index.css)
```

## ModeStage §12

From `apps/desktop/src/components/ModeStage.tsx`, line 266 at `7f1c6a84` (the comment that stays: "the narrow layout too follows the full recede").

```ts
// Nick's ruling (via Fable, Oct 25): "Recede depth" is REMOVED - the narrow layout follows the full recede: the narrow layout too
```

## ModeStage §13

From `apps/desktop/src/components/ModeStage.tsx`, line 368 at `7f1c6a84` (the comment that stays: "zoomed, the writing line is held at ZOOM_ANCHOR of the page column, the anchor the band mask is drawn against").

```ts
    // PAGE-SIZE - zoomed, the writing line is held at ZOOM_ANCHOR (50% since polish #10 item 19) of the page column, the anchor Cursor's band mask is drawn against
```

## ModeStage §14

From `apps/desktop/src/components/ModeStage.tsx`, line 450 at `7f1c6a84` (the comment that stays: "a press on the paper off the text: below the last line, the caret goes to the end; beside a line, to the nearest spot on that line (caret-from-point, read at press time, applied next frame); on the text, the browser's own").

```ts
  // BLANK-PAGE CLICK (Fable, Oct 22; ledger 134 and her correction on 0e713e7a - "just let me write"). A press on the PAPER, off the text:
  //   - BELOW the last line (or on an empty page)  -> the caret at the END of the text;
  //   - BESIDE a line (a side margin, or the page's top padding) -> the NEAREST SPOT ON THAT LINE, by the browser's own caret-from-point at the
  //     press, clamped into the editor's box - never the end of the document;
  //   - ON the text -> the browser's own, never touched.
  // Why here: a bare focus() left a Draft page's caret at the START (Free Write was spared only by its forward lock). This handler sits on the
  // PAPER (.mode-page), not the scroller, because the paper's LEFT margin is .mode-page's padding, outside the scroller. A press on a control keeps
  // exactly what it did before (inside the scroller a plain focus, outside it nothing), and so does a press on any other element of the page.
  // The point is read at PRESS time (before focus can scroll a typewriter page) and turned into the editor's own plain offset (rowsOffsetOf), so a
  // re-render on focus cannot detach it; it is applied by the editor's own setCaretOffset on the NEXT frame, because the editor's own placement on
  // focus lands after a synchronous set and would overwrite it (PageEditor's onReachName, measured). If the browser cannot resolve the point, the
  // press is a plain focus - never the end.
```

## ModeStage §15

From `apps/desktop/src/components/ModeStage.tsx`, line 578 at `7f1c6a84` (the comment that stays: "'Pen' from the lexicon, matching the bar's own aria-label").

```ts
                {/* ITEM 130 (2026-09-09) — 'Pen', from the lexicon.
                    This read 'ink' while this same bar's own aria-label read
                    'Pen' (above), so one control carried two names and only
                    assistive tech got the right one. It is the UNFRAMED bar:
                    the narrow shell is the only surface it reaches, which is
                    why the phone showed 'INK' beside text-colour swatches and
                    looked like the Ink wave's zone. It is not — that zone is
                    Sliver.tsx's, framed-only, and cannot render here. */}
```

## ModeStage §16

From `apps/desktop/src/components/ModeStage.tsx`, line 587 at `7f1c6a84` (the comment that stays: "PEN_INKS ids stay fixed (the stored value compares against them); only the swatch's painted colour goes through effectivePenInk, so the chip shows what tapping it writes").

```ts
                {/* FIX (Fable, Oct 17, ledger 88-90) — PEN_INKS is a fixed,
                    theme-independent set of IDS (the comparison/stored value
                    `choosePen`/`pen === ink` needs to keep working against,
                    unchanged); only the SWATCH'S OWN PAINTED COLOUR must go
                    through the same effectivePenInk() substitution the actual
                    ink on the page already gets (render-prop hand-off,
                    below) — otherwise the chip lies about what tapping it
                    will write in Flux, same species as splash-sweep's
                    page-outline fix: paint the theme's own ink, not Arbor's. */}
```

## ModeStage §17

From `apps/desktop/src/components/ModeStage.tsx`, line 607 at `7f1c6a84` (the comment that stays: "no nib control: a button for a capability this surface does not have is absent, never greyed").

```ts
                {/* ITEM 130 (2026-09-09) — THE 'nib · fine ▾' BUTTON IS GONE.
                    It was `title="Nib styles — coming soon"`: a control
                    promising a capability this surface does not have. G3 in
                    miniature — progressive disclosure never shows a locked
                    door — so it is ABSENT, never grayed: what isn't built
                    doesn't render. Item 131 (phone ink) brings real nibs here
                    and this is where they land. Dating note, because the word
                    misled the first diagnosis: this button was introduced
                    d65065c on 2026-06-28, ten weeks BEFORE the Ink wave's own
                    nib (af3c79c, 2026-09-07). Same word, unrelated control. */}
```

## ModeStage §18

From `apps/desktop/src/components/ModeStage.tsx`, line 782 at `7f1c6a84` (the comment that stays: "options exist only where they act: Progress:Project needs a StoryPlan; the Bar|Rhizome style needs the framed stage; typewriterAvailable is false on a screenplay page; stored values are untouched either way").

```ts
// The gear menu — the writing-screen chrome settings, persisted. `hasMilestones`
// gates the Progress:Project option — offered ONLY when the current page
// belongs to a project with a StoryPlan (the canon's Q3 rule; no greyed
// states, the option simply isn't in the list otherwise).
// M2 S1 — `framed` gates the NEW Progress-style (Bar|Rhizome) option the
// same "offered only when it exists" way: the growth engine itself (S2)
// only ever mounts on the framed (>=1100px) desk stage (this build's own
// judgment call — see RhizomeField.tsx's header comment for the full
// reasoning), so offering the control below that width would let a writer
// toggle a setting with no visible effect on their current device. The
// STORED value is untouched either way (same silent-degrade law as
// Progress:Project) — it simply resumes the instant the writer is back on
// a framed session.
// SC1 S3 (2026-07-24) — `typewriterAvailable` defaults TRUE, so every
// pre-SC1 caller (this file's own framed/unframed prose gear) is unchanged.
// Sliver.tsx passes false on a screenplay page, where the surface no longer
// runs the typewriter and the option must therefore not present itself: the
// icon toggle is the visible affordance, but this Seg is the second one
// behind the same gear, and hiding only the first would leave a live switch
// that does nothing one click deeper.
```

## ModeStage §19

From `apps/desktop/src/components/ModeStage.tsx`, line 832 at `7f1c6a84` (no comment stays: the code reads plainly).

```ts
      {/* ITEM word-diet (Nick, Oct 13) — the standing hint below retires;
          its explanation moves here, behind a "?" beside this row's own
          label, one plain sentence (recedeHint, deskLexicon.ts). */}
```

## ModeStage §20

From `apps/desktop/src/components/ModeStage.tsx`, line 835 at `7f1c6a84` (no comment stays: the code reads plainly).

```ts
      {/* Nick's ruling (via Fable, Oct 25): "Recede depth" is REMOVED - the narrow layout follows the full recede - the row that stood here (the fadeDepth Seg) is gone */}
```

## ModeStage §21

From `apps/desktop/src/components/ModeStage.tsx`, line 856 at `7f1c6a84` (the comment that stays: "picker order follows the theme arc's narrative progression, not launch order").

```ts
  // Fable's A3 (TH2 review) — picker order follows theme-arc.md's narrative
  // progression (Plateau -> Machina -> Flux -> Nomad -> Volant), not launch
  // order; later territories arrive here only by progressive disclosure
  // (engagement-facts the app already shows, never a solicited/gated
  // target — the M1 anti-gamification frame). Two entries make the order
  // moot today, but the law belongs at the site that will enforce it.
```
