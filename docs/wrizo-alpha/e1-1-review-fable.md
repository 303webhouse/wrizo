# E1.1 — Words Out, Made Whole · Fable's post-merge review · 2026-07-23

**Ticket:** E1.1 (item 55). Merged `0c472c2` on Nick's word ("permission
to merge and deploy whenever you're finished" — quoted in the merge
record; the word covered both acts, so the deploy at `35207e0a` rode it
lawfully, manifest named, zero unnamed riders). `main` at `be780ad`.
**Method:** house depth — census via stats (3 files, 334+/63−), then
`full_patch` line-by-line on all three: `pageExport.ts`,
`persistence.ts`, `e1.mjs` (the whole 295-line harness delta). The
park-quoted originals were compared against the deleted live text **in
the same diff** — verbatim identity confirmed by direct comparison, not
by the commit's claim.

## Verdict: GREEN. The record is true, the words are whole, and the immutability law was honored under conditions that would have excused sloppiness. Items 51 and 55 close on Nick's sitting.

## VERIFIED

**S1 — the collision fix of record, hardened.** One seam
(`exportPageFiles`), both call sites inherit untouched. The suffix draws
from the id's random tail (`slice(-6)`, ~2.2B space) after the review's
own catch that the head is pure timestamp — and the harness fixture now
exercises the exact same-tick shape (ids sharing their whole head,
differing only in tail) that the pre-hardening version would have failed.
Deterministic: same page, same name, every export, no timestamp. All id
chars base36, filename-legal by construction. Both same-titled files'
bytes verified carrying their own words. The parenthesized form is a
lawful instantiation of the brief's "e.g.", disclosed.

**S3 — the Trash rides along, exactly as ratified.**
`getDeletedEntries()` is read-only in the strongest sense — clones only,
nothing on the path can touch `deletedAt` — and mirrors the Trash
Board's own membership rule by citation (soft-deleted, any origin,
system Boards excluded). Live pages first, chronological; trashed pages
after, chronological, under `## From the Trash`; the marker is exported
body text and deliberately outside `deskLexicon` — proven structurally,
since the lexicon file isn't in the diff at all. Empty trash emits no
empty section. Counts are named separately (5 live + 1 trashed), never
blended. The harness proves presence under the marker AND absence above
it, and that the row stays soft-deleted.

**S4 — the whitelist inverted, failure mode flipped.** Every box walked;
unknown kinds emit the named placeholder, never silence; `connection`
and `board-meta` skipped by name with reasons; the exactly-once
placeholder assertion cleverly proves the by-name skip produced nothing.
Known-kind rendering is output-identical to before — order preserved,
fallback preserved.

**The immutability law, honored at pressure.** Three falsified checks
parked with originals quoted verbatim (verified against the deleted
lines in this same diff), superseding authority named, live successors
in the file's own live section, and parked probes re-driving fresh
reality — the supersession record traveling in the same commit that
moved reality, per the codicil. And a practice worth naming as the new
standard: **the live section and the parked probes share module-scope
fixtures**, so the successors re-prove the same reality with the same
numbers, never a drifted copy.

**Process, on the record.** The suite was read to completion
synchronously before the merge act, per the ratified law; the one red
was the known `fx5` flake, isolated per standing practice, zero overlap
with this export-only diff. The 3-way merge preserved the A1 ruling doc
and all nine review docs across the stale base — verified by the merging
session and consistent with my own trail read. The S5 records commit did
the rare honest thing: item 51's false claim stands in the ledger with
the correction beside it — the record shows what was claimed AND what
was true.

## ADVISORIES — non-blocking

1. **The 80-char cap now governs the title component**; the full base
   can reach ~89 with the suffix. Disclosed in-code with correct
   purpose-preservation reasoning (the cap tames long first lines; the
   suffix is bounded at 9 legal chars). Endorsed — recorded so the
   brief's letter and the code's reading are reconciled.
2. **`board-meta`'s "zero writer text" comment is already stale** —
   BM1's lanes live on board-meta and carry writer-authored titles. The
   FX11 rider (logged in the ledger) renders those titles AND corrects
   this comment in the same pass.
3. **The harness's `^# ` and marker anchors remain writer-text-fragile**
   (a page whose own first line is `## From the Trash` would confuse the
   split). Pathological, harness-only, no product defect — the existing
   deflake-pass note (item 48's rider territory) extends to the marker.

## Close condition

Nick's device sitting — agenda item one now includes the Trash
spot-check: a known trashed page's words present under the marker, wifi
off. Then items 51 and 55 close together, and the export lifeline's
record and reality finally agree.

## Consequence: TU5's gate

With this review on disk, TU5's build gate is fully met. The start word
is given in the same breath as this file's landing — see the session
directive accompanying it.

— Fable
