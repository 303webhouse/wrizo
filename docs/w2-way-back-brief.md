# W2 — the way back (build brief)

**Branch:** `w2-way-back` · off post-W1 `main`
**Authorized by:** `docs/page-primacy-canon.md` (build on Nick's ratification,
not before). One ticket; Fable reviews the pushed branch before merge.

## Why

The page-primacy ruling: navigation is honest, but every departure from a
live writing session must offer a stateful one-tap return. Today, tapping a
DeskRail destination from an open page unmounts the editor and the way back
is the browser's back button — invisible, and blind to scroll/caret/mode.
W2 makes return a first-class, visible, faithful act. Filing-without-leaving
already exists (J5); this is the other half.

## Scope (slices)

- **S0 — verify current loss.** Harness-record what today's back-navigation
  actually restores on each writing surface (text page, Journal authored
  page, board, script): route yes, scroll/caret no. Pin the baseline.
- **S1 — session capture.** On departing a writing surface (route change
  away while a session is live), capture `{ entryId, route, scrollY, caret
  (text surfaces), mode, capturedAt }` to `sessionStorage`
  (`wrizo-way-back`, one slot — last writing session wins). Text surfaces
  (PageEditor text delegate, QuickSprint, JournalEntry authored) capture
  caret + scroll; board/script capture route + mount only in v1 — their
  internal state already persists through their own stores. Session-scoped
  by design: a way back is a live thread, not a bookmark. Zero schema.
- **S2 — the return chip.** A quiet ember chip in the DeskRail's top slot
  (the ChromeHandle dot's visual family): `↩` + the page's `firstLine(24)`.
  Renders on any non-writing route while a captured session exists; one tap
  navigates and restores via the F2 `warmStart` one-shot-state pattern
  (consume-and-clear — a refresh never replays it). Reaching the page by any
  other path (rail, list, pager) also consumes the slot if it lands on the
  same entry. Opening a *different* writing surface replaces the slot.
- **S3 — harness (`scripts/harness/w2.mjs`).** Leave a mid-scroll,
  mid-caret text session via the rail → chip present with correct label →
  tap → assert route, scrollY (±4px), caret offset, and mode all restored,
  and the editor's mount identity is fresh-but-equivalent (text
  byte-identical). Repeat route-restore-only for a board and a script page.
  Plus the rule's standing assertions: Add to… sheet open/close and assist
  rail collapse/expand leave the page bounding rect byte-identical
  (promotes W1's grid check to a permanent invariant).
- **S4 — the rule lands.** Merge the AGENTS.md PAGE IS PRIMARY text from
  the canon doc, verbatim, in this ticket.

## Non-goals

Overlay Drawers/Shelf/Library (trimmed to horizon). Metadata panels (below-
page is final). Plan-beside-page / reference peek (horizon, logged with
reasons). Multi-slot return history. Persisting the way back across app
restarts (sessionStorage is the point). Any schema or server change.

## Invariants

No new deps. Zero schema — `sessionStorage` only, one key. The chip is
navigation-surface chrome: it never renders on a writing surface and never
participates in the dissolve engine. Reuse `firstLine`, the F2 one-shot
pattern, and the ember dot's visual tokens — no new state mechanism, no new
visual vocabulary. Vocabulary: the chip's accessible name is "Return to the
page" (Journal-noun discipline holds; never "note"/"entry" user-facing).

## Definition of done

`tsc` (desktop + server) + `build:web` + selftest green; `w1.mjs` re-runs
green (the incentive row and grid are adjacent); `w2.mjs` committed and
green per the harness rule. Report = push; merge on Fable's review + Nick's
word; feel items (chip legibility at S25 thumb reach, restore "snap"
subtlety) join the consolidated hardware session. Nick's device verdict
closes the ticket.

— Fable
