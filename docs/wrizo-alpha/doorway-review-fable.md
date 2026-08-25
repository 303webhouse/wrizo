# The doorway wave — post-merge review (Fable) — items 104,
87-subset, 97, 101

Reviewed at merge cf9180a (offer 24896a1; both settings 59/59
CLEAN, bundle index-D8pFRr1k.js carries — main moved zero app code
since base). Census: 5 src files +141, three harnesses +657,
runtime-verify +12; zero schema. VERDICT: PASS.

ITEM 104: the UnbornPage dispatch now asks the ROW once the row
exists — pageType outranks descriptor.kind, prose rows fall
through to the SAME component under the SAME key (no remount, no
dropped burst; PB1's property preserved exactly, stated in place
with the replaceState reasoning). The structure door reuses
requestScreenplay alone — one implementation — and is guarded
three ways, with the StrictMode double-invoke named as why the
latch is a ref. The descriptor's structure field degrades
unrecognized values to "no opinion, not a guess." S1(c) red
pre-fix; S2 green pre-fix proving 104(a) was the unborn case in a
different hat; S1(d) keeps Nick's F5 as a standing control.

ITEM 87-SUBSET: the empty case moves, the threshold rule stands —
seedTypewriterDefault(!fresh && …) — with FX2 S2 amended "at the
one point the original rule was never really about." The four
clause-1 parks are design-supersession parks with the durable
finding carried forward ("a door-made choice that is never
persisted is true exactly once"); the empty live-park list is
evidence, argued check by check.

ITEM 97: the pointer cleared AT DETECTION via destructure-and-
save; the code comment carries the does-not-bite finding in
capitals, the local-path correction (softDeleteEntry already
unpairs, BM1 S2), and the NAMED RESIDUAL (the tombstone-arrival
window, apply-time unpairing beyond the decision's authority).
S2 exercises the one reachable path — a remote tombstone through
the armed sync double — including the first draft's refused-pull
lesson (a just-minted board is dirty; push-and-clean first, as a
real second device would have).

ITEM 101: S4 built to confirm the benign reading or refute it —
a measurement, not a defect claim; green confirms same-route-
navigation-onto-an-identical-door, routed to item 96's feedback
charter.

OBS (non-blocking, one-touch, th2-comment class ×3): stale
clause-1 prose shipped — BoardEditor's "declares Draft too,"
CascadePanels' "This door SAYS Draft," unbornPage's "mode (item
87)" cross-reference — all present-tense descriptions of the
REMOVED ?mode=draft mechanism, plus inert ?mode=draft params in
item104.mjs fixtures. Correct at next touch of each file.

— Fable, 2026-08-17

---

## OWNERSHIP APPEND — 2026-08-24 (Fable)

**This review verified the effect's GUARDS and not its POSITION — and that miss is mine.** Item
104's New Page door crashes on mount in production: a hooks-order violation (`fe0252b`) where the
effect's hook sits BELOW an early return, so a COLD DIRECT LOAD of `#/page/new` changes the hook
order and React throws on mount. The review checked that the effect was guarded three ways; it did
not check WHERE the hook was declared relative to the component's early returns. **New checklist
item, standing, for any component with early returns: hook-position-below-early-returns.** The
coverage gap that let it past the 59/59 suite is item 109 (no gate for a cold direct load); the
product fix is item 104's forward-fix at the fix lane, with the Railway rollback lever named and
held (redeploy P2c, git `643dd16` · railway `ec2b9755`, on Nick's word if the fix stalls).

— Fable, 2026-08-24
