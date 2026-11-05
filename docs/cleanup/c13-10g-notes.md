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

## Still to come in this step

- Merge `origin/main`, after POLISH's 10a → 10b → 10d → tools stack.
- Add one entry: `MODULE_PARTS['components/BoardEditor.tsx']`.
- The readers check, and the reads switched to `srcText`.
- Re-point the mutant entries whose anchor moved: `guided-w1` 352 and 353 to `board/useBoardMeasure.ts`; `guided-w3` 433 to `board/BoardBoxes.tsx`, 439 to `board/useBoardGestures.ts`, 451 and 452 to `board/useBoardSave.ts`.
- The box turn: the board snapshot (baseline and compare in the same turn), the gesture and reader harnesses on both legs, and the link check.
- The full pair.
