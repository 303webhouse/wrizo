# Parked records archived from help-choose-census.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/help-choose-census.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from help-choose-census.mjs lines 224-227 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 90f8ae194b83784959a14b3f1a71021dd9f0284a

```js
  // ---- PARKED VERBATIM - SUPERSEDED by TOOLS #11 (Fable, Oct 28: Intake REPLACES the Forms content in Machina): DeckWizard now mounts the one panel TWICE - embedded inside the Forms dialog (Machina) and as the overlay (Arbor / Flux) - each behind its own `helpOpen` gate. The original check is kept below, no longer run; the successor follows (the SectionsPopout host is unchanged: one mount).
  // ok('C10 [Forms successor]: it NEVER opens itself - each of its two hosts mounts it exactly once, behind `{helpOpen &&`, and flips helpOpen to true ONLY from an onClick (however many doors: every call is an onClick)', mounts.every(mountOk), JSON.stringify(mounts.map((t) => ({ ok: mountOk(t), opens: opens(t), onClick: clickOpens(t) }))));
  // ------------------------------------------------------------------
  // DeckWizard: exactly TWO mounts, the overlay (`{helpOpen && !machina && <HelpMeChoose`) and the embedded one (`machina && helpOpen && ( <HelpMeChoose embedded`), each behind `helpOpen`; EVERY setHelpOpen(true) is an onClick (a liveness floor of 1).
```

## Record 2 · from help-choose-census.mjs lines 238-240 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 90f8ae194b83784959a14b3f1a71021dd9f0284a

```js
  // ---- PARKED VERBATIM - SUPERSEDED by TOOLS #11 (Fable, Oct 28: Intake REPLACES the Forms content in Machina): DeckWizard now mounts the one panel TWICE - embedded inside the Forms dialog (Machina) and as the overlay (Arbor / Flux) - each behind its own `helpOpen` gate. The original mutant (it used the one-mount predicate) is kept below, no longer run; the successor follows.
  // ok('MUTANT: an auto-open effect in DeckWizard (a bare setHelpOpen(true)) - the successor must go RED (the mutation LANDED: the real host passes)', mountOk(mounts[1]) && effectOpen !== mounts[1] && !mountOk(effectOpen), JSON.stringify({ real: mountOk(mounts[1]), landed: effectOpen !== mounts[1], mutant: mountOk(effectOpen) }));
  // ------------------------------------------------------------------
```
