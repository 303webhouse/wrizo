# E1.1 — Words Out, Made Whole · fix brief · 2026-07-23

**Place at:** `docs/wrizo-alpha/e1-1-words-out-fix-brief.md`.
**Branch:** `e1-1-words-out-fix` off `main`, own worktree (one checkout
per agent — no exceptions, including quick passes).
**Priority: P0-adjacent — lands before the Aug 1 freeze.** E1 shipped and
its architecture reviewed GREEN, but Fable's post-merge review
(`e1-review-fable.md`) found the merge record claims a fix that is not on
`main`, and Nick has since ruled the Trash scope. This ticket makes the
record true and the export whole.
**Authority:** Fable's E1 review, 2026-07-23; Nick's ratifications of
2026-07-23 ("agree with you on each of these issues"): the Trash word
given — trashed pages ride along under a marked section.
**ZERO SCHEMA, ZERO SERVER FILES, ZERO NEW DEPS.** Merge pre-authorized
as zero-schema; Fable reviews post-merge. Report = push.

## S0 — records first, and the search before the build
Ledger: open E1.1's item referencing item 51. **Before writing any code:**
check the primary checkout (`git status` + `git stash list`) and the
`e1-words-out` branch for the orphaned collision fix the merge record
describes — it may exist uncommitted. Report what you find either way;
if found, adopt it rather than re-deriving, disclosed.

## S1 — the collision fix of record
A stable per-entry-id suffix on the "This Page" base filename, applied in
**one place** — `exportPageFiles()` in `store/pageExport.ts` — so both
call sites (PageEditor, ScriptEditor) inherit it. Shape: a short stable
fragment of `entry.id` appended to the safe base (e.g. `Title · a1b2c3`),
still passing `safeFilenameBase`'s own legality rules and the 80-char
cap. Two different pages sharing a first line must produce two distinct
filenames, deterministically, across repeated exports of the same page
(same page → same name every time; no timestamps in the suffix).

## S2 — the harness check of record
In `e1.mjs`: seed two pages with **identical first lines**, download both
as "This Page (.md)", read actual bytes, assert **two distinct files on
disk, each carrying its own words intact**. The existing round-trip
filename assertion (`'Round Trip Title.md'`) is falsified by S1: park it
per A4 — quoted verbatim, superseding authority named (Fable's E1 review
+ this brief), live successor asserting the suffixed form. Per the A1
codicil: the park cycle travels in the same commit as the change that
moved reality.

## S3 — the Trash rides along (Nick's word, ratified 2026-07-23)
"Everything" gains an honest **`## From the Trash`** section: every
soft-deleted page's block, rendered by the same `pageBlock` machinery,
clearly separated after the live pages. Requirements:
- The enumeration seam must expose soft-deleted rows; if none exists, add
  a read-only one (client-side, zero schema). Never resurrect or mutate a
  deleted row in the process — read-only means read-only.
- The section header is part of the exported artifact's body text and
  therefore does NOT route through `deskLexicon` (the boundary the E1
  review endorsed as canon).
- Live pages remain first, chronological; trashed pages follow under the
  marked section, chronological; system Boards stay excluded (unchanged
  rationale — derived mirrors, zero unique words).
- Harness: the corpus's soft-deleted page flips from must-be-absent to
  must-appear-under-the-marked-section. The old exclusion check is
  falsified: park it per A4 with this brief named as the superseding
  authority, live successor asserting presence under `## From the
  Trash` and absence from the live section above it. The document-count
  assertion updates to count live + trashed explicitly (name both
  numbers), not one blended total.

## S4 — the whitelist inverted
`boardBody()` currently whitelists text/ink/page-pin and silently drops
any other box kind. Invert the failure mode: an unrecognized kind exports
a named placeholder line (`[A card of an unrecognized kind — not exported
as text.]`), never silence. The 'connection' kind is explicitly skipped
by name (it carries no writer text — a link, not a card), disclosed in a
comment. Harness: seed a board with a fabricated unknown-kind box; assert
the placeholder appears.

## S5 — the record corrected
One records commit on item 51, named plainly per the stalled-report law:
the original claim ("fixed by the orchestrating session post-review") did
not land on `main`; E1.1 lands it, plus the Trash word and the whitelist
inversion. No euphemism; the ledger says what happened.

## Non-goals
Suffixes on "This Binder"/"Everything" filenames (single-document scopes,
no cross-page collision); zip/multi-file delivery; any change to Copy
payloads; ink rendering.

## Invariants
Client-side only; zero schema; the writer's words never altered,
truncated, or reordered; every UI string through `deskLexicon`, exported
body text deliberately not; both-reference-widths on any geometry assert
(none expected); full suite green both `HARNESS_PARKED` settings; `tsc`
×2; `build:web`; report = push.

## Definition of done
Two same-titled pages download as two files, both sets of words intact.
Nick's "Everything" contains every live word AND every trashed word, the
latter honestly marked. A future box kind cannot silently vanish from an
export. The ledger tells the truth about all of it.

— Fable, from the E1 post-merge review + Nick's ratifications
