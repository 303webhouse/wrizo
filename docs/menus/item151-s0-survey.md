# ITEM 151 · S0 — THE SILENT DRIVER ACT, RE-CENSUSED AT BRANCH TIP
### tools lane · worktree `.claude/item151-silent-acts` · branch `item151-silent-acts`
### off `origin/main` @ `746682b` · 2026-09-18 · NO BEHAVIOUR CHANGE

## THE CENSUS AT TIP: 152, NOT 156

The finding was made during VW1 (item 134) at **156 live instances across 49
files** — 128 optional-chain acts (`?.click()` and its cousins), 24
if-guarded calls (`if (item) item.click()`), 11 more sitting commented and
excluded as not-live. **Re-run here at branch tip: 152**, same 49 files, same
128 optional-chain reading, **24 if-guarded** — four fewer than first counted.

**Traced, not assumed:** three of the four are VW1's own `clickCategory`
helper rewrites (`ab4.mjs`, `cd2.mjs`, `fx9.mjs`), which converted
`if (item) item.click();` into a named throw at the site — the exact fix
this item exists to generalise, already landed incidentally in three files.
The fourth is not yet traced to a specific commit; it does not change the
item's scope and is noted here rather than left silent.

## THE POPULATION, UNCHANGED IN SHAPE

Two patterns, both **actions** — `click`, `focus`, `blur`, `dispatchEvent`,
`scrollIntoView`, `submit` — never reads, which is why the census was scoped
to those six verbs from the start: a guarded *read* returning null is
ordinary defensive code; a guarded *act* that does nothing is a driver that
can lie by doing nothing, which is the standing law this item enforces.

Leading files, unchanged: `item121.mjs`(11) · `fx5.mjs`(10) ·
`item126.mjs`(8) · `item112a.mjs`(7) · `fx2.mjs`(6) · `ab2.mjs`(5) ·
`ab3.mjs`(5) · `ab4.mjs`(5) · `b1.mjs`(5) · `b2-1.mjs`(5) · `b2.mjs`(5) ·
`fx18.mjs`(5) · `fx6.mjs`(5) · `fx7.mjs`(5) — and 35 more files carrying
fewer each.

## ROUTING — INK AND FIX ARE NAMED HERE, BEFORE ANY SITE IS TOUCHED

The four leading files belong to other lanes' territory: `item121.mjs`,
`fx5.mjs`, `item126.mjs` and `item112a.mjs` read as **INK's**, by subject
(the ink stratum, its stroke drivers). This notice is the routing check
ratified as this item's own precondition — **nothing in those four files is
converted before INK and FIX have seen this survey and this item's number**,
relayed through the ledger as every cross-lane notice in this arc has been.

## THE FIX'S SHAPE, ALREADY PROVEN THREE TIMES

`if (item) item.click();` and `document.querySelector(sel)?.click();` both
do nothing observable when the target is absent — a driver can "press" a
control that was never there, and the check that follows reads a page that
never moved. VW1's three conversions already carry the pattern this item
generalises: probe first, then **fail a named check** rather than falling
through silently.

```js
// before — silent, either way
if (item) item.click();

// after — the same act, but absence is a finding, not an outcome
if (!item) throw new Error('<file>: no <target> to press');
item.click();
```

A guard is not removed by this fix; it is turned into a claim.

## THE COVERAGE CHECK IS INVERTED, NOT ENUMERATED — AND FOR A NAMED REASON

VW1's own check 7 was widened twice for the same species (spread form, then
direct form) before a third, wholly different form — an index passed as a
function argument — reached zero via a fourth. **The 156 figure itself was
built from two patterns that had already undercounted VW1's census twice.**
A pattern list is exactly the instrument this item cannot trust to prove its
own completeness.

So this item's own durability check will not enumerate guard shapes. It
will assert, the way VW1's check 7 ended up asserting: **any live act
(`click`/`focus`/`blur`/`dispatchEvent`/`scrollIntoView`/`submit`) reached
through a conditional or optional-chain is an offender unless the guard's
own branch fails a named check when the target is absent** — proven by
reading the AST shape of the guard's consequent, not by matching a fixed
list of spellings. A fifth silent-fallthrough form should fail this check by
construction, not need its own line added after it is found the hard way.

## WHAT THIS COMMIT CHANGES

**Nothing.** Survey only, landed before any site is touched, so the census
and the routing can be checked against the code before the code moves.
