# I0 — Pen discipline (ink sealed in the Journal) — build brief

**Branch:** `i0-pen-discipline` — created FIRST, before the first edit. Off `main`.
**Deploy note:** joins the held arc-F `railway up` (or immediately after it).
Hardware gate for THIS ticket is NICK'S PHONE — the one gate item that needs no
tablet. No deploy of this branch before his phone pass.
**Arc:** INK — ticket 0 of 4 (I0 discipline · I1 render · I2 port · I3 unlink,
with I3 sequenced into the fragments-under-Pages design pass)
**Canon (new locked decision, 2026-07-03):** Ink is SEALED IN THE JOURNAL, the
way AI assist already is. The Journal is the drawing pad and diary; Pages are
the typewriter; ink reaches a project only by porting. On every non-Journal
writing surface the stylus must NEVER produce ink, characters, or OS
handwriting recognition. The app simulates a writer with a journal, a
typewriter, and a drawing pad in front of them — with integrity.

## Why (live defect on prod)

F1 (deployed) correctly lands typed pages in PageEditor — a surface with no
pen handling at all — so a stylus there falls through to browser/OS defaults:
the screen pans, or the OS converts strokes into a TEXT GUESS and injects it.
Injected recognition text violates forward-only, the anti-slop ethos, and the
new canon above. Separately UNVERIFIED: whether the Journal sheet's
capture-phase pen interception still beats Nick's phone's current browser
(an OS/browser update is a suspect — Nick reports ink failing "again").

## Slices

### Slice 1 — pen neutrality on non-ink surfaces
Target: ForwardOnlyEditor's host on every non-Journal surface (PageEditor in
BOTH modes, Drafting anywhere, the gate's editor). Behavior spec, in order of
preference:
- The pen produces ZERO characters and triggers ZERO OS handwriting UI. Hard
  requirement, no exceptions.
- A pen tap MAY place the caret IF that's achievable without enabling
  recognition; if not cleanly achievable, the pen is fully inert on these
  surfaces (metaphor-coherent: typewriters ignore pens). Choose per test
  results, don't force it.
- Finger, mouse, and keyboard behavior byte-identically unchanged.
Mechanism investigation order: (a) capture-phase pointer handling on the host
(`pointerType === 'pen'` → preventDefault on pointerdown/move — the Journal
sheet's proven pattern, used here to NEUTRALIZE rather than ink); (b) CSS
`touch-action` adjustments scoped to pen if (a) leaves pan artifacts;
(c) beforeinput filtering only as a last resort (recognition inserts are hard
to attribute — prefer stopping them at the pointer).

### Slice 2 — Journal sheet verification + hardening
On Nick's ACTUAL phone browser (he'll supply the failing URL, device, and
browser — treat that as slice input), verify the ink path end to end: pen on
an authored journal page draws ink, never pans, never triggers recognition.
If the current browser now beats the capture-phase interception, harden it:
earlier capture, `touch-action: none` scoped to pen interactions on the sheet,
pointer capture on pen-down — whatever the device demands. Document the
device/browser matrix in the report; this bug class is hardware-invisible by
definition, so the report must say what was tested ON, not just what passed.

### Slice 3 — regression guards
The IME composition path is sacred — mobile soft-keyboard typing byte-identical
before/after (the CDP composition tests must pass untouched). Finger scroll,
mouse selection, hardware keyboards: unchanged. Selftest green.

## Non-goals (the rest of the INK arc)
Ink RENDERING on pages (I1); the text-vs-text+ink porting prompt and the
"New project…" destination (I2); unlink-to-movable-graphic (I3 — designed WITH
the fragments-under-Pages pass, not before it); any Journal ink feature work;
"stylus connected" detection (the web has none — pen presence is per-event via
pointerType, which is what the spec above uses).

## Invariants
- No surface may EVER accept text the writer didn't type. Recognition-injected
  characters are a hard failure anywhere in the app.
- Forward-only, honor-discard, autosave, warm-start, invitation: untouched.
- No schema, no server, no sync. Pure input discipline.
- Journal ink data model untouched — strokes stay on the entry exactly as-is.

## Definition of done
1. On Nick's phone (the gate): pen on a chapter page → zero characters, zero
   handwriting UI, no unexpected pan; pen on a journal page → inks correctly.
2. In-harness: CDP-synthesized pen pointer events on PageEditor produce no
   input events reaching the model; composition/typing tests byte-identical;
   `tsc` (desktop + server) + `build:web` + selftest green.
3. The report names the exact device + browser versions verified.
4. Deploy only after Nick's phone pass; then it rides the next `railway up`.

## Working environment
- Branch `i0-pen-discipline` FIRST, before the first edit.
- PowerShell edits via `[System.IO.File]::ReadAllText/WriteAllText`, UTF-8 no
  BOM; `git --no-pager` always. Log the shipped ticket to `docs/backlog.md`.
