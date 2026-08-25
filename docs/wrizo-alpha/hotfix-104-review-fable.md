# Hotfix 104 (hooks class) — review (Fable) — read at raw bytes,
offer 2c36ad0

VERDICT: PASS. Both settings 59/59 CLEAN on the identical bundle;
item104.mjs S6 proven to BITE — 2/15 red at the DEPLOYED bundle
(React #300, tree blanked), 15/15 with the fix, staged on the
exact production path: create → push-and-clean first (the item-89
"local unsynced edit wins" knowledge reused, or the tombstone
would be refused) → armed pull delivers the tombstone under a
MOUNTED surface → no hooks error, and the writer is carried
somewhere real.

THE FIX: the vanished-page decision lives in BOTH dispatchers,
whose hooks all sit above every return — a vanished page UNMOUNTS
the view instead of re-rendering it short. The class removed, not
the instance: the census found THREE hooks below the view's
guard, useCascade among them OLDER than the doorway, and the
pre-doorway baseline crashes without the doorway's hooks — the
ordered one-line lift alone would have shipped a green suite and
a still-crashing product. The honest trade is stated in place:
the view KEEPS its pre-existing illegal form, disarmed by the
dispatchers' invariant rather than refactored under a hotfix.
The lifted hooks' comment teaches the registration-vs-body law
where it lives.

OBS (non-blocking, next touch): the invariant rests on the
dispatcher re-rendering FIRST on store change; the subscription
chain that guarantees this is unstated in the comments — S6
enforces the property empirically forever, but one sentence
naming what re-renders the dispatcher would complete the record.

REGISTERED WITH IT: the lane's self-corrections (the stash no-op
that made 8bf431b's message overclaim its own diff — corrected in
2c36ad0 rather than left standing; the finding saved by having
been drawn from the ARTIFACT, not the source) and the cold-load
discrepancy held as an environmental open with its dead end
documented (--mode development is not dev React) — routed to the
83 desk's scratch-serve environment post-merge.

— Fable, 2026-08-24
