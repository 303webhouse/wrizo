# ITEM 148 — EVERY SEAM, NOT FOUR VERBS (tools lane; branch `item147-148-guards`)
### The guard inverted · browserless built and green · **box legs owed** (bm1, item97, tu5, b2, fx9, item85c) — lands at a batch boundary (it can turn a green red)

Census: `item148-census.md` (re-derived on main; 40 seams / 21 files then; 42 seams / 92 units by the AST count now that namespace members and the `__wrizo*` forms are counted).

**Built.** `scripts/seam-census.mjs` (pure: source map in, units out) and `scripts/harness/item148.mjs` (22 checks, park count 0).
- **Every seam in every file, every attachment form** (property, element-access, `Object.assign`), and every namespace MEMBER is one unit. Coverage beside the verdicts: 155 files read; 42 seams by AST = 42 by an independent textual count; 63 debounced writers derived.
- **"Debounced writer" is derived**: any function whose call graph reaches `scheduleFlush`, followed across modules through relative imports. The flush machinery (`flushNow`, `durable*`) is a leaf. Nothing is a list of writer names.
- **Classes:** DURABLE (21) needs no entry · UNDURABLE = the footgun, a failure · SYNC-WRITE (6), FLUSH (1), READ-ONLY (64) each need a NAMED exemption with a written reason, and the CLAIM is checked against the class the code derives to (a "read-only" that reaches a writer is a red). New seam, new member, stale entry, placeholder reason, and a gutted `durable*` wrapper all fail.
- `ns.*` wildcards exist only for namespaces whose members are all one class; each member's class is still checked one by one.

**Product change (test seams only; no app code calls them).**
- `wrizoPairing.birth / pair / unpair` → `durableSeam(...)` (`persistence.ts`).
- `wrizoBible.add / edit / delete` → `durableSeam(...)` (`tutorBible.ts`); `durableSeam` gained `export`.
- `wrizoTouchInOrder` needed nothing: its direct `flushNow()` counts as a flusher.

**Falsification (virtual tree; nothing on disk mutated; each injection asserted to land):** wrapper removed from Pairing (by shape), from Bible (by file), TouchInOrder's flush removed (by verb), a brand-new verbless writer in a brand-new file, an unlisted read-only seam, an element-access seam, a read-only claim made false, a gutted `durableSeam`, a stale entry, a placeholder reason, a contradicting claim, and a scan that reads nothing. 12 mutants, all red on their own named kind.

**seed-guard.mjs is untouched and stays TRUE** (its OBS-1 check is now a strict subset); nothing parked, nothing edited. Suites: item148 22/22, item147 12/12, seed-guard 36/36 (browserless). `tsc --noEmit` 0, `build:web` 0.

**Owed on the box** (the wrapped seams now flush): `bm1`, `item97`, `tu5`, `b2`, `fx9`, `item85c`. A flush returns the same value earlier, so none should move; that is the claim the run tests.

**Unmeasured, named.** The trace follows named relative imports only (no `import *`, no re-exports, no dynamic access); a seam whose write hides behind one would read as read-only. The 42-seam textual cross-check would not see it either. No seam on main uses those forms today; a violation would show as a file the census cannot resolve, which it does not currently report. Unbuilt.
