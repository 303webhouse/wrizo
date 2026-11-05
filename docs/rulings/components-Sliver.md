# Rulings: `apps/desktop/src/components/Sliver.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[Sliver §n]` points here.

## Sliver §1

From `apps/desktop/src/components/Sliver.tsx`, line 35 at `7f1c6a84` (the comment that stays: "the rosters and their lexicon keys in one place each, in order: Normal (preselected), Screenplay, Research; MLA (default), APA, Chicago, AP").

```ts
// ITEM 114 (item 83 errata E4) — the rosters and their lexicon keys, in one
// place each, so the buttons cannot drift from the type or from the words. The
// ORDER is the ruling's order: Normal (preselected) · Screenplay · Research,
// and MLA (default) · APA · Chicago · AP.
```

## Sliver §2

From `apps/desktop/src/components/Sliver.tsx`, line 117 at `7f1c6a84` (the comment that stays: "this page's own id and emptiness, so formatLocked and the foot's toggle ask typewriterForPage, never the shared mirror").

```ts
      // typewriter-scope (Fable Oct 21) - THIS page's own id/emptiness, so
      // formatLocked (SliverToolsBody, below) and the foot's own toggle
      // (SliverInstrumentRow) can ask typewriterForPage directly instead of
      // the shared `typewriter` mirror. Required: every 'draft' caller
      // (PageEditor, ScriptEditor) already has both in scope.
```

## Sliver §3

From `apps/desktop/src/components/Sliver.tsx`, line 135 at `7f1c6a84` (the comment that stays: "the caret line's heading level (1-6), or null: H lights on a heading line").

```ts
        // HEADINGS (Nick, 2026-10-06) - the caret line's heading level (1-6), or null: H lights on a heading line.
```

## Sliver §4

From `apps/desktop/src/components/Sliver.tsx`, line 138 at `7f1c6a84` (the comment that stays: "the page's declared kind and, under Research, its style guide; optional: the screenplay surface passes none, since a script page has already declared what it is").

```ts
      // ITEM 114 (item 83 errata E4) — the page's DECLARED kind and, under
      // Research, its style guide. Note the two neighbouring words this union
      // now carries and which must not be confused: `kind: 'draft'` is which
      // SLIVER CONTENT this is, and `pageKind` is what the writer says the PAGE
      // is. A third sense, DeskFrame's own `pageKind` prop, means which surface
      // renders. Named here because three senses of one word in one file is
      // exactly how a later hand marries two of them by accident.
      //
      // OPTIONAL, AND THE ABSENCE IS A SCOPE DECISION — disclosed in the offer
      // record rather than left to be discovered. Two hosts pass `kind:'draft'`
      // content: PageEditor's prose Draft, which passes these, and
      // ScriptEditor's framed screenplay surface, which passes NONE of them, so
      // the chips are genuinely absent from the DOM there (never greyed — G3).
      // The reason is that a script page has ALREADY declared what it is: its
      // pageType is 'script' and its courier measure says so louder than any
      // chip could. Offering a kind row there would let a writer mark a
      // screenplay "Normal" and would then PERSIST that contradiction. Nick's
      // walkthrough opened item 114 out of the DRAFT structure redesign; if he
      // wants the row on screenplay too, it is four props and a default, and
      // the offer says so.
```

## Sliver §5

From `apps/desktop/src/components/Sliver.tsx`, line 163 at `7f1c6a84` (the comment that stays: "the Templates picker's rows: the host decides what a press does (empty page: in place; a page with words: a new page); `selected` draws the current template chosen").

```ts
      // PAGE-TEMPLATES-MOVE (Nick, 2026-10-08) - Screenplay is a LIVE template here, ahead of the disabled placeholders (Sprout
      // stays the blank Free Write page's door; Plan stays on the PLAN bar). The host owns what it does (on an empty page it
      // applies in place; on a page with words it opens a new page), so the strip only renders and calls.
      // `selected`: the page already IS this template (a screenplay page) - drawn chosen, brass at rest, aria-pressed.
      // PAGE TEMPLATES (approved mockup cursor/templates @ 0fc9afef): the picker is five rows now - Blank, Screenplay, Outline, Title Page, Bibliography -
      // each a tiny page sketch and its word. Same contract: the host decides what a press does (empty page: in place; a page with words: a new page).
```

## Sliver §6

From `apps/desktop/src/components/Sliver.tsx`, line 188 at `7f1c6a84` (the comment that stays: "New page card: a real page, created and pinned to this board in one act (BoardEditor's onAddPageCard)").

```ts
      // FX6 S2b — "New page card": a real page, created AND pinned to this
      // board in one act (BoardEditor.tsx's own onAddPageCard) — the
      // board-side door Nick reached for and couldn't find.
```

## Sliver §7

From `apps/desktop/src/components/Sliver.tsx`, line 226 at `7f1c6a84` (the comment that stays: "the open/close announcement is a layout effect keyed on `open`: a setState updater stays pure, every path that changes `open` announces, and the one-drawer hand-over lands before paint").

```ts
  // item 83 M1 (R9/R11) — the two-drawer law. Opening announces itself; the
  // store answers whether the cascade must yield, and does the measuring (see
  // store/menusDrawers.ts on why a POLICY may measure where an anchor may not).
  // Closing is announced too, so the store never believes a drawer is open
  // after the writer has shut it.
  // item 83 errata E1 (2026-08-28) — THE ANNOUNCEMENT IS STRUCTURAL.
  //
  // This used to announce from INSIDE the setState updater. Two things were
  // wrong with that, and the second one is the defect Nick felt on a tablet:
  //
  //   1. A state updater must be PURE. `requestOpen` closes the other drawer
  //      by calling ITS setState, so the old code set state on a different
  //      component from inside this one's render phase. React is entitled to
  //      call an updater more than once, or to discard the work.
  //   2. It only announced on the paths that went THROUGH this function. The
  //      grip's own onClick called `setOpen(o => !o)` directly — the
  //      affordance a writer actually taps — so opening the sliver by grip
  //      left the store believing NOTHING was open. Measured, not inferred:
  //      with the sliver visibly `data-open="true"`, the store still read
  //      `openDrawer: null`, so `requestOpen('cascade')` found no other
  //      drawer to displace and the far-left open never shut the sliver.
  //      The law was never wrong; it was never told.
  //
  // Announcing from an EFFECT keyed on `open` fixes both at once: it is a
  // commit-phase side effect where a side effect belongs, and EVERY path that
  // changes `open` announces — the grip, the shortcut, the exclusion handoff,
  // and any path added later. A silent open path is no longer possible to
  // write, which is the difference between fixing this bug and closing its
  // class.
  // PHASE 1: a LAYOUT effect (the Tutor's announce is one too), so the one-drawer hand-over lands before paint - no single frame shows both hands open.
```

## Sliver §8

From `apps/desktop/src/components/Sliver.tsx`, line 267 at `7f1c6a84` (the comment that stays: "Esc closes the open drawer unless a control inside handled it; focus returns to the tab when it was in the drawer, and stays on the page otherwise").

```ts
  // DRAWER MIRROR (Fable's check 5, Oct 24): Esc closes the open drawer - unless a control inside already handled it - and the focus goes back to the
  // tab when it was in the drawer. An Esc pressed on the page closes it and leaves the focus on the page (the page is primary).
```

## Sliver §9

From `apps/desktop/src/components/Sliver.tsx`, line 315 at `7f1c6a84` (the comment that stays: "the foot's gate reports up to the panel that carries the fade classes; the setter is stable, safe as an effect dependency").

```ts
  // item 83 errata E1 — the foot's own gate reports up to the panel that
  // carries the fade classes. `setPopoutHold` is a useState setter, so it is
  // referentially stable and safe as an effect dependency downstream.
```

## Sliver §10

From `apps/desktop/src/components/Sliver.tsx`, line 333 at `7f1c6a84` (the comment that stays: "data-menus-dock / data-menus-handle are behaviour-free contract markers the menus probe binds to, so it keeps testing the invariant if class names change").

```ts
    // item 83 M1 — the wave's own contract markers. scripts/menus-probe.mjs
    // binds to these, not to the `wz-` classes, so the acceptance instrument
    // keeps testing the RULED INVARIANT (the dock's right edge is the paper's
    // left edge; the handle rides the drawer's left) even if the class names
    // are refactored later. Behaviour-free attributes: nothing styles them.
```

## Sliver §11

From `apps/desktop/src/components/Sliver.tsx`, line 349 at `7f1c6a84` (the comment that stays: "with the drawer shut, the arrow tab carries a tiny pen while the page is in INK: a state in the tab's olive, never brass; absent in TEXT").

```ts
        {/* PHASE 1 - "which instrument am I" must stay readable with the drawer SHUT (item 121 I3). The choice now lives in the drawer's tab
            row, so the fixed arrow tab carries a tiny pen while the page is in INK. It is a state, not a choice: it wears the tab's own olive,
            never brass, and it is absent in TEXT (the default needs no mark). */}
```

## Sliver §12

From `apps/desktop/src/components/Sliver.tsx`, line 357 at `7f1c6a84` (the comment that stays: "data-popout-hold rides the PANEL, not the tray: a faded ancestor caps every child's opacity, and the tray may not leave the drawer; with no pop-out open it reads 'false' and nothing changes").

```ts
      {/* item 83 errata E1 (2026-09-03) — THE POP-OUT HOLD.
          `data-popout-hold` is the ONE new signal: true while a foot pop-out
          is open and its composed-text gate has not yet fired (SliverInstrumentRow
          below does the counting; index.css's own
          `.wz-sliver-panel[data-popout-hold='true']` rule does the holding).
          WHY IT RIDES THE PANEL AND NOT THE TRAY, recorded so it is not
          "corrected" later: an opacity on this panel caps every descendant's —
          a child cannot be more opaque than a faded ancestor — so a tray held
          visible inside a dissolved drawer is not expressible in CSS at all.
          Lifting the tray OUT of the panel is the other escape, and the anchor
          law bars it (R11: the tray is the FOOT's own raised tray, drawer-width;
          a portal would have to COMPUTE where the foot is, and an anchor may not
          be computed). It is also simply what a drawer does — you cannot leave a
          tray standing out of a shut drawer. The hold is scoped to exactly that
          state: with no pop-out open this attribute reads 'false' and every fade
          on this surface behaves byte-identically to before. */}
```

## Sliver §13

From `apps/desktop/src/components/Sliver.tsx`, line 385 at `7f1c6a84` (no comment stays: the code reads plainly).

```ts
        {/* SC1 S3 (Nick's word, 2026-07-24) — the typewriter OPTION does not
            present itself on a screenplay page. The surface no longer runs
            the typewriter (ScriptEditor.tsx), and a live switch that does
            nothing is a lying affordance: worse than a missing one, because
            the writer flips it, sees no change, and learns the app lies. This
            gate reaches BOTH of the option's surfaces in this row — the icon
            toggle itself and the Typewriter row inside the gear's
            SettingsPanel — so neither can be the one that gets forgotten.
            Interim, pending Nick's own revision of typewriter mode in a
            separate build; SC3 owns the option's return. Every other surface
            (prose Draft, Free Write, Journal, Board) is untouched. */}
```

## Sliver §14

From `apps/desktop/src/components/Sliver.tsx`, line 396 at `7f1c6a84` (the comment that stays: "the foot is universal on page-writing surfaces (prose and screenplay): its menu mounts and its settings persist here; never on card or board tools").

```ts
        {/* ITEM 83 M8 (R12) — THE FOOT IS UNIVERSAL ON PAGE-WRITING SURFACES.
            The exclusion above is superseded by Nick's own word: "One small
            change: TYPEWRITER mode should be available while writing a
            screenplay, too." SC1 S3's disable was recorded as "pending Nick's
            own revision of typewriter mode" — this IS that revision, arriving
            at the design layer, and it resolves F9 (which had defaulted to a
            per-surface foot) in the opposite direction.
            SCOPE, exactly: the menu MOUNTS and its settings PERSIST here now.
            The engine's screenplay hook-up — how the hold band meets the
            Clock's 54-line body and the Courier register — is engine-touching
            and travels as its own post-vacation brief (R12's own flag), so
            nothing here reaches into useTypewriterFade. No grayed states: the
            menu simply governs what it already governs.
            R14 keeps this off CARD and BOARD tools — the universal foot is the
            page-writing surfaces' (prose and screenplay), not everything's. */}
```

## Sliver §15

From `apps/desktop/src/components/Sliver.tsx`, line 534 at `7f1c6a84` (the comment that stays: "the eraser is a real two-state toggle and tip-agnostic: it erases whatever tip laid the ink").

```ts
          {/* J2's eraser, as the Journal built it: a real two-state toggle, and
              TIP-AGNOSTIC — it erases whatever tip laid the ink down. The
              stricter analog reading (a pencil erases, a pen and a marker do
              not) is Nick's open word; "as built" is the default and this wave
              deliberately does not spend it. */}
```

## Sliver §16

From `apps/desktop/src/components/Sliver.tsx`, line 630 at `7f1c6a84` (the comment that stays: "only a template row a theme renamed away from the canonical word gets a "?"; the set is named here because the lexicon's OVERRIDES is not exported").

```ts
// help-buttons (Fable, Oct 18) — only a ROW NAME this theme renamed away from
// the canonical word needs a "?"; Arbor's own five words ARE the canonical
// ones (deskLexicon.ts's own CANONICAL), so none of its rows get one — Flux
// overrides every one of them (Raw/Script/Spine/Cover/Sources), so all five
// of its rows do. Named here, not derived from the lexicon's own internals
// (OVERRIDES isn't exported, and the override list is already the one place
// this fact lives — deskLexicon.ts's OVERRIDES.flux block, template* keys).
```

## Sliver §17

From `apps/desktop/src/components/Sliver.tsx`, line 640 at `7f1c6a84` (the comment that stays: "Machina's forms do not map 1:1 onto the five template rows, so its rows keep the canonical words and get no "?"").

```ts
  // MACHINA: "Forms" - the mockup draws Memorandum / Report / Minutes (and Org chart / Timeline for plans), which do not map 1:1 onto the app's five
  // template rows; until Nick/Fable rule on the mapping the five rows keep their canonical words, so none is renamed and none gets a "?" yet.
```

## Sliver §18

From `apps/desktop/src/components/Sliver.tsx`, line 655 at `7f1c6a84` (the comment that stays: "while Typewriter is on the whole Format group is greyed; the hook is called above the early return (hook order), and its result is only the fallback to this page's own typewriterForPage").

```ts
  // PHASE 1 (S4) - while Typewriter is on the whole Format group is greyed and unusable (Nick). Read here, above the early return, so the hook order holds.
  // typewriter-scope (Fable Oct 21) - the hook call stays unconditional (hook-order law, unchanged); its RESULT is
  // only the fallback now. FORMAT is mounted only on 'draft' content (ScriptEditor passes none), which is the one
  // kind carrying its own pageId/pageEmpty (Sliver.tsx's own SliverContent type) - formatLocked asks THIS page's own
  // typewriterForPage there, never the shared mirror a different page's open could have left behind.
```

## Sliver §19

From `apps/desktop/src/components/Sliver.tsx`, line 671 at `7f1c6a84` (the comment that stays: "the ink zone is real ink (the stratum's tips and colours), not text colour; absent in TEXT, never greyed").

```ts
      {/* ITEM 121 I4/I6 — THE INK ZONE, AND WHAT IT REPLACED.
          Until item 121 this zone was headed "Ink" and was NOT ink: its
          swatches were three hardcoded hex values that coloured the TYPED TEXT
          and caret (ForwardOnlyEditor's own `penColor`), and beside them sat a
          fake "nib · fine" button that did nothing. Under R15 that is digital
          styling on a surface that does not decorate — the same class as the
          B/I/U this ticket removes below, differing only in which property it
          set — so it RETIRES WITH STYLING, on Nick's word (2026-09-07). "Ink"
          now means one thing on this surface, and it means the true one.
          SCOPE, exactly: only the `freewrite` arm's feed is gone. PEN_INKS,
          ModeStage's own unframed pen bar, and QuickSprint keep the text-colour
          mechanism untouched — R15 names neither, and this lane does not reach
          past the surface it was chartered for.
          ABSENT IN TEXT, never greyed: `inkOptions` is passed only in INK, so
          in TEXT none of this exists in the DOM at all (G3 — a greyed control
          for a capability the surface does not currently have is a locked door
          wearing paint; the typewriter has no nibs). */}
```

## Sliver §20

From `apps/desktop/src/components/Sliver.tsx`, line 690 at `7f1c6a84` (the comment that stays: "Free Write offers no styling: B/I/U are absent, not disabled (the typewriter does not decorate); Draft's roster below is untouched and shares the styling keys").

```ts
      {/* ITEM 121 I6 (R15/G3) — STYLING IS RETIRED FROM FREE WRITE.
          Nick's analog law: Free Write is a typewriter for text — "no digital
          styling, no fonts, no formatting on that surface." B/I/U leave, and
          they leave by ABSENCE, not by a hidden or disabled mount: what the
          analog page cannot do, the chrome does not offer. This supersedes M4
          (R1) FOR THIS SURFACE ONLY.
          DRAFT IS UNTOUCHED — R4 keeps its much larger FORMAT roster below,
          `stylingBold`/`stylingItalic`/`stylingUnderline` are SHARED with it
          and must survive, and `__u__`/the marker conventions in
          store/draftFormat.ts are Draft's, not this surface's.
          NO LEXICON KEY ORPHANS BY THIS REMOVAL, and the S0 survey's claim that
          `stylingHeading` would is CORRECTED HERE RATHER THAN QUIETLY DROPPED:
          Draft's own zone does head with `railFormat`, but BoardEditor's card
          popup dock heads with `stylingHeading`, so sweeping it would have
          broken the Board. Checked before sweeping, not after. The keys that
          DO orphan are `railInkTool`/`railInkToolInert` — the inert
          placeholder's, and that placeholder is now gone outright.
          The menus wave's tests that asserted Free Write's B·I·U get the park
          treatment: original assertions kept verbatim with a successor
          pointer, never rewritten in place. */}
```

## Sliver §21

From `apps/desktop/src/components/Sliver.tsx`, line 761 at `7f1c6a84` (the comment that stays: "H lights on a heading line and toggles it; + and - step between the six levels; they show only on a heading line").

```ts
            {/* HEADINGS (Nick, 2026-10-06): H lights on a heading line and toggles it (adds Heading 2, or removes any level); + and -
                step between the six levels, toward h1 and toward h6. They act only on a heading line, so they show only on one. */}
```

## Sliver §22

From `apps/desktop/src/components/Sliver.tsx`, line 769 at `7f1c6a84` (the comment that stays: "lists and quotes ride the existing `- ` and `> ` conventions; indent and alignment are line-prefix directives (store/draftFormat.ts documents why they are not metadata)").

```ts
          {/* ITEM 83 M5 (R4) — the roster Nick named: bulleted lists,
              indentation/block quote, alignment, line spacing. Lists and
              quotes ride conventions that already exist (`- `, `> `); indent
              and alignment become line-prefix directives per F3's default
              (store/draftFormat.ts documents the tokens and why they are not
              metadata). */}
```

## Sliver §23

From `apps/desktop/src/components/Sliver.tsx`, line 778 at `7f1c6a84` (the comment that stays: "outdent, the exact decrement of Indent (floored at zero, counted in leading tabs, one shared helper); outdent before indent so the pair reads left to right").

```ts
            {/* ITEM 83 ERRATA E3, THE OUTDENT PARTNER (Nick's ruling) — the exact
                decrement of Indent beside it, floored at zero, levels counted in
                tabs on F3's leading-tab convention (store/draftFormat.ts shares
                one paragraph-scope helper between the two so they cannot drift).
                ORDER: outdent BEFORE indent, so the pair reads left-to-right as
                a pair — the same order the legacy bar has always used
                (ModeStage.tsx's Outdent/Indent), and the same direction this
                drawer's own alignment row already reads.
                GLYPH: a paragraph of lines with an arrow. Align left is a
                stack of lines, not this arrow, so the two controls cannot
                wear one mark. */}
```

## Sliver §24

From `apps/desktop/src/components/Sliver.tsx`, line 802 at `7f1c6a84` (the comment that stays: "Structure is the tab's last zone before the foot; the `-zone` suffix is load-bearing: `wz-sliver-structure` is the retired tablist's class, whose absence a harness reads").

```ts
      {/* item 83 errata E2 — STRUCTURE IS THE TAB'S LAST ZONE BEFORE THE FOOT.
          Recorded plainly rather than claimed as work: it ALREADY WAS, at this
          wave's branch point. Every remaining section in this body is gated to
          another `content.kind`, so on a Draft page the rendered sequence is
          FORMAT then STRUCTURE, with the goal foot as the next sibling — see
          docs/menus/item83-errata-s0-survey.md (c). What this errata adds is
          the NAME (`wz-sliver-structure-zone`) that lets the acceptance instrument
          measure the claim at all, and the guard that keeps it true as E4 grows
          this zone. Nothing moved, and the offer says so.

          THE `-zone` SUFFIX IS LOAD-BEARING, not decoration. The first cut of
          this named the div `wz-sliver-structure` — which is the RETIRED
          tablist's own class, swept by the menus wave's own "orphaned
          .wz-sliver-structure sweep". ab2.mjs still probes that exact class,
          and reads its ABSENCE as the proof the picker is gone; reusing the
          name made a live assertion false without any ruling having changed.
          Caught by the suite. The picker's name stays retired. */}
```

## Sliver §25

From `apps/desktop/src/components/Sliver.tsx`, line 819 at `7f1c6a84` (the comment that stays: "ACTIONS sits between Format and Templates").

```ts
      {/* PHASE 1 - ACTIONS, between Format and Templates (Nick's order: Typeface, Format, Actions, Templates). */}
```

## Sliver §26

From `apps/desktop/src/components/Sliver.tsx`, line 997 at `7f1c6a84` (the comment that stays: "pop-outs fade on written words, never on a clock: a foot pop-out receives its fade only after POPOUT_FADE_WORDS words or a new period since it opened; idle never fades it").

```ts
// FX3 S5 — the sliver foot's new quiet icon row, beneath the goal block:
// (1) the typewriter toggle, ICON ONLY (moved here from SliverToolsBody's
// old "READING" section — see that removal's own comment); (2) the
// writing-settings gear, relocated whole from the paper (ModeStage.tsx no
// longer mounts it when framed) — SettingsPanel AND ThemePanel travel
// together behind the SAME gear click, exactly as they did there, rather
// than splitting the theme switcher off to some new, brief-unspecified
// home (the brief's own "don't leave an orphaned half-gear if you split
// them" — the safest reading, given the foot row's three icons are already
// spoken for and nothing in S5 names a fourth place for Theme, is to move
// the gear WHOLE); (3) a new instruments icon (a minimal, working-value
// panel; the goal's unit now lives with its number in store/writingGoal.ts).
// All three buttons are `--text-mid`/
// olive at rest (`.wz-sliver-instruments-btn`, index.css) — brass appears
// only on hover, matching the sliver's own pre-existing law elsewhere.
// item 83 errata E1 (2026-09-03) — POP-OUTS FADE ON WRITTEN WORDS, NEVER ON A
// CLOCK. Nick's walkthrough ruling: a foot pop-out fades only after FIFTEEN
// WORDS have been written, or a PERIOD has been entered, counted from the
// moment it opened. Idle never fades it — a writer thinking is not a writer
// done.
//
// WHAT IT REPLACES, named exactly (S0's survey, `docs/menus/item83-errata-s0-survey.md`):
// the pop-out had no fade of its own and no timer of its own. It is a child of
// `.wz-sliver-panel`, which carries `chrome-fade desk-dissolve`, so it rode the
// room's ambient dissolve — armed by `useChromeDissolve.noteWrite()` on the
// FIRST forward keystroke (ModeStage.tsx -> useChromeDissolve.ts), receding over
// FADE_OUT_S = 2.8s. One character typed and the tray was gone. The "short
// timer" a writer feels is that 2.8s curve; no setTimeout ever hid the tray.
//
// SCOPE, and why it is not a second engine. Nothing here touches
// useChromeDissolve, its constants, or any other chrome surface: the vanish
// engine's own recede/summon fades are untouched, and drawers keep R10's
// slide-only open/close. The ONLY change is WHEN this one surface receives the
// fade it already had — the same `.desk-dissolve` rule, the same `--fade-dur`
// curve, the same `prefers-reduced-motion` opt-out. The trigger changed; the
// fade path did not.
//
// FIFTEEN, and why it is a plain module constant: it is a ruled number, not a
// tuned one. It carries no setting, so it needs no store; naming it here keeps
// it beside the code that reads it.
```

## Sliver §27

From `apps/desktop/src/components/Sliver.tsx`, line 1043 at `7f1c6a84` (the comment that stays: "a period is one the document did not have when the tray opened - counted, not watched, so it works on both prose surfaces").

```ts
// "A period entered" is measured as a period the document did not have when the
// tray opened. Counting occurrences rather than watching keystrokes is what
// makes this work on BOTH prose surfaces: Draft is freely editable (a keystroke
// watcher would miss a period pasted, or one typed mid-paragraph), and the
// Sliver already receives the page's live text on every change, so no new
// signal has to be threaded from three hosts. The one case it deliberately
// treats as a wash — delete a period, type it back — is genuinely no new period
// in the writer's document, which is the thing the ruling names.
```

## Sliver §28

From `apps/desktop/src/components/Sliver.tsx`, line 1061 at `7f1c6a84` (the comment that stays: "a Draft or Screenplay page asks typewriterForPage; Free Write (no pageId) reads the shared field").

```ts
  // typewriter-scope (Fable Oct 21) — a Draft/Screenplay page (pageId given)
  // asks typewriterForPage directly; Free Write (no pageId — this same foot
  // is universal across page-writing surfaces, ITEM 83 M8's own ruling)
  // keeps reading the shared field exactly as before.
```

## Sliver §29

From `apps/desktop/src/components/Sliver.tsx`, line 1067 at `7f1c6a84` (the comment that stays: "the foot is one three-dot menu: Typewriter, Progress and the remaining preferences open together under their headings; one instrument open at a time").

```ts
  // The foot is one three-dot menu. Typewriter, progress, and the remaining
  // preferences open together, under those three headings. Full screen is
  // not in this drawer — the app chrome already offers it.
  //
  // Nick's ruling: "I don't want a separate 'Instruments' toggle/menu. All of
  // the options in it should be set in one of the other settings options. Here
  // are the three I want at the bottom of every pop-out tool menu: TYPEWRITER,
  // PROGRESS, and FULL SCREEN."
  //
  // WHERE EVERYTHING WENT, named rather than left to be discovered:
  //  · the gear RETIRES from the foot. Its Progress/Timer rows move into
  //    PROGRESS; its Fade depth folds into the Typewriter menu's Line Fade
  //    (O-FW2, resolved by merger); Theme leaves the foot entirely for the
  //    rail's own theme category, which already stands (R5).
  //  · the Instruments panel RETIRES WHOLE. Its Show/Unit/Target rows are
  //    absorbed into PROGRESS, so nothing it offered is lost — a second
  //    surface onto the same goal becomes one surface.
  // One instrument may be open at a time: these are pop-outs from a foot in a
  // narrow drawer, and two open at once would scroll rather than disclose.
```

## Sliver §30

From `apps/desktop/src/components/Sliver.tsx`, line 1088 at `7f1c6a84` (the comment that stays: "`held` is true from a tray's opening until POPOUT_FADE_WORDS words or a period since then").

```ts
  // item 83 errata E1 — the composed-text gate. `held` is true from the moment a
  // tray opens until the writer has committed POPOUT_FADE_WORDS words, or
  // entered a period, since that moment.
```

## Sliver §31

From `apps/desktop/src/components/Sliver.tsx`, line 1108 at `7f1c6a84` (the comment that stays: "the release runs on text change only; there is no timer, so a writer who sits thinking keeps the tray").

```ts
  // The release. Runs on text change only — there is NO timer here, and that
  // absence is the ruling: "idle never fades it." A writer who opens a tray and
  // sits thinking keeps it, however long they sit.
```

## Sliver §32

From `apps/desktop/src/components/Sliver.tsx`, line 1161 at `7f1c6a84` (the comment that stays: "the Flicker switch is Flux's only: a switch with nothing to switch would teach the writer it does something").

```ts
          {/* GLITCH METER (Fable, Oct 17: "the Flicker switch goes in the '...' settings panel beside Typewriter"). Flux only: the meter is
              Flux's, and a switch with nothing to switch would teach a writer it does something. */}
```

## Sliver §33

From `apps/desktop/src/components/Sliver.tsx`, line 1175 at `7f1c6a84` (no comment stays: the code reads plainly).

```ts
          {/* Nick's ruling (via Fable, Oct 25): "Recede depth" is REMOVED - the narrow layout follows the full recede. It was the Preferences block's only row, so the block is gone too. */}
```

## Sliver §34

From `apps/desktop/src/components/Sliver.tsx`, line 1182 at `7f1c6a84` (the comment that stays: "the Typewriter menu: one pop-out, each behaviour with its toggle and adjustments disclosed in place, so the depth never grows").

```ts
// ITEM 83 M4 (R3) — THE TYPEWRITER MENU. One pop-out, exactly one level
// beyond the panel (G4's ceiling, met by the ruling's own shape — "the
// Typewriter icon opens"). Each behaviour carries its toggle AND its
// adjustments, disclosed IN PLACE beneath it, so the depth never grows.
```

## Sliver §35

From `apps/desktop/src/components/Sliver.tsx`, line 1191 at `7f1c6a84` (the comment that stays: "the on/off row is the icon toggle beside the "..."; while it is off these rows are greyed (values kept); same pageId fallback as the toggle").

```ts
  // PHASE 1 (S4) - the Typewriter on/off row LEFT this menu for the icon toggle beside the "...". What stays is greyed and unusable while the mode is
  // off (the values are kept; they simply cannot be changed until it is back on).
  // typewriter-scope (Fable Oct 21) - same pageId fallback as SliverInstrumentRow's own typewriterOn, so this menu
  // never disagrees with the icon toggle it lives beneath.
```

## Sliver §36

From `apps/desktop/src/components/Sliver.tsx`, line 1295 at `7f1c6a84` (no comment stays: the code reads plainly).

```ts
// ITEM 83 M4 (R5) — RETIRED: InstrumentsPanel and InstrumentsIcon.
// Nick: "I don't want a separate Instruments toggle/menu. All of the options
// in it should be set in one of the other settings options." Its whole roster
// (Show · Unit · Target) is absorbed into the foot's PROGRESS menu above, so
// nothing it offered is lost — two surfaces onto one goal became one. Deleted
// rather than parked because it is a COMPONENT, not a harness assertion: the
// park-never-edit law governs checks, and the checks that covered these rows
// still pass against their new home.
```
