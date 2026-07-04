# OPS — Canon refresh (docs only) — build brief

**Branch:** `docs-canon-refresh` — created FIRST. Off `main`. Docs only: zero app
code, zero deploy dependency, merges independently of both hardware gates.
**Why:** Finding 6 of the July review — stale canon quietly steers the
committees and CC. `north-star.md` is v0.1 (pre-Wrizo, an M1 built around the
deleted SessionLauncher) and `AGENTS.md` carries the same dead stage goal.

## Slices

### Slice 1 — `docs/north-star.md` → v0.2
Rewrite to match the shipped product. Must contain, tersely:
- The promise (keep): a writing studio that keeps you moving; it does not
  write for you.
- The wedge: the writing app that gets you writing and can't be fidgeted with.
- The architecture as-built: Two Minds (Middle Door / Trellis); Drawers →
  Binders → Pages on the fragment substrate; modes (Free write / Draft live;
  Format / Workshop future); forward-only runway; chrome dissolve; the gate.
- The north-star metric: TTFK — time to first keystroke — with the F-arc as
  its first optimization pass.
- The ink canon (2026-07-03): ink sealed in the Journal; Pages are the
  typewriter; ink reaches projects only by porting (INK arc I0–I3).
- Domain lives on the binder (type × kind), never as an app mode.

### Slice 2 — `AGENTS.md` stage goal
Replace the SessionLauncher-era Stage-1 goal with the current reality: the
F-arc ("from open to flow") complete in code; next queue = HOME verification,
anti-slop paste rail, fragments-under-Pages (with INK I3 married to it).
Committee roster and double-pass protocol: unchanged.

### Slice 3 — `PHILOSOPHY.md` addition
Add the founder's line VERBATIM as a section epigraph:
"I want this app to simulate the experience of a writer with a journal and
typewriter and drawing pad in front of them with as much integrity as
possible." — then two or three sentences connecting it to the ink canon and
the sealed-AI frame. Do not paraphrase the quote.

## Non-goals
`docs/state-of-wrizo-2026-07.md` (Rev 3 is the chat lead's, written after the
deploy with the first TTFK numbers); any brief edits; any app code; backlog
restructuring.

## Definition of done
1. All three docs read true against the working tree (spot-check names/routes
   against code, not memory).
2. No app code touched (`git --no-pager diff --stat` shows docs only).
3. Logged to `docs/backlog.md`; merged to `main` without waiting on any gate.
