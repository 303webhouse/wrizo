# Rulings: `apps/desktop/src/components/ScriptEditor.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[ScriptEditor §n]` points here.

## ScriptEditor §1

From `apps/desktop/src/components/ScriptEditor.tsx`, line 80 at `ded4321b` (the comment that stays: "one frozen style object per element type (the precondition for StaticScriptElement's memo); vertical spacing in line units (calc(var(--script-line) * N)); the page-top rule stays in CSS, never a function of position").

```ts
// Shared geometry for both the active and static renders of an element — one
// function so the two can never drift from each other visually.
// SC2 S1 — the page gains its vertical rhythm. Until now `elementStyle` set no
// vertical margin at all and `SPACE_BEFORE` sat dormant beside `PAGE_LINES`, so
// every element rendered flush against the next: a screenplay with no vertical
// rhythm, which is incorrect on its face rather than a matter of taste.
//
// THE SPACING IS IN LINE UNITS, NEVER px OR em (Fable, 2026-07-25). N blank
// lines of arithmetic must render as exactly N line-heights, so the margin is
// `calc(var(--script-line) * N)` where `--script-line` is the sheet's own line
// box (index.css). A px or em value could drift off the 12pt box and the
// ledger's count would stop matching the page.
//
// SUPPRESSION IS NOT HERE, DELIBERATELY. "The first element of a page
// contributes zero space" is the CONSUMER's rule, not the type's — this
// function stays a pure function of the element type, which is also what lets
// S5 freeze one style object per type for memoization. Document start is
// handled in CSS (`.script-sheet > *:first-child`); S2's paginator will apply
// the identical rule at every page top.
//
// SC2 S2b — ONE FROZEN OBJECT PER ELEMENT TYPE, precomputed at module level.
// The function's shape is unchanged; what changes is that two elements of the
// same type now receive the SAME object, not two equal ones. That is the
// precondition for S5's `React.memo` on StaticScriptElement: a memo whose style
// prop is a fresh object every render is a memo that never hits.
//
// It is ALSO the reason this must not become a function of position. S2b renders
// a SEQUENCE of pages, and the obvious way to zero a page-top element's space
// would be to branch this on "is it first on its page" — which would make the
// style depend on pagination, defeat the freeze, and put the same element's
// appearance at the mercy of a break above it. The page-top rule stays where it
// already lived: in CSS (`.script-sheet > *:first-child`), which becomes
// per-page for free the moment there is more than one sheet, and which the
// paginator's own `spaceBefore: 0` at every page top agrees with by
// construction.
```

## ScriptEditor §2

From `apps/desktop/src/components/ScriptEditor.tsx`, line 139 at `ded4321b` (the comment that stays: "the script page's vertical policy: focus never scrolls; the box moves only to keep the CARET visible, and only by the minimum; no animation, no fraction, no home").

```ts
// -- SC2 S2b — THE SCRIPT PAGE'S VERTICAL POLICY, STATED ---------------------
//
// Until now this surface had no vertical policy; it had a SIDE EFFECT. The page
// scrolled because `ActiveScriptElement` calls `node.focus()` on mount, and
// focusing an element below the fold scrolls it into view — so every Enter moved
// the box, and nobody had ever decided that it should. It is why the behaviour
// broke on SC2 S1, a change that had nothing to do with scrolling (sc1.mjs's own
// S3 park records the measurement). A paginated surface cannot leave that
// undecided: crossing a page break MUST have a stated answer.
//
// THE RULE, in three clauses. It is a rule, not a description of what happens:
//
//   1. FOCUS NEVER SCROLLS. Every focus() on this surface passes
//      `{ preventScroll: true }`. Placing the caret is not a request to move
//      the paper.
//   2. THE BOX MOVES ONLY TO KEEP THE CARET VISIBLE, AND ONLY BY THE MINIMUM.
//      If the caret is inside the scroll box's visible band, the box does not
//      move at all — not by a pixel, not to centre anything. If the caret is
//      above the band, the box scrolls up until the caret's own top sits on the
//      band's top edge; if below, down until its bottom sits on the band's
//      bottom edge. Nothing else moves the page.
//   3. NO ANIMATION, NO FRACTION, NO HOME. The page never repositions itself
//      for aesthetic reasons — no typewriter line, no quarter-down start, no
//      easing. A screenplay page stays where the writer put it.
//
// Clause 2 is measured off the CARET, not the element: an action block can be
// taller than the whole visible band, and scrolling its top into view would send
// the caret at its foot straight back off the bottom.
//
// OPEN AND DELIBERATELY UNANSWERED: whether a caret sitting flush on the band's
// bottom edge wants breathing room above the edge. That is Nick's call, it is on
// the ledger for the sitting, and inventing a number here would make it look
// ruled. Clause 2 gives it exactly zero until he says otherwise.
```

## ScriptEditor §3

From `apps/desktop/src/components/ScriptEditor.tsx`, line 272 at `ded4321b` (the comment that stays: "clause 1 of the vertical policy: focus never scrolls the page").

```ts
    // SC2 S2b — clause 1 of the vertical policy (see the rule above). This
    // single argument is the whole of the defect Fable charged to this slice:
    // the page's scrolling was the browser's reflex to focus(), never a
    // decision. Clause 2 then makes the decision, explicitly, one line down.
```

## ScriptEditor §4

From `apps/desktop/src/components/ScriptEditor.tsx`, line 277 at `ded4321b` (the comment that stays: "a page break remounts the active element (React deletes and re-inserts across sheets), so the same edit session restores the live caret offset over the stale hint").

```ts
    // SC2 S5 — THE CARET ACROSS THE BREAK, and this line is the fix.
    //
    // OBSERVED, not predicted (2026-07-29). Sheets are DOM parents keyed by page
    // index, so when the paginator moves the ACTIVE element to another sheet,
    // React deletes it from one parent's child list and inserts it into the
    // other's — it never moves a host node between parents. The live
    // contenteditable is destroyed and a fresh one mounts in its place. Proved
    // with an expando on the node (a property React cannot preserve across a
    // delete+insert): one Tab on the last element of a page and the expando was
    // gone, the element had crossed sheet 0 to sheet 1.
    //
    // What that cost: `caretHint` is written ONLY by `moveActive`, and `retype`,
    // `handleInput` and `acceptAutocomplete` never call it — so on a crossing
    // caused by a mutation rather than a navigation, the fresh instance restored
    // the caret to a hint left over from the last ACTIVATION. Measured: caret at
    // 12, restored to 9, and the writer's next two keystrokes landed at 9 —
    // inside the word they had just typed.
    //
    // So the remount is preferred-over: if this mount is the SAME edit session
    // as the one that just ended (same element id, same seedNonce — i.e. React
    // rebuilt us for a reason of its own rather than because the writer moved),
    // the live offset the writer actually had wins over the stale hint. On a
    // genuine activation the key does not match and `caretHint` governs exactly
    // as before.
    //
    // WHAT THIS DOES NOT FIX, stated so it is not read as more: a remount still
    // destroys a new DOM node's worth of browser state that no offset can
    // restore — an in-flight IME composition, a non-collapsed selection (only
    // the caret's start offset travels), and the element's native undo stack.
    // Those need the class dissolved, not the symptom closed.
```

## ScriptEditor §5

From `apps/desktop/src/components/ScriptEditor.tsx`, line 493 at `ded4321b` (the comment that stays: "the screenplay surface does not run the typewriter (useTypewriterFade is not called here); the scroll cap is the containment fix and stays").

```ts
  // AB2 S2 DoD — the typewriter option used to reach the script surface's
  // Draft posture through the rail, with its hold-band targeting the bounded
  // scroll-cap AB1's containment fix (finding 4) gives this surface.
  //
  // SC1 S3, AMENDED 2026-07-24 (Nick's word, via Fable): **the screenplay
  // surface does not run the typewriter at all**, interim, pending his own
  // revision of typewriter mode in a separate build. So this surface no
  // longer calls useTypewriterFade — the hook and its shared engine are
  // untouched and byte-identical for prose (ModeStage) and Journal
  // (JournalEntry), which keep it exactly as FX5 shipped it.
  //
  // This AMENDS AB2 S2's own definition of done ("the typewriter option
  // reaches the script surface's Draft posture") on the record — recorded in
  // the ledger and in the SC1 report, and carried in ab2.mjs's own park
  // cycle in the same commit, so it can never fail silently.
  //
  // The scroll cap itself stays exactly as it is: it is AB1's containment
  // fix (a bounded height + internal scroll for a sheet that grows with the
  // document), which has nothing to do with the typewriter. What goes with
  // the hook is the static `--tw-start-offset` padding that rode on
  // `[data-typewriter='true']` — the measured root of SC-V4 (an
  // unconditional 183px pushing a brand-new page's caret to 38.2% of the
  // box). See index.css's own rule.
```

## ScriptEditor §6

From `apps/desktop/src/components/ScriptEditor.tsx`, line 526 at `ded4321b` (the comment that stays: "Screenplay pages follow prose Draft's per-page typewriter rule (read once at mount, written on every toggle); the stored value drives the toggle and the drawer, not a fade").

```ts
  // PHASE 1 (S5) - Screenplay pages follow the same per-page rule as prose Draft (Nick, Oct 11): read once at mount, written on every toggle. This surface does not run
  // the line-following fade (SC1 S3, below); the stored value still drives the toggle's state and the drawer.
```

## ScriptEditor §7

From `apps/desktop/src/components/ScriptEditor.tsx`, line 533 at `ded4321b` (the comment that stays: "no typewriter seed here (it writes the shared setting, and would flip prose's); the vanishing law reaches the script surface's own chrome, triggered only when framed").

```ts
  // FX2 S2 gave this surface the Draft-open typewriter seed: on mount it wrote
  // the GLOBAL typewriter setting from the page's own line count, exactly as
  // PageEditor.tsx does for prose.
  //
  // SC1 S3, AMENDED 2026-07-24 — that seed retires here with the typewriter
  // itself. It was never a script-local value: `seedTypewriterDefault` writes
  // the shared `wrizo-writing-settings` store, so leaving it in place would
  // have a screenplay page — a surface that no longer runs the typewriter at
  // all — silently flip the writer's typewriter setting for PROSE and Journal
  // on open, purely as a side effect of opening a script. Prose keeps its own
  // identical seed in PageEditor.tsx, untouched.
  // AB1 S3 — the vanishing law, generalized to the script surface's own
  // DeskFrame chrome (the mode strip; the corner glyph via App.tsx's shared
  // isWriting session). Mounted unconditionally (rootRef omitted -> writes
  // --fade-dur onto <html>, same default every other caller relies on) but
  // only ever actually triggered when framed (see handleInput below) — below
  // the 1100px gate this never dissolves anything, matching pre-AB1
  // behavior exactly (script never had a dissolve engine before this).
```

## ScriptEditor §8

From `apps/desktop/src/components/ScriptEditor.tsx`, line 683 at `ded4321b` (no comment stays: the code reads plainly).

```ts
    // ITEM word-diet (Nick, Oct 13): REMOVE — the framed Page panel's own footer line retires whole.
```

## ScriptEditor §9

From `apps/desktop/src/components/ScriptEditor.tsx`, line 813 at `ded4321b` (the comment that stays: "`text` is read from the live DOM, the ground truth of what is typed right now").

```ts
        // `text` (read above from the live DOM, not `prev[activeIndex].text`)
        // is ground truth for what's actually typed right now — same
        // reasoning as Enter's own DOM read (Fable A2).
```

## ScriptEditor §10

From `apps/desktop/src/components/ScriptEditor.tsx`, line 856 at `ded4321b` (the comment that stays: "one delegated handler reads the DOCUMENT index off the DOM, so it cannot drift from the flat element array; a press below the last element activates it with the caret at its end").

```ts
  // SC2 S2b — ONE delegated handler for the whole sequence, replacing the
  // per-element `(x, y) => activateAt(i, x, y)` closure. Two reasons, and the
  // second is the load-bearing one: (a) N elements no longer mean N new function
  // objects per render, which is the S5 memoization seam; (b) the index it reads
  // is the DOCUMENT index off the DOM, so it cannot drift from the flat element
  // array that `activateAt` addresses, however the pages above it break.
  // BLANK-PAGE CLICK (Fable, Oct 22 - Page-readiness, "just let me write"; the Screenplay half, her ruling): a press on the empty paper BELOW the
  // last script element activates that element with the caret at its END - on a blank script that is its first (only) element, focused. The
  // re-seed (moveActive -> a new seedNonce key) remounts the active element, which focuses itself on mount, so this works even when the last
  // element is already the active one and has merely lost focus. The active element's DOM text is committed first, exactly as activateAt does.
```

## ScriptEditor §11

From `apps/desktop/src/components/ScriptEditor.tsx`, line 999 at `ded4321b` (the comment that stays: "this page's own id, so the Sliver's formatLocked and toggle read typewriterForPage, never the shared mirror").

```ts
    // typewriter-scope (Fable Oct 21) - same signal enterPageTypewriter's own
    // mount call already used (below), so Sliver's own formatLocked/toggle
    // read THIS page's own value, never the shared `typewriter` mirror.
```

## ScriptEditor §12

From `apps/desktop/src/components/ScriptEditor.tsx`, line 1006 at `ded4321b` (the comment that stays: "Screenplay is the current choice here (pressing it changes nothing); another template converts an EMPTY screenplay in place, and opens a new page from one with words").

```ts
    // PAGE-TEMPLATES-MOVE (Nick's standing rule: brass marks a choice the writer has made, at rest) - this page IS a screenplay,
    // so its Templates row shows the Screenplay template CHOSEN. Pressing a choice already made changes nothing.
    // PAGE TEMPLATES - the full picker: Screenplay is the current choice here (pressing it changes nothing); any other row on an EMPTY
    // screenplay converts the page in place (the empty-page rule, Fable Oct 16 Q2 - the same conversion Structure uses, plus the lens), and on a
    // screenplay WITH words opens a new page (the words never move), whose chip reads "Opened as a new page · Back".
```

## ScriptEditor §13

From `apps/desktop/src/components/ScriptEditor.tsx`, line 1084 at `ded4321b` (the comment that stays: "the page number lives on the page artifact only (top margin, from page two, "2."), never a total anywhere; it is chrome outside the 54-line block, so it costs no counted line").

```ts
          {/* SC2 S4 — THE PAGE NUMBER (R1, approved 2026-07-24). Top-right,
              inside the top margin, PAGE ONE BARE, from page two on.

              R1's bright line travels with it and is the harder half of this
              slice: the number lives ON THE PAGE ARTIFACT ONLY. No total, no
              "of N", no aggregate anywhere in the app — not in the sliver, not
              in the Tutor, not in a title, not in an aria-label. The committee
              put it plainly: a page number on a screenplay is not the app
              counting the writer, it is the document's own furniture, as
              intrinsic as a slugline's capitals. An aggregate would be the app
              counting, and that is the line R1 amends by exactly one line and
              nothing more. sc2.mjs asserts the absence as strictly as the
              presence.

              It is CHROME, not body: it sits in the top margin, outside the
              54-line block, so it costs no line the paginator counted. That is
              not asserted by inspection — page one carries no number and every
              other page does, so the standing cross-check that all sheets share
              one first-line offset IS the proof, and it fails the moment the
              number takes a line.

              The trailing period is the trade's own form (Final Draft, Fade In
              and Highland all render "2."). R1 ruled the position and the bare
              first page, not the punctuation — so this is a judgment call
              inside its "per the standard" wording, named here rather than
              left to look ruled, and vetoable in a line. */}
```

## ScriptEditor §14

From `apps/desktop/src/components/ScriptEditor.tsx`, line 1142 at `ded4321b` (the comment that stays: "rendered as the active element's flow-sibling, so its absolute position resolves beneath this block wherever it sits").

```ts
                  {/* Fable R1 — rendered as the active element's own flow-sibling
                      (not the sheet's last child) so its no-top/left absolute
                      position resolves to right beneath THIS block, wherever it
                      sits in the document, instead of the bottom of the sheet. */}
```

## ScriptEditor §15

From `apps/desktop/src/components/ScriptEditor.tsx`, line 1176 at `ded4321b` (the comment that stays: "the nav row recedes with the rest of the framed chrome").

```ts
        {/* ab1.1 R1 (Fable review) — the nav row was the one piece of framed
            chrome that never recessed with the rest of the room. */}
```

## ScriptEditor §16

From `apps/desktop/src/components/ScriptEditor.tsx`, line 1179 at `ded4321b` (the comment that stays: "the address line: the same LocationCrumb the Page uses, in the board's row shape, so the framed surfaces cannot drift").

```ts
          {/* PW1 S6 (Nick, Q7) — the Screenplay regains the address line too.
              The same one component the Page uses (LocationCrumb), in the same
              row shape the Board proved — so the three framed surfaces cannot
              drift, which is precisely how the Page and the Script came to have
              two hand-rolled copies of one chain in the first place. */}
```

## ScriptEditor §17

From `apps/desktop/src/components/ScriptEditor.tsx`, line 1193 at `ded4321b` (the comment that stays: "the Pages/Plan toggle sits beside Done: a script page is a Pages view").

```ts
            {/* cd1.1 (Fable review erratum) — the Pages/Plan flight toggle
                belongs beside Done on both hosts; a script page IS a "Pages"
                view (PageEditor.tsx's own toggle carries the same semantics). */}
```
