# MERGE OFFER TO CHAT 1 — ITEM 104, THIRD PASS (the hooks-order class)

Branch: **`hotfix-104-third`** @ `d212b8e`. Base: `origin/main` @ **`e5f3f25`**,
pinned by SHA. **NO DEPLOY.** Nick's interim rule stands until this stamps: the
New Page door is avoided on production.

---

## STAMPS

| | |
|---|---|
| unparked | **60/60 CLEAN** — `tree=e5f3f25+4dirty bundle=index-CaW0zodg.js/531457b` |
| parked | **60/60 CLEAN** — `bundle=index-CaW0zodg.js/531457b` (identical bundle) |
| `hooks-order.mjs` | **NEW static guard — names BOTH violations pre-fix, green after** |
| `tsc` | clean |
| schema | **zero** |

---

## THE THREE THINGS THAT MATTER

**1. WHERE — and one ruled-out item needs correcting.** `useCascade` at
`PageEditor.tsx:428`, below the single early return at `:340`. The brief listed
"every hook in PageEditorView is top-level and above the guard" as ruled out; a
census on main's own tip disagrees, and `useCascade` is the hook whose absence
drops the count.

**2. WHY `entry` flips.** `UnbornProvider` registers the unborn slot during
**RENDER** (a `useMemo`) but tears it down in an **EFFECT CLEANUP**. React 18
StrictMode simulates unmount/remount by cycling *effects* while *preserving* memo
state — the cleanup clears the slot, the memo cannot re-run, the next render
finds nothing. The file's own comment anticipated a double *render*; it did not
anticipate a double *effect*.

**3. The environment — and THE COLD-LOAD OPEN IS NOW CLOSED.** A **dev build
with StrictMode**. Proven both directions on the same dev server: StrictMode ON →
throws and blanks; StrictMode OFF → renders correctly. Production strips the
double-invoke. **The 83 desk's void and this lane's cold-load-fine were both
correct measurements of different builds** — the hypothesis carried in the last
offer is confirmed, and that observation can be retired.

---

## WHY THE SECOND PASS MISSED, stated plainly

The dispatcher guards decide in the **parent**. A **child-local re-render** of
`PageEditorView` never re-runs the parent, so the parent guard is never
consulted. A guard one level up protects only the renders that pass through that
level. The invariant has to hold **inside** the component: every hook above, the
decision below.

## THE CENSUS FOUND THE FAULT WAS NOT ALONE

Over 145 files: **`ScriptEditor` carried the identical shape** — and it is the
room the doorway sends writers *into*. Fixing only the reported surface would
have **moved** the crash, not removed it. Fixed the same way. A third,
`JournalEntryView`, sits on a surface unrouted since FX14 — recorded, left alone,
and allowlisted by name in the new guard.

The slot lifecycle is fixed at its root too: the spurious teardown is retired
(hygiene, never correctness, by its own comment) and registration self-heals at
render.

## AN INTERMEDIATE WRONG STATE THAT ALMOST SHIPPED

With only the hook order fixed, the crash was gone but `#/page/new`
**redirected to Arrival** — a crash traded for a dead door.

**"NOTHING THREW" IS NOT A VERDICT. "THE WRITER SEES THE PAGE" IS.** That state
would have passed any check asserting only the absence of an error, and it would
have shipped as fixed. It was caught solely because the probe asserts what the
writer should SEE (`prose: true`, a non-empty tree) rather than what the console
should lack. Every check in this ticket now asserts a visible outcome, not a
silence.

## THE NEW GUARD IS STATIC, AND THAT IS DELIBERATE

`scripts/harness/hooks-order.mjs`. The crashing path is **dev-only**, so a
production-bundle CDP scenario **cannot** bite on it — the fault is visible in the
source, so the source is what gets guarded. Against the pre-fix source it names
both violations by file, function, hook and line.

**Nothing in the suite had ever asserted hook ORDER. That is why this class
shipped three times.**

### Its scope, named — it is the GENERAL form, not the three files

Asked directly, and measured rather than claimed: the guard walks **every `.ts`
/`.tsx` under `src` (145 files)** and checks **every function-declared component
AND custom hook (150 of them)** — not the three files this ticket touched.

**Its blind spots, named too, because a guard that overstates itself is worse
than none:**

- **Arrow-defined components/hooks** (`const Foo = () => {…}`) are not parsed.
  Measured today: **1 such definition exists in the whole codebase and it
  contains no hook calls** — so the blind spot is currently EMPTY, but it is
  structural, not absent.
- **Multi-line early returns** (`if (x) {` … `return` on its own deeper-indented
  line) are not matched; only top-level single-statement returns are. Both
  faults this ticket fixed were of the matched shape.
- It is a **line scanner, not an AST pass**, so it reasons about text.

**OWED to item 109's charter: the AST-based general form**, which would close
both blind spots and could run as a lint rather than a suite file. Recorded as
owed rather than quietly implied by "general".
