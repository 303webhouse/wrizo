# Batch Two — review (Fable) — range f12c318 → reveal @ d24c2c9

VERDICT: PASS, pending one line. Range pulled as two trees: 32
files; 8 product files (+313/−25); apps/server 0; no .sql, no
migration. Packages: 133, 135 (harness), 137, reveal-on-click.
133 — boardName(text, fallback) in entryText.ts is the one
derivation (first non-empty line, trimmed, 60 cap), each surface
passing its own fallback word — as ruled after FIX's correction.
The crumb control commits through patchJournalEntry, Enter/blur
commits, Escape reverts, empty reverts, no write when unchanged.
The Page face's title is a button only on the subject page;
onReachName focuses and lands the caret at the end of the first
line after a frame. DEFECT, OBS-1: BoardEditor.tsx:2523 sets the
rename draft by comparing the derived name to 'Untitled board'
while this surface's fallback is 'Untitled' — the comparison can
never be true, the "open empty when nameless" branch is dead, and
an unnamed board's field opens pre-filled with "Untitled". A
leftover of the fallback correction — the word appears twice in
one expression and one was updated. Fix: the draft opens as
boardName(live.text, '') — empty when nameless; one check: an
unnamed board's field opens empty, a named one with its name.
Cosmetic, no data risk (an unedited Enter writes nothing).
reveal-on-click — revealAtCaret acts only on a collapsed selection
inside its own editor, computes the would-be HTML at the caret and
returns without touching the DOM when it equals the last render
(the WeakMap is the loop-breaker: the redecorate's own caret
restore fires selectionchange, which now no-ops); one register on
document for page and card, each gating on el.contains; composing
and em-dash guards kept. OBS-2, scale not defect: the equality
test decorates the whole text on every selectionchange, so a
keystroke now decorates twice; on long pages that is item 86's
territory — measure at scale there; a cheaper identity (the caret's
run) is the obvious refinement. fx5 PASS (62) is the evidence the
retired keyup/mouseup behaviour survived the swap.
137 — .desk-frame-strip gains display:flex; flex-direction:column
and .wz-strip trades height:100% for flex:1; min-height:0; z-index:1
untouched; the measurement is in the stylesheet beside the rule.
PASS.
OBS-3, records: FIX's park count (179) matches the `"name":
"PARKED"` form only; item137.mjs emits a bare `ITEM137 PARKED`
line the counter can't see — harmless at zero parks, an undercount
the day it parks; TOOLS conforms the line. The deploy pair at the
assembled HEAD is the first measurement of the combined state.
— Fable, 2026-09-14
