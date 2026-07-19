# FX4 — the Fourth Sitting · Fable's post-merge review · 2026-07-18

**Verdict: GREEN. Required: 0. Advisories: 1.** Merge `94466fa`
(ledger `e9cc9eb`), census pulled directly: 17 files, all
apps/desktop — zero server files, zero migrations. Zero-schema TRUE
at census level. 2417+/544−.

**Depth disclosed:** census + record depth, standing on three
independent zero-discrepancy verification runs, the adversarial
mutation test on S1's ink-coordinate proof, and an independent
review pass with demonstrated teeth (573f76c — a dead OR-clause
assertion found and fixed in fx4.mjs's own S4 check; the review
finding real faults is what makes its green meaningful). Strip
flush verified CSS-only (DeskFrame untouched — the FX2 school).

**The sitting vindicated:** all three felt complaints were real
root-caused defects, not tuning: S2's glow painted behind the app
(no local stacking context for the negative z-index anchor;
isolation:isolate fixes; eased curve reuses AmbientGlow's own
technique; the field-never-burns cap untouched; a computed-opacity
floor assert guards regression). S8's hover-restore died after each
mount's first cycle (inZone never reset on dwell-fire; fixed at the
root; proven across four consecutive cycles, both surfaces). S1's
Journal work exposed and fixed the host's overflow clipping plus
two shared-engine defects (caret fallback on empty
getClientRects()+non-text anchors; fresh-page auto-scroll from the
empty-editor fallback). **All five fixes ratified in-scope** —
every one lives inside a surface this ticket's slices own,
disclosed loudly, diagnosed before tuning per FX2's law.

**Rulings:** board-meta's un-normalized canvasW/canvasH RATIFIED —
the canvas is the normalization basis; self-normalization would be
circular; consumer audit recorded in the header; legacy no-meta
boards proven byte-identical; no STOP owed. fx1.mjs's
generation-2 double supersession ENDORSED (accretion precedent:
quote, never edit). w2.mjs's park ENDORSED (proxy check; the
adjacent check carries the true claim). The seven-file park sweep
audited honestly at A4 discipline — superseded checks gone from
the live path, not edited in place.

**A1 (carried, Nick's eye):** the desk grid now LEFT-ANCHORS at
wide viewports (leftover width sits right, not symmetric) — a
lawful reading of "reclaimed width feeds the stage" that parked
cd1's ratified symmetric-margins check. If Nick's device verdict
goes the other way, the revert is one line. First on his glance
list.

**Close conditions:** (1) this review on disk — this commit;
(2) redeploy on Nick's word — manifest: d1a6696..HEAD = FX4 (one
code ticket) + named doc riders (item 32 sitting record, FX4/TU1
briefs + items 33/34, board-card-studies.html, the stash-drop
record, this review); (3) Nick's FX4 DoD script + the A1 wide-desk
glance. TU1 proceeds on its branch; Fable reviews ON THE BRANCH
when CC reports; merge only on Nick's explicit go.

— Fable, 2026-07-18
