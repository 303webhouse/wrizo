# ITEM 147 — THE PARK COUNT AS A CHECK (tools lane; branch `item147-148-guards`, from origin/main @ 1811b22)
### Browserless. Re-derived on the current tree, not inherited from ERRATA's offer (read for reasoning only).

**The defect:** run-suite reds a file only on a `FAIL` verdict line, non-zero exit, timeout, or no verdict. A parked check reaches the suite only through the file's `PARKED` line, so a literal `PARKED: PASS (0 checks)` over running park records is structurally green. `item87.mjs` was that file (four `pok()` records, a line saying 0).

**Why source, not output:** the printed N cannot be compared to a list length from output (output does not identify the list), and counting park calls is wrong (a loop parks 3 with one call; a `PARKED-DRIVER` probe fires only on a failure branch). So the guard asserts the verdict is DERIVED from the array the file pushes into, and that a FAIL form exists. Detection is by declaration + `.push` in the AST (comments ignored), never by helper name.

**Built:** `scripts/park-count-classify.mjs` (pure classifier), `scripts/harness/item147.mjs` (12 checks, park count 0), one fix to `item87.mjs`.

**Measured on 94 harness files:** DERIVED 41 · DECLARED-EMPTY 32 (19 with a literal `(0 checks)` line) · NOT-GATED 19 · SILENT 2 (`pw1`, `pw2`) · defects 0 (after the item87 fix).

**item87 fix:** the old literal line is quoted verbatim in a comment; the line is now derived from `parkedChecks.length` and has a FAIL form. **Its parked leg must now read `PARKED: PASS (4 checks)`** — the four records are byte-untouched and pass constant `true`, so nothing goes red. Verify on the next box turn that holds item87.

**Falsification:** four classifier mutants on a temp copy, each asserted to land and each red on a fixture (M1, blind to pushes, also reds the coverage check); item87's pre-fix source replayed from `origin/main` classifies CANNOT-FAIL.

**Informational, not built:**
1. 30 parked records in 13 files pass a constant `true` (a park that cannot itself fail).
2. 19 DECLARED-EMPTY files print a literal `(0 checks)`: one amendment away from being item 87. The guard reports the count each run.
3. `audit-parked-records.mjs` sits outside the roster.
