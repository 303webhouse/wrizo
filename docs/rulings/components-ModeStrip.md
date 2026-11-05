# Rulings: `apps/desktop/src/components/ModeStrip.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[ModeStrip §n]` points here.

## ModeStrip §1

From `apps/desktop/src/components/ModeStrip.tsx`, line 6 at `7f1c6a84` (the comment that stays: "the framed mode strip: Free Write, Draft and Revise are live; Workshop is hidden until built; Publish opens the stub dialog; freeWriteEnabled and reviseEnabled let the screenplay surface keep Draft as its only posture").

```ts
// AB1 S2 — the real unified mode strip, ratified exact strings (title case):
// Free Write · Draft · Revise · Workshop · Publish. Lives ABOVE the stage on
// every DeskFrame surface, including script (finding 5 dies here) — the
// three-tab ModeSwitcher.tsx it visually supersedes stays in the codebase
// unchanged for the surfaces DeskFrame doesn't yet own (QuickSprint, and
// every surface under the 1100px gate).
//
// ITEM 112-A — REVISE IS LIVE. Free Write, Draft and Revise are live
// EditorModes; Workshop is HIDDEN until built (Oct 23 - it used to flash "coming soon"), and Publish
// opens the same stub dialog PageEditor already ships. Revise takes THE STRIP'S
// EXISTING SWITCH BEHAVIOUR and no new gesture: it is `onSwitch('revise')`, the
// identical call Draft makes, so the doorway is the mode's only new thing about
// entering. `flashSoon` stays — Workshop still uses it, and so does the
// freeWriteEnabled=false path below.
//
// `freeWriteEnabled=false` lets the script surface keep Draft as its only live
// posture (script Free-write is AB2, per the existing "Draft law only" comment
// in ScriptEditor.tsx) while still showing all five strings, per S6's "strip
// present on every surface including script."
//
// ITEM 112-A — `reviseEnabled` is the EXACT SAME LEVER for the exact same
// reason, and it exists because standing Revise up would otherwise have made
// the screenplay's own strip lie. ScriptEditor mounts this component with a
// no-op `onSwitch`, so a newly-live Revise tab there would have rendered as a
// real posture and done NOTHING when pressed — worse than the deferred tab it
// replaced. Screenplay is Draft-only by its own law (S1), and 112-A charters
// Revise on the PROSE PAGE alone, so the script surface passes false and keeps
// flashing coming-soon for Revise exactly as it already does for Free Write.
// Default true: the prose Page, this ticket's own surface, needs no opt-in.
```

## ModeStrip §2

From `apps/desktop/src/components/ModeStrip.tsx`, line 64 at `7f1c6a84` (the comment that stays: "Workshop is absent until it is built, every theme's word for it with it; re-add the item here to bring it back").

```ts
    // Workshop is ABSENT until it is built (Nick, Oct 23 11:01 am) - every theme's word for it
    // (Workshop / Relay / Commune ...) goes with the tab; re-add the item here to bring it back.
```

## ModeStrip §3

From `apps/desktop/src/components/ModeStrip.tsx`, line 77 at `7f1c6a84` (the comment that stays: "data-mode-key is a behaviour-free contract marker: the labels are themeable, so an instrument binds to the key, not the word").

```ts
            /* ITEM 112-A — a CONTRACT MARKER, the same behaviour-free idiom
               Sliver.tsx's own `data-menus-dock`/`data-menus-handle` already
               establish, and here for the same reason: these labels come from
               useDeskLexicon and are THEMEABLE, so an acceptance instrument that
               bound to the word "Revise" would be testing a theme rather than the
               ruled invariant. Nothing styles this attribute. */
```

## ModeStrip §4

From `apps/desktop/src/components/ModeStrip.tsx`, line 92 at `7f1c6a84` (the comment that stays: "the "?" sits beside the tab, never inside it: a button inside a button is invalid and would switch modes on every press").

```ts
        // help-buttons (Nick approved Oct 12) — the "?" sits BESIDE the tab,
        // never inside it: role="tab" is a real <button>, and a <button>
        // nested inside a <button> is both invalid HTML and would fire the
        // tab's own onClick (switching mode) on every "?" press. A wrapper
        // span only for the two tabs that carry one, so the other three's
        // DOM shape is untouched.
```
