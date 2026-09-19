# ITEM 154 · S0 — THE REAL BOUNDARY CENSUS
### tools lane · worktree `.claude/item154-instring-acts` · branch `item154-instring-acts`
### off `origin/main` @ `56e2ad8` (Shape A already merged) · 2026-09-18 · NO SITE TOUCHED

## THE NUMBER: 156, NOT 134 — RE-DERIVED, NOT SAMPLED

Item 151's own S0 found that ~88% of its original outer-code population
lived inside `app.evalJs("...")` string arguments, invisible to a real AST
reader by design — architecturally, not by bug. **134 was the size of that
finding at the moment it was made, carried forward as this item's opening
figure without ever being independently re-derived.** Fable's brief named
the risk precisely: "the old sample was a lower bound from a heuristic that
has miscounted twice." It was — the SAME heuristic class (a pattern grep,
trusting spelling over structure) that undercounted VW1's own census twice
before its check 7 was inverted rather than widened a third time.

**This item does not inherit 134. It re-derives the population with a real
parser, twice — once on the outer file, once on each extracted string —
and gets 156.**

```
harness files scanned:            91
evalJs(...) call sites found:      3446
statically extractable arguments:  3398  (98.6%)
  (of which, resolved via a same-file template helper/binding: 177)
NOT statically extractable:        48    (1.4% — named below, not guessed at)
unparseable after extraction:      0
ALREADY-GUARDED-SAFE (throws):     0
OFFENDERS (the real boundary):     156
```

**By shape** — the same two classes item 151's own outer census used, plus
their natural `&&` cousin:

| class | count |
|---|---|
| optional-chain (`x?.click()` and its cousins) | 133 |
| if-guard, silent (`if (x) x.click()`, no throw in the branch) | 23 |
| `&&`-guard, silent (`x && x.click()`) | 0 |
| **total** | **156** |

**Proportionally close to item 151's own outer shape (128/24 of 152)** —
the same defect class, the same author habits, reached through a different
boundary. This is not a coincidence worth over-reading, but it is a sanity
check the number passed rather than one it was built to pass.

## THE METHOD — TWO PASSES, NEITHER ONE A REGEX

**Pass 1 — extraction.** `scripts/item154-census.mjs` (new, committed).
For every harness file, a `ts.createSourceFile` walk finds every
`evalJs(...)` call and extracts its first argument's INNER TEXT using AST
NODE OFFSETS, never string/regex matching:

- A plain `StringLiteral` or `NoSubstitutionTemplateLiteral`'s own `.text`
  (TypeScript's tokenizer has already cooked it correctly — item 152's own
  lesson: a hand-rolled unescape is where `\b`/`\n` silently collapse, so
  nothing here is re-decoded by hand).
- A `TemplateExpression`'s head/middle/tail pieces, each already-cooked,
  joined with a single safe identifier placeholder (`__ITEM154_X__`) at
  each `${...}` span the AST already located — not by matching `${` and
  `}` as characters, which breaks on a brace inside a string or a nested
  template.
- **One level of same-file indirection**, resolved the way item 151's own
  build had to (`pressOn` → `hittablePoint` → `hittablePointBy`): a call to
  a same-file helper of the shape `const NAME = (params) => <literal>`
  (`rectOf('.sel')`, 80 call sites across 7 helper names), and a bare
  identifier bound ONCE, anywhere in the file, directly to a literal
  (`DRAG_HELPER`, `POINTER_HELPER`, `CONTRAST_JS` and others — 97 more
  sites). **A name bound MORE THAN ONCE in the same file is left
  unresolved on purpose** — `expr`/`mutate`-style loop variables reused
  across sections (`bm1`, `pw1`, `pw2`, `fx14`, `fx15`, `hb2`, `j6`, `m1`) —
  because picking either binding risks reading the wrong one, and
  ambiguous is not the same as safe.

**Validity — a real parse, asked separately from the pattern question.**
Every extracted text is compiled (not run) via `new vm.Script(text)` —
Node's own V8 parser — before anything else happens to it. **Zero failed.**
This is the check item 151/152 both named and neither one gets to skip:
"a file that parses is not a file whose regexes compile," applied here to
confirm the EXTRACTION itself produced valid JS, not merely that the outer
`.mjs` file did.

**Pass 2 — the pattern.** Each validated inner text is parsed as its OWN
`ts.createSourceFile` and walked for the same six verbs (`click`, `focus`,
`blur`, `dispatchEvent`, `scrollIntoView`, `submit`) reached through an
optional chain anywhere in the access chain, or sitting inside an
`if (X) { ...X.verb()... }` / `X && X.verb()` guard whose own branch never
throws. A guard that already throws is recorded separately
(`ALREADY-GUARDED-SAFE`) so a file that has already fixed a site in-string
is never double-counted as an offender — **found zero of these**, meaning
none of the 156 is a stale count of an already-fixed site.

## THE 48 UNRESOLVED SITES — NAMED, NOT ASSUMED CLEAN

**1.4% of 3446 sites could not be statically resolved by this pass**, and
rather than guess, they are listed here in full so the gap is auditable,
not asserted away:

- **Ambiguous same-name bindings** (`expr` in `bm1`/`pw1`/`pw2`, `mutate`
  in `fx14`/`fx15`/`hb2`/`j6`) — bound more than once in the file, left
  unresolved by the safety rule above.
- **String concatenation** (`BinaryExpression`, 37 sites) — the extractor
  does not currently trace `+`-joined operands. The visible text at each
  of these leans heavily toward boot/seed boilerplate (`localStorage.clear();
  localStorage.setItem('wrizo-first-run...` appears near-identically in
  `fx10`, `item84`, `item84b`, `m2`, `m3`, `m4`, `tu1`, `tu2`, `tu5`),
  `fetch('/api/_sync_mode', ...)` calls, and `location.hash = '#/page/' +
  ...` navigation — none of which is a strong prior FOR a click-guard, but
  none of them was read closely enough to certify either. **Not claimed
  safe; claimed unresolved.**

Full list, file:line, in `item154-census-detail.json` (repo root, not
committed — regenerate with `node scripts/item154-census.mjs`) and enumerated
in this commit's own diff description.

## LEADING FILES — AND THE ROUTING GATE, RESTATED FOR THIS ITEM'S OWN POPULATION

| file | offenders | evalJs sites |
|---|---|---|
| `item121.mjs` | 11 | 52 |
| `item126.mjs` | 8 | 42 |
| `item112a.mjs` | 7 | 46 |
| `ab4.mjs` | 6 | 98 |
| `fx2.mjs` | 6 | 31 |
| `fx5.mjs` | 6 | 141 |
| `ab2.mjs`, `ab3.mjs`, `b1.mjs`, `b2-1.mjs`, `b2.mjs`, `cd2.mjs`, `fx18.mjs`, `fx6.mjs`, `fx7.mjs`, `item83f.mjs` | 5 each | — |

**`item121.mjs`, `item126.mjs`, `item112a.mjs` and `fx5.mjs` are the SAME
four files item 151's own S0 survey named as INK's territory.** That
notice was never file-scoped to Shape A alone — it named the FILES. Shape
A's outer coordinate-dispatch sites in `fx5.mjs` were fixed under item 151
because that population is outer JS structure, not the in-string
population the gate names; **item 154's population in all four of these
files IS exactly what the gate names, so all four stay HELD for this item
too — item121.mjs and item126.mjs doubly so, since Shape A's own last two
sites in them are also still pending the same clearance.** Nothing in any
of the four converts before chat 1 confirms INK/FIX have seen this survey.

## WHAT THIS COMMIT CHANGES

**Nothing.** `scripts/item154-census.mjs` is a new, committed, re-runnable
tool — survey infrastructure, not a behaviour change. No harness file's
runtime content is touched. Same discipline as item 151's own S0: the
census and the routing are on record before a single site moves.

## THE BUILD METHOD, STATED IN ADVANCE (NOT YET EXECUTED)

Per Fable's own brief: when sites are rewritten, **verification is by BYTE
COMPARISON of the extracted argument, never "it still parses."** The
census tool already separates these two questions — `new vm.Script(...)`
answers "does it parse," the AST walk answers "does it carry the pattern"
— and the build phase adds a third, independent check: the REWRITTEN
extracted text, re-extracted from the changed file by the same Pass-1
logic, compared byte-for-byte against the intended replacement, not
merely re-parsed and re-walked. A file that parses and a file whose
guard-throw actually landed at the right bytes are two different claims;
item 152 exists because that distinction was learned the hard way.
