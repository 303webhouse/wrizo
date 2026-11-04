# Rulings: `apps/desktop/src/components/useTypewriterFade.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[useTypewriterFade §n]` points here.

## useTypewriterFade §1

From `apps/desktop/src/components/useTypewriterFade.ts`, line 3 at `ded4321b` (the comment that stays: "the shared typewriter engine holds the active line low so earlier lines ride up and fade; past the zone's lower bound it scrolls smoothly by exactly the delta (one line for ordinary typing), never a jolt").

```ts
// Shared typewriter-scroll engine (B2, FX1 S1 rewrite): holds the active line
// low in the viewport so earlier lines ride up and fade. Originally
// ModeStage-only (a fixed-height `.mode-scroll` box); generalized here so
// JournalEntry's naturally-growing, window-scrolled sheet (ink strokes anchor
// to the sheet's own growing height, so it can't be clipped into a fixed-
// height overflow box — see JournalEntry.tsx) can share the same hold
// behavior via `useWindowScroll`. The visual fade itself is CSS: a
// `mask-image` on the scroll box for the container case, or a sticky
// gradient overlay for the window case (see index.css / JournalEntry.tsx).
//
// FX1 S1 (Nick's first-sitting verdict) — the old engine held the active line
// at a fixed band and, on crossing it, snapped the scroll position with a
// hand-rolled overshoot-then-settle "jolt" animation. That overshoot read as
// a pop/jerk on every line commit. This rewrite drops the jolt entirely: once
// the writing zone's lower bound (still TYPEWRITER_BAND) is crossed, the box
// scrolls smoothly (native smooth scroll; instant under reduced-motion) by
// exactly the delta needed to restore the bound — which, for ordinary one-
// line-at-a-time typing, is one line-height, never a multi-line jump.
```

## useTypewriterFade §2

From `apps/desktop/src/components/useTypewriterFade.ts`, line 24 at `ded4321b` (the comment that stays: "the start offset is a visual quarter of the stage, for prose, script and the Journal alike").

```ts
// FX4 S1 — Nick's 2026-07-18 sitting: the fraction moves again, this time to
// a "visual quarter" — and, for the FIRST time, the Journal carve-out this
// comment used to describe RETIRES (see the new CSS rule this ticket adds:
// `.entry-full[data-typewriter='true']{ padding-top:var(--tw-start-offset) }`
// in index.css — Journal's window-scroll call below now passes its OWN
// holdBand, see JOURNAL_HOLD_BAND, and reads this SAME fraction for the
// first time ever). Measured the fx1.mjs way (a rendered rect, not the raw
// CSS value alone — .mode-page's own top padding sits ON TOP of
// --tw-start-offset's own contribution, so the two together are what a
// writer actually SEES): at 0.25 raw, prose's VISUAL start lands at ~29.2%
// of the stage height at 1280px and ~30.0% at the S2-scaled 2200px; script's
// (no comparable extra chrome padding) lands almost exactly on the raw
// value, ~25.0% at 1280px — all three comfortably read as "about a quarter,"
// genuinely lower than the old 0.29 raw / ~33-34% visual FX3 shipped —
// verified empirically via the same harness technique FX3's own S3 used
// (fx4.mjs's own S1 section), not just derived on paper.
```

## useTypewriterFade §3

From `apps/desktop/src/components/useTypewriterFade.ts`, line 115 at `ded4321b` (the comment that stays: "the row the collapsed caret sits in, or null: a fresh line after Enter is an empty row, where the range gives no rect or the previous line's").

```ts
/** POLISH #10 item 17: the row the collapsed caret sits in (the row model's `.wz-row`), or null - a fresh line after Enter is an EMPTY row, where the
 *  range gives no rect, or the previous line's. */
```

## useTypewriterFade §4

From `apps/desktop/src/components/useTypewriterFade.ts`, line 154 at `ded4321b` (the comment that stays: "diagnostics in memory only: an array the harness puts on window before mount; absent in every real session, so nothing is written").

```ts
    // PAGE-SIZE G DIAGNOSTICS (Fable, Oct 24 - approved with conditions): the engine's decisions, in MEMORY only - an array the harness puts on
    // window before the page mounts. Read ONCE here, at mount; when it is absent (every real session) nothing below is ever written. No DOM
    // attribute, no DOM write, nothing on the keystroke path but one branch. page-size.mjs's source check pins this gate.
```

## useTypewriterFade §5

From `apps/desktop/src/components/useTypewriterFade.ts`, line 161 at `ded4321b` (the comment that stays: "the fade trigger: window mode gates on the sheet's own top vs the viewport, container mode on the box's own scrollTop against its rest position").

```ts
      // Window mode: gate on the SHEET's own top vs the viewport (has content
      // actually scrolled past the fold?), not raw window.scrollY — a page
      // can be scrolled a little (chrome above the sheet moving out of view)
      // while the sheet's first line is still fully below the viewport top.
      // Using window.scrollY there (Fable W1-R3) washed line 1 into paper on
      // a short-but-scrolled page, violating C2. Container mode: the box's
      // own scrollTop past its own rest position (0) — this is the "fade-
      // trigger threshold, separate from the start offset" S3 went looking
      // for. FX3 S3 fix — this previously read `box.scrollTop - box.top`,
      // subtracting the box's VIEWPORT-space Y position (readBox's own
      // `top`, ~150px in the framed layout) from its scroll offset, a unit
      // mismatch: on any layout where the scroll box doesn't sit within a
      // few px of the viewport's own top (every framed surface, pre- and
      // post-S1), that left `data-scrolled` needing scrollTop > ~150px to
      // ever flip true — the mask-image fade was structurally stuck off for
      // many lines after the auto-scroll (CONTAINER_HOLD_BAND, above) had
      // already kicked in, exactly Nick's "the first scroll engaged late"
      // (auto-scroll and its own visual fade lagging out of step). The fix
      // is simply the box's own scrollTop against its own rest position.
```

## useTypewriterFade §6

From `apps/desktop/src/components/useTypewriterFade.ts`, line 197 at `ded4321b` (the comment that stays: "one line per glide: the next step waits until the last glide has landed and steps from there; a glide that never lands stops waiting after GLIDE_MS").

```ts
    // PAGE-SIZE - ONE LINE PER GLIDE. Each step is a one-line smooth scroll, and a chained catch-up step used to fire on the very next frame,
    // reading box.scrollTop while the last step was still in flight - every step started short and a deep engage under-scrolled (lane run on
    // fb1e28fb). Building each step on the last one's TARGET instead (64e5b7f9) folded the queued lines into ONE long smooth scroll - a multi-line
    // lurch at up to 167px a frame (fx5 S1 a on 64e5b7f9). So the next step WAITS until the last glide has landed, then steps from where it landed:
    // one line at a time, and no line lost. A glide that never lands (a writer's own scroll took over) stops waiting after GLIDE_MS.
```

## useTypewriterFade §7

From `apps/desktop/src/components/useTypewriterFade.ts`, line 204 at `ded4321b` (the comment that stays: "a glide is paid only when it lands: one that ends short (the browser cancelled it) has its remainder owed again; one that went back past its start is the writer's own scroll, honoured").

```ts
    // PAGE-SIZE - A GLIDE IS PAID ONLY WHEN IT LANDS. The lane run on d80010ae caught G's cause in its own trace: the engine issued its one-line
    // smooth scroll (972 -> 999) and credited the line at once - and the scroll never moved (972 at 1s and at 1.5s): the browser CANCELLED the
    // smooth scroll (its own caret-into-view on the next keystroke is the likely canceller). The next pass saw nothing owed and the writing line
    // stayed a line low. Now a glide that ends short of its target - the box still between where it started and where it was going - has its
    // unscrolled remainder owed again, and is re-issued. A box that went BACK past where the glide began is the writer's own scroll: honoured,
    // as before (FX5 S1 c). A timer re-checks just after each glide's time, so a lost line is recovered even if the writer stops typing.
```

## useTypewriterFade §8

From `apps/desktop/src/components/useTypewriterFade.ts`, line 212 at `ded4321b` (the comment that stays: "glides are timed by performance.now(), ending at LINE_GLIDE_MS whatever the frame pacing; a backlog is paid in bigger steps finished within BACKLOG_CAP_MS").

```ts
    // TIME-BASED GLIDE (Fable, Oct 31, ledger 166). The browser's native smooth scroll was the engine's clock: a one-line glide took however long the machine
    // took to land it, and a deep first engage (a long page, the caret at its foot) is paid ONE LINE PER GLIDE - 38 serial landings, ~1.6 s after the last key on
    // the box and ~9 s on a loaded one. Now each glide is driven by performance.now(), not by frames: it ends at LINE_GLIDE_MS whatever the frame pacing (a
    // timer ends it if the frames stop), and a BACKLOG is paid in bigger steps sized so that it is finished within BACKLOG_CAP_MS of becoming owed. An ordinary
    // line (a backlog of one) is still one line per glide; no frame moves more than the lurch law allows (fx5 S1 a: 1.6 lines, 2.5 on first engage).
```

## useTypewriterFade §9

From `apps/desktop/src/components/useTypewriterFade.ts`, line 220 at `ded4321b` (the comment that stays: "no single catch-up step is more than MAX_STEP_LINES lines, however much is owed: a deep backlog takes more steps, never a bigger one").

```ts
    // THE STEP CAP (Fable, Nov 1, train-12i). The cap above sizes a backlog's steps to finish in time - but once the owed advance has stood past it (typing outran the
    // glides, or a frame stall held them) there is no time left and the sizing paid the WHOLE backlog in one step: 444 px in one frame (fx5 S1 a, 1 run in 24 of train-12h).
    // No single catch-up step is more than this many lines, whatever is owed or however late it is; a deep backlog is paid in more steps, never a bigger one.
```

## useTypewriterFade §10

From `apps/desktop/src/components/useTypewriterFade.ts`, line 284 at `ded4321b` (the comment that stays: "the band mask's line unit in screen px (line height x paint scale); zoomed, the start offset puts a fresh page's first line at the anchor").

```ts
      // PAGE-SIZE - the band mask's line unit, in SCREEN pixels (the real line height x the paint scale), written where the mask is drawn; and the
      // start offset, ZOOMED, puts a fresh page's first line at the anchor itself - inside the band's full strength (a quarter of the stage put
      // it about a line ABOVE the anchor, on the .88 ramp: fx5 S1(d) on fb1e28fb). Layout px: the screen distance divided by the paint scale.
```

## useTypewriterFade §11

From `apps/desktop/src/components/useTypewriterFade.ts`, line 297 at `ded4321b` (the comment that stays: "room below the last line, so it can rise to the anchor: the column's own height in layout px").

```ts
        // and room BELOW the last line, so the last line can rise to the anchor at all: zoomed, the scroller's box reaches far below the stage,
        // and 30vh of end padding let the scroll bottom out with the writing line still 1-3 lines under the band (W/T on 64e5b7f9). Its own
        // height (layout px) is always enough - the sheet "bleeds a full stage height below" in Cursor's mockup for the same reason.
```

## useTypewriterFade §12

From `apps/desktop/src/components/useTypewriterFade.ts`, line 313 at `ded4321b` (the comment that stays: "the caret's ROW is the truth when the range's rect is not on it, so Enter's line is paid at once").

```ts
        // POLISH #10 item 17 (Nick, Oct 25): on the row model the caret's ROW is the truth. Right after Enter the new line is an empty row: the range
        // gives no rect, or the previous line's - and the walk below measures the previous line's last character - so Enter's line was never paid
        // until the next keystroke, and then the page jumped. The row the caret sits in is measured instead whenever the range's rect is not on it.
```

## useTypewriterFade §13

From `apps/desktop/src/components/useTypewriterFade.ts`, line 389 at `ded4321b` (the comment that stays: "the caret is tracked in document space (from the TEXT's top, not the scroller's padding), so a writer's own scroll is never snapped back and a scale change never shifts it").

```ts
      // FX5 S1 (a, c) — "document space": the caret's position independent
      // of the CURRENT scroll offset. The OLD design recomputed an ABSOLUTE
      // `target = box.scrollTop + delta` on every keystroke, which always
      // tries to put the caret back at exactly holdBandValue's own fraction
      // of the box — a real, reproducible defect (found live, not guessed):
      // a writer who scrolls up to reread has the caret's ON-SCREEN
      // position pushed far down (or off-screen) by their own scroll, so
      // the very next keystroke computed a huge `delta` and snapped the
      // whole page back down to re-align — "typing snaps the page back to
      // the band," exactly Nick's complaint, not merely a tuning issue.
      // docCaretBottom instead tracks the caret in a coordinate space that
      // does NOT move when the box is merely scrolled (only when the
      // caret's own document position genuinely changes), so comparing it
      // against its own PREVIOUS reading isolates "how much new content did
      // the writer just produce" from "where did the viewport happen to be
      // sitting" — the two concerns S1 asks to be decoupled.
      // PAGE LAW (fx5 S1 c, train-11): the document position is measured from the TEXT's top, not the scroller's. The scroller's start-offset padding is rewritten
      // whenever the paint scale moves (measure(): startPx is the screen distance over the scale), and a position that includes it shifts by the change - the carried
      // position was then 110px off and one typed line paid 140px (501 -> 636) with the page law broken. The text does not move when its padding does.
```
