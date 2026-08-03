# P0 wave — post-merge review (Fable) — items 89, 88a, 88b

Reviewed at merge da69332 (four commits 8875343..3de9f28). Census:
8 files, +1166/−25 — persistence.ts, sync.ts, PlacesPanel.tsx,
runtime-verify.mjs, two new harnesses, two records files. Zero
schema, zero server. Stamped suites 53/53 → 54/54 both settings,
same bundle hash; both harnesses PROVEN TO BITE pre-fix (8/14,
5/10 red on pre-fix bundles). VERDICT: PASS.

ITEM 89: the dirty registry is journaled to disk IN THE SAME
SYNCHRONOUS TICK as the collection it describes — the two cannot
disagree about a record that reached disk. The boot restore is
SELF-HEALING: ids whose rows never landed are pruned at the one
moment both halves are visible, closing the phantom-id trap the
fix itself could have introduced (asserted, S4, not assumed).
Corrupt journal boots empty, never crashes (S5). Logout removes
the journal — the cross-account leak caught preemptively. The
backfill is KEPT with the disjoint-populations argument (dirty
rows vs. wrongly-CLEAN rows), its accidental recovery-lever job
retired, and its journal-only asymmetry RECORDED rather than
silently fixed. The harness arms the SERVER double (/api/_sync_mode,
tutorMode's exact precedent) because a page-side trap dies with
the page — the defect's whole habitat is unreachable-AFTER-reload.
S1(e) measures the user-facing truth on the wire.

ITEMS 88a/88b: setPageHome returns a typed result; refusals WRITE
NOTHING; a live binder is defined by the app's own getProject —
the same definition the UI's list uses. The 88b correction is the
patch's finest reasoning, in the code where it lives: filing an
unborn page never no-opped — it BIRTHED LITTER through a side
door via getJournalEntry's unborn-slot fall-through. Reading the
cache directly makes "a thing in no pool cannot move between
pools" true IN CODE rather than by comment; birth stays the one
path (PB1 ruling 2 preserved). The panel's refusal language is a
writer's, not a system's. Parks: NONE owed, both files, with the
reasoning stated — "the absence is the finding."

OBS (non-blocking, item-90 neighborhood): 'no-such-page'
conflates unborn with trashed; the "write a word first" toast
would mis-speak for a trashed page. Unreachable today (Trash
items don't open); split the message when item 90 makes them
openable.

— Fable, 2026-08-03
