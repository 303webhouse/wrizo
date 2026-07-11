# VW — The Voice Wall (anti-slop paste rail) — build brief · v2

**v2 note:** adds Slice 4 (the own-ink clipboard shadow — REQUIRED pre-merge,
from the Fable review of the v1 build) and updates the merge condition.
Replace the entire contents of `docs/vw-voice-wall-brief.md` with this file.

**Branch:** `vw-voice-wall` (exists, built through Slice 3 — unpushed).
FIRST action this pass: `git --no-pager push -u origin vw-voice-wall`
(report = push), then build Slice 4 on it.
**Merge condition (updated):** the v1 gate ("Nick's stack verdict") is
functionally satisfied — the deployed stack has been Nick's daily driver
since early July; his J2 S25 pass carries the formal word. Merge after
Slice 4 lands AND the Fable review of the pushed branch returns green.
**Deploy note:** no hardware gate — input-layer, harness-verifiable.
**Canon:** `PHILOSOPHY.md` → "The Voice Wall" · `north-star.md` v0.2 · 2026-07-10

## Why

The wall is about WHOSE VOICE, never about clipboards. Slices 1–3 (built)
close the prose surfaces, keep copy-out sacred, and open the Import door.
Slice 4 closes the one hole the v1 build opened: with paste blocked and cut
free in Draft, a writer can cut a paragraph of their OWN prose and never put
it back — reorganizing a revision, the core act of Draft mode, would require
retyping. That walls the writer's own voice, which is precisely what the Wall
promises never to do.

## Slices 1–3 — BUILT (v1, verified by CC's 16-check run; Fable review pending push)
1. Prose surfaces closed: `beforeinput` blocks `insertFromPaste`/`insertFromDrop`
   on Free write, Draft, the journal editable, and the gate — with the
   once-per-session whisper ("Outside text stays outside — Import it from
   your binder if it's yours"), calm, auto-fading, never modal. Metadata
   inputs (titles, rename, search, create form) paste normally.
2. Copy-out sacred: selection/copy never blocked; "Copy page text" on
   PageEditor + JournalEntry copies derived clean text (struck runs excluded).
3. The Import door: `ImportDraft` (plain non-generative textarea → Manuscript /
   Research / Note) from ProjectHome + Drawers; `journal_entries.imported_at`
   boot-idempotent through both sync mappers; quiet "Imported" crumb tag;
   imported pages behave as normal pages.

## Slice 4 — the own-ink clipboard shadow (NEW, required pre-merge)

The writer's own words, cut or copied from inside the app THIS SESSION, pass
back through the wall silently. Foreign text still walls.

- **Recording:** in `store/voiceWall.ts`, a session-scoped in-memory shadow
  (one slot, last-wins — no history, never persisted). Populate it from:
  (a) a capture-phase document `copy`/`cut` listener that records
  `String(document.getSelection())` WHEN the selection lies within a prose
  surface (the same surface set Slice 1 guards); (b) the "Copy page text"
  action records its exact payload.
- **The gate check:** in the Slice-1 paste-block path, read the incoming
  clipboard text (`event.dataTransfer?.getData('text/plain')` per the
  beforeinput spec, with the `event.data` fallback). ALLOW when it equals the
  shadow — exact match, or both-sides-trimmed match to survive editor edge
  whitespace. No whisper on an allowed paste.
- **Mode semantics on allow:**
  - Draft (free editing): simply do not preventDefault — the browser paste
    proceeds.
  - Free write / journal (forward-only): preventDefault and route the text
    through the EXISTING append path (the same seam typed input uses), so
    the paste lands at the end like everything else. Forward-only's law —
    text enters at the runway's tip — is not suspended for own ink.
- **Drop:** the same shadow check applies to `insertFromDrop` in Draft
  (drag-moving your own selected paragraph is the same gesture).
- The whisper copy stays as-is; a blocked FOREIGN paste after an allowed own
  paste still whispers if the session hasn't yet.

## Non-goals (logged)
Cross-session or cross-device shadow (in-memory only, by design — provenance
beyond the live session is unknowable and Import is the door for it);
multi-item clipboard history; chapter-splitting imports; file-upload import;
provenance enforcement; any pen/ink change.

## Invariants
- No surface accepts text the writer didn't type — the shadow is not an
  exception to this rule, it is its proof: shadowed text IS text the writer
  typed, returning.
- Forward-only semantics hold even for allowed pastes (append-at-tip).
- Copy-out unrestricted, everywhere, always. One-home, clean-save: untouched.
- The shadow never persists, never syncs, never logs its contents.

## Definition of done (in-harness; v1 checks 1–16 must still pass)
17. Draft: select a paragraph → cut → click elsewhere in the page → paste →
    the paragraph lands byte-identical; no whisper.
18. Copy on page A (prose) → paste on page B (Draft) same session → allowed.
19. Free write: copy own sentence → paste → text APPENDS at the runway tip
    (forward-only preserved), byte-identical; no whisper.
20. Foreign text (harness-injected clipboard content that never transited a
    prose copy/cut) → still blocked + whisper fires (session-fresh fixture).
21. Trimmed-equality tolerance works; near-miss text (one char off) blocks.
22. Reload clears the shadow (paste of pre-reload own text blocks — the
    session boundary is real).
23. `tsc` (desktop + server) + `build:web` + selftest green.

## Working environment
- Push the existing branch FIRST (report = push), then Slice 4 on it.
- PowerShell edits via `[System.IO.File]::ReadAllText/WriteAllText`, UTF-8 no
  BOM; `git --no-pager` always. Log the shipped ticket to `docs/backlog.md`.
