# Rulings: `apps/desktop/src/components/ForwardOnlyEditor.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[ForwardOnlyEditor §n]` points here.

## ForwardOnlyEditor §1

From `apps/desktop/src/components/ForwardOnlyEditor.tsx`, line 173 at `ded4321b` (the comment that stays: "what the writer types, pastes or composes is literal: its formatting characters are escaped (escapeTyped); the rail's own insertion is a tool and calls handleInput directly").

```ts
  // TYPED-LITERAL (Nick, Oct 16): what the writer TYPES (or pastes, or composes) on the runway is literal - its formatting characters
  // escaped for where they land on the page's text (store/hiddenMarks.ts escapeTyped). The rail's own insertion (insertMarkerRef) is a
  // tool, not typing, and keeps calling handleInput directly.
```

## ForwardOnlyEditor §2

From `apps/desktop/src/components/ForwardOnlyEditor.tsx`, line 450 at `ded4321b` (the comment that stays: "the lens's own keys (Tab, Shift+Tab, Enter) come first and once; a handled key is the lens's and nothing after it sees it (otherwise one Enter is done twice)").

```ts
        // PAGE TEMPLATES - the lens's own keys (the Outline's Tab / Shift+Tab / Enter) come FIRST, here, and once. They used to be tried in onFormatKeyDraft below, AFTER this listener's marks.enter had
        // already done the Enter itself - so one Enter was done twice (ledger 92, X7: a blank line, and the next row without its tab). A handled key is the lens's; nothing after it sees it.
```

## ForwardOnlyEditor §3

From `apps/desktop/src/components/ForwardOnlyEditor.tsx`, line 571 at `ded4321b` (the comment that stays: "copy-out writes the derived text's characters and markup; struck letters are history, not prose, so they are left out").

```ts
    // IN-APP-COPY-FORMAT: copy-out writes the plain characters and Wrizo's markup of the DERIVED text - the struck letters are history, not
    // prose, so they are left out of both (Q3, Nick, Oct 16), as Copy My Words leaves them out.
```

## ForwardOnlyEditor §4

From `apps/desktop/src/components/ForwardOnlyEditor.tsx`, line 625 at `ded4321b` (the comment that stays: "pen discipline: the stylus is inert on this non-Journal surface - a capture-phase pen-only preventDefault plus touch-action:none and the handwriting opt-out; finger, mouse and keyboard are never intercepted").

```ts
  // I0 — pen discipline. Ink is SEALED IN THE JOURNAL; the ForwardOnlyEditor is a
  // NON-Journal surface (the sprint, the page in BOTH modes, the gate), so the
  // stylus must be INERT here: zero characters, zero OS handwriting recognition,
  // metaphor-coherent (typewriters ignore pens). Two mechanisms, the proven J10
  // pattern used to NEUTRALIZE rather than ink:
  //   (a) capture-phase pen-only pointer preventDefault — no caret, no default, so
  //       recognition never initiates from the pointer;
  //   (b) touch-action:none + the declarative handwriting opt-out — Chromium routes
  //       handwriting through touch-action (pointer preventDefault alone doesn't
  //       stop it), so `none` is what actually seals it.
  // Finger / mouse / keyboard are never intercepted (pen-only guard), so their
  // behavior is unchanged apart from touch-action (finger-drag over the editor no
  // longer pans — the same tradeoff the shipped Journal sheet already makes; the
  // scroll container `.mode-scroll` still owns finger scroll). Verified on hardware
  // (Nick's phone) before deploy — this bug class is hardware-invisible.
```

## ForwardOnlyEditor §5

From `apps/desktop/src/components/ForwardOnlyEditor.tsx`, line 693 at `ded4321b` (the comment that stays: "the re-anchor below leaves a caret the writer just moved (a press, a navigation or select-all key) where they put it, until the next insert clears the note").

```ts
  // BUG-LIST #33 (ledger 168): the re-anchor below ran after EVERY render, so a caret the writer had just moved (Ctrl+Home, a click, an arrow run) was put
  // back at the end by the next render - the save round-trip, ~1.5 s after the last keystroke. The writer's own move is noted here (a press in the host, or
  // a navigation / select-all key) and cleared by the next insert (handleInput - the one funnel every text path ends in, so it is cleared BEFORE the render that insert
  // causes; a listener of its own on beforeinput / paste / compositionend runs after the editor's handler, whose setState has by then re-rendered); while it stands, a
  // selection that is still valid inside the host is left where the writer put it. Typing is unchanged: the model appends at the tip whatever the caret does.
```

## ForwardOnlyEditor §6

From `apps/desktop/src/components/ForwardOnlyEditor.tsx`, line 752 at `ded4321b` (the comment that stays: "the hint never covers text: on the framed prose page it is portalled onto the page's foot (or just below the writing line when zoomed); measured before paint").

```ts
  // POLISH #10 item 2 (Nick, Oct 25) - THE HINT NEVER COVERS TEXT. Pinned 8px above this editor's bottom, it sat on the LAST line wherever the text filled
  // the box - the writing line itself. On the framed prose page it now goes ONTO THE PAGE (a portal into .mode-page, in the page's own layout px): at the
  // page's foot - its bottom margin, where text never runs - in the normal view, and in the zoom (whose foot is off the stage) just below the writing
  // line, inside the band's lower fade. In Free Write the caret is always at the end, so nothing is below it to cover. Elsewhere (no framed page) it
  // keeps its old place. Measured before paint, so the old place is never drawn.
```

## ForwardOnlyEditor §7

From `apps/desktop/src/components/ForwardOnlyEditor.tsx`, line 825 at `ded4321b` (the comment that stays: "the browser's spelling squiggle in Revise only: in Free Write and Draft it would nag generative writing").

```ts
        // REVISE SPELLING — the browser's own red squiggle, in Revise ONLY (Nick:
        // "Red squiggles for typos/misspellings ... only when the User is in Revise
        // mode"). Free Write is forward-only drafting where a squiggle is a nag and
        // Draft is still generative, so both stay off, as does every other host of
        // this editor (HomeFlow's gate never passes a mode; QuickSprint cannot reach
        // 'revise'). The squiggle is the browser's, so nothing here draws it; the
        // attribute IS the whole of this change, and the harness asserts it by mode.
```
