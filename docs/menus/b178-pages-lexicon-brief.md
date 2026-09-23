# ITEM 178 — "PAGES" IS WRIZO'S WORD FOR A DOCUMENT
### PLAN desk · 2026-09-22 · brief · **a census and a routing rule — the mechanism already exists**

**WORKTREE:** `.claude/worktrees/i178-pages-term` · **BRANCH:** `i178-pages-term` · **OFF:** `origin/main`.
**Never the primary checkout. This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — read the box ordering on the ledger or ask chat 1
> before any run; never infer your turn from quiet.

> **⚠ SYMBOLS ARE THE ANCHOR.** Census measured at `33d352e`.

> **✅ PRIMARY TEXT — Nick's own words** (`55cf81c`, part 1's NOTE), **pasted by him and byte-checked.**

---

## §0 · THE PRIMARY TEXT

> *"I want to change "Page" as the general term for the writing surface to "Pages," and this should be
> Wrizo's term for "document" or "docs" that is more commonly used. This is a sitewide change, although
> the important thing is that the user sees the term "Pages" as a stand in for "document" or "doc" or
> "docs," not that the backend code necessarily calls the writing surface that."*

---

## §1 · THE CENSUS — measured, not estimated (at `33d352e`)

**⛔ THE FIRST FINDING IS THAT THE MECHANISM ALREADY EXISTS, AND SO DOES HIS SPLIT.**
`store/themeLexicon.ts` maps a canonical term id to the current theme's display string, **and its own
header states his rule before he stated it:**
> *"Display projection ONLY: data, schema, routes, sync, and search keep the canonical nouns below
> forever — a search for 'drawer' must still work under any theme."*

| measured | count |
|---|---|
| the canonical term for a document | **`page: { one: 'Page', many: 'Pages' }`** — *already his word* |
| `lex('page')` call sites | **28** |
| `deskTerm`/`t()` keys whose id names a page | **50** |
| **lexicon VALUES that spell "page"/"pages" in the string itself** | **34** *(6 of them plural)* — **the leak** |
| **writer-facing strings that say "document", "doc" or "docs"** | **0** |
| places the app says **"Doc"** | **1 — the FLUX theme's override** (§3) |

**SO THE WORK IS NOT A RENAME. IT IS TWO THINGS:** *(1) close the leak — every writer-facing name for a
document comes from the term, not from a hard-coded word; (2) make plurals come from the plural form.*
**And one question only Nick can answer (§3).**

---

## §2 · THE RULE, AND THE TWO SLICES

> **EVERY WRITER-FACING NAME FOR A DOCUMENT COMES FROM `lex('page')` — `.one` OR `.many`, NEVER A SPELLED
> WORD AND NEVER `lex('page') + "s"`.** **Data, schema, routes, sync and search keep the canonical noun**
> — his own sentence, and the module's own law.

**S1 · THE LEAK.** The **34** lexicon values that spell the word are each resolved one of two ways, **and
every one is recorded**: **routed** through the term, or **kept canonical ON PURPOSE** with its reason (a
route, a data name, a test seam). *A string nobody classified is the leak that survives the sweep.*

**S2 · PLURALS.** **6** of the 34 are plural. **A plural built by appending "s" is a defect**, not a
shortcut — the module carries two number forms precisely because *"English pluralization isn't algorithmic
from a single canonical string."* **Every plural reads `.many`.**

**⚠ AND THE SWEEP IS BEHAVIOURAL, NOT TEXTUAL:** *grep for what a string DOES (names a document to a
writer), not for the letters "page"* — a value like **"Nothing else to add yet."** names documents without
containing the word, and **"Page Setup"** contains it without naming one. **The count is the check:
34 classified, 0 unclassified.**

---

## §3 · ⚠ THE ONE QUESTION — FLUX SAYS "DOC", AND IT IS THE ONLY PLACE THE APP DOES

**The Flux theme overrides the term:** `page: { one: 'Doc', many: 'Docs' }` — inside a whole coherent set
(*Cache · Rack · Cartridge · Node · Circuit · Deck · Log · Schematic · Checkpoint · Safehouse ·
Firewall*). **It is the single place in Wrizo where a document is called a Doc — the exact word his
ruling replaces.**

| reading | what happens to Flux |
|---|---|
| **(a) his ruling sets the CANONICAL vocabulary** *(lean)* | Flux keeps its costume; a writer who chooses a themed vocabulary chose it. **"Sitewide" means every surface, not every theme.** |
| **(b) "sitewide" is literal** | **Flux's `page` override is retired** and Flux says Pages, while its other twelve terms stay. |
| **(c) the reconciliation** | Flux keeps a themed word **that is not "Doc"** — *the theme arc coins it, not this desk.* |

**LEAN: (a), and it is the weakest lean in this brief** — *his sentence says "sitewide", and (a) reads a
limit into it that his words do not contain.* **This is one word from him, and the brief builds whichever
he says.** *(Recorded because a desk that quietly kept Flux would be deciding a founder's scope for him.)*

---

## §4 · WHAT DOES NOT CHANGE — stated so no one is thorough in the wrong direction
**Routes** (`/page/:id`), **`pageType`**, **`JournalEntry`**, **the seams** (`window.wrizoCreateJournalPage`),
**localStorage keys**, **search**, **every harness handle**. *His own words: "not that the backend code
necessarily calls the writing surface that."* **A rename that reached them would break the app to fix a
word.**

## §5 · THE HARNESS — `apps/desktop/scripts/harness/i178.mjs`
Standing laws: **drivers never assume existence** · **real pointer events** · **seed through the seams** ·
**absolute worktree path** · **select by name**.
1. **COVERAGE IS THE CHECK:** the census's **34** classified strings are asserted **by name** — routed or
   kept-canonical-with-a-reason — and **an unclassified one FAILS**. *A population of zero means nothing
   without a coverage number beside it.*
2. **THE THEME PROOF:** switch themes and **every writer-facing document name changes**, while
   **routes, seams and search do not** — one assertion each side.
3. **PLURALS:** a surface that names many documents reads `.many`, **never `.one + "s"`** (assert against a
   theme whose plural is not +s).
4. **"Document", "doc" and "docs" appear in NO writer-facing string** under any theme — *subject to §3.*
5. Both `HARNESS_PARKED` settings CLEAN; **park count audited.**

## §Q · FOR NICK
- **178-Q1 — Flux.** It is the only place Wrizo says **"Doc"**. **Does your ruling reach a theme a writer
  chose** (Flux says *Pages*), **or is a themed vocabulary a costume that may keep its own words** (this
  desk's lean), **or should Flux keep a themed word that simply is not "Doc"**?

## §CLOSE
1. S0 re-measures §1's counts at the build's own tree (they will have moved).
2. Build S1–S2; `tsc` + `build:web` + selftest + full suite, **both settings**, green.
3. **Push the branch. Do not merge.**
4. **A FOUNDER SITTING IS OWED** — *"the app calls them Pages everywhere I look"* is a meaning claim.

**Nothing deploys on this lane's word.**
