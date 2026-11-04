# Rulings: `apps/desktop/src/pages/PageEditor.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[PageEditor §n]` points here.

## PageEditor §1

From `apps/desktop/src/pages/PageEditor.tsx`, line 114 at `4d6af3d9` (the comment that stays: "non-null only while this surface has no row yet; every use below reads "if this page is still unborn", so the born path is the ordinary one, and `entry` resolves from the unborn slot meanwhile").

```ts
  // PB1 (item 71) — non-null only while this surface has no row yet. Every use
  // below reads as "if this page is still unborn, …", so the born path is the
  // ordinary one, untouched. `entry` resolves from the unborn slot meanwhile,
  // so the whole tree mounts exactly as it always did.
```

## PageEditor §2

From `apps/desktop/src/pages/PageEditor.tsx`, line 198 at `4d6af3d9` (the comment that stays: "Free Write is a typewriter for text and a sketch pad for drawing; `instrument` is which one the page is now. TEXT by default and not persisted (session-scoped): a page that remembered INK would open unable to type.").

```ts
  // ── ITEM 121 · THE INK WAVE ────────────────────────────────────────────────
  // R15: Free Write is a typewriter for text and a journal page / sketch pad
  // for drawing. `instrument` is which of the two the page currently IS.
  //
  // DEFAULT TEXT, AND NOT PERSISTED. A page is a typewriter until the writer
  // picks up the pen — session-scoped, exactly like J2's pen re-arm on open,
  // and deliberately NOT stored per page the way `mode` is: a page that
  // remembered INK would open unable to type, which is the wrong failure for a
  // writing app, and one word reverses this if Nick wants it remembered.
```

## PageEditor §3

From `apps/desktop/src/pages/PageEditor.tsx`, line 217 at `4d6af3d9` (the comment that stays: "what this mode lets the writer do to the page's ink, derived from mode and instrument, never stored: Free Write is `edit` in INK and `inert` in TEXT; Draft and Revise are `movable`. The ternary reaches `movable` only past `mode === 'journal'`, so Free Write can never acquire it by accident.").

```ts
  // ITEM 126 B2 — WHAT THIS MODE LETS THE WRITER DO TO THE PAGE'S INK.
  //
  // Derived, never stored: it is a pure function of the mode and (in Free Write)
  // the instrument, so there is no second source of truth to fall out of step
  // with the switch.
  //
  // FREE WRITE keeps exactly the two states item 121 shipped — `edit` in INK,
  // `inert` in TEXT — and RULED (Fable, 2026-09-08): the TEXT half stays INERT,
  // R15 stands. The asymmetry that creates is the REASON rather than a hole: in
  // Free Write the sketch pad is one press away, so a writer who wants to
  // rearrange ink flips to INK; in Draft and Revise there is no INK to flip to,
  // which is exactly why `movable` exists there and nowhere else. A typewriter
  // does not move ink; a sketch pad does.
  //
  // THE TERNARY IS WRITTEN THIS WAY ON PURPOSE. `movable` is reached only by
  // falling past `mode === 'journal'`, so Free Write can never acquire it by
  // accident. Writing it the other way round — "movable unless the writer is
  // drawing" — would hand the move gesture to Free Write's TEXT half and reverse
  // the ruling silently, which is the one mistake this ticket is most able to
  // make.
```

## PageEditor §4

From `apps/desktop/src/pages/PageEditor.tsx`, line 240 at `4d6af3d9` (the comment that stays: "persist strokes, merging the LIVE text so a pending typed run is never clobbered (Free Write's text autosave is debounced). An unborn page has no row and a stroke is content: the row is written WITH the ink in one synchronous act (`birthWith`), never created empty first; an ink-only page is not empty.").

```ts
  // Persist strokes, merging the LIVE text so a pending typed run is never
  // clobbered — the Journal's own rule (its `persist`), and load-bearing here
  // too because Free Write's text autosave is debounced.
  //
  // PB1 — AN UNBORN PAGE HAS NO ROW, and a stroke is content. The row is
  // written WITH the ink in the same synchronous act (`birthWith`), never
  // created empty and filled in afterwards, which is the whole of PB1's law;
  // `strokes` joins `text`/`boxes`/`script` in BirthContent for exactly that.
  // Ink is a birth trigger because ink is writing: F6's own DoD 4 already
  // ruled that an ink-only page is NOT empty.
```

## PageEditor §5

From `apps/desktop/src/pages/PageEditor.tsx`, line 307 at `4d6af3d9` (the comment that stays: "the caret line's heading level, and where the small floating +/- sits while a heading is selected").

```ts
  // HEADINGS (Nick, 2026-10-06): the caret line's heading level, and where the small floating +/- sits while a heading is selected.
```

## PageEditor §6

From `apps/desktop/src/pages/PageEditor.tsx`, line 311 at `4d6af3d9` (the comment that stays: "and its size").

```ts
// POLISH #10 item 4: and its size
```

## PageEditor §7

From `apps/desktop/src/pages/PageEditor.tsx`, line 356 at `4d6af3d9` (the comment that stays: "The heading line the floating +/- sits beside, as plain offsets from the last full recompute. A scroll changes nothing the recompute derives, so it only re-places the pop, while one is shown, at most once a frame (the full recompute reads the whole page's innerText, and the typewriter scrolls on every line).").

```ts
    // The heading line the floating +/- sits beside, as plain offsets, set by the last full recompute. A SCROLL changes where the line
    // is on screen but nothing the recompute derives (marks, heading level, the selection), so a scroll only re-places the pop -
    // and only while one is shown, at most once a frame (Fable, 2026-10-12: the full recompute reads the whole page's innerText,
    // and the typewriter scrolls on every line).
```

## PageEditor §8

From `apps/desktop/src/pages/PageEditor.tsx`, line 399 at `4d6af3d9` (the comment that stays: "The floating +/-: shown only while a selection sits on a heading line, placed where it never covers a word (past the heading's last line, else in the column's left margin); a fixed overlay, so the page never moves.").

```ts
      // THE FLOATING +/- (Nick: "a '+/-' option ... that hovers over the heading text on the page when it is highlighted"). Shown only
      // while a SELECTION sits on a heading line. It is placed where it can never cover a word: just past the end of the heading's own
      // last line of text; if that would run off the column, in the column's left margin beside the heading. Fixed-position overlay,
      // so the page never moves.
```

## PageEditor §9

From `apps/desktop/src/pages/PageEditor.tsx`, line 454 at `4d6af3d9` (the comment that stays: "the Draft-open typewriter is decided once at mount (empty deps freeze `mode` and `initialText`; the component remounts per page, so a mode switch within one mount never re-runs it); an EMPTY page opens with the typewriter OFF, having no lines to follow").

```ts
  // FX2 S2 — Draft-open typewriter default, captured once at mount (the
  // same "captured once" idiom as warmRef above, and Sliver.tsx's own
  // initialGoalTextRef). `mode` and `initialText` here are read inside the
  // effect's OWN closure (empty deps), so they're each frozen at their
  // FIRST-RENDER value — the effective mode AT OPEN, before any switchMode()
  // click could change it, and the page's text as it stood at that same
  // mount. This component remounts per page (`key={id}` below), so "once
  // per mount" already means "once per page-open": a later Draft <-> Free
  // Write mode switch within the SAME mount can never re-run this effect,
  // satisfying "mid-session mode switches don't re-evaluate" for free,
  // without a separate guard ref. Free Write is untouched — no call here
  // when the page opens into 'journal'.
  // ITEM 87 (clause 3) — A FRESH PAGE OPENS WITH THE TYPEWRITER OFF.
  //
  // Nick's S3, and it AMENDS FX2 S2 rather than discarding it. FX2 S2 ruled
  // "Draft opens with typewriter ON unless the page already holds 10+ line-
  // equivalents," reasoning that the line-following fade helps someone starting
  // to write and hinders someone editing a body of text. An EMPTY page seeds 0
  // line-equivalents, so it fell on the ON side of that rule by arithmetic
  // rather than by intent — and a page with nothing in it has no lines to
  // follow, which is the state Nick objected to. The threshold rule is
  // untouched everywhere it still applies: a page with SOME text below the
  // threshold still opens ON (fx2.mjs's ~3-line check proves it, unchanged).
  // Only the empty case moves, so this is an amendment at the one point the
  // original rule was never really about.
```

## PageEditor §10

From `apps/desktop/src/pages/PageEditor.tsx`, line 572 at `4d6af3d9` (the comment that stays: "This hook sits ABOVE the early return below (the hooks-order guards enforce it); its body reads `applyFormatAt`, defined below, safely, since an effect runs after render, and its deps carry `!!realEntry` so the listener attaches once the editor mounts. Tab indents through draftFormat's own indent (a leading tab), the same formatter as the rail's arrows, so a key and a click cannot drift apart. It is a state machine (store/tabChord.ts): each Tab tap is one more first-line level, Shift+Tab one back, Tab held + 1 one whole-paragraph level per press; a tap applies on release, and a quick Tab-then-1 types its 1. Draft and Revise act everywhere; Free Write is forward-only, so it acts on a BLANK line only and never outdents. Capturing Tab costs a keyboard-only writer Tab-out; Escape leaves the surface (store/escapeExit.ts). While an Outline is in Draft it owns Tab and this machine stands aside (a ref, read at press time).").

```ts
  // ITEM 158, RE-HOMED BY THE PAIR: this hook lives ABOVE the early return below, deliberately (item 104's law, and the
  // hooks-order guards that enforce it - the first pair run went red on exactly this: it had been written beneath the
  // guard). The effect body reads `applyFormatAt`, defined far below: safe, since an effect body runs after the render
  // function has finished. And because the editor only mounts once the entry exists, the deps carry `!!realEntry` so the
  // listener is attached when it does, not only when the mode changes.
  // ITEM 158 — TAB INDENTS THE PARAGRAPH.
  //
  // Nick: on the writing surface Tab moved BROWSER FOCUS instead of indenting.
  // It did, because nothing on this surface handled Tab at all and the browser
  // was free to do what it does with an unhandled Tab.
  //
  // THE INDENT IS NOT INVENTED HERE. `draftFormat.ts` already defines it, in as
  // many words: "Indent is a leading tab" — one leading `\t` on every line of
  // the paragraph, levels counted in tabs, blank separator lines left alone,
  // the caret keeping the character it sat on, and `^\t+` already stripped on
  // export. Tab runs that SAME action through the SAME formatter the rail's
  // arrows use, so a keystroke and a click cannot drift apart, and one atomic
  // undo step covers either.
  //
  // FREE WRITE IS FORWARD-ONLY, AND THAT DECIDES ITS LAW. A leading tab on a
  // line that already has words is an insertion BEHIND the caret, which the
  // forward law forbids. On an EMPTY line it is an insertion at the caret —
  // the typewriter's paragraph tab, lawful and ordinary. So: Tab indents a
  // blank line, does nothing on a written one, and Shift+Tab does nothing at
  // all there (an outdent is a deletion).
  //
  // WHAT IT COSTS, RECORDED RATHER THAN GLOSSED: capturing Tab means a
  // keyboard-only writer can no longer Tab OUT of the editor to the chrome.
  // That is the standard trade every text editor makes — and the card popup
  // already traps Tab deliberately — but it is a real cost, not a free win,
  // and Escape is what leaves the surface (built by the accessibility audit's A1 fix: store/escapeExit.ts).
  //
  // STEP 3 (Nick, 2026-09-25) - TAB IS NOW A STATE MACHINE (store/tabChord.ts, proved without a browser): every Tab tap is one more
  // first-line level ("keep indenting the text further"), Shift+Tab one level back, and Tab HELD + 1 is one WHOLE-PARAGRAPH (block)
  // level per press of the 1 (Shift+Tab held + 1 one back). A tap is applied on release; a quick Tab-then-1 (a numbered list) types
  // its 1. Draft and Revise act everywhere; Free Write acts on a BLANK line only and never outdents (a deletion), and there a 1 is
  // always just typed unless the chord may act.
  // PAGE TEMPLATES - an OUTLINE owns Tab in Draft: each row is a heading with its own level (store/outlineText.ts, the lens's onLensKey), while this machine indents
  // the whole PARAGRAPH - and an outline is one unbroken paragraph. So while an Outline is in Draft this machine stands aside (a ref, read at press time: the template
  // can change under a mounted editor; this hook sits above the early return, deliberately, like its neighbours). Esc still leaves the surface.
```

## PageEditor §11

From `apps/desktop/src/pages/PageEditor.tsx`, line 713 at `4d6af3d9` (the comment that stays: "the durable-relationship doors: pairing, porting and pinning outlive the visit, so they birth the page FIRST and then act on the real row, as one act: no dangling pointer, no orphan").

```ts
  // PB1 — the durable-relationship doors (Fable's ruling 2). Pairing, porting
  // and pinning all create something that outlives the visit, so they birth the
  // page FIRST and then act on the real row — never "act on nothing and hope."
  // The order is fixed and the two steps are one act, so no pointer is ever
  // left dangling and no orphan is ever minted.
```

## PageEditor §12

From `apps/desktop/src/pages/PageEditor.tsx`, line 763 at `4d6af3d9` (the comment that stays: "the framed Page panel has no footer line").

```ts
    // ITEM word-diet (Nick, Oct 13): REMOVE — the framed Page panel's own footer line retires whole.
```

## PageEditor §13

From `apps/desktop/src/pages/PageEditor.tsx`, line 829 at `4d6af3d9` (the comment that stays: "The template picker (Sliver, Templates; Draft and later strips, never Free Write): Blank, Screenplay, Outline, Title Page, Bibliography. The host owns the act: an EMPTY page (no words, no ink) takes the choice in place; a page WITH words or ink never moves, and the choice opens a NEW page in the same home, whose chip reads "Opened as a new page · Back". Pressing the current choice changes nothing. A template is a lens set through patchPageSettings, as `kind` is; on an unborn page it rides the address.").

```ts
  // PAGE-TEMPLATES-MOVE (Nick, 2026-10-08: "templates live in the tools menu now") - Screenplay is the Draft strip's LIVE
  // template (Sliver.tsx, Templates; Draft and later strips only, never Free Write). It runs the act its door ran: the
  // Structure path (AB2 S4) - free on an empty page, and it BIRTHS (the ruled amendment to ruling 2).
  // On an EMPTY page (zero words, the row's own test) it applies in place. On a page WITH words it never touches the text: it
  // opens a NEW screenplay page in the same home through item 104's own `structure` address (the arrival effect above births
  // it), and the new page carries the existing "Back to <title>" chip (state.fromBoardId - the PW1 chip that names the surface
  // actually left), so the departure keeps a one-tap return.
  //
  // PAGE TEMPLATES (docs/plans/page-templates.md, approved Oct 16) GENERALIZES THAT ACT to the five rows of the picker - Blank, Screenplay,
  // Outline, Title Page, Bibliography - without changing its shape: the host owns it; an EMPTY page (no words, no ink) takes the choice in
  // place; a page WITH words or ink never moves - the choice opens a NEW page in the same home, and the new page's chip (state.openedByTemplate)
  // reads "Opened as a new page · Back". Pressing the choice already made changes nothing. A template is a lens on the text, set through the
  // same patchPageSettings seam `kind` uses; on a page not yet born it rides the address instead (the row is born only by the first word, PB1).
```

## PageEditor §14

From `apps/desktop/src/pages/PageEditor.tsx`, line 916 at `4d6af3d9` (the comment that stays: "scales with --paper-scale so the editor's type grows with the paper (the measure is the constant, not the pixel width); it reaches the contenteditable by inheritance (ForwardOnlyEditor spreads this style on its outer wrap). A page's default is 12 real points in page units (index.css --wz-pt).").

```ts
          // FX3 S2 — scales with --paper-scale (index.css) so the editor's
          // own rendered type grows in lockstep with the paper (Law 1: the
          // measure, not the pixel width, is the constant). Reaches the
          // actual contenteditable node via inheritance, not directly
          // (ForwardOnlyEditor spreads this `style` onto the outer
          // `.forward-only-editor-wrap`, not the `.forward-only-editor`
          // node itself — font-size is an inherited property, so this
          // still works).
          // PAGE-SIZE (ruling a): 12 real points in page units - 16px at page scale 1, growing with the page (index.css --wz-pt).
```

## PageEditor §15

From `apps/desktop/src/pages/PageEditor.tsx`, line 939 at `4d6af3d9` (the comment that stays: "the ink stratum paints OVER the text (a later sibling: ink under type would be hidden). It renders in every mode, since the ink is the page's, framed only (below 1100px the page keeps its pre-ink terms). Mode varies permission, not presence (`inkPermission`); both canvases stay pointer-events:none and routing belongs to the sheet.").

```ts
      {/* ITEM 121 I2 — the ink stratum, OVER the text (a later sibling, so it
          paints on top — the analog act is writing ON the page with a pen, and
          ink UNDER type would simply be hidden by the type).
          ITEM 126 B1 — AND IT RENDERS IN EVERY MODE NOW, because the ink is THE
          PAGE'S, not Free Write's decoration (Nick: "both text and ink should be
          editable … in Free Write mode. Once the user switches to Draft or
          Revise mode, INK no longer becomes directly editable but can be moved
          around"). This is ONE CONDITION rather than a new surface: the sheet
          this canvas anchors to is `editorBody`'s own wrapper, which was already
          rendered unconditionally in all three modes — see
          docs/menus/item126-s0-survey.md §2.
          FRAMED-ONLY STAYS. Below the 1100px gate the page keeps its
          pre-item-121 terms exactly, per the 112-A rider's precedent; item 126
          does not lift that, and lifting it by silence would be this lane
          widening its own charter.
          WHAT VARIES BY MODE IS PERMISSION, NOT PRESENCE — see `inkPermission`
          above. Both canvases stay pointer-events:none in every mode; routing
          belongs to the sheet, always. */}
```

## PageEditor §16

From `apps/desktop/src/pages/PageEditor.tsx`, line 970 at `4d6af3d9` (the comment that stays: "The rail's Bold/Italic/Heading/Spacing tools act on entry.text directly (markdown conventions, no separate rich-text state): read the selection by linear offset (store/caretOffset.ts), transform (store/draftFormat.ts), then re-decorate through ForwardOnlyEditor's own guarded helper (decorateEditorFor), never a bare innerHTML write, which would bring back Chromium's trailing-newline caret quirk; a rail click and a keystroke leave the same state. One implementation, two gates: `applyRailFormat`'s `mode !== 'drafting'` guard keeps a leaked Revise rail inert, so each caller brings its own scope (the rail Draft-only, Tab in Draft and Revise).").

```ts
  // AB2 S3 — the rail's Bold/Italic/Heading/Spacing tools, operating on
  // entry.text directly (S0's ruling: markdown conventions, no separate
  // rich-text state). Reads the editor's current selection via the SAME
  // linear-offset technique the rest of this codebase uses for caret math
  // (store/caretOffset.ts), applies the transform (store/draftFormat.ts),
  // then imperatively re-decorates the DOM through the SAME guarded helper
  // ForwardOnlyEditor's own native listener uses on every keystroke
  // (store/draftDecoration.ts's decorateEditorFor) — not a bare
  // `el.innerHTML = decorateMarkdown(...)`, which would reintroduce the
  // Chromium trailing-newline-at-EOF caret quirk that helper guards against
  // (reachable here too: Spacing at the very end of the page inserts a
  // trailing blank line, landing the caret exactly in that state) — so a
  // rail click and a keystroke leave the surface in the identical state.
  // ITEM 158 — ONE IMPLEMENTATION, TWO GATES. Tab must indent in Draft AND
  // Revise, but `applyRailFormat`'s own `mode !== 'drafting'` guard is
  // load-bearing for a different reason (112-A: it is what would keep a leaked
  // Revise rail INERT rather than live-looking), so widening it would quietly
  // spend a safety net on an unrelated errand. Instead the body moves here and
  // each caller brings its own scope: the rail stays Draft-only, the keybinding
  // covers both editable modes, and there is still only one formatter.
```

## PageEditor §17

From `apps/desktop/src/pages/PageEditor.tsx`, line 1028 at `4d6af3d9` (the comment that stays: "a face for the HIGHLIGHTED words only, by a format press's road: one atomic undo step, the same decorator, the highlight left on the same words").

```ts
  // FONT-SPAN (docs/font-span-plan.md; Nick approved the font-choices mockup): a face for the HIGHLIGHTED words only - the same road
  // a format press takes: ONE atomic undo step, the text written through the same decorator, and the highlight left on the same words.
```

## PageEditor §18

From `apps/desktop/src/pages/PageEditor.tsx`, line 1041 at `4d6af3d9` (the comment that stays: "through the rows, as a format press is: a bare decorateEditorFor replaced the rows' DOM behind the row model's back, so the highlight and the face were lost").

```ts
      // TYPING-LATENCY x FONT-SPAN (ledger 79): through the rows, as a format press is - a bare decorateEditorFor replaced the rows'
      // DOM behind the row model's back (its shadow kept the old text: 60 chars vs the page's 91), so the highlight and the face were lost
```

## PageEditor §19

From `apps/desktop/src/pages/PageEditor.tsx`, line 1048 at `4d6af3d9` (the comment that stays: "a size for the HIGHLIGHTED words only, by the face's road (one atomic undo step, through the rows)").

```ts
  // FONT-SPAN: the Whole document pick, as the mockup has it - every word takes the page's new face, so the spans go (free-edit modes,
  // where the page's text can be rewritten in place; Free Write's forward-only runway is never rewritten by a tool). One undo step.
  // POLISH #10 item 4 (Nick ruled A, Oct 25): a size for the HIGHLIGHTED words only - the face's own road (one atomic undo step, through the rows)
```

## PageEditor §20

From `apps/desktop/src/pages/PageEditor.tsx`, line 1067 at `4d6af3d9` (the comment that stays: "the whole-document SIZE pick: the spans' sizes go (the faces stay), one undo step, through the rows").

```ts
  // POLISH #10 item 4: the whole-document SIZE pick - the spans' sizes go (the faces stay), one undo step, through the rows
```

## PageEditor §21

From `apps/desktop/src/pages/PageEditor.tsx`, line 1148 at `4d6af3d9` (the comment that stays: "Screenplay BIRTHS, at zero words: it transforms the surface rather than decorating it, a durable commitment about what the document is (closer to pairing a board than to toggling a setting), so there is no unborn script surface to hold").

```ts
    // PB1 — AMENDMENT to Fable's ruling 2 (2026-07-26), quoted so it reads as a
    // ruled distinction rather than a schedule concession: "the Screenplay door
    // is presented as a mode choice … but structurally it's the one that
    // transforms the surface itself rather than decorating it. The writer who
    // clicks Screenplay has made a durable authorial commitment about what this
    // document is, which is closer in kind to pairing a board than to toggling
    // a setting … a screenplay page is a different document, not a
    // differently-dressed one." So Screenplay BIRTHS, at zero words — which is
    // also why there is no unborn script surface to hold.
```

## PageEditor §22

From `apps/desktop/src/pages/PageEditor.tsx`, line 1173 at `4d6af3d9` (the comment that stays: "A door that declared Screenplay opens the screenplay room, through `requestScreenplay` (one birth path). Guarded three ways, since a double birth would be worse than the defect: only while UNBORN (`unbornRef.current`), only when the address asked, and only once per mount (the ref latch survives StrictMode's double-invoke).").

```ts
  // ITEM 104 — A DOOR THAT DECLARED SCREENPLAY OPENS THE SCREENPLAY ROOM.
  //
  // Nick's verdict, verbatim: "Screenplay mode should be auto-selected anyway
  // when a user comes from a New Page where the 'Screenplay' template icon was
  // selected." This is that, and it deliberately reuses `requestScreenplay`
  // rather than inventing a second birth path — so the ruled amendment (choosing
  // Screenplay BIRTHS, at zero words) keeps ONE implementation and cannot drift.
  //
  // Guarded three ways, because a birth that fires twice or fires on the wrong
  // surface would be a worse defect than the one being fixed: only while this
  // surface is genuinely UNBORN (`unbornRef.current`), only when the ADDRESS
  // asked for it, and only ONCE per mount (the ref latch — an effect with empty
  // deps still re-runs under StrictMode's double-invoke, and `birthWith` on an
  // already-born surface would be a second row).
```

## PageEditor §23

From `apps/desktop/src/pages/PageEditor.tsx`, line 1189 at `4d6af3d9` (the comment that stays: "Journal furniture (ink, capture items) is gated on the page's ORIGIN, not the mode alone: a null-origin row (older pages) reads as journal-equivalent, and only an explicit 'project' | 'loose' origin suppresses it. The forward lock is not furniture: it belongs to Free Write the posture, so it mounts on every page's Free Write rail (ForwardOnlyEditor's `forwardLock` was never origin-gated).").

```ts
  // AB3 S4 — Journal furniture (ink/capture items) stays conditional on the
  // page's ORIGIN, not the editor's Free-Write MODE alone: a project- or
  // loose-origin page in Free Write mode gets none of it — only a
  // journal-origin page does. Canon amendment A2 (the grandfather clause): a
  // null-origin row (every page that existed before this ticket) behaves
  // EXACTLY as today, where mode alone decided it — so null reads as
  // "journal-equivalent" here, and only an EXPLICIT non-journal origin
  // ('project' | 'loose') suppresses the furniture.
  //
  // FX1 S3 (Nick's first-sitting verdict, provisional canon note) — the
  // forward lock SPLITS off this gate: it belongs to Free Write the
  // POSTURE, not the Journal the PLACE, so it now mounts on every page's
  // Free Write rail regardless of origin. Ink and capture items are
  // unchanged — still journal furniture, still origin-gated. This amends
  // Law 2's furniture list in practice (forward lock is mode furniture, not
  // journal furniture) pending Nick's feel-test and the committee pass's
  // formal canon-doc amendment; the canon doc itself is untouched this
  // ticket. The MECHANIC (ForwardOnlyEditor's `forwardLock` prop below) was
  // never origin-gated — only this rail control was — so no change was
  // needed there for loose/project pages to actually strike/erase per the
  // persisted setting.
```

## PageEditor §24

From `apps/desktop/src/pages/PageEditor.tsx`, line 1212 at `4d6af3d9` (the comment that stays: "the one funnel for this page's page_settings, mirroring CascadePanels' PageSetupZone.patch exactly, including its `?? PAGE_SETTINGS_FALLBACK` base: one merge policy per jsonb column, and the values written are the ones the app already renders").

```ts
  // ITEM 114 (item 83 errata E4) — the one funnel for this page's own
  // page_settings, mirroring CascadePanels.tsx's PageSetupZone.patch EXACTLY,
  // including its `?? PAGE_SETTINGS_FALLBACK` base. That base materialises the
  // app's own current dress onto a page that had none, which is a real write —
  // and it is the established policy for this column, chosen there and reused
  // here rather than invented a second time. A second merge policy on one jsonb
  // column is how two writers of the same field drift apart; the values written
  // are the ones the app already renders, so nothing about the page changes but
  // its row.
```

## PageEditor §25

From `apps/desktop/src/pages/PageEditor.tsx`, line 1226 at `4d6af3d9` (the comment that stays: ""Default": drop the page's own face; a page that never chose one is left as it is (no write)").

```ts
  // TOOLS #10 item 10 - "Default": drop the page's own face. A page that never chose one is left exactly as it is (no write).
```

## PageEditor §26

From `apps/desktop/src/pages/PageEditor.tsx`, line 1234 at `4d6af3d9` (the comment that stays: "the Type control's props, one funnel into page_settings: `size` reads through the page default and is written as points; a face is written whole. `scoped` gives the section its two scopes and the roster as a list (Draft only: Free Write and Revise carry no styling tools, so a pick there is the whole page's).").

```ts
  // ITEM 207 - the Type control's props, one funnel into the page's own page_settings (the same patch every page-level
  // choice uses). `size` reads through the default 11 and is written as the number of points; a face is written whole.
  // FONT-SPAN: `scoped` gives the section its two scopes and the roster as a list (Draft only: the mode with styling tools - Free Write
  // and Revise carry none by ruling, so they keep the face button, and a pick there is always the whole page's).
```

## PageEditor §27

From `apps/desktop/src/pages/PageEditor.tsx`, line 1241 at `4d6af3d9` (the comment that stays: "a page's default is 12 real points; cards keep 11").

```ts
// PAGE-SIZE (ruling a): a page's default is 12 real points; cards keep 11
```

## PageEditor §28

From `apps/desktop/src/pages/PageEditor.tsx`, line 1242 at `4d6af3d9` (the comment that stays: "`undefined` is "Default": the stored face is cleared (no stored face = the theme's default), after the same whole-page span clear a face pick does").

```ts
    // TOOLS #10 item 10: `undefined` is "Default" - the stored face is CLEARED (no stored face = the theme's default; that rule already existed), after the same whole-page span clear a face pick does.
```

## PageEditor §29

From `apps/desktop/src/pages/PageEditor.tsx`, line 1244 at `4d6af3d9` (the comment that stays: "the whole page's size: its spans' sizes go").

```ts
// POLISH #10 item 4: the whole page's size - its spans' sizes go
```

## PageEditor §30

From `apps/desktop/src/pages/PageEditor.tsx`, line 1296 at `4d6af3d9` (the comment that stays: "read through the default, never written at birth: a page that never chose has no `kind` key, reads 'normal', and stays byte-identical on disk").

```ts
            // ITEM 114 (item 83 errata E4) — READ THROUGH THE DEFAULT, never
            // written at birth. A page that has never chosen carries no `kind`
            // key at all, reads 'normal' here, and stays byte-identical on disk.
```

## PageEditor §31

From `apps/desktop/src/pages/PageEditor.tsx`, line 1307 at `4d6af3d9` (the comment that stays: "Revise's own drawer, and this branch is load-bearing: without it Revise fell to Draft's branch and got Draft's Structure control and format rail, live-looking but inert (`applyRailFormat` returns outside Draft). Its tenant is the Type control, full form; the drawer's standing furniture (goal block, instruments row) stays on every surface.").

```ts
        // ITEM 112-A — REVISE'S DESK DRAWER OPENS, AND IT OPENS ONTO NOTHING.
        //
        // Nick's ruling (2026-09-02): both grips are visible from 112-A and both
        // OPEN their tabs, even onto an empty drawer — an empty drawer opens, so
        // it is not a locked door and G3's absence-over-grayed does not govern
        // it. The mirror is visually complete now; 112-C fills this drawer with
        // 83's Type section.
        //
        // THIS BRANCH IS NEW AND IT IS LOAD-BEARING. Before it, this was a
        // two-branch ternary and Revise fell down the `else` — inheriting Draft's
        // Structure control and Draft's format rail. Worse than mere tenant
        // leakage (§6): `applyRailFormat` guards on `mode !== 'drafting'` and
        // returns, so those controls would have rendered LIVE-LOOKING AND INERT,
        // which is precisely the locked door wearing paint G3 forbids.
        //
        // MERGE NOTE (origin/main 1c8edd3, item 114 / errata E4): main added the
        // page-kind and style-guide pickers to the DRAFT branch above while this
        // ticket was in flight. They stay Draft's. They are not 83's Type section
        // (face and size, RV1-RV4) — that is still 112-C — and either way 112-A
        // ships NO tenants, so Revise's drawer stays empty of both.
        //
        // `kind: 'empty'` is the shape SliverToolsBody already answers with
        // `return null`. The drawer itself still opens and still carries the
        // sliver's OWN standing furniture — the goal block, the instruments row —
        // which belong to the drawer on every surface and are not Revise tenants.
        // Empty of TENANTS is what was ruled; empty of everything was not.
        // ITEM 207 - 112-A's empty Revise drawer takes its one tenant: the Type control, full form.
```

## PageEditor §32

From `apps/desktop/src/pages/PageEditor.tsx`, line 1448 at `4d6af3d9` (the comment that stays: "the framed (>=1100px) composition: the mode strip sits in this header row and the top-bar title retires (the Page face carries the title and where it lives, via describePageHome). "Done alone" means no title and no Catch, never no doorways: the Pages/Plan toggle stays beside Done, as on ScriptEditor's framed header.").

```ts
  // CD1 S1 — the framed (>=1100px) composition. The mode strip moves up
  // into this header row (left-set, engraved register via its own CSS);
  // the top-bar title retires (the crumb/breadcrumb it duplicated — the
  // Page face already carries the same title + "where it lives" chain via
  // describePageHome, S3). "Copy page text" already left top chrome
  // entirely in AB1/AB2 (S4) — its future home is a later ticket's Publish
  // surface.
  //
  // cd1.1 (Fable review erratum) — S1's brief read "Done alone" as scrapping
  // the Pages/Plan toggle too; that was Fable's own defect, not the build's.
  // "Done alone" meant no title and no Catch, never no doorways — the
  // toggle belongs beside Done here (and on ScriptEditor's own framed
  // header, which never had one before this ticket).
```

## PageEditor §33

From `apps/desktop/src/pages/PageEditor.tsx`, line 1466 at `4d6af3d9` (the comment that stays: "the address: crumb (marginRight:auto) · strip · actions, the shape the Board uses").

```ts
            {/* PW1 S6 (Nick, Q7) — THE ADDRESS COMES BACK, in the shape the
                Board already proved: crumb (marginRight:auto) · strip ·
                actions. CD1 S1's own reasoning for removing it is quoted in
                LocationCrumb.tsx and stands as reasoning; Nick's hardware
                falsified the trade it bought, and Q7 returns it. A ruled trade
                overtaken by evidence, not a defect.

                This ALSO gives item 121's own I3 note its missing landmark:
                the note below says R15 seats the INK switch "beside the
                location line" and that "the framed band has none." It has one
                again — and the switch keeps its ported position RELATIVE to
                the strip, which is what actually ported. */}
```

## PageEditor §34

From `apps/desktop/src/pages/PageEditor.tsx`, line 1528 at `4d6af3d9` (the comment that stays: "The Tutor is absent while the first-run gate holds (first run stays pure), not veiled-but-mounted: the veil's filter:blur would make a new containing block and break the Tutor's two absolute anchors (they need .desk-frame-stage). Otherwise the right hand mounts from first paint, unborn pages included, as BoardEditor, ScriptEditor and JournalEntry do; `entry` already carries the minted per-surface id (UnbornProvider registers it before children render), and Tutor.send() refuses on an unborn surface.").

```ts
          // TU1 non-goal, verbatim: "the Tutor on the threshold (first-run
          // stays pure)" — absent outright while the gate holds, not merely
          // veiled-but-mounted like the sliver above. This also sidesteps a
          // real geometry hazard FirstRunVeil's own wrapper would otherwise
          // create: `.hb1-veil[data-veiled='true']`'s `filter:blur(4px)`
          // establishes a NEW containing block for `position:absolute`
          // descendants (per the CSS spec, same as `transform` would), which
          // would silently break the Tutor's two anchors' percentage math
          // (they need `.desk-frame-stage` as their containing block, per
          // Tutor.tsx's own header comment) — Sliver never hits this because
          // DeskFrame.tsx provides ITS anchor div outside the veil; the
          // Tutor provides its own anchors internally, so a veil wrapper
          // here would swallow them both.
          // E4 — THE RIGHT HAND MOUNTS FROM FIRST PAINT. `|| unborn` is gone.
          // Nick's mirrored-hands ruling is the authority: an unborn page IS "a
          // Page on which the User does any kind of writing", so both hands
          // mount. The EXISTENCE PROOF is already in the tree — BoardEditor
          // (:2428), ScriptEditor (:1112) and JournalEntry (:1174) all mount
          // this panel unconditionally, unborn boards included; only this line
          // gated it, and only on pages. The left hand was never gated this way
          // either: it renders while gated and is merely VEILED (see `sliver`
          // above). Measured symptom, pre-fix: `.wz-tutor-zone` count 0 on a new
          // page, unmoved by forced re-renders, appearing only at BIRTH.
          //
          // IDENTITY IS ALREADY REAL, NOT `MISSING_ENTRY`. `UnbornProvider`
          // registers a record in persistence's unborn slot before children
          // render, and `getJournalEntry` falls through to it, so `entry` here
          // carries the MINTED PER-SURFACE id — verified by measurement, not by
          // reading: the row a Tutor send used to create was stamped with that
          // very id. `MISSING_ENTRY` cannot reach this line at all; the
          // vanished-page case returns at the dispatcher (`PageEditor()`) one
          // level up, before this view ever mounts.
          //
          // `gateActive` STAYS, for both of its recorded reasons above (TU1's
          // "first-run stays pure" non-goal, and the FirstRunVeil blur that
          // would establish a containing block and break the Tutor's own two
          // absolute anchors). That gate is the one-time first-run ceremony,
          // not "first load" — it is not what this ticket is about.
          //
          // Tutor.send() refuses out loud on an unborn surface (see its own
          // comment): un-gating here without that would have spread a live
          // PB1 violation from boards to pages.
```

## PageEditor §35

From `apps/desktop/src/pages/PageEditor.tsx`, line 1653 at `4d6af3d9` (the comment that stays: "the Workshop tab is hidden until built").

```ts
            // Workshop tab hidden until built (Nick, Oct 23 11:01 am).
```

## PageEditor §36

From `apps/desktop/src/pages/PageEditor.tsx`, line 1672 at `4d6af3d9` (the comment that stays: "the noun is cut: name the act, not the object ("pages text" is not English)").

```ts
          {/* ITEM word-diet (Nick, review fix, Oct 13) — "page text" was a
              normal singular-noun-as-modifier compound; "pages text" isn't
              standard English. Cut the noun (name the act, not the object). */}
```

## PageEditor §37

From `apps/desktop/src/pages/PageEditor.tsx`, line 1738 at `4d6af3d9` (the comment that stays: "/page/new, the unborn surface: a door that opens a blank surface creates no row; it lands here carrying what it meant as query params (the address is reload-safe by construction). The dispatch is the same as /page/:id's, reading the same getJournalEntry, which resolves the unborn slot. There is no unborn script surface: choosing Screenplay births, so a script page has a row by the time ScriptEditor mounts.").

```ts
// PB1 (item 71) — /page/new, the unborn surface. A door that opens a blank
// surface no longer creates a row; it lands here carrying what it MEANT as
// query params (Fable's ruling 1: the descriptor goes in the address, which is
// reload-safe by construction — reload re-reads the URL and the door's meaning
// survives with no storage and no fallback rule to invent).
//
// The dispatch below is the SAME dispatch as /page/:id above, reading the same
// getJournalEntry — which resolves the unborn slot while the surface is
// unborn, so neither editor needed a second code path to mount. There is no
// unborn SCRIPT surface: choosing Screenplay births (the ruled amendment to
// ruling 2, see requestScreenplay above), so a script page always has a row by
// the time ScriptEditor mounts.
```

## PageEditor §38

From `apps/desktop/src/pages/PageEditor.tsx`, line 1754 at `4d6af3d9` (the comment that stays: "The row outranks the door once it exists: `birthWith` corrects the address with history.replaceState on purpose (a navigate() would unmount mid-keystroke), which never notifies HashRouter, so the descriptor alone would keep a born screenplay row on PageEditorView. The door's intent decides only while there is no row. A prose row has no pageType, so it keeps the same PageEditorView and key: no remount, no dropped keystroke.").

```ts
        // ITEM 104 — THE ROOM OUTRANKS THE DOOR, ONCE THE ROOM EXISTS.
        //
        // This dispatch used to read `descriptor.kind` and nothing else, and
        // that single fact produced every symptom Nick reported: Screenplay
        // selection "dead" on an unborn page, from the New Page template icon
        // AND from the Draft panel's Structure toggle.
        //
        // Neither control was dead. `requestScreenplay` births a real
        // `pageType: 'script'` row (Nick's own refinement: the kind SAVES), and
        // `birthWith` then corrects the address with `history.replaceState` ON
        // PURPOSE — a real `navigate()` there unmounts the surface mid-keystroke
        // and drops a typing burst, which PB1's burst-integrity check caught
        // once already. But `replaceState` never notifies HashRouter, so no
        // route change occurs and THIS callback kept re-rendering
        // `PageEditorView`, because the descriptor said `prose` and always
        // would. The row was a screenplay; the surface was not. F5 re-read
        // `#/page/<id>`, landed on the BORN route below — which has always
        // dispatched on the ROW — and mounted ScriptEditor correctly. That
        // asymmetry is exactly what Nick measured.
        //
        // So the door's intent decides only while there is nothing else to ask.
        // The moment a row exists it is the authority on what this page IS,
        // which is the same rule `PageEditor` above has always followed.
        //
        // Prose birth is deliberately untouched by this: a prose row has no
        // `pageType`, so it still falls through to the SAME `PageEditorView`
        // with the SAME key — no remount, no lost focus, not one dropped
        // keystroke. The burst-integrity property `replaceState` exists to
        // protect is preserved exactly; only a genuine change of document KIND
        // swaps the surface, which is precisely when a swap is what the writer
        // asked for.
```
