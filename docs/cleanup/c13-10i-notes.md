# #13 step 10i: hooks out of PageEditorView (POLISH): step notes

Branch `c13-10i-pageeditor`, cut from `origin/main` **3bc58305** (Nov 5). At that commit `pages/PageEditor.tsx` is byte-identical to 8aae0c76's: 1,444 lines.

Fable pre-approved the hooks under 10g's rules (Nov 5): each hook is verbatim, called at the same spot, with explicit parameters and no dependency edits; the lint equals base once refs and setters are removed; `--allow` covers wiring only.

## The hooks

Three files in `pages/pageEditor/`. Each is one contiguous run of `PageEditorView`, called at the exact spot it left, so the effects run in the same order.

| Hook | Lines at base | Holds |
|---|---|---|
| `useFirstRunGate` | 384–397 | the gate's active/words/reached, publishing the gate's state, the theme choice that unlocks it |
| `usePageTypewriter` | 411–421 | the page's typewriter memory: read once at mount, held while in Draft |
| `usePageAutosave` | 449–503 | `flush`, `onTextChange` (the first word's birth), the 2 s debounced save, the flush on hide, logout and unmount |

- **Module constants:** each moves with the only hook that reads it. `AUTOSAVE_MS` goes to `usePageAutosave.ts`. `FIRST_RUN_WORD_TARGET` goes to `useFirstRunGate.ts` (exported, because the JSX reads it too).
- **Imports:** `PageEditor.tsx`'s own import list is unchanged (`noUnusedLocals` is off), so the module graph keeps its order. Step 11 trims the imports left unused, as it does for 10g.

**Not lifted (the brief named them):**
- **Mode switch:** not contiguous. The `mode` state is at line 164 and `switchMode` at 442–447 (six lines), with other hooks between them. It stays in place.
- **Links dock:** no links-dock code remains in PageEditor; it lives in the Tutor now.
- **First-run gate:** the gate's ref and state (299–310) stay in the component. The Draft caret-state effect (311–382) sits between them and the gate's logic, so only 384–397 is one contiguous run.

## Proof (browserless)

- **The split check with `--allow`:** 1,301 code lines before and 1,330 after; nothing missing. 29 lines added, all on [`c13-10i-allow.txt`](c13-10i-allow.txt) (three calls, plus each hook's signature, parameter types, return and closing brace), and every entry is used. 11/11 including liveness.
  - The tool's SCOPE plant used `pages/PageEditor.tsx` as its "outside" file. 10i splits that module, so the plant now names `c13-planted/outside-the-split.ts`.
- **`tsc`:** clean.
- **The react-hooks lint** (10g's method, the same scratch install): base `PageEditor.tsx` at 3bc58305 gives **0** messages. The split gives **1**: `missing dependency: 'textRef'` in `usePageTypewriter`, because a ref passed as a parameter loses its stable status.
  - With the six ref and setter parameters removed (`firstRunGateRequested`, `setGateUnlocked`, `textRef`, `unbornRef`, `lastSavedRef`, `setText`), the split gives 0, equal to base.
  - **Liveness:** with `id` dropped from `usePageTypewriter`'s `[mode, id]`, the lint still reports `'id'` after the removal.
  - No `eslint-disable` line was added; the two in the moved runs moved with them.
- **One reader:** `global-css.mjs` gets `MODULE_PARTS['pages/PageEditor.tsx']`: the module, then the three hooks in the order their lines stood. Every reader of PageEditor's text that reads through `srcText` now reads the join.
  - The raw readers (`hide-workshop-source`, `item207-core`, `glue-9`'s chip reads, `typing-latency-readers-guard`, `c13-10f-wordcount`) look only at lines that stay in the module.
  - `logout-flush` D3 finds `registerFlush(flush)` through the join. Its "imports the registry" check passes on PageEditor's kept import, as with 10g's note, so step 11's trim needs the hook's import there too.
  - `drawers-p1` D1c reports a branch's diff of PageEditor without judging it.
  - **Missed by my first sweep, found by Chat 1's Actions pair (2/22 on both legs):** `typewriter-page` P9 and P9b read PageEditor by plain path, and the typewriter memory's lines had moved to `usePageTypewriter.ts`. Fix `309987d8`: `pe` reads through `srcText`; the checks and regexes are unchanged.
  - **The mechanical sweep that replaced my hand grep** covered all 24 scripts naming `PageEditor.tsx`. It counts each regex or string literal on PageEditor at base, on the module alone, and on the join; on the old read it flags P9b (1 against 0).
    - The 13 scripts it flags all clear: four only mention PageEditor in comments (`ab2`, `fx2`, `fx5`, `flux-page-ink`). The rest read through `srcText` (base equals join), or their moved literal is generic (`/\s+/`, `/.*/`).
    - The raw reads of `hide-workshop-source` and `item207-core` test only lines that stay in the module.
- **Merged origin/main `2db62a73`** (10j, and FIX's readers-guard r2) at `28a1a9f0`, with no rebase.
  - The readers guard's THE PATHS names `pages/PageEditor.tsx` as the page's save path, and the save now lives in `usePageAutosave.ts`.
  - A new check, THE PATHS (10i), holds `pages/pageEditor/` to the same rule (no innerText or textContent reads), and requires that the sweep read the folder. It is added rather than edited because 10h edits the next line.
- **`c13-10-seams-check` A0:** its `SHIPS` list gains `pages/PageEditor.tsx`, as its own line says each merged split's entry does. 16/16 on both legs.
- **`seed-guard`:** 36/36.

## Proof (box)

Law 1 (page rect, scroll and caret across every panel open and close), the step 5 snapshot (parent against tip), the hooks-order guards, and the 104-file lane on both legs. Gate: the full pair (Chat 1).
