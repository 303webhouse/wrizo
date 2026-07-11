# S1 — the element engine · build brief

**Place at:** `docs/s1-script-editor-brief.md` · 2026-07-11 · Branch: `s1-script-editor` off post-J5 `main`.
**Canon:** `s-arc-screenplay-plan.md` (v1.1) · `structure-spine-plan.md` · `fragments-under-pages-canon.md` (ScriptDoc ratified §3) · house laws standing.
**Why:** the Screenplay door has existed since B1/F4 but opens onto a plain typewriter. S1 builds the room: the substrate, the birth paths, and the block editor whose keyboard IS the interface. This is the arc's heavyweight — plan it at ~2× a J-ticket. One ship report (report = push); if the editor fights back mid-build, push WIP to the branch and request a sanity read rather than guessing.
**Protocol:** report = push, NOT merged; Fable reviews the diff; merge on Nick's word; `railway up`; S25 + desktop feel gates join the consolidated hardware session. Device verdict closes the ticket.

## Amendment to plan v1.1 (logged here, supersedes)

The plan's risk list said S1 adds no deps. **S1 carries exactly one: `@fontsource/courier-prime`** (Regular + Bold). The script surface without Courier is not the room — ch-unit geometry AND the industry feel both hang on it, and the house pattern is self-hosted @fontsource (the F5 precedent). `pdf-lib` still waits for S2. No other deps.

## Slice 0 — orient + verify (read-only; report drift before building)

Grep/confirm on merged `main`, correcting this brief's names to reality if they drifted:
1. `PageType` union members + defining module; `PAGETYPE_LABEL`'s home (resume vocab); `Project.kind` still carries `'screenplay'`.
2. `PageEditor()`'s outer delegation wrapper (`pageType === 'board'` → `BoardEditor` before hooks run) — S1 adds the third delegate the same way.
3. `createBinderPage` / `createBoardPage` signatures; the F4 CreateProject birth path where every real form currently births a **manuscript** page.
4. The `boxes` jsonb recipe end-to-end: `types` → `persistence` → `sync.ts` both mappers (`rowToJournalEntry` + `upsertJournalEntries`, JSON.stringify'd) → `migrate.ts` `ADD COLUMN IF NOT EXISTS`. `script` mirrors it exactly.
5. VW prose-surface wiring points (paste guard + whisper + own-shadow) and how `ForwardOnlyEditor`/PageEditor mount them; `useSessionLog` surface values in use.
6. Confirm Courier Prime is absent since the brand paint (`--font-mono` falls back to system mono) — S1 reintroduces it **scoped to the script surface only**, never to `--font-mono` globally.
7. StoryPlan/BeatWizard: read-only confirmation they exist untouched — S1 reserves `beatId?` on `Scene` and does NOTHING else with the plan (P-arc's lane).

## Slice 1 — the substrate (fragments-canon §2, the `boxes` recipe verbatim)

- `types`: add `pageType 'script'`; add per plan §2.2B —
  `ScriptElType = 'scene'|'action'|'character'|'paren'|'dialogue'|'transition'|'shot'|'general'`;
  `ScriptEl { id, t, text, dual?: 'L'|'R', struck?: boolean }`;
  `Scene { id, heading: ScriptEl, body: ScriptEl[], number?: string, omitted?: boolean, beatId?: string }`;
  `ScriptDoc { v: 1, title?: TitlePageFields, scenes: Scene[] }` (`TitlePageFields` = `{ title?, byline?, contact? }`, dormant until S2).
  `dual`/`struck`/`number`/`omitted`/`beatId` are **reserved-not-built** — present in types, never written by S1 UI.
- `journal_entries.script jsonb` in `migrate.ts`; both sync mappers carry it like `boxes`.
- `persistence`: `getScriptDoc(entryId)` / `saveScriptDoc(entryId, doc)` — the save writes the doc AND the derived `entry.text` shadow in one call (canon §2.4). Shadow serialization (this string is S3's future parser input — keep it boring and stable): elements in order, blank-line separated; sluglines/character/transition/shot uppercased; character line then its paren/dialogue lines directly beneath; no indentation, no markup. Golden-string it in the harness.
- `PAGETYPE_LABEL.script = 'SCRIPT'`.
- **First deploy runs the live prod round-trip check** (the D2/J4 ritual): save a script page, pull on a second session, byte-compare the doc.

## Slice 2 — the birth paths

- CreateProject: `kind === 'screenplay'` births a **script** page (not manuscript) and opens it — title-later law unchanged, caret waiting in the scene-heading ghost.
- ProjectHome: script pages group atop Manuscript; "＋ New script page" alongside the existing "＋ New page (type)" picker, which gains **Script**. Any binder may hold script pages (TV episodes are siblings); the Screenplay kind just defaults to one.
- Existing screenplay-kind binders (if any in prod) are untouched — their manuscript pages stay manuscript pages.

## Slice 3 — ScriptEditor, the room

`PageEditor()` outer wrapper delegates `pageType === 'script'` → `ScriptEditor` before hooks (J4 rule). The block editor, per plan §2.2C:

- One styled block per element in one scroll surface; **the active element only** is a live contenteditable (`plaintext-only`, guarded fallback `true`) — seed once per edit session, keyed remount (`BoardTextBox` pattern). Inactive elements are rendered text. Cross-element selection exists in a read layer for copy-out only.
- All geometry in `ch` on Courier Prime — these constants live in a new shared module **`scriptMetrics.ts`** (S2's paginator imports the SAME module; this is the one-truth seam):
  widths `{scene:60, action:60, shot:60, general:60, dialogue:35, paren:19, character:38, transition:60}` · indents `{scene:0, action:0, shot:0, general:0, dialogue:10, paren:16, character:22, transition:right-aligned-to-60}` · uppercase types `{scene, character, transition, shot}` · `PAGE_LINES 55` + `SPACE_BEFORE {scene:2, paren:0, dialogue:0, rest:1}` (dormant until S2, defined now).
- The keyboard map lives in one module **`scriptKeys.ts`** — the FROZEN table below, the two formerly-UNVERIFIED cells commented `AMENDABLE (frozen 2026-07-11, Nick's word; flip here if a verdict lands pre-merge)`:

  | From | Enter → | Tab → |
  |---|---|---|
  | scene | action | action |
  | action | action | character |
  | character | dialogue | **transition** |
  | paren | dialogue | dialogue |
  | dialogue | **action** | paren |
  | transition | scene | scene |
  | shot | action | character |
  | general | action | action |

  Plus: Enter on an **empty** element retypes it to the Enter-target in place (no blank litter — spacing is the machine's job); Enter mid-text splits at the caret (tail goes to the new element, trimmed); Tab retypes per the map at any caret position, Shift+Tab cycles the type list backward; Ctrl/Cmd+1–8 sets type directly (scene…general); Backspace at an element's head merges into the element above; ↑/↓ walk elements at their edges.
- **Smart conversions:** leading `int.`/`ext.`/`est.`/`i/e` in an action promotes it to a scene heading live. Uppercase types store uppercased on commit (display via CSS while typing).
- **Autocomplete** (quiet popover, never modal, Esc dismisses): characters + locations derived live from the doc (two-letter threshold), slugline prefixes, time-of-day after ` - ` (accepting a location appends ` - ` and chains straight into the TOD list), extensions after `(` on a character line, transitions. Arrow/Enter/Tab accept.
- **Auto (CONT'D):** committing a character whose name (sans extension) matches the previous speaker with intervening action gains ` (CONT'D)`.
- Ghost placeholders per type on the empty active element. Accent spent ONLY on the caret and the active element's hairline. Warm paper surface on ground, per tokens; Courier Prime scoped here only.
- Autosave: 2s debounce + `flushNow` on hide/unmount (house pattern), through `saveScriptDoc` (doc + shadow together, one write).
- **Mode law, interim:** script pages ship **Draft law only** — no mode strip on this surface until S4 brings script Free-write. State it in a comment where PageEditor mounts the strip.

## Slice 4 — the room's law wiring

- **Voice Wall:** the script surface joins the prose-surface set — foreign paste blocked + whispered; own-ink shadow honored; copy-out sacred ("Copy script text" emits the derived serialization).
- **Pen discipline:** I0 pattern on the whole surface — the pen points, never types, never inks.
- **TTFK:** `useSessionLog` mounts with `surface: 'script'`.
- **Resume/mirror:** verify (don't build) that F1/F2 pick up the SCRIPT tag + the shadow's last line for free.

## Slice 5 — the harness (`scripts/harness/s1.mjs`, committed same commit)

Cell-by-cell conformance of the frozen Enter/Tab table (every row, both keys); empty-Enter retype; split-at-caret; backspace merge; `int.` promotion; the location → ` - ` → TOD autocomplete chain; character two-letter completion; extension completion; auto (CONT'D); uppercase-on-commit; shadow golden-string stability; jsonb reload round-trip; birth paths (screenplay kind opens a script page; picker leaf works; old binders untouched); VW paste-block + whisper on the surface with copy-out intact; ghost visible on empty active element. Plus re-runs: `j4.mjs`, `j5.mjs`, `tsc` (desktop + server), `build:web`, selftest.

## Non-goals (S1)

Pagination, Print view, title page, PDF (S2) · scene rail (S2) · Fountain/FDX (S3/S5) · script Free-write + strikes (S4 — `struck` stays dormant) · dual dialogue (S5) · scene reorder · beat chips / plan linking (P3 — `beatId` stays dormant) · reports, scene numbers, revision anything (deferred suite) · phone optimization (graceful degradation only; the surface must not break on S25, not shine there).

## Invariants

No styling toolbar, ever (anti-Canva — this surface is its purest form). AI covenant untouched. Voice Wall holds. Ink sealed in the Journal. Orange accent = caret + active hairline only; square corners; solid borders; Courier Prime scoped to the script surface. "Journal" noun untouched; the only new user-facing noun is **Script** (the picker keeps F4's "Screenplay" kind label). Zero new collections — one jsonb column through both mappers, prod round-trip on first deploy. One new dep (`@fontsource/courier-prime`), nothing else. Internal names free, commented. Harness persisted per the rule. Report = push; merge waits on Fable's review + Nick's word.

## Definition of done

1. Screenplay-kind create lands the caret in a script page's scene-heading ghost — no title demanded.
2. The frozen map passes cell-by-cell in-harness; the two AMENDABLE cells are flagged in `scriptKeys.ts`.
3. The autocomplete chain (INT. → location → ` - ` → DAY) works end to end; two letters completes a known character; `(` completes an extension.
4. (CONT'D) arrives on its own after intervening action.
5. `entry.text` carries the golden serialization; the resume mirror shows SCRIPT + the last line unprompted.
6. The `script` column survives reload AND the live prod push/pull round-trip byte-exact.
7. Foreign paste on the surface is blocked with the whisper; copy-out emits the serialization untouched.
8. The pen points and cannot type or ink.
9. `s1.mjs` green and committed; `j4.mjs` + `j5.mjs` re-run green; `tsc`/`build:web`/selftest green.
10. S25 + desktop feel gates logged for the consolidated session (typing rhythm, ghost legibility, autocomplete at pointer and thumb) — **Nick's device verdict closes the ticket.**
