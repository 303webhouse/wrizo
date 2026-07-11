# J5 — Fable's review · `j5-spread-console` @ `135642a`

**Place at:** `docs/j5-review-fable.md` · 2026-07-11 · Reviewed against `docs/j5-spread-console-brief.md`, `j-arc-design.md`, house laws.
**Verdict: REQUIRED FIXES — 3, all small.** Apply on-branch, re-verify, push; merge waits on Nick's word (J4 protocol). No data-loss-class findings. The build is faithful to the brief everywhere else.

## What held (verified in the diff, not the report)

- **Zero-schema invariant:** no server files touched; sync untouched; all new persistence is client-side on pre-existing fields. Confirmed.
- **One ordering implementation:** no new `orderIndex` writers anywhere in the diff; lenses are pure views; the `dragEnabled` gate covers **every** deviation (`order==='your' && content==='all' && !starOnly && !tagFilter`) — filters included, which was my first thing to check. The `onDown` early-return mirrors the proven `selectModeRef` guard, so tap/select/focus paths are untouched by construction.
- **Two-verb law:** every leaf tagged; `appendToChapter` is read-only on sources (byte-untouched harness-asserted); `attachToPlanBeat` moves nothing, dedups `routedProjectIds`; `appendToBoard` appends `[...existing, ...new]` with `startY = max(y+h)+gap`, `startZ = max(z)+1`, and the `buildPortedBoxes` extraction preserves the fresh-board path byte-for-byte (J4 scenario re-run green covers the regression).
- **Vocabulary canon:** both aria-label violations fixed ("Journal" / "Journal spread"); internal names untouched; the header comment records the ruling.
- **Selection semantics:** id-keyed, survives lens flips, count is total-not-visible, and sheet actions correctly act on the **full** selection (consistent with the count's honesty).
- **Harness quality:** exact-string toast asserts, the zero-`orderIndex` assert reads localStorage after clearing the debounce window, sources byte-compared. The two harness-authoring fixes (navigate-away-first seeding; id-polling over blind sleeps) are the right lessons and are written into the scenario as comments. Disclosure section is honest.
- **Empty-drawer leaf collapse** ("＋ New project (Untitled)" + standalone merged into one leaf): correct reading — the brief's own "(same mechanics)" concedes they were one operation with two labels. Ratified; A3 below just logs it.

## Required fixes (CC executes verbatim, on-branch)

**R1 — single-page MOVE feedback is lost.** In `JournalEntry.tsx`, the MOVES path calls `toast.show(message)` then `navigate('/journal')` — the toast node lives inside the view being unmounted, so a FILE from the entry view completes **silently**. DoD 8 promises the verb toast per action; the Spread flow delivers it, the single-page flow cannot. Fix: pass the message as one-shot navigation state and have the Journal list consume-and-show it (the F2 `warmStart` consume-on-arrival pattern — `replace` the history state so refresh never re-toasts; the Journal list mounts the same `useActionToast`). Extend `j5.mjs`: single-page FILE-to-Shelf → assert the toast text is visible **on `/journal` after the navigation**, and that a reload shows no toast.

**R2 — DoD 2's positive half is unverified.** The scenario asserts drag is *blocked* under a non-default lens (zero writes, note shown, note gone on return) but never performs a **successful default-lens drag reorder**. The `dragEnabled` threading touched the exact drag-arming path (`onDown`); an inverted flag would kill all reordering and nothing committed would catch it — J3 predates the harness rule, so no persisted J3 script backstops this. Fix: add one check to `j5.mjs` — default lens, `__pointerSeq` (the helper is already in the file) drags a cell past the mouse threshold onto a new position, assert the visible order changed AND the `orderIndex` write landed in localStorage (after the 400ms window) AND survives a reload.

**R3 — multi-source append order: ruling + pin.** The brief says chapter-append lands "in selection order"; the code passes `pages.filter(p => selected.has(p.id))` — **notebook order**, regardless of click sequence — and the backlog entry repeats "selection order" while describing code that does otherwise. **Ruling: notebook order STANDS.** It matches J4's port precedent ("sourced in notebook order") and the "Your order" canon — the writer's arrangement outranks click sequence. Fix is docs + pin, not behavior: (a) correct the backlog J5 line to "notebook order (Your order) — the J4 port precedent"; (b) one comment at the `sourceIds` construction in `Spread.tsx` naming the ruling; (c) add a two-source chapter-append check to `j5.mjs` asserting the appended blocks land in notebook order even when clicked in reverse. *(Nick: if you actually want click-order, say so in the relay and R3 inverts to a code fix — my recommendation is it doesn't.)*

## Advisory (non-blocking — for the merge word or the hardware/design pass)

- **A1 — toast plural grammar:** "Filed 3 pages … — moved; **it** left the Journal." The brief's own template said "it"; with N>1 it reads off. One-line polish if wanted ("they left" for N>1).
- **A2 — brass on MOVES verb tags** vs the invariant "brass = active/selection only." Defensible (the consequential verb earns the eye) but it's a token-law exception — ratify it or drop MOVES tags to `--text-mid`. Nick's taste call at the gate session.
- **A3 —** empty-drawer leaf collapse, ratified above; logged here so the deviation is on the record.
- **A4 —** `appendToBoard` onto an *empty* existing board starts at `gap` rather than the fresh-board `0.06` — cosmetic, invisible in practice.
- **A5 —** after a Spread FILE, Select mode stays active with an empty selection. Matches the brief as written; the S25 pass may want auto-exit — feel call, not a fix.

## Protocol

R1–R3 on-branch → re-run `j5.mjs` (now ~36 checks) + the J4 scenario + `tsc`/`build:web`/selftest → push → I spot-check the delta → Nick's merge word → `railway up` → S25 + desktop gates per the brief's DoD 11. The two hardware gates remain the DONE bar regardless.
