# ITEM 154 · BUILT — 139 OF 156 REWRITTEN, 17 NAMED AND HELD BACK
### tools lane · branch `item154-instring-acts` · worktree `.claude/item154-instring-acts`
### census `21b6b86` · Shape A closeout `b5a13a1` · build `<this commit>` · 2026-09-18

**BUILT AND BYTE-VERIFIED. NOT LAUNCHED.** Per Fable's own instruction:
verification is by byte comparison of the extracted argument, never "it
still parses." Both are done, independently of each other (§3). No suite
has been run against this tree.

---

## §1 · SCOPE — WHAT WAS SAFE TO AUTOMATE, AND WHAT WAS NOT

156 offenders were found by the S0 census. This build rewrites the subset
reachable by a MECHANICAL, PROVEN-CORRECT splice, and names the rest rather
than guess at them:

**139 REWRITTEN**, gated on two conditions, both required:

1. **The source literal carries no live `${...}` interpolation.** A
   `StringLiteral` or `NoSubstitutionTemplateLiteral` argument's cooked
   text IS the complete content — re-encoding the whole thing via
   `JSON.stringify` is unconditionally correct, because there is nothing
   else in the literal a rewrite could clobber. A `TemplateExpression`
   (has interpolation elsewhere in the same literal) was NOT touched this
   pass — collapsing the whole literal to a static string would freeze
   those OTHER live expressions at census-time values, which is a
   correctness bug this tool refuses to risk. Mapping a specific offender's
   position back to a raw source offset while leaving every `${...}`
   untouched is the harder problem the item's own S0 survey named in
   advance; it was not attempted this pass.
2. **The offender's own shape is simple** — a single optional chain with
   no deeper `?.` in the same access chain, or an if-guard whose consequent
   is ONE statement. Two sites are not this shape (one nested optional
   chain, one multi-statement if-body) and are flagged, not guessed at —
   restructuring a multi-statement block correctly needs a human reading
   it, not a splice.

**17 FLAGGED, NOT TOUCHED** — named by file:line, not folded into a bare
count:

- **15** carry a live interpolation elsewhere in the same literal:
  `fx2.mjs:150`, `item112a.mjs:77`, `item121.mjs:645`, `item126.mjs:116`,
  `item126.mjs:253`, `item126.mjs:312`, `item126.mjs:522`,
  `item126.mjs:527`, `item83f.mjs:106`, `item83f.mjs:148`,
  `item84.mjs:173`, `item84.mjs:240`, `item84b.mjs:183`,
  `item84b.mjs:248`, `sc2.mjs:1117`.
- **2** are the complex-shape sites: `th2.mjs:353` (a nested optional
  chain), `tu5.mjs:449` (a multi-statement if-guard body).

These 17 are this build's own honest remainder — a boundary this pass
could not safely reach, in the same posture as the census's own 48
unresolved sites (S0 survey) and item 155's declined 1,443.

---

## §2 · THE TRANSFORM — BOTH CLASSES REDUCE TO ITEM 151's OWN S0 EXAMPLE

```js
// optional chain
// before:  RECEIVER?.VERB(ARGS)
// after:
(() => { const __t = RECEIVER; if (!__t) throw new Error(MSG); return __t.VERB(ARGS); })()

// if-guard
// before:  if (X) STATEMENT
// after:
if (!X) throw new Error(MSG);
STATEMENT
```

The if-guard form DROPS the redundant `if (X)` wrapper around the original
statement, matching item 151's own S0 doc precisely: after the throw, X is
guaranteed truthy, so the act is unconditional rather than re-wrapped —
"the same act, but absence is a finding, not an outcome."

A real, representative example (item126.mjs, an if-guard site):

```diff
- await app.evalJs(`(() => { const row = document.querySelector('.wz-sliver-instruments-row'); const gear = row ? [...row.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || '') === 'Writing settings') : null; if (gear) gear.click(); })()`);
+ await app.evalJs("(() => { const row = document.querySelector('.wz-sliver-instruments-row'); const gear = row ? [...row.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || '') === 'Writing settings') : null; if (!gear) throw new Error(\"no gear target\");\ngear.click(); })()");
```

And an optional-chain site (item121.mjs):

```diff
- await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
+ await app.evalJs("(() => { const __t = document.querySelector('.wz-sliver-grip'); if (!__t) throw new Error(\"no click target\"); return __t.click(); })()");
```

**Re-encoding uses `JSON.stringify` on the new cooked text, never a
hand-written escape** — item 152's own lesson, applied at the point where a
hand-rolled escape would have been tempting. The tool never types a `\n` or
`\"` itself; `JSON.stringify` computes correct escaping for whatever
content results, which is why the quote style sometimes flips from
backtick to double-quote (visible above) — a behavior-neutral side effect
of re-encoding through one canonical path rather than trying to preserve
the original literal's own punctuation.

---

## §3 · VERIFICATION — TWO INDEPENDENT INSTRUMENTS, NEITHER ONE "IT STILL PARSES"

**(a) The rewrite tool's own post-write byte comparison.** Every write is
followed by re-reading the FILE FROM DISK, re-running the same Pass-1
extraction the census uses, and comparing the re-extracted cooked text
against the exact text the tool intended to write:

```
137/137 intended rewrites confirmed byte-identical in the file actually on disk.
ALL REWRITTEN FILES: BYTE-VERIFIED
```

(137 distinct call-site rewrites carrying 139 offender-level edits — two
call sites each held two offenders, collapsed into one rewritten literal
apiece.)

**(b) A SEPARATE tool — the original S0 census (`item154-census.mjs`),
unmodified — re-run against the changed tree, independently of the
rewriter's own report.** Two tools built for different purposes agree:

```
OFFENDERS (the real boundary):     17
```

156 → 17 is exactly 139 fewer, and 17 is exactly this build's own named
remainder (§1) — not a number arrived at by trusting the rewrite tool's
self-report, but by a second, independently-built instrument counting the
population from scratch on the file as it now stands.

**Also checked, not assumed:**

- `ALREADY-GUARDED-SAFE: 0`, both before and after — the census's detector
  for "an if-block that already throws" does not match this build's OWN
  new shape (a throw-then-unconditional-act, not a throw-inside-an-if), so
  this stays at zero correctly; it is a different pattern shape, not a
  missed count.
- **Zero offenders live inside a resolved helper/binding** (`rectOf`,
  `DRAG_HELPER`, etc.) — checked directly before building anything, because
  had one existed there, fixing it once would need to apply to every call
  site referencing it, and the census's per-call-site counting would have
  overcounted a single textual defect as one instance per reference. None
  did; this was a real risk considered and ruled out, not assumed away.
- Every real V8 parse asked TWICE per rewritten site — the new INNER cooked
  text (`vm.Script`), and the whole OUTER file afterward (`node --check`,
  via a temp copy, since the outer file is an ES module with top-level
  `import` that `vm.Script` cannot parse). A parse of garbage is still a
  parse; both checks ran before either file was trusted.

---

## §4 · WHAT THIS COMMIT CHANGES

50 harness files, 139 offender sites, 137 call-site rewrites. `tsc --noEmit`
exit 0. `build:web` exit 0, **bundle hash unchanged**
(`index-DfFOCr6L.js/586771b` — confirming harness-only changes, no app
source touched). All 50 touched files individually re-verified with
`node --check` after the fact, outside the rewrite tool's own internal
check, as a second look rather than trusting the tool's own report alone.

**No suite has been run.** This offer stops at the same boundary every
offer in this arc has: built, verified two independent ways, not launched.
