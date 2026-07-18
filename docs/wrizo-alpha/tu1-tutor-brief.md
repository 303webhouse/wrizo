# TU1 — the Tutor · build brief · 2026-07-18

**Branch:** tu1-tutor off main, own worktree per ONE CHECKOUT PER
AGENT.
**Authority:** the Tutor committee pass as ratified by Nick
(A12–A15, the composition line made LAW with his revisit note;
per-page threads in v1; Wall-first sequencing now discharged by
AB4). This is the arc's SECOND schema addition after `origin`.
**SCHEMA TICKET — NO MERGE PRE-AUTHORIZATION.** Build and push the
branch; report = push; Fable reviews ON THE BRANCH; the merge
happens only on Nick's explicit go. The S1 precedent's live prod
round-trip is REQUIRED after deploy.

## S0 — records first
Ledger: open TU1's item (this brief, schema flag restated). Item
27 takes the consolidation note: HB-arc stewardship returned to the
primary session 2026-07-18; hb1.2 briefed after Nick's sitting
(hammer-test result feeds severity; escalates to fold-class only on
Nick's word); the sitting list is consolidated across items 27/30/31.
Drop the `cd1.1 erratum WIP` stash — its hold condition (item 26's
close) cleared 2026-07-17. Commit this brief.

## S1 — the schema, declared loudly
One nullable `tutor` jsonb column on `journal_entries` — additive
only (`add column if not exists`, no default, no CHECK), matching
the `origin`/`script` precedent exactly, both sync-mapper
directions (rowToEntry / upsertEntry). It holds ONE thing: the
page's conversation thread — `{ messages: [{ id, role:
'writer'|'tutor', text, at }] }`. Nothing else is ever persisted:
lens results and nudges are DERIVED, recomputed on approach, never
stored (the sheet law's instinct applied to the Tutor's room).
Grandfather: null ⇔ undefined must be a fixed point through every
client mutation path and both mappers — a legacy page with no
thread behaves byte-identically to today. Types: `TutorThread` in
types/index.ts with a header comment carrying this paragraph's
reasoning.

## S2 — the room's geometry (the sliver, mirrored)
A grip at the paper's RIGHT edge — the FX2 clearance law mirrored:
persistent chrome never enters the text measure at any viewport.
Clamp the anchor's width to the actual paper-to-stage-right margin
in pure CSS (the `--frame-gap`/cancellation approach FX2 proved on
the left); below that margin it may dip into the paper's own right
padding, hard-capped at that depth. Opens a ~300px panel rightward;
the paper's rect never changes, any width; at narrow widths the
open panel overlays per the CD2 small-screen law. A15 whole: the
undocked panel dissolves on the first keystroke (the one vanishing
engine's keydown pattern, not a new one); a dock control with the
survey's exact grammar (dock survives typing; Escape / close /
explicit only; ~180ms, reduced-motion honored; the docked panel
compresses toward a 120px floor or the dock affordance is
unavailable below it). Nothing orange at rest; the grip and panel
chrome are quiet, olive only for open/active state.

## S3 — the lenses (programmatic, offline, private)
A quiet lens row, minimum options, all deterministic and fully
client-side (nothing leaves the device):
- **Consistency** — proper-noun harvest across the page's project;
  flag case variants and near-duplicates (edit distance ≤2) as
  observations ("Aria / Arya both appear"). Honest v1 simplicity.
- **Structure** — where this page sits: its home, its memberships
  (getBoardsPinning), its linked beat if any. Read-only, M1's
  coverage-never-verdicts.
- **Fragments** — the writer's own recent captures and starred
  pages sharing a tag with this page, resurfaced. Recency + tags
  only; say so plainly in the panel's own copy.

## S4 — nudges: letters, never calls
Templated observations keyed to real state (a starred page
untouched for days; a board with an empty region), written in the
Tutor's voice, DERIVED live on approach, rendered in the panel,
never stored, never pushed. A14 is absolute: no badge, toast,
count, dot, or interruption exists anywhere in this ticket — the
grip's rendering is identical whether letters wait or not.

## S5 — the conversation (the model, behind the rail)
Server: ONE new route (writer-initiated proxy; key server-side
only via env — `TUTOR_API_KEY` + provider/model config; never
client-side; no ambient calls, no retry loops, a hard per-request
token cap). Client: the open conversation in the panel, per-page
thread persisted via S1. **A13 mechanically and by register:** the
system prompt binds the Tutor to speak ABOUT the writing, never AS
it — reference atoms lawful, composition declined in character
with a question that sends the writer back to the page; the panel
renders NO insert/apply/copy-into-page affordance of any kind (the
future paste rail is the mechanical backstop; until then the
affordances simply do not exist). First open ever: the one-time
plain disclosure ("What you ask the Tutor travels to a language
model; your pages stay yours."), a local persisted flag, never
schema. Offline or unconfigured: the conversation says so in one
quiet line; the lenses work regardless.

## S6 — harness (tu1.mjs) + the bar
Geometry at 1100/1280/2200 (grip/text disjointness, paper-rect
invariance closed/open/docked — the clamp engages at the floor, so
the floor width is mandatory per FX2's own lesson); keystroke
dissolve + dock-survives-typing + Escape ladder; disclosure appears
exactly once across two opens; Consistency lens determinism on a
seeded misspelling fixture; a defense-in-depth A13 walk — every
control in the panel, assert none targets a writing surface
(HB1's ratified pattern: structural, never enumerated); grandfather
— a null-tutor legacy fixture byte-identical through load/edit/
save; the thread's persist-across-reload. Park sweep expected
empty (additive ticket) — PARKED gate armed-but-empty per the
cd2/fx3/ab4 precedent. Full suite green, both HARNESS_PARKED
settings. tsc ×2, build:web, selftest.

## Non-goals
Project-level room; model-written nudges; the Tutor on the
threshold (first-run stays pure); theme dialects; voice/audio;
the mechanical paste rail (its own future build); streaming/
tool-use anything; any affordance moving Tutor text toward a page
— constitutionally out, not deferred.

## Invariants
A12–A15 verbatim (the canon's fourth ratification record). The
paper never moves. One vanishing engine; the dock rider holds.
Olive/orange lanes; anti-solicitation; every string through
deskLexicon. Both-reference-widths + the 1100 floor on every
geometry assert. Legacy <1100px byte-identical (the Tutor is
framed-only chrome). Server surface minimal and enumerated: one
column, two mapper touches, one route — anything more is
STOP-and-report. Keys server-side only; writer-initiated calls
only. Report = push; NO merge without Nick's explicit go.

## Definition of done
Nick, after his go, the merge, deploy on his word, and the S1-
precedent prod round-trip (a scratch account pushes and pulls a
populated thread byte-for-byte): opens the grip and the paper
doesn't move; types and the room steps back; docks it and it stays
while he writes; runs Consistency against a deliberately
misspelled name and sees it caught; asks for a paragraph and
watches the Tutor decline beautifully and hand back a question;
pulls the plug and finds the lenses still working; reloads and
finds the thread remembered. The disclosure appeared once, ever.

— Fable, from the committee's ratified pass, 2026-07-18
