# SC2 — post-merge review (Fable) — item 62

Reviewed at merge 32376b9 (offer ecd37bf; sixth suite 56/56 CLEAN
both settings at tree eb74835, marker honored-through per 77(c)).
Census: 7 files, +2403/−55 — ScriptEditor.tsx, index.css,
scriptLedger.ts (new), scriptMetrics.ts, scriptPaginate.ts (new),
sc1.mjs, sc2.mjs (new). Zero schema, zero server.
VERDICT: PASS. Item 62 → REVIEWED, GREEN — CLOSED.

THE CARET FIX (S5): mechanism OBSERVED, not predicted — sheets
are DOM parents, so a break-crossing is a delete+insert (proven
with an expando React cannot preserve); the stale caretHint
restored offsets from the last ACTIVATION (measured: caret at 12
restored to 9). The fix spends a remembered live offset ONLY on a
same-session remount (element id + seedNonce); genuine
activations fall through to the hint unchanged. Its non-fixes are
stated in place — IME composition, non-collapsed selection,
native undo — "those need the class dissolved, not the symptom
closed."

THE ENGINE: the ledger is pure arithmetic consuming declared
constants — "a ledger that measured the render could never catch
the render being wrong" is the self-check corollary as code — and
wrapToLines carries the exact-concatenation contract
(join('')===input) with its own falsified first cut recorded: the
'\n' join rendered correctly and was a lie about the text,
invisible until the concatenation check found it. PAGE_LINES is
DERIVED (66−6−6=54), the trade-parity delta recorded-not-acted;
the lookups are total with the NaN mechanism named at the seam
and its live example honestly un-correctable (the frozen fixture
must stay pre-pagination). The paginator is a projection — never
stored, viewport-invariant BY CONSTRUCTION (width is not an
input) with the honest limit stated (necessary, not sufficient;
sc2.mjs cross-checks the render). Break rules are a TABLE so
SC2.1 is an edit, not a rewrite; only ruled rules are set; and
applyBreakRules carries a TERMINATION PROOF — one forward-only
move, Φ strictly increasing, a 2N bound, the refusals part of the
proof — because "an oscillation is not a wrong page count, it is
a frozen editor."

THE POLICY: the vertical rule replaces an accidental side-effect
(focus()'s scroll reflex) with three stated clauses, measured off
the CARET; the sheet is height-EXACT ("the paper never
negotiates"); the inter-sheet gap is chrome in rem for three
load-bearing reasons; the page number honors R1's bright line —
no aggregate anywhere, absence asserted as strictly as presence —
and its chrome-not-body status is proven by the shared
first-line-offset cross-check, not inspection.

THE INSTRUMENTS: sc2.mjs's header is the house's measurement
epistemics whole — the fixture-not-number gate, interleaved
judging, the 5-page control chosen on data, the between-session
ratio instability measured and FLAGGED RATHER THAN DECIDED
("narrowing a ruling is not the builder's call"), and the
self-correction inside its own comment. sc1's park cycles state
the vehicle/subject distinction at the site; S3's successor
restates the scroll policy as a check.

OBS (non-blocking, three, all self-flagged or boundary-grade):
(1) the page number's trailing period is a named judgment call
inside R1's wording — Nick's one word confirms or vetoes; (2) the
caret's breathing-room at the band's bottom edge is deliberately
zero pending Nick's ruling — it is literally Part 3 item 6 of his
own sitting agenda, the code and the agenda pointing at the same
open question; (3) an action of exactly 54 lines encountered
mid-page SPLITS rather than moving whole (the split test uses
positional space; fresh-page suppression would fit it) — lawful
either way since action is splittable; noted for SC2.1, where the
same boundary recurs in dialogue.

The memo's effect remains verification-owed under Amendment 1's
interleaved procedure — the code says so itself in capitals — and
item 76's dissolution re-derives the bound, per its standing
condition (d). Nothing here claims what isn't measured.

— Fable, 2026-08-17
