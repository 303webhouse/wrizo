# Item 82 — diagnosis (chat 6) · 2026-07-31

**S0-class mechanism report, one per red. Diagnosis only — no patches, per
Fable's order.** The headline is not a mechanism: **none of item 82's five reds
reproduce at the recorded control.** What *is* established is why the control
cannot be validated as recorded, and that finding is now demonstrated on disk
rather than argued.

---

## 0. THE CONTROL, RE-RUN — and what it is named by

Per Fable's ruling 1, every suite claim from here names **tree SHA + served
asset hash**, and a suite of record **rebuilds first**. This one did.

| | |
|---|---|
| tree | **`9b30273`** (detached worktree, the SHA item 82 names) |
| served bundle | **`index-CubIOguU.js`**, 523,769 bytes (`index-DfTiVdTQ.css`) |
| build | `pnpm run build:web` immediately before running |
| runner | the committed `scripts/run-suite.mjs` (DF1.1), glob **52** |
| settings | both, serially |
| guard | no `--ignore-foreign`; no `CONTAMINATED` / `REFUSED` / `ABORTED` line on either sweep |
| window | 18:09:56 → 18:54:10 UTC |

```
SUITE DONE HARNESS_PARKED=unset — 52/52 of 52 returned a passing verdict
SUITE RESULT: CLEAN
SUITE DONE HARNESS_PARKED=1     — 52/52 of 52 returned a passing verdict
SUITE RESULT: CLEAN
```

**Item 82's central claim — "a full suite on CLEAN `main`, with zero SC2 in the
tree, is RED at both settings" — does not reproduce.**

---

## 1. THE ESTABLISHED MECHANISM — provenance (now item 77(c))

This is the only mechanism this diagnosis actually closes, and it is structural.

`withHarness` serves `DEFAULT_DIST = apps/desktop/dist-web` — a **build
artifact**. `dist-web/` is **gitignored** (`.gitignore:8`) with **zero tracked
files**. Therefore **a tree SHA does not pin what the suite tested.** Two
worktrees at byte-identical `apps/` can serve entirely different applications
depending on when each last ran `build:web`.

**This is not hypothetical. It is on disk right now** (read-only forensic
inspection, authorized by Fable, disclosed here — filenames, sizes, `cmp`, two
symbol greps; nothing written or moved):

| | tree HEAD | served bundle | bytes |
|---|---|---|---|
| this diagnosis' control | `9b30273` (clean main) | `index-CubIOguU.js` | 523,769 |
| `.claude/worktrees/sc2-the-clock` | `9503515` (**+995/−41 lines of SC2 app source**) | `index-CubIOguU.js` | 523,769 |

`cmp` reports the two bundles **byte-identical**, and neither contains
`scriptPaginate` (0 occurrences in both). A ~1000-line source difference cannot
produce a byte-identical content-hashed bundle — so **that worktree is serving a
clean-main bundle while its own source carries SC2.** A harness run from it today
would test clean main while every provenance claim about it said SC2.

**The control's own served bundle is unrecoverable.** That `dist-web` was built
at **01:36**, *after* the control window (00:48–01:18 MDT), so whatever was served
during the control has been overwritten, and its hash was recorded nowhere. The
absence is the finding.

**Correction of record, made against my own earlier claim.** I first offered this
provenance gap as the likely *explanation* for j5's divergence — "a differently
built bundle produces exactly this." The hash comparison does not support that:
the bundle available in SC2's worktree is the same clean-main bundle this
diagnosis tested against. **The structural finding stands and is stronger; its
application to j5 does not.** Recorded rather than quietly dropped.

---

## 2. MECHANISM REPORT, PER RED

### j5 — "the item's spine" · **NOT REPRODUCED**
Item 82: `waitFor timed out: lens row` at `j5.mjs:178`, the app rendering its own
empty state; *"failed **every** unset run — in-suite and isolated, on BOTH
trees."*

Observed here: **PASS 37, five times** — four standalone unset, plus in-suite at
both settings. Zero failures.

Line-site note, checked because it would have implicated this lane: `j5.mjs:178`
is the **original chrome wait** (`label: 'lens row'`). DF1.1's own
`waitSpreadRehydrated` is line **179** and carries a different label
(`Spread rehydrated (lens row): …`), so the reported timeout is *not* DF1.1's
addition — it was never reached. Item 82's own mechanism question (2) is
therefore the right reading: with zero pages the lens row does not mount at all,
making it a **consequence** of the empty Spread, not an independent symptom.

**No mechanism is offered.** The failure is not present at the recorded control
on a freshly built bundle, and inventing a cause to cover the gap would be worse
than the gap.

### j4 — **NOT REPRODUCED**
Item 82: null cell at `j4.mjs:84` with chrome mounted and localStorage populated
(DF1.1 species-2 signature), plus a *second* distinct mode on main-parked
(`Access is denied for this document`, `j4.mjs:296`).

Observed here: **PASS 24 unset / PASS 28 parked**, in-suite, both settings.

### b2-1 — item 77(b)'s named signature · **NOT REPRODUCED**
Item 82: parked NOVERDICT, `ReferenceError: __click is not defined` at
`b2-1.mjs:110`, after 28 passing checks.

Observed here: **PASS 28 + PARKED 1, five standalone parked runs and in-suite at
both settings.** Zero failures.

**Narrowing registered:** standalone 5/5 green means that, whatever it is, it does
not live in the file alone. **Two hypotheses were tested and REFUTED** — recorded
so the next lane does not re-spend them:

1. *Helper-injection timing.* `withHarness` injects `PAGE_HELPERS` once at
   startup with `.catch(() => {})` swallowing failure, and — despite its comment
   *"Wait for the first authed render, then inject helpers"* — **does not wait**;
   `reload()` re-injects, `goto()` deliberately does not (*"same-document; helpers
   persist"*, true only when the document is already at `base`). b2-1's LIVE
   section enters via `freshDesk`, which reloads; its PARKED block enters via
   `seedProjectWithPlan`, which `goto`s and then calls `app.click` at line 110
   **with no intervening reload**. Plausible — and **refuted**: probe found
   `__click` a function in **6/6** trials at startup and after `goto`, with
   `readyState` already `complete`.
2. *Stale-browser reattachment across the two `withHarness` sessions a parked run
   performs* (both keyed to the same PID-derived profile dir). **Refuted**: in
   **4/4** trials session 2 started on its own fresh base with `__click` present;
   no reattachment observed. DF1.1's `removeDir(udd)`-before-launch is present in
   the control (`runtime-verify.mjs:643`), which closes profile carry-over at
   launch.

The observation that *every* parked block opens a **second** `withHarness`
session stands as true and unexplained-as-a-cause; it is the structural
difference between the settings and remains the place to look.

### th2 — **NOT REPRODUCED**
Item 82: parked FAIL 2/42, "crossing the goal fires the celebration" → false,
while passing 42/42 unset in the same control.
Observed here: **PASS 42, both settings.**

### fx6 — **NOT REPRODUCED**
Item 82: `pass:true detail:"Hello--world "` unset vs `pass:false
detail:"Hello—world "` parked, same tree, same run.
Observed here: **PASS 37, both settings.**

---

## 3. WHAT THIS DOES AND DOES NOT LICENCE

**Does not licence closing item 82.** "Not reproduced" is not "does not happen",
and the DF1.1 lesson binds: clearance evidence must scale to the observed rarity.
The evidence here is one full sweep per setting, plus 4 repeats of j5 and 5 of
b2-1 — enough to contradict *"fails every run"*, not enough to prove a flip
family absent. Item 82's reds were real observations and are recorded as such.

**Does licence doubting the control's identity, not the observer.** The one
identifier the control recorded (tree SHA) provably does not pin what runs, and
the machine currently holds an artifact where tree and bundle disagree by ~1000
lines. The control can therefore be neither validated nor invalidated as
recorded — which is exactly the gap 77(c)'s stamp closes.

**Carried as input, per Fable's ruling 4, both still open:** chat 1's Spread
hydration hypothesis (PB1's `persistence.ts` lines as substrate) — already
contradicted by the 7/30 combined-tree green and now further subordinate to the
bundle question; and Nick's sitting, which will report what the production Spread
shows a real writer.

**Recommended next step (not taken — no patches without the word):** 77(c) first,
because until the runner stamps the served bundle into every verdict record,
every future control in this arc has the same unfalsifiable identity. Then re-run
item 82's control by whoever still has its conditions, with tree SHA **and** hash
recorded.

— chat 6, 2026-07-31. Control: tree `9b30273`, bundle `index-CubIOguU.js`,
52/52 CLEAN both settings.
