# #13 step 10g: the BoardEditor split (INK): step notes

Branch `c13-10g-board`, cut from `origin/main` **d1ede8e9** (Nov 4). At that commit, `BoardEditor.tsx` is byte-identical to 305bed60's: 3,328 lines.

## The commits

1. **060cba05 · the moves.** Three files in `components/board/`:
   - `geometry.ts`: the constants and the pure helpers.
   - `BoardBoxes.tsx`: the three box renderers.
   - `BoardCardPopup.tsx`: the card popup.

   Every line moves verbatim, and `export` is added where a moved declaration needs it. BoardEditor's own import list is unchanged (`noUnusedLocals` is off), so the module graph keeps its order. Fable accepted this; step 11 trims the unused imports with its own proof.

   **Proof:**
   - The split check: 3,130 code lines before and after; nothing missing, nothing added.
   - The bundle is byte-identical (`158f9542`) to a control build of d1ede8e9 whose only change is moving `notecardExcerpt` up 8 lines. So declaration order is the only change.

2. **9282b44e · the seven hooks.** Fable approved this list on Nov 4. Connection mode stays inside `useBoardGestures`.

   | Hook | Holds |
   |---|---|
   | `useBoardMeasure` | the wrap width, the room height |
   | `useBoardBox` | the area beside open drawers |
   | `useBoardSave` | the system-board reconcile, autosave and birth, grafts, the flush on hide and logout |
   | `useBoardReflow` | the font tick, the height floor |
   | `useRailLinkDrag` | a thumbnail dropped on the board becomes a linked copy |
   | `useBoardGestures` | select, move, resize, create, and connection mode |
   | `useBoardKeys` | Esc, Delete, Ctrl+Z |

   How they were made:
   - Each hook is one contiguous run of the component body, its lines verbatim, called at the exact spot it left, so the effects run in the same order.
   - Every outer value a run reads is an explicit parameter. The TypeScript checker found them, and each is typed from its own `useRef`/`useState` generic.
   - No dependency array was edited.
   - `type LastAction` moves to `geometry.ts`.
   - [`c13-10g-allow.txt`](c13-10g-allow.txt) lists the 97 added lines: signatures, parameter types, returns, closing braces and calls.

   **Proof:** the split check with `--allow`: nothing missing; 97 lines added, all of them on the list, and every entry used.

## The react-hooks lint (the method Fable accepted, Nov 4)

The repo has no lint, and this step adds no lint dependency. Fable's condition was "no new warnings against base". The method:

1. **Install the lint outside the repo, in a scratch folder.**
   ```
   npm init -y
   npm install eslint@8.57.0 eslint-plugin-react-hooks@4.6.2 @typescript-eslint/parser@7.18.0 typescript@5.4.5
   ```
2. **Run two rules programmatically** with ESLint's `Linter`: `react-hooks/rules-of-hooks` (as an error) and `react-hooks/exhaustive-deps` (as a warning). The parser is `@typescript-eslint/parser` with JSX on. Print one line per message as `<rule> | <message>`, with no file or line, so a moved hook's warning reads the same wherever its lines now sit.
3. **Base:** d1ede8e9's `components/BoardEditor.tsx` gives **4** messages:
   - 3 × "complex expression in the dependency array";
   - 1 × "missing dependency: 'id'", on the gesture effect.
4. **Split:** `BoardEditor.tsx` plus `components/board/*` gives **11** messages.
5. **Why the count rises.** The lint knows a `useRef` object or a `useState` setter is stable only inside the component that creates it. Passed in as a parameter, the same value is reported as a missing dependency, or as a `.current` read in a cleanup.
6. **The comparison.** Take the 36 parameters whose type in `c13-10g-allow.txt` is `MutableRefObject<…>` or `Dispatch<SetStateAction<…>>`, and remove their names from each split message. The split's messages then equal base's exactly: 3 complex-expression messages and "missing: id". The other 7 messages are left with no names.
7. **Liveness.** A copy of `useBoardGestures.ts` with `pageWidthPx` dropped from its dependency array still reports `pageWidthPx` as missing after the stable names are removed. So the comparison hides refs and setters only, never a real dependency.

No `eslint-disable` line was added.

## The readers (after the merge of POLISH's stack, which brings `MODULE_PARTS` and `--allow`)

- **One reader for the board.** `global-css.mjs` gets `MODULE_PARTS['components/BoardEditor.tsx']`, in this order: `geometry`, `BoardBoxes`, `BoardCardPopup`, the module itself, then the seven hooks in the order their lines stood. `srcText` of the module returns them joined.
- **Every script that reads the module's text now reads it through `srcText`:** 25 in all.
  - 19 already did, or needed only their BoardEditor read switched: `deck-rows-logic`, `sized-by-hand-logic`, `walk-open-select`, `item138`, `item163`, `item207-core`, `page-links`, `big-projects-1a`.
  - 6 read the bare file and were safe, but now read the join too, so the board has one reader: `board-context-menu`, `box-tombstones`, `big-projects-2`, `guided-w2`, `help-choose-census`, `page-scroll-return`.
  - The change is the read only. No assertion changes.
- **[`c13-10g-readers.mjs`](../../apps/desktop/scripts/c13/c13-10g-readers.mjs)** proves it:
  - **The parts:** the entry lists the module and every file in `components/board/`.
  - **The lines:** the join holds the module's 3,130 code lines plus the 97 allowed ones.
  - **The answers:** every distinctive string or regex literal of the 25 readers counts the same on the join as on the module at base. The 29 that move are explained one by one: each runs on CSS, on another file, on a loader list, or on a label, never on the board.
  - **Liveness:** a planted edit inside a part, and one inside the module itself, each turns a reader red. So does an unlisted script, and so does an explained entry that no literal uses.
- **Checked by hand.** The readers that slice by position:
  - `guided-w1` K10 and Y6, and `guided-w3` NT3: each slice stays inside one part, and the parts keep their order.
  - `walk-open-select` A1–A3: its marker and the dependency line after it now sit together in `useBoardGestures.ts`.
  - `item138` claim 6: its slice starts in `useBoardGestures.ts`.
  - `sized-by-hand-logic` S4: the set line and the two clear lines are each still found exactly once.
- **The mutant tables need NO re-point**, contrary to the brief's expectation:
  - `guided-w1`, `guided-w3`, `guided-add-scenes`, `guided-w2` and `flux-v2` apply a mutant to the text their checks read: `rd(over)` reads `srcText`, which is the join. So an entry naming `components/BoardEditor.tsx` lands on the join.
  - Re-pointed to a part, it would not land, because the checks read the join, not the part.
  - Their bundle loader takes `.ts` files only, so it never loads BoardEditor.
  - All six moved anchors redden source checks: S11, NT3, SH4b and FM2.
- **One re-point: `typing-latency-readers-guard.mjs`.** It walks every file raw and classifies each DOM-text read by FILE, so its four BoardEditor entries follow their code: three to `board/BoardCardPopup.tsx`, one to `board/useRailLinkDrag.ts`. The text of each entry is unchanged.
- **Unaffected:**
  - box-tombstones T11's per-file raw `.boxes` counts are identical on base and split, recomputed on both trees.
  - `th-machina-source` M11 and `guided-w3` NT1 walk every file through `srcText`. They read the board's lines twice, which is harmless: no board file imports `themeFontFaces`, and no board part reads `.prompt`.
- **Note for step 11:** `logout-flush` D3's "imports the registry" passes on BoardEditor's kept, unused `registerFlush` import. When step 11 trims that import, D3 needs the hook's import instead.

## Still to come in this step

- The box turn: the board snapshot (baseline and compare in the same turn), the gesture and reader harnesses on both legs, and the link check.
- The full pair.
