# MERGE OFFER TO CHAT 1 — ITEM 104 HOTFIX (the hooks-order crash)

Branch: **`hotfix-104-hooks`** @ `74b6a7e`. Base: `origin/main` @ **`bddcbcf`**,
pinned by SHA. **NO DEPLOY — the hotfix waits on Nick's word.**

Production is currently on `git 1cbda72 · railway 59d55924` and **carries the
crash**. It is a tree-blanking React error, so it presents as the app going
blank, not as a wrong result.

---

## STAMPS

| | |
|---|---|
| unparked | **59/59 CLEAN** — `tree=bddcbcf+2dirty bundle=index-hZQhhS8W.js/531318b` |
| parked | **59/59 CLEAN** — `bundle=index-hZQhhS8W.js/531318b` (identical bundle) |
| `item104.mjs` | **15 checks — S6 RED (2/15) against the DEPLOYED bundle** |
| `tsc` | clean |
| schema | **zero** |

---

## THE ONE THING TO READ BEFORE MERGING: the doorway is exonerated

The report attributed the crash to this lane's `structureDoorRef` effect. **That
attribution is wrong, and the correction is measured, not argued.**

A census of `PageEditorView` found **THREE** hooks below its single
`if (!entry)` guard — and **`useCascade` is one of them, from a position older
than the doorway ship**. Built from **pre-doorway src** (with `structureDoorRef`
verified absent) **the crash reproduces identically.** The doorway ship added two
hooks to an already-illegal region; it did not create the fault.

**Consequence for the fix:** the ordered one-line lift was **necessary but not
sufficient**. Lifting only this lane's two hooks leaves `useCascade` below the
guard, and the baseline proves that still crashes. So the vanished-page decision
moved **up into both dispatchers**, whose own hooks sit above every return: the
view now **unmounts** instead of re-rendering short. That removes the class.

---

## S0 — why 59/59 passed, and who is actually hit

**Why it shipped green:** no committed scenario has ever driven `entry`
non-null → null while a surface stayed **mounted**. Every file either sits on a
page that exists or navigates away — and navigating away unmounts, which is
exactly what hides this. The suite could not even *express* the condition until
the armable sync pull landed with item 97. → **item 109** opens for that gap.

**The offered hypothesis did not reproduce.** Cold loads of `/page/new`,
`?structure=screenplay`, and a missing page id all render correctly on the
deployed bundle. The condition is **the page you are on becoming absent while
you are on it**.

**Who is hit:** not only direct loads, not every in-app writer — **two devices,
one open page.** Another device deletes a page this one has open; the tombstone
arrives on a sync pull. Logout navigates away before the cache clears, and the
in-app Delete verb deletes from a list, not the page underfoot.

**A false negative worth inheriting:** the first baseline reverted the
pre-doorway tree **whole**, which also removed this lane's own
`/api/_sync_mode { pull }` double. With no way to deliver a tombstone, nothing
transitioned and the baseline "passed" — which would have wrongly confirmed the
doorway ship as the cause. **Baseline = old product under CURRENT instruments.**

---

## OPEN OBSERVATION (carried per Fable's ruling 3) — not reconciled

The 83 desk measured a **cold-load void across three trees**; this lane measured
**cold-load fine at the same bundle**. Both are reported as measured, so neither
is overwritten.

**Most likely reconciliation, offered as a hypothesis:** a `vite dev` scratch
serve versus a production build. `main.tsx` wraps the app in `React.StrictMode`,
whose double-invoke is **development-only** and is stripped from a production
build — and it also explains the differing error text (dev prints the full
invariant; production prints "Minified React error #300").

**The discriminating question, so one run settles it:** was the scratch serve
`vite dev`, or a static serve of `dist-web`? If dev, the findings agree and the
difference is StrictMode. If static production, they genuinely conflict and
something environmental is unaccounted for.

**Not reconciled here by choice:** settling it needs a dev server plus a browser,
and this lane's stamped suite was mid-run — launching one would have contended
for the shared pool and voided the sweep. **The fix does not depend on the
answer;** the class fix removes the fault on both paths.
