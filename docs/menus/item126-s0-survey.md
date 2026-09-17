# ITEM 126 · INK ACROSS MODES (121-B) — S0 SURVEY
### ink lane · 2026-09-11 · worktree `.claude/worktrees/item126-ink-across-modes` · branch `item126-ink-across-modes` off `origin/main` **pinned at `1e55179`**
### read FROM DISK, browserless, no box taken. Where this survey and the build brief disagree, DISK WINS.

---

## §0 · THE POINT OF THIS SURVEY

The build brief (`item126-build-brief.md`) was written **browserless during a
deploy window**, and it said so: six of its S0 questions were answered by this
same lane in advance and written down as **claims to verify, not facts to
trust**. This survey is that verification, against a base four days and many
merges later. **Every claim held.** Two things the brief could not have known
are added at §8.

**⚠ ONE SEQUENCING GATE IS NOT YET MET, and no patch has been made.** Fable's
ruling on §3.1 (Free Write's TEXT half stays INERT) is on `origin/item126-brief
@ 62ba992` and is **NOT on main** — main's copy of the brief still presents that
question as OPEN. The brief's own §0 says *disk wins*, so building from main's
text today would mean building against a stale question. **S0 is committed now
(the brief's "S0 FIRST"); B1–B6 wait for the ruling to land.**

---

## §1 · THE ONE GATE — confirmed

`InkStratum` has **exactly one mount in the entire app**:

- [PageEditor.tsx:684](apps/desktop/src/pages/PageEditor.tsx#L684) —
  `{framed && mode === 'journal' && (` … `<InkStratum` at :685.

Every other occurrence is an import or a comment
([Sliver.tsx:21](apps/desktop/src/components/Sliver.tsx#L21) imports the `InkPen`
*type* only; [PageEditor.tsx:12](apps/desktop/src/pages/PageEditor.tsx#L12) the
import; :619 a comment). **Nothing else decides the stratum's presence**, so B1
is one condition and there is no second gate hiding behind it.

**The five `mode === 'journal'` sites in PageEditor, mapped — only ONE is B1's:**

| line | what it gates | B1 touches it? |
|---|---|---|
| 638 | `forwardLock` (Free Write's own law) | **no** |
| **684** | **the InkStratum mount** | **YES — this one** |
| 823 | the sliver's freewrite content arm | **no** |
| 1033 | the `InkSwitch` in the band | **no** — the switch stays Free Write's |
| 1149 | `instrument` on the paper | **no** — `data-instrument` stays Free Write's |

That table is the guard against B1 being applied with a broad find-and-replace,
which would hand Draft an instrument switch it must not have.

## §2 · THE SHEET IS ALREADY UNIVERSAL — confirmed, and it is what shrinks the ticket

- `editorBody` at [PageEditor.tsx:610](apps/desktop/src/pages/PageEditor.tsx#L610);
  **the very first element it returns** is the sheet —
  `className="wz-ink-sheet"` at [:622](apps/desktop/src/pages/PageEditor.tsx#L622),
  `position:relative; width:100%; minHeight:100%` — **with no mode condition
  anywhere between the function head and that div.**
- `editorBody` is handed to **one** `ModeStage`, which takes `mode={mode}` as a
  plain prop and renders the children regardless:
  [:1153](apps/desktop/src/pages/PageEditor.tsx#L1153) (framed) and
  [:1221](apps/desktop/src/pages/PageEditor.tsx#L1221) (legacy).

**So the box the canvas anchors to ALREADY EXISTS in Draft and in Revise.** B1
extends a mount into a surface that is already laid out for it; it does not
build a surface. The anchor law's two-independently-measured-boxes check will
have a real second box to measure in all three modes on day one.

## §3 · THE EDITOR SPLIT — confirmed

[ForwardOnlyEditor.tsx:102](apps/desktop/src/components/ForwardOnlyEditor.tsx#L102)
— `const freeEdit = mode === 'drafting' || mode === 'revise';`

Draft and Revise share one editor path. **This is exactly why B6 must assert
them SEPARATELY:** a single wrong gate would pass one and fail the other, and a
suite that tested only Draft would call that green.

## §4 · WHAT IS NOT A MODE — confirmed

- **Screenplay is a page KIND, not a mode.** `ScriptEditor` is dispatched on
  `entry?.pageType === 'script'` at
  [PageEditor.tsx:1244](apps/desktop/src/pages/PageEditor.tsx#L1244) (and :1309),
  and it mounts **neither** `.wz-ink-sheet` **nor** `InkStratum` — grep count
  **0**. Out of scope, and not by oversight.
- **Board ink is box-local.** `BoardEditor` imports `renderStroke` and paints
  `box.strokes` per box
  ([BoardEditor.tsx:160](apps/desktop/src/components/BoardEditor.tsx#L160)),
  against the box's own width. A different owner, a different field. Out of scope.

## §5 · THE DOUBLE-CLICK CENSUS — the collision is NOT the one the brief feared

**The page surface binds NO double-click at all today.** `PageEditor`,
`ModeStage`, `ForwardOnlyEditor` and `InkStratum` contain zero `onDoubleClick`
and zero `'dblclick'` listeners. The only bindings in the app are on **other
surfaces**:

- [BoardEditor.tsx:2043](apps/desktop/src/components/BoardEditor.tsx#L2043) — the board card's own (text edit / page-pin travel).
- [CascadePanels.tsx:577](apps/desktop/src/components/CascadePanels.tsx#L577) — `onDoubleClick={onTravel}`.

**So the brief's worry about item 128's nested-board double-click is real as a
GRAMMAR question and empty as a COLLISION one** — different surfaces, no shared
element. The competitor B3 actually has to live beside is **the browser's own
native double-click word-selection**, which is the very thing Nick's sentence
protects ("text … only editable by standard in-line word processing led by a
cursor"). B3's miss-path is therefore not politeness; it is the feature.

## §6 · THE PARK SURFACE — ZERO PARKS OWED by the mount extension (statically)

- `item121.mjs` **S10** asserts *"the TEXT|INK switch does NOT mount on Draft"*
  ([item121.mjs:614](apps/desktop/scripts/harness/item121.mjs#L614)). **Still
  true after 121-B** — Draft gains no drawing and therefore no instrument
  switch. Not a park; it becomes *more* load-bearing, because it is what stops
  B1 being over-applied (see §1's table).
- **No harness anywhere asserts the stratum's ABSENCE**, in any mode. The only
  artifact is a **comment**, not an assertion:
  [item121.mjs:88](apps/desktop/scripts/harness/item121.mjs#L88) — *"the switch
  and the stratum are correctly absent a moment ago: they are Free Write's."*
  **That sentence becomes false at B1 and must be corrected in the same commit**
  — no park (nothing is falsified that was ever checked), but "sweep behaviours,
  not strings" cuts both ways: a comment that lies to the next reader is a defect
  even when no check goes red.
- `fx4.mjs:220-221` and `fx5.mjs:330-333` mention `.ink-committed`, and both are
  **comments about the RETIRED legacy Journal surface** (`.entry-full`, unrouted
  by FX14) — not live assertions, and not affected.

**⚠ STATICALLY ZERO IS NOT MEASURED ZERO.** This lane published "5 parks" on item
121 and the true count was 8; the three it missed were invisible to a green
unparked run because they lived in `HARNESS_PARKED` sections. **The park count is
settled by running BOTH settings, not by this survey.** §6 says where to look
first, not what the answer will be.

## §7 · PREP DONE, OFF THE BOX

- `pnpm install --frozen-lockfile` — clean (285 packages).
- `tsc --noEmit` — **clean**.
- `vite build --outDir dist-web` — **clean**, emits `dist-web/index.html` and
  `assets/index-BNOjHQno.js`.

This is the step that is on the record as costing a box slot when skipped: with
no `node_modules`, `run-suite` refuses at its own pre-run rebuild. **The slot,
when granted, will be spent on the suite and not on discovery.**

## §8 · TWO THINGS THE BRIEF COULD NOT HAVE KNOWN

1. **⚠ THE "PEN" RENAME LANDED NEXT DOOR, AND THERE ARE NOW TWO PENS.** Item 130
   added `modeBarPen: 'Pen'` to the desk lexicon
   ([deskLexicon.ts:590](apps/desktop/src/store/deskLexicon.ts#L590)) — it names
   **ModeStage's UNFRAMED (below-1100) pen bar**, which is the **TEXT-COLOUR**
   control item 121 §6.2 deliberately left alone, *not* the ink pen. The ink
   tip's own string is `inkTipPen: 'Pen'`
   ([deskLexicon.ts:597](apps/desktop/src/store/deskLexicon.ts#L597)).
   **Two lexicon keys, the same rendered word, different meanings, one file
   apart. They must not be merged, and 121-B must not "tidy" one into the
   other.** Recorded here because the next hand to see a duplicate string will be
   tempted. Item 121's ink layer itself was untouched by that rename — verified:
   no commit in the range touches `ink.ts`, `InkStratum.tsx` or `InkSwitch.tsx`,
   and all six of this lane's ink lexicon keys are intact.
2. **A FREE REPRODUCIBILITY CROSS-CHECK.** This worktree's `build:web` emitted
   `index-BNOjHQno.js` — **byte-identical to item 130's stamped bundle**
   (`bundle=index-BNOjHQno.js/573558b` at `d1f4be3`). Since this base is
   `1e55179`, four commits later, that simultaneously confirms **those commits
   are docs-only** and that **a clean-source build here reproduces the stamped
   one**. Worth one line because the opposite result — a different hash from an
   allegedly docs-only range — would have been a contamination signal.

## §9 · WHAT B1 NOW COSTS, stated so the offer can be checked against it

One condition at `PageEditor.tsx:684`; one prop shape (`active: boolean` →
`permission`); one comment corrected at `item121.mjs:88`. **Everything else in
the brief — the permission model, the hit test, the group, the move, the
persistence — is new behaviour built on a surface that already exists.** No
migration, no new column, no server file: `strokes` is untouched in shape by
anything in this ticket, and a move rewrites geometry inside the existing blob.

**Commit:** `Ink-B: S0 — survey (the one gate, the universal sheet, the editor
split, the dblclick census, the park surface)`
