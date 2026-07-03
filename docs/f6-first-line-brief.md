# F6 — The first-line invitation (opt-in) — build brief

**Branch:** `f6-first-line` — created FIRST, before the first edit. Off `main`
(F1–F5).
**Deploy note:** merges to `main` and joins the held arc-F deploy. Adds ONE line
to Nick's tablet checklist: the invitation's faintness/register on hardware.
**Arc:** F — "From open to flow" · ticket 6 of 6 · the arc's last tile
**Canon:** `docs/state-of-wrizo-2026-07.md` Rev 2 (Part IV, F6) · 2026-07-02
**Feel source:** the invitation idiom in
`apps/desktop/scratch/wrizo-f-arc-design-a2.html` (the Catch view's faint line)

## Why

The blank page is the other half of the funnel problem: the arc removed every
decision between the writer and the page, and F6 offers a hand once they're ON
it. One quiet prompt from the canonical pool, in the permission-giving register
— an invitation to push against, never text that writes itself. Canon gates it
behind a setting so it can never become noise; rather than orphan that setting
in infrastructure the app doesn't have, THE INVITATION INTRODUCES ITSELF:
consent is given in context, on the page, and withdrawing it is permanent.

## The model — three states, one pref

A localStorage pref (`wrizo-first-line-invite`, matching the mode-memory
pattern): `'off'` (default) | `'on'` | `'never'`.

- **off (default):** a truly empty page shows only an ultra-faint affordance —
  "invite a first line?" — where the invitation would sit. Tap → pref becomes
  `'on'` and the first prompt appears immediately. This is the setting,
  discovered exactly where it matters.
- **on:** every truly empty page opens with one prompt from the canonical
  25-prompt pool (Crimson italic, faint ink — the register of the feel source),
  plus a tiny quiet "don't offer again" beside it.
- **never:** nothing, ever again, on any page.

The first keystroke dismisses whatever is showing (affordance or invitation)
for that page — the pref is untouched; the writer's ink always wins the space.

## Slices

### Slice 1 — the shared piece
A small `useFirstLineInvite(isEmpty: () => boolean)` hook + one component:
reads the pref, renders the affordance/invitation/nothing, draws its prompt
from the SAME canonical pool the idle nudges use (import it — no new pool, no
duplicated strings), wires the three transitions (tap-affordance → 'on';
"don't offer again" → 'never'; first keystroke → dismiss-for-this-page via the
existing onForward/noteWrite seam — its FOURTH consumer).

### Slice 2 — the surfaces
- PageEditor: truly empty = `entry.text.length === 0`. The invitation renders
  in the sheet's content area as a render-only element ABOVE/OUTSIDE the
  editable DOM (the warm-start overlay pattern) — it must never be selectable,
  editable, or saved.
- Authored JournalEntry: truly empty = no text AND zero ink strokes. Same
  render-only placement. Read-only captures: nothing (the `enabled` gate).
- A fresh Catch page is the prime case and needs no special code — it IS a
  truly empty journal page.

### Slice 3 — nudge choreography
While the invitation (or affordance) is visible, SUPPRESS the idle-nudge timer
— no double prompting. The first keystroke clears the invitation and the
normal nudge cadence starts from that keystroke, exactly as today.

## Non-goals (later / other tickets)
Per-domain prompt flavors (waits on the templates work, with Format); any new
prompt pool or copy; a settings surface; server/schema/sync changes (the pref
is device-local by design — an invitation preference is not worth a sync
collection); anon-gate behavior (HOME pass).

## Invariants
- The invitation NEVER inserts text. Render-only, outside the editable DOM,
  never serialized — saved bytes identical whether it showed or not
  (harness-assert, same as warm-start).
- Default state adds ONE faint line to empty pages and nothing anywhere else;
  'never' is honored forever on that device.
- Register: permission-giving, no imperative "write about…" phrasing beyond
  what the canonical pool already says; Crimson italic faint for the
  invitation, Figtree tan-faint for the affordance and "don't offer again".
- Forward-only, honor-discard, autosave, warm-start: untouched. The dismiss
  rides the existing keystroke seam; no new listeners on the document.
- No schema, no server, no sync.

## Definition of done (in-harness)
1. Default pref: empty page shows the faint affordance only; non-empty pages
   show nothing; tap → prompt appears + pref `'on'` persists reload.
2. Pref 'on': a fresh Catch page opens with an invitation from the canonical
   pool; first keystroke dismisses it; saved text is byte-identical to a
   session where it never showed.
3. "Don't offer again" → pref `'never'` persists; nothing renders on any
   empty page thereafter.
4. Ink-only journal page (strokes, no text) counts as NOT empty — no
   invitation over ink.
5. Idle nudges are suppressed while the invitation/affordance is visible and
   resume normally after the first keystroke.
6. Read-only captures render nothing.
7. `tsc` (desktop + server) + `build:web` + selftest green; CDP checks 1–6.
8. Deploy: joins the held arc-F `railway up`; Nick's checklist gains the
   invitation-register line.

## Working environment
- Branch `f6-first-line` FIRST, before the first edit.
- PowerShell edits via `[System.IO.File]::ReadAllText/WriteAllText`, UTF-8 no
  BOM; `git --no-pager` always. Log the shipped ticket to `docs/backlog.md`.
