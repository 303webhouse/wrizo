# S1 — Fable's review · `s1-script-editor` @ `28c3f51`

**Place at:** `docs/reviews/s1-review-fable.md` · 2026-07-11 · Reviewed against `docs/briefs/s/s1-script-editor-brief.md`, the fragments canon, house laws.
**Verdict: REQUIRED FIXES — 2** (R1 code, R2 verification), advisories logged. No data-loss findings, no sync-law findings. For a 1,400-line heavyweight this is an unusually clean build — the one real defect lives precisely in the corner the harness never visits.

## What held (verified in the diff, not the report)

- **Sync law, perfect:** `script` in both mappers; the upsert's column list, `$1–$20` placeholder renumbering, `::jsonb` casts, ON CONFLICT set, and param-array order all check out against `boxes` — I counted every position. `migrate.ts` matches the house DDL convention.
- **The substrate:** types exactly per brief, reserved fields present and never written; `saveScriptDoc` writes doc + shadow in one call; `createScriptPage` seeds the doc so `entry.text` starts `''` (title-later law); `groupIntoScenes` carries dormant fields forward via `prevScenes` — the regroup can't silently strip `number`/`omitted`/`beatId`.
- **The editor's hard parts:** single-live-editable with seed-once + keyed remount is the BoardTextBox pattern verbatim; retype preserves the caret for free (type isn't in the key — nice); Enter reads the DOM as ground truth; commit applies (CONT'D) before uppercase (correct order — name-matching needs raw case); empty-Enter retypes in place; hooks all unconditional with the guard return after them.
- **Law wiring:** `.script-el-active` joins PROSE_SURFACES; paste/drop/beforeinput guards match BoardTextBox; own-shadow paste harness-proven allowed; I0 pen neutralization verbatim; TTFK widened and mounted; Draft-only commented at the delegation site.
- **Birth paths:** `addSupport` routes `script` → `createScriptPage`, never the generic creator — a page can't be born docless. Non-screenplay kinds harness-proven untouched. The "Scripts section only when non-empty" reading (dedicated button lives inside it; the picker leaf is the first door on other binders) is a fair interpretation of the brief's ambiguous phrasing — ratified.
- **Harness:** 82 substantive checks, the synthetic-keydown rationale documented, cell-by-cell table coverage, the full autocomplete chain, negative birth-path check, honest disclosure section. The harness-authoring bug writeup (stale caret → cascading 14) is exactly the kind of lesson that belongs in the file.

## Required fixes (CC executes on-branch)

**R1 — the autocomplete popover is unanchored.** `AutocompletePopover` renders as the LAST child of `.script-sheet`, `position:absolute` with **no top/left anywhere** (JSX has no inline coords; the CSS class sets none) — so it takes its static flow position at the *bottom of the entire sheet*, regardless of where the active element is. Every harness interaction edits the document's tail, so all 82 checks pass while the popover is broken for the primary case: editing mid-document in any script longer than a screen, where it renders below the fold — invisible. Fix (cheapest correct): emit the popover **inside the map, immediately after the active element** — its static absolute position then sits directly beneath the active block, indented with `marginLeft: INDENT_CH[type]ch` so it hangs under the text, and it stays out of the element flow. Extend `s1.mjs`: with the active element mid-document (elements exist after it), assert the popover's `offsetTop` is within one line-height of the active element's bottom — not the sheet's.

**R2 — CSS-variable existence check (verification; code only if it fails).** The S1 styles consume `--ink-on-paper`, `--ink-on-paper-low`, `--ink-border`, `--ink-900`, `--ink-800`, `--paper`. An undefined CSS var fails **silently** — the ghost text, sheet border, and popover colors would simply not render, and neither `tsc` nor the harness can see color. Grep `index.css` and confirm every one of those six exists in `:root` (or the theme blocks); report the grep result in the fix log. If any is missing, map it to the correct existing token — do not mint new tokens.

## Advisories (non-blocking; two carry timers)

- **A1 — synthetic-heading id churn *(must fix before P3)*.** When element 0 is retyped away from `scene`, `groupIntoScenes` synthesizes an empty heading with a **new id on every autosave** until a reload materializes it. Nothing consumes scene ids in S1, and it self-heals on reload — but it violates the canon's stable-id rule the moment P3's beat links arrive. Fix shape (later): insert the synthetic heading into the *elements array* at synthesis time so it's real and id-stable immediately. Logged here so P3's brief inherits it.
- **A2 — merge/arrow commits read state where Enter reads DOM.** Backspace-merge and the arrow-walk commits use `elements[i].text` (state) while Enter's own comment justifies DOM-as-ground-truth. React's discrete-event flushing makes the gap unreachable in practice today, and IME (where it could matter) is already a disclosed gap — but the asymmetry costs one line to remove whenever the file is next touched.
- **A3 — the reload `waitFor` uses a comma operator:** `"!!a, !!b"` evaluates to only the second predicate. Harmless here (the second was the one that mattered) — intended `||`; fix opportunistically.
- **A4 — the shadow's "golden string" is containment-tested, not exact.** Add one exact-match assertion on a small fixed doc when `s1.mjs` is next touched — the serialization is S3's parser contract, and containment won't catch whitespace drift.
- **A5 —** ghost visibility on a *cleared* (typed-then-deleted) element depends on the browser dropping the empty text node (`:empty` semantics) — pure feel territory; add to the S1 gate items.

## Protocol

R1 + R2 on-branch → re-run `s1.mjs` (now ~84) + `j4.mjs`/`j5.mjs` + `tsc`/`build:web`/selftest → push → I spot-check the delta → **Nick's merge word** → `railway up` **+ the live prod round-trip for the new `script` column (the D2/J4 ritual — this deploy is NOT zero-schema, unlike J5's)** → S1's gate items join the consolidated hardware session. Nick's device verdict closes the ticket.
