# ITEM 154 · REBUILT — 147 REWRITTEN, 7 SITES EXEMPTED BY NAME, NONE HELD BACK
### tools lane · branch `item154-instring-acts` · worktree `.claude/item154-instring-acts`
### census `21b6b86` · Shape A closeout `b5a13a1` · first build `a406778` (**SUPERSEDED, never run**) · rebuild = this commit · 2026-09-19

**BUILT, BYTE-VERIFIED, AND FALSIFIED. NOT LAUNCHED.** The tip moved from
`a406778` to this commit: chat 1 should verify THIS tip, not the one the last
report named. Nothing in `a406778` ever reached a suite — it was corrected
before any pair was granted — so no red was caused by it.

---

## §0 · WHAT THIS CORRECTS — THE FIRST BUILD WAS WRONG IN SIX WAYS

The first build (`a406778`, "139 of 156 rewritten, 17 held back") converted a
**syntactic shape**. Reading the sites one at a time — before the pair, while
the box was not mine — found that the same syntax is worn by things that are
not silent acts, and that the tool itself had defects. Each is fixed here;
none is a claim about the product.

| # | the first build | what was wrong | now |
|---|---|---|---|
| 1 | rewrote `sc1.mjs:562` to throw | the check is *"the OPTION does not present itself"* — `gear` is the **Typewriter** control, which must be **absent**. The passing state is absence; the throw would have failed it | **exempt**, by name |
| 2 | rewrote `m2.mjs:543`, `m4.mjs:264` | `return !!btn` is **asserted** by the very next line (`ok(..., progressTimeBtn === true)`). Absence already fails a *named check*; a throw replaced that with a file abort — the opposite of this arc's law ("probe first, fail a check") | **exempt**, by name |
| 3 | rewrote both halves of `cd2.mjs:597`/`:622` | `A?.focus?.() \|\| B?.focus?.()` is a **fallback chain**. Converting the first half makes it throw when absent *instead of falling back to B* | **exempt**, by name |
| 4 | dropped the `?.()` of `x?.focus?.()` | changed the author's method-existence guard, silently | preserved: `__t.focus?.()` |
| 5 | message `no click target` | names no selector; `evalJs` surfaces an in-page throw as `page eval: {exceptionDetails}`, so a red would not say *which* target was missing across ~130 sites | `no click target: document.querySelector('.wz-sliver-grip')` |
| 6 | held back 17 sites | 15 had a live `${...}` (now handled in place), `th2:353` a two-level lookup (now written by hand and verified alike), and `tu5:449` **was never an offender** — a scan-until-exhausted loop whose `else` is the loop ending | 0 held back |

**The root cause is the one item 155 names, aimed at my own S0:** *a number you
cannot defend per site is not a population.* The 156 was defensible as a
count of a **shape**. It was not a count of **silent acts**. Reading each
one gives **147 silent acts + 9 shapes (7 sites) that are not.**

> **BYTE-IDENTICAL TO INTENT IS NOT CORRECT — THE INTENT IS WHAT NEEDS
> AUDITING.** *(Fable's band, ratified 2026-09-19: the first build was
> byte-verified 137/137 and wrong in six ways.)*
>
> **A COUNT OF A SYNTACTIC SHAPE IS A LIST OF CANDIDATES — THE POPULATION IS
> WHAT SURVIVES READING EACH ONE.** *(tools' words, proposed — item 155's own
> law aimed at tools' S0; not yet ratified.)*

---

## §1 · THE POPULATION, READ PER SITE

`156 = 133 optional-chain + 23 if-guard` (S0, unchanged). Per site:

- **147 rewritten** — 127 optional-chain (117 in plain strings, 10 in
  templates), 19 if-guard (14 + 5), 1 by hand (`th2:353`).
- **9 shapes in 7 sites EXEMPT** (`item154-exemptions.mjs`; every needle must
  match exactly its declared count or the tool fails — a stale exemption is a
  guard passing blind):

| site | class | why |
|---|---|---|
| `m2.mjs:543`, `m4.mjs:264` | probe-and-report | absence is asserted by the next `ok()` |
| `tu5.mjs:449` | control flow | a search loop; absence is how it ends |
| `sc1.mjs:562` | expected-absent | a negative assertion; absence is the passing state |
| `cd2.mjs:597`, `:622` (×2 each) | fallback chain | `\|\|` consumes the absence |
| `item133.mjs:133` | author-documented intent | the comment says `?.click()` is deliberate so *the assertion below speaks* — **RULED EXEMPT by Fable, §6** |

Of the 133 optional-chain calls, **129 are bare statements** (value discarded —
silent by construction) and **4 are consumed** (the cd2 fallbacks). That split
was measured, not assumed.

---

## §2 · THE TRANSFORM

```js
// optional chain            RECEIVER?.VERB(ARGS)
(() => { const __t = RECEIVER; if (!__t) throw new Error("no VERB target: RECEIVER"); return __t.VERB(ARGS); })()

// if-guard                  if (X) STATEMENT
if (!X) throw new Error("no X target");
STATEMENT
```

- **Templates are edited in place, at raw offsets inside one literal piece.**
  Collapsing a `${...}` template to a static string would freeze its other
  live expressions, so it is never done. An optional chain whose receiver
  *contains* an interpolation (`document.querySelector('${EDITOR}')?.focus()`,
  10 sites) is handled by inserting a prefix before the receiver and replacing
  only the `?.verb()` tail — the receiver text is never copied, so the live
  expression is never touched.
- **Every harness file is CRLF**, and a template's cooked text normalises
  CRLF → LF, so multi-line pieces have raw ≠ cooked for that reason alone.
  The mapping accepts that *only* when every newline is a CRLF and
  normalising reproduces the cooked text exactly; a mixed or escaped piece is
  still refused. Inserted newlines follow the **file's** convention.
- Re-encoding is `JSON.stringify` (static) or a `cookedToRaw` written with
  `split`/`join` and **self-tested at startup against TypeScript's own
  tokenizer** — item 152's lesson applied where a hand-typed escape was
  tempting.
- `th2:353` (`find(...)?.querySelector(...)?.click()`) is written by hand —
  a named failure owed at *each* level — but goes through the **same** byte
  comparison as the 146 automated rewrites: an in-string edit is verified by
  what the file says, whoever typed it.

---

## §3 · VERIFICATION — FIVE INSTRUMENTS, AND WHAT EACH CANNOT SEE

**(a) Byte comparison, every argument, re-read from disk.** 2,580 `evalJs`
arguments across 49 files: **147 edited == the intended text, character for
character, with every `${...}` expression unchanged; 2,433 untouched
byte-identical; the file outside every argument byte-identical to the
original; no new bare LF in any CRLF file.**
*Cannot see:* whether the intent was right (§0 is the proof).

**(b) An independent census** (`item154-census.mjs`, a separate program) on the
result: **OFFENDERS 0, EXEMPT 9.** It agrees with the rewriter — after one
disagreement, honestly resolved: it counted the rewrite's own
`return __t.focus?.()` (right after a named throw on `__t`) as an offender.
A lone optional *call* on a non-optional access asks whether the **method**
exists, not the **target**; the census now walks from the access. Checked
first that this hides **none** of the original sites — 0 of 133 are reached
only through a lone optional call — so the 156 is unchanged.

**(c) A behavioural falsification** (`item154-behaviour.mjs`, no browser):
every changed argument, old vs new, in three stub worlds — *absent*,
*present*, and *inner-miss* (outer container found, everything inside it
missing, which reaches a guard sitting behind an earlier `if (!row) return`).
**147/147 conclusive:** the old text is silent where the new one throws *by
name*; where the target exists the new one performs exactly the same acts and
does not throw. **Mutation-tested on copies** (each mutation asserted to have
landed first): an inert guard, a dropped act, an inverted guard and a dropped
statement are each **reported FAIL with the right diagnosis**. The first
classification labelled two of those four "inconclusive"; tightened until it
said what it found.
*Cannot see:* whether a throw is the *right* behaviour. Every exempted site
"behaves correctly" under a converted text here and is still the wrong thing
to have done — which is why exemptions live in a reviewable table, not a
pattern. **A 147/147 means "every rewrite does what it says", never "every
rewrite should have been made".**

**(d) Idempotence:** re-running the rewriter on the rewritten tree changes 0
files.

**(e) Environment:** `tsc --noEmit` exit 0; `build:web` exit 0, **bundle
unchanged** (`index-DfFOCr6L.js`); `node --check` clean on all 49 files and
the four tools; **0 files with mixed line endings**.

**A bug found on the way, kept on the record:** `item121.mjs` and `sc2.mjs`
each ended up with one bare LF in an all-CRLF file — the in-template `if`
rewrites keyed the inserted newline on the *piece*, not the file. Git's own
warning named exactly those two files. **The byte comparison could not see
it** (cooked text normalises CRLF → LF); a new check — no new bare LF in any
CRLF file — now can, and would have flagged both.

---

## §4 · FOUND, NOT FIXED — SECOND SILENT-ABSENCE PATHS (ITEM 155's TERRITORY)

Reaching the guard in the all-absent world failed at four sites, because an
**earlier exit** fires first. Each guard is correct where it sits; the earlier
exit is a second silent path outside item 154's six-verb pattern, recorded
here, not touched:

- `fx2.mjs:311`, `:373` — `if (!row) return;` before the guarded click.
- `item83f.mjs:106` — `if (!row) return false;`, **and its wrapper
  `openPopout` discards the result**, so the `false` reports nothing.
  (`:148`, `clickFormat`, discards a `return !!b` the same way.)
- `fx3.mjs:371` — a bare `row.querySelectorAll` on a null row: already loud,
  just not named.

---

## §5 · WHAT THE PAIR WILL AND WON'T SHOW — STATED IN ADVANCE

**Expected red count: UNKNOWN**, and deliberately not guessed — the same
refusal as item 151's §12. Any new red is a site where the target is absent in
a *passing* run: either a real miss that has been hiding (item 130's class
caught retroactively) or a legitimate absence that needs an exemption named.
Diagnose each as a candidate finding before treating it as a break.

**THE FIRST IN-STRING RED ABORTS ITS FILE'S REMAINING CHECKS** (the ruled cost,
§6.2). The throw surfaces from `evalJs` as an uncaught rejection, so every
check after it in that file goes unreported for that run. **A red there is
diagnosed, not re-run** — a re-run reproduces the same abort and learns
nothing; the error names the missing selector and the outer stack names the
line, which is the whole diagnosis.

A reading aid, not a number:

- **Most likely first candidate: `fx1.mjs:325` and `:514`** —
  `[...querySelectorAll('.typewriter-toggle')].find(Boolean)?.click()`. `fx2`'s
  own park note says that class is *gone* at one location, yet product source
  still renders it (`WritingIncentives.tsx:295`). Whether it exists on
  `fx1`'s page is exactly what the pair will say; if not, that click has done
  nothing for a long time and the check after it is trivially true.
- **"Dismiss if open" shapes** — where absence may be a legitimate state:
  `.board-popup-done` ×7, `.sprint-modal-backdrop` ×2, `.btn-quiet` ×2,
  `.wz-tutor-dock-btn` ×3, `.structure-confirm-screenplay`.
- **Low risk**, the target exists in essentially every run: `.wz-sliver-grip`
  ×34 (opening the sliver), `.forward-only-editor` ×20 (`focus`).

---

## §6 · THREE RULINGS — HANDED UP WITH A LEAN, RULED BY FABLE 2026-09-19

All three leans were upheld.

1. **`item133.mjs:133` — RULED EXEMPT.** The author wrote `?.click()`
   *deliberately* so the assertion below speaks; that is the check asserting
   the **rule** (the rename field opens pre-filled) rather than the **proxy**
   (the click landed). It stays exempt, with that reason now in the table
   (`item154-exemptions.mjs`).
2. **Throw vs. record-a-check — RULED: ACCEPT THE THROW, AND RECORD THE COST.**
   An in-string throw surfaces as an uncaught rejection and aborts the rest of
   that file's checks, which cuts against the arc's own
   `harness-drivers-never-assume-existence` law (a failed named check lets the
   file keep reporting). **The cost, stated:** the first in-string red in a
   file aborts that file's remaining checks — see §5, *a red there is
   diagnosed, not re-run.* **Why it is still right:** in-string code cannot
   call `ok()`, so the alternative to a throw is *silence* — and an abort that
   names the missing selector is strictly better than a green about something
   else.
3. **The census definition — RATIFIED, Fable as the second reader** the
   redefinition asked for (§3b). Walking from the access rather than the call
   is correct: a lone `?.()` on a non-optional access asks whether the
   *method* exists, not whether the *target* does, and is not a silent act.

---

## §7 · WHAT THIS COMMIT CHANGES

49 harness files, 147 in-string rewrites (`+152 / −183`, no whole-file
churn); new: `item154-exemptions.mjs`, `item154-behaviour.mjs`; changed:
`item154-census.mjs` (exemptions, target-side optional links),
`item154-rewrite.mjs` (rebuilt). **No suite run, no merge, no deploy.**
