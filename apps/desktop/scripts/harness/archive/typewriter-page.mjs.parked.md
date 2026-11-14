# Parked records archived from typewriter-page.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/typewriter-page.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from typewriter-page.mjs lines 199-212 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 03dffdcbd957f90905724eeba41117afddb841e2

```js
// ---- PARKED - SUPERSEDED by typewriter-scope (Fable, Oct 21) -------------------------------
// GENERATION 1, quoted VERBATIM and no longer asserted (see the comment above the P1-P4 ok()
// calls in the main tally, which now read typewriterForPage instead). enterPageTypewriter used
// to MIRROR its resolved value into the shared `typewriter` field; this ticket removes that
// mirror on purpose (it is what let one page's seed leak into another page's Ctrl+B gate - the
// Nick/Fable-reported repro this ticket exists to fix, docs/plans/typewriter-scope-plan.md). The
// four claims below are re-asserted against their NEW, opposite truth - the shared field is
// UNTOUCHED, not merely wrong - so this block stays green under HARNESS_PARKED=1, proving the
// retirement rather than quietly losing the old probe's own audit trail.
//
//   ok('(P1) a NEW page opens ON in Arbor (plateau) and OFF in Flux, and remembers that choice from its first open', v.newPages === true, JSON.stringify({ arbor: base.arborNew, flux: base.fluxNew, arborSaved: base.arborSaved, fluxSaved: base.fluxSaved }));
//   ok('(P2) toggle, reload, and the SAME page keeps it - OFF in Arbor and ON in Flux (the saved value beats both the theme and "has text")', v.persists === true, JSON.stringify({ afterToggle: base.liveAfterToggle, aOff: base.aKeepsOffAfterReload, fluxDefault: base.fluxDefault, fluxOnKept: base.fluxOnKept }));
//   ok('(P3) a SECOND page keeps its OWN setting: A (turned off) and B (its own) each come back as they were', v.ownPerPage === true, JSON.stringify({ bOwn: base.bOwn, pair: base.pair }));
//   ok('(P4) a pre-existing page with text and no saved value opens OFF (in Arbor too), is saved as OFF, and a later change cannot flip it; a SHORT page is no longer ON (the 1-9-line rule is gone)', v.existingText === true, JSON.stringify({ old: base.oldWithText, saved: base.oldSaved, stillOff: base.oldStillOff, short: base.shortWithText }));
```
