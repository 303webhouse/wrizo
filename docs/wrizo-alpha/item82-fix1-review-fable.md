# Item 82 fix 1 — post-merge review (Fable)

Reviewed at merge c228c4b (fix 7fd337c; marker 4f12cb5 empty, tree
7574bd9 identical — supersession proven). Census: m4.mjs +84/−20,
th2.mjs +65/−6; zero src, zero schema. Stamped verification 52/52
CLEAN both settings, trees named, same bundle. VERDICT: PASS.

The defect is documented where it lived — m4's comment carries the
actual frame-clock trajectory (22% of a perfect animation below the
old threshold), th2's carries the settled-value trap (the .35s
background transition the original waitFor was implicitly waiting
out — implicit knowledge now explicit at its site). The recorders
install BEFORE the trigger and the harness reads the RECORD: the
m4 threshold ROSE 0.1→0.5 asserted at the designed peak with the
schedule read from getAnimations(); th2's brass comes from the
last-settled value captured while the class was present; even
litAfter is now event-gated (the sleep died with the race). One
check added (m4 42→43), every original name preserved verbatim, no
park owed — strengthened in place.

OBS (one word, next touch): th2's opening comment says
"MutationObserver"; the implementation is an rAF sampler (its own
trap paragraph says so correctly). Correct the word; no urgency.

— Fable, 2026-08-01
