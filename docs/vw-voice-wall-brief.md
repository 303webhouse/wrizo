# VW — The Voice Wall (anti-slop paste rail) — build brief

**Branch:** `vw-voice-wall` — created FIRST, before the first edit. Off `main`.
**Merge condition (hard):** do NOT merge to `main` until Nick's phone
verification of the currently deployed stack (F2–F6 + I0 Slice 2) returns a
verdict. Build and verify on the branch; merge after his word.
**Deploy note:** no hardware gate of its own — input-layer work, fully
harness-verifiable (the pen path is untouched).
**Arc:** standalone identity ticket · queue item 2 of the July review
**Canon:** `PHILOSOPHY.md` → "The Voice Wall" (the settled design) +
`north-star.md` v0.2 · Written 2026-07-04

## Why

The wall was never about paste — it is about WHOSE VOICE. External prose
pasted into a generative surface imports a foreign voice (the same reason
AI-ghostwriting is out); the writer's own work flowing in, and finished work
flowing out, is always permitted. Discovered during the I0 review: the wall is
PARTIALLY BUILT — `ForwardOnlyEditor` already blocks `insertFromPaste` /
`insertFromDrop` with the comment "foreign-voice wall." This ticket completes
the wall and, critically, builds its DOOR.

Framing that governs every copy decision below (Principle 8): **importing is
an edge activity.** Paste is blocked mid-flow not as punishment but because
decisions live at edges, never the middle. The block protects flow; the
Import door serves migration.

## Slices

### Slice 1 — close the prose surfaces
- Verify + keep the existing ForwardOnlyEditor block (covers sprint, pages in
  both modes, the gate).
- Add the same `beforeinput` block (`insertFromPaste`, `insertFromDrop`) to
  the Journal's `.entry-edit` path (J10) if absent. Verify drop events and
  context-menu paste route through `beforeinput` on both surfaces; close any
  path that bypasses it.
- The whisper: when a paste is blocked on a prose surface, one calm inline
  line — "Outside text stays outside — Import it from your binder if it's
  yours." — auto-fading, non-modal, at most ONCE per session. Never a scold,
  never a modal, never red (Principle 5). After the one whisper: silent.
- Metadata inputs are NOT prose: titles, rename fields, search, the create
  form keep normal paste. The wall guards voice, not clipboards.

### Slice 2 — copy-out is sacred (verification)
- Selection + copy must work on every prose surface in both modes (confirm
  nothing in the forward-only guards preventDefaults `copy` or selection of
  committed text).
- Add a quiet "Copy page text" action to the PageEditor / JournalEntry
  overflow so mobile writers aren't fighting long-press selection for a full
  page. Copies derived clean text (struck runs excluded — the clean-save
  invariant's public face).

### Slice 3 — the door: Import a draft
- Entry points: a quiet "Import a draft" action on ProjectHome (binder level)
  and in the Drawers view. Deliberately NOT on the Desk and NOT inside any
  editor — the door lives at the edge.
- Flow: a plain paste surface (a textarea — intentionally non-generative, no
  forward-only, no modes) → land as: a MANUSCRIPT page or a SUPPORT page
  (research / note), writer's choice → `createBinderPage` with the chosen
  pageType, text set, and provenance stamped.
- Provenance: one boot-idempotent column on `journal_entries` —
  `imported_at text` — mirrored through BOTH sync mappers per the checklist
  (rowToEntry + upsert). Client type gains `importedAt?: string`. The page
  header/crumb shows a quiet "Imported" tag. The stamp is metadata only — no
  behavior hangs off it yet (Workshop/publishing honesty later).
- Generosity is the point: a writer migrating a half-finished novel is the
  writer's own voice flowing in. v1 = one page per import, any length.

## Non-goals (later)
Chapter-splitting long imports; file-upload import (paste only in v1);
provenance ENFORCEMENT of any kind; Workshop rules; clipboard inspection or
origin heuristics (unknowable on the web — the design doesn't need them);
any change to the pen/ink layer.

## Invariants
- No failure states: the whisper informs once, then the wall is silent.
- No surface accepts text the writer didn't type — EXCEPT the Import door,
  which exists precisely so that rule can hold everywhere else.
- Copy-out unrestricted, everywhere, always.
- One-home rule untouched; forward-only untouched; clean-save untouched
  (imported text enters as plain committed text, no struck runs).
- Sync checklist: `imported_at` in push AND pull mappers; live round-trip
  after this eventually deploys.

## Definition of done (in-harness)
1. Paste + drop blocked on: Free write, Draft, the journal editable, the
   gate's editor — each shows the whisper once per session, then silence.
2. Titles / rename / search / create form paste normally.
3. Copy-out verified on every prose surface; "Copy page text" yields derived
   clean text (struck runs excluded).
4. Import → manuscript page and Import → support page both land with
   `importedAt` set, the "Imported" tag visible, and the page behaving as a
   normal page thereafter (modes, filing, resume card all correct).
5. `imported_at` round-trips through push AND pull in the harness.
6. `tsc` (desktop + server) + `build:web` + selftest green; CDP checks 1–4.
7. Merge to `main` ONLY after Nick's stack verdict; deploys with the next
   `railway up` thereafter.

## Working environment
- Branch `vw-voice-wall` FIRST, before the first edit.
- PowerShell edits via `[System.IO.File]::ReadAllText/WriteAllText`, UTF-8 no
  BOM; `git --no-pager` always. Log the shipped ticket to `docs/backlog.md`.
