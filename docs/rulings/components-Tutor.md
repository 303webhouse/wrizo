# Rulings: `apps/desktop/src/components/Tutor.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[Tutor §n]` points here.

## Tutor §1

From `apps/desktop/src/components/Tutor.tsx`, line 26 at `e2898deb` (no comment stays: the code reads plainly).

```ts
// POLISH #10 item 24
```

## Tutor §2

From `apps/desktop/src/components/Tutor.tsx`, line 30 at `e2898deb` (the comment that stays: "the Tutor: two DeskFrame anchors (the grip's small safe box; the open panel pinned to the stage's edge), rendered bare; it receives only entry/project/pageText/selectionText - nothing that could write onto a page; no badge, toast or count ever knocks").

```ts
// TU1 S2/S3/S4/S5 — the Tutor. The sliver, mirrored, on the paper's RIGHT
// edge — but rendered as TWO separate DeskFrame overlay anchors, not one
// (see index.css's own `.desk-frame-tutor-anchor`/`.desk-frame-tutor-panel-
// anchor` header comment for the full "why one anchor can't serve both
// jobs" writeup — the short version: the grip needs the FX2 clamp's small
// safe box, the ~300px open panel needs to be pinned to the STAGE's own
// right edge instead, or it silently clips against `.desk-frame-host`'s
// own overflow:hidden at ordinary widths, empirically confirmed before
// this shape was chosen). DeskFrame.tsx renders this component's whole
// return value BARE (no wrapping div) precisely so both anchors land as
// direct children of `.desk-frame-stage` — an intervening wrapper would
// break their `position:absolute` percentage math.
//
// A12 — the two-sides law: this is the ONE surface in the whole app the
// writer goes to when they DON'T know what they need. A13 is enforced
// architecturally, not just by prompt: this component receives only
// `entry`/`project`/`pageText`/`selectionText` — never an editor ref, never a
// page-text setter, never anything that could route a byte of Tutor output onto
// a writing surface. ITEM 84's TD4 added the fourth of those and changed nothing
// about the wall: `selectionText` is a STRING the host computed (see
// useSurfaceSelection.ts), read-only here exactly as `pageText` has always been.
// The Draft roster's own presses write to `composerText` — this panel's own
// input — and to nothing else. Every control below is inert with respect to the page:
// the grip/dock buttons toggle local UI state; the fragment items call
// `navigate()` (travel, not text insertion); the composer's own input
// talks ONLY to appendTutorMessage/apiTutorChat. No control in this file
// ever touches `editorRef`, `setText`, or any DOM node outside the
// `.wz-tutor-zone`-marked subtree — the ticket's own defense-in-depth A13
// harness walk (tu1.mjs) asserts this structurally, not by enumerating
// "these N buttons are fine."
//
// A14 — the room never knocks. Its PRINCIPLE stands as ratified law; FX12 S1 retired
// its current IMPLEMENTATION (the "Waiting for you" nudges), not the principle: the
// nudges section and its engine now sleep entire (no computation, no injection). What
// remains true and is even easier to see now: nothing in this file renders a
// badge/toast/count/dot on the grip, and the grip's own markup is unchanged — there is
// no knock anywhere. A later Tutor-panel ticket may return the letters under content
// law (the return gate on ledger item 64).
```

## Tutor §3

From `apps/desktop/src/components/Tutor.tsx`, line 69 at `e2898deb` (no comment stays: the code reads plainly).

```ts
// FX18 S2 (Fable's ruling, 2026-07-29) — the usable-panel floor: the smallest margin at
// which an OPEN panel can occupy the writing-surface margin without becoming a useless
// sliver. Below it the panel overlays the paper at natural open-w instead — the documented
// narrow-screen degradation (the measure-effect below sets the panel's inline width to
// natural open-w there). Distinct from DOCK_FLOOR_PX above: that gates whether the DOCK
// affordance is offered; this gates whether an open panel occupies the margin or overlays.
```

## Tutor §4

From `apps/desktop/src/components/Tutor.tsx`, line 75 at `e2898deb` (the comment that stays: "see the retired grip-move effect").

```ts
// POLISH #10 item 1 - see the retired grip-move effect
```

## Tutor §5

From `apps/desktop/src/components/Tutor.tsx`, line 77 at `e2898deb` (the comment that stays: "the measure-effect's floor is DRAWER_MIN (200); this constant is kept as the record").

```ts
// SUPERSEDED by page-size (Fable's 1366 rule, Oct 23): the measure-effect's floor is DRAWER_MIN (200); kept as the record
```

## Tutor §6

From `apps/desktop/src/components/Tutor.tsx`, line 154 at `e2898deb` (the comment that stays: "the count is of the slice actually sent, never the whole stretch").

```ts
  // ITEM word-diet (Fable) — the writer-facing count is of the part actually
  // sent (this kept slice), never the whole stretch; whitespace-split, same
  // as every other word count in this file (pageWords and friends).
```

## Tutor §7

From `apps/desktop/src/components/Tutor.tsx`, line 186 at `e2898deb` (the comment that stays: "the margin past the paper's right edge, measured (the mirror of Cascade's availableCascadeMargin); .board-canvas-wrap is a paper too, or a board reads an unlimited margin; linkDockRoom: the true margin, so the page is never covered").

```ts
// The margin genuinely available past the paper's right edge — the exact
// mirror of Cascade.tsx's own `availableCascadeMargin()` (see that file's
// header comment for the full "why measured geometry, not getComputedStyle
// on the calc() custom property" reasoning; it applies unchanged here,
// just flipped to the paper's RIGHT edge vs. the stage's right edge).
// TU2 S4 — `.board-canvas-wrap` joins the selector: Board's own framed
// wrapper (BoardEditor.tsx) carries neither `.mode-pagecol` (prose/script's
// own canonical-width class) nor `.entry-full` — without this, the query
// below matched NOTHING on a board-mounted panel, `paper` stayed null, and
// the function's own `if (!stage || !paper) return Infinity` early-out fired
// on every call, silently reporting "unlimited margin" regardless of the
// board canvas's true on-screen width. That would have made the dock
// affordance's own floor gate (DOCK_FLOOR_PX, Tutor.tsx's own call site)
// vacuously always-true on Board — a real correctness gap the geometry
// retrofit's own "Presence on Boards" clause would otherwise leave open.
// POLISH #10 item 24 (K2): the TRUE margin beside the painted page (no +frame-gap), and whether the link reader fits there - the page is never covered
```

## Tutor §8

From `apps/desktop/src/components/Tutor.tsx`, line 273 at `e2898deb` (the comment that stays: "the roster's three presets, in order; `id` keys the local deck, `term` the string of record").

```ts
// ITEM 84, THE DECK PHASE — the roster's three presets, in Nick's own ruled
// order. `id` keys the local deck; `term` keys the string of record.
```

## Tutor §9

From `apps/desktop/src/components/Tutor.tsx`, line 296 at `e2898deb` (the comment that stays: "`label` overrides only the chip's face; pressAsk still sends `term`, word for word").

```ts
  // word-diet-layouts (Nick's ruling, Oct 13): "the chip's visible label
  // becomes 'Selection'; the prompt it sends stays word for word." `term`
  // alone used to serve BOTH the face and the wire; `label`, where present,
  // overrides only the face — pressAsk (below) still reads `term`
  // unconditionally, so what gets staged into the composer is byte-exact
  // unchanged. Absent on asks 1-3: their face and their wire are still the
  // same string, exactly as before this ruling.
```

## Tutor §10

From `apps/desktop/src/components/Tutor.tsx`, line 324 at `e2898deb` (the comment that stays: "one drawer at a time: a layout effect keyed on `open`, so every path announces and no frame shows both drawers open").

```ts
  // PHASE 1 (Fable, Oct 12) - one drawer at a time: opening the Tutor closes the Tools drawer (and the reverse), at every width. Announced from an effect keyed on `open`
  // so EVERY path that opens it announces (the grip, a shortcut, anything added later) - the same structural rule the Tools drawer follows.
  // A LAYOUT effect, so the hand-over lands before paint: no single frame shows both drawers open.
```

## Tutor §11

From `apps/desktop/src/components/Tutor.tsx`, line 332 at `e2898deb` (the comment that stays: "the open panel's width, measured: flush to the paper's right edge where a usable panel fits, natural open-w (overlay) below that; null on a board and while docked (CSS owns those)").

```ts
  // FX18 S2 (Fable's ruling) — the OPEN panel's live width in px on a WRITING surface,
  // MEASURED (the FX13 measure-effect pattern), or null to defer to CSS. Occupy-margin uses
  // the TRUE geometric margin (stage.right - paper.right) so the panel sits FLUSH to the
  // paper's right edge — never dipping past its own grip into the paper (the CSS
  // --tutor-panel-margin calc adds --frame-gap and so overshot by 28px). Below the usable
  // floor it becomes natural open-w (overlay). null on Board (the --board CSS rule owns it)
  // and while docked (the docked CSS rule owns it).
```

## Tutor §12

From `apps/desktop/src/components/Tutor.tsx`, line 340 at `e2898deb` (the comment that stays: "how far the open panel stands in from the stage's edge, so its left edge meets its tab on the page's edge (the Tools drawer's mirror)").

```ts
  // DRAWER MIRROR (Nick, via Fable, Oct 24): how far the open panel stands in from the stage's right edge, so that its left edge meets its own tab on
  // the page's right edge - the mirror of the Tools drawer ([panel][tab][page] on the left, [page][tab][panel] here). 0 in every other regime.
```

## Tutor §13

From `apps/desktop/src/components/Tutor.tsx`, line 343 at `e2898deb` (the comment that stays: "a linked card or page docked beside this page (this device's slot), carried by the Tutor's dock; a dock found on mount docks again").

```ts
  // POLISH #10 item 24 (Nick, via Fable, Oct 25): a linked card or page docked beside this page (this device's own slot) - the Tutor's own DOCK carries
  // it, so it stays while the writer writes. Docking it from the Grafts list opens and docks the panel; a dock found on mount (a reload) docks again.
```

## Tutor §14

From `apps/desktop/src/components/Tutor.tsx`, line 361 at `e2898deb` (the comment that stays: "the grip's open position is measured from the panel's rendered rect, correct whichever of three regimes sized it").

```ts
  // tutor-drawer-arrow (Nick's live bug report, confirmed by tutor-drawer-
  // probe.mjs, ledger 57) — "anchor the grip to the drawer's board/page-
  // facing edge, just outside the tab row, the exact mirror of the Tools
  // drawer's arrow." Sliver's own grip never has this problem because its
  // panel is a SIMPLE `calc(100% - 16px)` of its own anchor's width — the
  // 16px gutter holds in every regime by construction. Tutor's panel width
  // comes from THREE different sources (this file's own JS measure-effect
  // above, the board CSS override, the base CSS clamp fallback), and in
  // every one of them the panel's own near edge can land exactly on — or
  // past — the grip's static, paper-anchored resting spot (TU2 S4's own
  // algebra: the grip's left edge IS the paper's right edge; the writing-
  // surface "occupy the margin" regime puts the panel's own left edge at
  // that exact same coordinate). Rather than re-derive the gutter three
  // times (and inevitably let them drift), this measures the PANEL's own
  // FINAL rendered rect directly — correct regardless of which of the
  // three regimes produced it — and overrides the grip ANCHOR's static
  // `right` with the one value that actually clears it.
```

## Tutor §15

From `apps/desktop/src/components/Tutor.tsx`, line 427 at `e2898deb` (the comment that stays: "one standing draw for the whole roster - a second press replaces it; component state, not a message, because a press must not conjure a thread; it commits on the writer's Send").

```ts
  // THE STANDING DRAW — the whole of Nick's "only one is ever rendered at a
  // time", expressed as a mechanism rather than a rule anyone has to remember.
  // Exactly ONE drawn line can exist at once, for the WHOLE roster: a second
  // press REPLACES it, never stacks beside it. His reason is on the record and
  // belongs here: "We don't want a user spending time debating which prompt to
  // respond to — the goal in Free Write is to get writing without much
  // deliberation." A build that renders three at once satisfies the count and
  // defeats the purpose, so there is deliberately no array here to render.
  //
  // It is COMPONENT STATE, not a persisted message, for a reason store/
  // persistence.ts states in its own words: a Tutor thread "is born on its
  // first real message and not one keystroke sooner." A press sends nothing
  // and says nothing — it must not conjure a thread. The draw commits into the
  // real thread only when the writer engages (send(), below), immediately
  // ahead of their own message, so the model sees the spur it is answering and
  // the conversation continues in this same window. An unanswered spur
  // persists nothing, which is the honest outcome: it was a spur toward the
  // page, and the page is where it was answered.
```

## Tutor §16

From `apps/desktop/src/components/Tutor.tsx`, line 455 at `e2898deb` (the comment that stays: "the page's word count when an ask was spent (its third draw); a ref because it must not cause a render").

```ts
  // THE REFILL ANCHOR — the page's word count at the moment each ask was SPENT
  // (its third draw), or null while that ask still has draws left. Nick's
  // hundred words are counted from here. A ref, not state, because it must not
  // itself cause a render: it is written in the press handler and read by the
  // effect that watches the count.
```

## Tutor §17

From `apps/desktop/src/components/Tutor.tsx`, line 461 at `e2898deb` (the comment that stays: "which spent ask was pressed a fourth time, so it answers with a note").

```ts
  // The note a spent ask answers a fourth press with — which preset was pressed,
  // or null. Nick's own words: "a note to the user if they try to use it a
  // fourth time before writing 100 words."
```

## Tutor §18

From `apps/desktop/src/components/Tutor.tsx`, line 553 at `e2898deb` (the comment that stays: "Esc closes the drawer from inside it too, unless a control already handled it; focus returns to the tab when it was in the drawer").

```ts
      // DRAWER MIRROR (Fable's check 5, Oct 24): Esc closes the drawer from INSIDE it too (it used to be ignored there, behind the zone guard below),
      // unless a control inside already handled it (the Bible editor's own Escape cancels its edit); the focus goes back to the tab - when it was in
      // the drawer. An Esc pressed on the page closes it and leaves the focus on the page.
```

## Tutor §19

From `apps/desktop/src/components/Tutor.tsx`, line 558 at `e2898deb` (the comment that stays: "Esc leaves a docked reader with the dock").

```ts
// POLISH #10 item 24: Esc leaves a docked reader with the dock
```

## Tutor §20

From `apps/desktop/src/components/Tutor.tsx`, line 572 at `e2898deb` (the comment that stays: "occupy the margin at min(margin, open-w) where a usable panel fits, else overlay at open-w; the paper rect is stable open or closed, so one read plus a resize listener suffices").

```ts
  // FX18 S2 (Fable's ruling) — the writing-surface panel width, MEASURED not approximated (the
  // FX13 measure-effect pattern Fable named; the same geometry availableTutorMargin() reads,
  // minus the +frame-gap the dock heuristic adds — here we want the TRUE margin so the panel
  // sits flush to the paper). While open+undocked on a writing surface, on every mount/resize:
  // occupy the margin at min(geoMargin, open-w) when a usable panel fits (geoMargin >=
  // USABLE_PANEL_FLOOR_PX), else overlay at natural open-w (the documented narrow-screen
  // degradation). null on Board (the --board CSS rule sets open-w) and while docked (the docked
  // CSS rule owns the width). The paper rect is stable open<->closed (the panel is absolutely
  // positioned, never pushes it — fx10's "paper rect byte-identical" invariant), so one read on
  // open + a resize listener suffices.
```

## Tutor §21

From `apps/desktop/src/components/Tutor.tsx`, line 583 at `e2898deb` (the comment that stays: "the board joins the mirror (it narrows to the drawer); a docked link reader is measured like the open drawer, never by the docked CSS clamp").

```ts
    // POLISH #10 item 1: the Board joins the mirror - its board narrows to the drawer's full width, so the panel stands flush against its tab there too
    // K2: a docked LINK READER is measured like the open drawer (flush to the page's edge past its tab), never by the docked CSS clamp, whose margin adds --frame-gap
```

## Tutor §22

From `apps/desktop/src/components/Tutor.tsx`, line 593 at `e2898deb` (the comment that stays: "a drawer narrows to fit beside the page down to DRAWER_MIN before it overlays; where it fits, tab and panel are anchored to the page's right edge, so the tab never moves").

```ts
      // PAGE-SIZE (Fable's 1366 rule, Oct 23): a drawer NARROWS to fit beside the page, down to DRAWER_MIN (scrolling inside); only below that
      // does it overlay - DRAWER_MIN replaces FX18's 280 here (the page is never covered while a drawer still fits at 200)
      // DRAWER MIRROR (Nick, via Fable, Oct 24): where it fits, the drawer - its 16px tab ON the page's edge plus its panel - is anchored to the page's
      // right edge, the mirror of the Tools drawer (whose 200px is its 184px panel + its tab). Before, the panel was pinned to the STAGE's edge: flush
      // only while the margin was narrower than open-w (63px off the page at 1920), and its tab was moved left of it on open. Now the tab never
      // moves and the panel starts at the tab: width = min(margin, tab + open-w) - tab, stood in from the stage's edge by what is left over.
      // Below DRAWER_MIN it still overlays at open-w from the stage's edge (the documented narrow degradation); the tab stays put, lifted above it.
```

## Tutor §23

From `apps/desktop/src/components/Tutor.tsx`, line 612 at `e2898deb` (the comment that stays: "the board narrows after the drawer opens").

```ts
// POLISH #10 item 1 - the board narrows after the drawer opens
```

## Tutor §24

From `apps/desktop/src/components/Tutor.tsx`, line 616 at `e2898deb` (the comment that stays: "on a writing surface the tab never moves (the CSS formula places it); the board narrows beside the drawer too, so this effect is inert, kept as the record of the move").

```ts
  // tutor-drawer-arrow — the grip's own open-state position, measured from
  // the panel's ACTUAL rendered rect (see gripLeftPx's own header comment
  // above for why this reads the panel directly rather than re-deriving
  // its width a fourth time). GRIP_GUTTER_PX mirrors Sliver's own literal
  // 16px inset (`.wz-sliver-panel{ right:16px }`) — "the exact mirror of
  // the Tools drawer's arrow." The anchor's own CSS sets `right` AND
  // `width`; the JSX below sets `left` AND explicitly clears `right` to
  // 'auto' (never left ambiguous to the engine's own over-constrained-box
  // resolution, which direction-flips which edge wins) — `width` stays
  // from the stylesheet, untouched. The grip itself sits at `left:0`
  // WITHIN the anchor, so controlling the anchor's own `left` is what
  // actually moves the grip; the anchor's own width/right edge are
  // pointer-events:none clearance space nobody else reads.
  // Depends on panelWidthPx too: a writing-surface resize can change the
  // panel's own JS-measured width without touching open/docked/pageKind,
  // and this must re-measure whenever that settles. Closed reverts to
  // null, handing position back to the static paper-anchored CSS formula
  // (TU2 S4's own algebra) exactly as before — this effect only ever
  // overrides the OPEN position.
  // DRAWER MIRROR (Nick, via Fable, Oct 24): on a writing surface the tab NEVER moves - opening or closing a drawer only flips its arrow; it rides the
  // painted page's edge (the CSS formula above). The move below stays for the Board alone, whose panel overlays the canvas from the stage's edge.
  // POLISH #10 item 1 (Oct 25): RETIRED for the Board too - the board narrows beside the open drawer now, so nothing overlays it and its tab rides its
  // edge (index.css --board-r). The effect is kept, inert, as the record of the move it made.
```

## Tutor §25

From `apps/desktop/src/components/Tutor.tsx`, line 657 at `e2898deb` (the comment that stays: "the disclosure modal no longer opens (its text sits behind a "?" by the Ask box); showDisclosure stays declared and is never set, so the guards that read it are dormant").

```ts
  // ITEM word-diet (Nick, Oct 13): REMOVE — the one-time "Before you ask"
  // modal (openDisclosureIfNeeded/acknowledgeDisclosure, below) retires
  // whole. tutorDisclosureBodyV4 moves behind a "?" beside the Ask box
  // instead, always available, no standing text and no one-time gate.
  // showDisclosure stays declared (several OTHER guards below read it) but
  // is never set true anymore, so those guards are permanently dormant
  // rather than individually rewired — the same "left inert, not deleted"
  // treatment store/tutorNudges.ts already carries ("sleeps dormant") for
  // exactly this kind of retirement.
```

## Tutor §26

From `apps/desktop/src/components/Tutor.tsx`, line 667 at `e2898deb` (the comment that stays: "reopening the grip while docked restores the panel; a docked reader is left with it").

```ts
// reopening the grip while docked restores the panel (Cascade's own T5 rider, mirrored); POLISH #10 item 24: a docked reader is left with it
```

## Tutor §27

From `apps/desktop/src/components/Tutor.tsx`, line 785 at `e2898deb` (the comment that stays: "the composer takes focus when the panel opens in Free Write (blank space with a cursor); preventScroll, and held off while the disclosure is up").

```ts
  // ITEM 84, THE DECK PHASE — (A) of the roster: the composer takes focus when
  // the panel opens in Free Write, so the roster's first member is genuinely
  // "blank space with a flashing cursor where anything can be asked" and not
  // just an input the writer must go find. Free Write only: this is the mode
  // whose whole posture is "start writing," and it is the mode whose roster
  // Nick redesigned around the cursor. `preventScroll` because the panel is its
  // own scroll column (FX10 S1) and a focus must never jump it. Held off while
  // the disclosure is up — that modal owns the room until it is acknowledged.
```

## Tutor §28

From `apps/desktop/src/components/Tutor.tsx`, line 798 at `e2898deb` (the comment that stays: "the refill: an ask's draws reset after 100 words written on this page since its third draw (HB1's monotone count, which never goes backwards under forward lock); the standing draw survives a refill").

```ts
  // ITEM 84, THE DECK PHASE — THE REFILL, on Nick's own ruling (verbatim):
  // "It should reset after 100 words have been written with a note to the user
  // if they try to use it a fourth time before writing 100 words."
  //
  // WHAT THE COUNT IS ANCHORED TO: words written on THIS page since the THIRD
  // draw — the moment the ask was spent — not since each draw and not since the
  // panel opened. So the anchor is stamped exactly once per ask, when its third
  // draw lands (see pressPreset below), and cleared when the hundred arrives.
  //
  // THE INSTRUMENT IS HB1's, NOT A NEW ONE. `useMonotonicWordCount` is the
  // app's own ratified reading of "a hundred words" (F1's whitespace-delimited
  // instrument, at F1's own threshold of 100), and it is monotone for a reason
  // this feature needs just as much as the first-run gate did: under forward
  // lock the derived text can transiently SHRINK while a trailing run is struck
  // (FirstRunGate.tsx's own F1 note), and a raw count would make the writer
  // watch progress go backwards. `active` is passed `true` here because this
  // count has no gate to end — the running max IS the reading, and each ask's
  // own anchor is what makes it a delta. See the S0 addendum for the one caveat
  // carried openly: that file's header calls itself non-reusable, written when
  // it had a single caller.
  //
  // The standing draw deliberately SURVIVES a refill: the writer is writing
  // FROM it, and the panel dissolves on that same keystroke anyway (A15), so
  // clearing it would delete the spur at the moment it started working. Only
  // the ceiling resets — and the note, having been answered.
```

## Tutor §29

From `apps/desktop/src/components/Tutor.tsx`, line 856 at `e2898deb` (the comment that stays: "a spent ask answers a fourth press with a note, which is why the button is never `disabled`").

```ts
    // THE FOURTH PRESS ANSWERS. Nick's ruling asks for "a note to the user if
    // they try to use it a fourth time before writing 100 words" — so a spent
    // ask is not a dead control; it is one that says why. This is why the
    // button below is never `disabled`: a disabled control cannot speak, and
    // silence here would read as breakage rather than as a rule.
```

## Tutor §30

From `apps/desktop/src/components/Tutor.tsx`, line 929 at `e2898deb` (the comment that stays: "an unborn surface refuses a send out loud and keeps the composer's text: a chat message must not birth the row").

```ts
    // E4 — THE UNBORN SURFACE REFUSES OUT LOUD, AND KEEPS THE WRITER'S WORDS.
    // Measured on the shipped build, on an unborn BOARD (which has mounted this
    // panel unconditionally all along): sending here wrote a REAL ROW —
    // `{pageType:'board', text:'', boxes:0, tutorMsgs:1}`. `getJournalEntry`
    // falls through to the unborn slot (persistence.ts:1667-1673), so
    // `appendTutorMessage` finds a record, and `saveJournalEntry` upserts it.
    // The surface was BORN BY A CHAT MESSAGE, with nothing written on it —
    // which is precisely what PB1 exists to prevent ("the row is written by the
    // first word"). E4 un-gates this panel on unborn PAGES too, so this had to
    // close first or the ticket would have spread the fault from boards to
    // pages.
    //
    // Refusing is the lawful branch of Fable's ruling ("must either work or
    // visibly refuse; silence is the defect"): PB1 is a standing law and a fix
    // lane does not overturn one to make a send succeed. The composer is NOT
    // cleared — the writer's sentence survives the refusal and sends itself the
    // moment there is a page to attach it to.
```

## Tutor §31

From `apps/desktop/src/components/Tutor.tsx`, line 967 at `e2898deb` (the comment that stays: "the standing draw commits into the thread here, just ahead of the writer's message, so the model sees the spur it answers; a send does not refill the deck").

```ts
    // ITEM 84, THE DECK PHASE — THE STANDING DRAW COMMITS HERE, and only here.
    // Nick's requirement 3, verbatim: "Whether the user asks their own question
    // or selects a preset, the Tutor's response should be in the same
    // dialog/chat window where conversation can commence." The draw has been
    // rendering in that window all along; this is the moment it becomes part of
    // the thread, immediately AHEAD of the writer's own message, so the history
    // this send replays reads in the order it actually happened — the spur,
    // then the answer to it. Without this line the model would be answering a
    // reply to a prompt it never saw.
    //
    // Note what travels and what does not: the press itself put nothing on any
    // wire. The drawn line reaches the model here, on the writer's own Send, as
    // an ordinary turn of the conversation — the same way every Tutor turn
    // already travels in `messages` (TU2's wire law, unchanged; no new key, no
    // new payload class, nothing this ticket adds to the disclosure's
    // enumeration).
    //
    // A SEND DOES NOT REFILL THE DECK. Nick's refill ruling names exactly one
    // condition — a hundred words written — and conversation is not it. That is
    // the rule agreeing with its own reason: the goal in Free Write is to get
    // writing, and writing happens on the page, not in this composer. So the
    // draw commits here and the counts are left exactly as they stand.
```

## Tutor §32

From `apps/desktop/src/components/Tutor.tsx`, line 996 at `e2898deb` (the comment that stays: "send only the most recent messages within the server's cap, ending with the writer's; the stored thread is untouched").

```ts
    // ITEM 215 — INTERIM RULE (Fable): send only the most recent messages
    // within the server's own cap, always ending with the writer's message
    // just appended above. The STORED thread (and everything rendered from
    // it) is untouched — capTutorHistory only shapes what travels on THIS
    // call's wire.
```

## Tutor §33

From `apps/desktop/src/components/Tutor.tsx`, line 1066 at `e2898deb` (the comment that stays: "the right drawer's tab row: TUTOR | the theme's links word (from the lexicon); its "?" is the shared HelpButton").

```ts
  // PHASE 1 (S3) - THE RIGHT DRAWER'S TAB ROW: TUTOR | the theme's links word (Grafts in Arbor, Links in Flux - from the lexicon, never written
  // here).
  // help-buttons (Nick approved Oct 12) - the "?" beside it now routes through
  // the shared HelpButton/helpGrafts (store/help.ts), which carries BOTH
  // themes' own sentences - this ticket's own fix for drawerLinksNote's old
  // gap (Arbor had an explainer, Flux's own was the empty string, so the "?"
  // simply never rendered there). drawerLinksNote/-NoteLabel retired; their
  // content is byte-near-identical to helpGrafts's own Arbor sentence.
```

## Tutor §34

From `apps/desktop/src/components/Tutor.tsx`, line 1106 at `e2898deb` (the comment that stays: "while a linked card or page stands docked, the docked panel is its reader").

```ts
          {/* POLISH #10 item 24: while a linked card or page stands docked, the docked panel is its reader */}
```

## Tutor §35

From `apps/desktop/src/components/Tutor.tsx`, line 1114 at `e2898deb` (the comment that stays: "the body renders unconditionally inside the faded panel (the Sliver's shape), so the close fades the content instead of unmounting it and fading an empty box").

```ts
          {/* E3 — THE COUNSEL FADES OUT, BECAUSE THERE IS NOW SOMETHING TO FADE.
              `{open && …}` used to wrap this body, so on close the CONTENT
              unmounted synchronously while the panel's own opacity transition
              ran on an EMPTY BOX. Measured, pre-fix: at the first frame after
              the close click the body was already gone (`content:false`) with
              panel opacity still `1.00`, which then faded 1.00 -> 0.13 over
              ~108ms. The writer sees the contents blink out and an empty
              rectangle dissolve — i.e. "it does not fade out" (E3, Nick
              2026-08-31).
              THE MIRROR WAS ALREADY EXACT EVERYWHERE ELSE. `.wz-sliver-panel`
              — the tool pop-out this panel is the mirror of — carries the
              identical transition (FX10 S1 copied it after reading it LIVE:
              `opacity var(--fade-dur,.2s) ease, transform var(--fade-dur,.2s)
              ease`), the identical `aria-hidden={!open}`, and the identical
              `pointer-events:none` when closed. The ONE difference was that
              Sliver.tsx renders `<SliverToolsBody />` UNCONDITIONALLY inside
              its faded panel. So this is that same shape, not a new one: no
              timing is copied here and no transition is added, because the
              fade this ticket wants has been declared on `.wz-tutor-panel` all
              along and simply had nothing inside it to carry.
              A11Y POSTURE IS INHERITED, NOT INVENTED: mounted-but-`aria-hidden`
              with `pointer-events:none` is exactly what the left hand has
              shipped since FX1. Adding anything further here (a `visibility`
              rule, an `inert`) would be DIVERGING from the mirror, which is
              the opposite of the ruling.
              The panel's own effects are already gated on `open`
              (`if (!open) return;`), so a closed body costs a render and no
              work — nothing is fetched, drawn, or measured while it is hidden. */}
```

## Tutor §36

From `apps/desktop/src/components/Tutor.tsx`, line 1144 at `e2898deb` (the comment that stays: "no standing header (the tab row names it); the dock toggle is icon-only, its full wording on aria-label and title").

```ts
            {/* ITEM tutor-drawer-mirror (Nick, Oct 15, 2:42am) — the standing
                "THE TUTOR" header is deleted whole (word diet; the tab row
                already names it — Sliver carries no equivalent header at
                all). The dock toggle survives, icon-only, no standing text
                label (full wording stays on aria-label/title, the SR
                carve-out) — a small quiet corner control, not a header row. */}
```

## Tutor §37

From `apps/desktop/src/components/Tutor.tsx`, line 1172 at `e2898deb` (the comment that stays: "the standing draw is the log's last turn, in this same window; there is one, never two; data-drawn is what the harness reads").

```ts
                {/* ITEM 84, THE DECK PHASE — the standing draw, rendered as the
                    last turn INSIDE this same log: Nick's requirement 3 is that
                    a preset's response land "in the same dialog/chat window
                    where conversation can commence," so it gets no window, no
                    tray and no furniture of its own. There is ONE of these,
                    always — the state it reads cannot hold two. It is not yet a
                    persisted message (send() commits it); `data-drawn` is what
                    the harness reads to prove the rendered line is a verbatim
                    member of the local pool for the preset that was pressed. */}
```

## Tutor §38

From `apps/desktop/src/components/Tutor.tsx`, line 1186 at `e2898deb` (the comment that stays: ""Try again" replays the exact request that failed (lastSendArgsRef)").

```ts
              {/* ITEM word-diet (Nick, Oct 13) — a real "Try again" button,
                  replaying the EXACT request that failed (lastSendArgsRef),
                  not a re-derived one. */}
```

## Tutor §39

From `apps/desktop/src/components/Tutor.tsx`, line 1201 at `e2898deb` (the comment that stays: "the Free Write roster mounts in the shared chip row above the composer; absent outright in Draft, on screenplay and on a board").

```ts
              {/* ITEM 84, THE DECK PHASE — THE FREE WRITE ROSTER. Mounted where
                  the arc already ruled it mounts (lock record §1 line 1: the
                  shared chip row inside "Talk it through", above the composer,
                  below the messages) — the redesign changed the roster's
                  contents, never its mount.
                  MODE-AWARE, and this is the panel's first such branch: absent
                  outright in Draft, on screenplay and on Board — absent, not
                  disabled (G3), because a preset is not a transient gate on
                  real capability there, it simply is not that mode's furniture.
                  A spent ask IS the lawful `disabled` case: the capability is
                  real and the gate lifts the moment the writer moves on. */}
```

## Tutor §40

From `apps/desktop/src/components/Tutor.tsx`, line 1220 at `e2898deb` (the comment that stays: "never `disabled`: a spent ask must answer a fourth press with a note; data-spent carries the quiet styling").

```ts
                      // NEVER `disabled`, and that is Nick's ruling rather than
                      // a style call: a spent ask must answer a fourth press
                      // with a note, and a disabled control cannot answer
                      // anything. `data-spent` carries the quiet styling that
                      // `:disabled` used to.
```

## Tutor §41

From `apps/desktop/src/components/Tutor.tsx`, line 1242 at `e2898deb` (the comment that stays: "the Draft roster takes the same slot in its own mode; chips render with the panel, never animate in, never reshuffle; the two rosters never co-render").

```ts
              {/* ITEM 84, THE DRAFT ROSTER — mounted where the arc ruled the shared
                  chip row mounts (lock record §1 line 1: inside "Talk it through",
                  above the composer, below the messages), the same slot the Free
                  Write roster takes in its own mode. Chips render WITH the panel
                  and never animate in; the order is fixed and never reshuffles
                  between visits. Absent outright in Free Write and on Board — the
                  two rosters are one branch's two sides and never co-render. */}
```

## Tutor §42

From `apps/desktop/src/components/Tutor.tsx`, line 1293 at `e2898deb` (the comment that stays: "what travels when you ask: behind a "?" beside the Ask box, no standing text").

```ts
                {/* ITEM word-diet (Nick, Oct 13, TRUST) — tutorDisclosureBodyV4,
                    behind a "?" beside the Ask box, no standing text. */}
```

## Tutor §43

From `apps/desktop/src/components/Tutor.tsx`, line 1325 at `e2898deb` (the comment that stays: "the note sits behind a "?" beside the lens heading").

```ts
              {/* ITEM word-diet (Nick, Oct 13) — the note moves behind a
                  "?" beside the lens heading. */}
```

## Tutor §44

From `apps/desktop/src/components/Tutor.tsx`, line 1344 at `e2898deb` (the comment that stays: "the nudges sleep: their section does not render and the engine (tutorNudges.ts) has no caller; the engine and its data stay, dormant").

```ts
            {/* FX12 S1 — the nudges sleep, whole: the "Waiting for you" section
                unrenders everywhere and the nudge-generation engine (tutorNudges.ts)
                sleeps entire — its only caller (computeNudges, above) is removed, so no
                computation and no injection happen on any surface. The engine and its
                data are UNTOUCHED (dormant, not deleted). A14's letters-frame survives
                as ratified law — this retires its current implementation, not its
                principle. RETURN GATE (ledger item 64): the nudges return only via a
                later Tutor-panel ticket under content law — no guilt-language, no counts,
                no repeats, deduplicated. The sleep must not become the grave. */}
```

## Tutor §45

From `apps/desktop/src/components/Tutor.tsx`, line 1354 at `e2898deb` (the comment that stays: "the Bible sits last in the cluster, only when the page rides a project; writer-authored, and nothing here can place text on a page").

```ts
            {/* TU5 S3 — the book's Bible, LAST in the cluster (Fable's ruling:
                the most at-rest thing sits deepest — lenses are verbs, nudges
                are letters on approach, the Bible is the shelf at the back).
                Only when the page rides a project (`entry.projectId`); a
                loose/journal page shows nothing here — quiet absence, not a
                disabled door. Writer-authored only; no control here can place
                text on a page (A13). No counts (the FX9 law travels). */}
```

## Tutor §46

From `apps/desktop/src/components/Tutor.tsx`, line 1364 at `e2898deb` (no comment stays: the code reads plainly).

```ts
                {/* ITEM word-diet (Nick, Oct 13): REMOVE — this explanatory
                    note is gone whole; tutorBibleNote's lexicon entry is
                    untouched, simply never rendered here now. */}
```

## Tutor §47

From `apps/desktop/src/components/Tutor.tsx`, line 1440 at `e2898deb` (no comment stays: the code reads plainly).

```ts
      {/* ITEM word-diet (Nick, Oct 13): REMOVE — the one-time "Before you
          ask" modal retires whole (ITEM 84's own v3/v4 annotation-form
          history, kept above in the comment this block used to carry —
          see the handleGripClick comment above for the pointer). V3's own
          text (tutorDisclosureBodyV3) is consequently NOT rendered
          anywhere anymore — flagged for confirmation in the report, since
          that's a real consequence of this change, not something this
          instruction stated directly. showDisclosure never becomes true
          now, so this is dead code already; removed rather than left as
          an unreachable branch, since a disclosure modal is exactly the
          kind of thing that should not exist in source looking reachable
          when it is not. */}
```
