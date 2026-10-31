# Page / editor

**What lives here:** the writing surface: the page, its modes (forward-only, Typewriter, Outline), the screenplay surface, the sliver, and the frame around them.
**Owner (proposal):** FIX for typing and save, POLISH for the look. **Back to** [MAP](../MAP.md).

## Entry files
- `pages/PageEditor.tsx`: `PageEditor` and `UnbornPage` wrap `PageEditorView` (one large component). Autosave, mode switching, the first line, the links dock.
- `components/ForwardOnlyEditor.tsx`: the typing path. Kept whole through #13.
- `components/ModeStage.tsx`: the stage the page sits on; owns the paper click.
- `components/ScriptEditor.tsx`: the screenplay surface. `components/Sliver.tsx`: instruments, goal, Typewriter settings.
- `store/forwardOnly.ts`, `store/markRuns.ts`, `store/entryText.ts`, `store/draftFormat.ts`, `store/wordCount.ts` (the one word counter).
- Typewriter: `components/useTypewriterFade.ts`, `store/pageScale.ts`.

## Seams and hooks
`window.wrizoPatchEntry` (write a page's text and fields), `window.wrizoFirstLineInvite`, `window.wrizoSetWritingGoal`, `window.wrizoResume`.

## Full pair
All of it: `PageEditor`, `ModeStage`, `ForwardOnlyEditor` and the typing path are full-pair files.

## Covering harnesses (start here)
`typewriter-page.mjs`, `typewriter-scope-source.mjs`, `typewriter-glide-keys.mjs`, `fx1.mjs`, `fx2.mjs`, `ab2.mjs`, `typing-latency-scroll.mjs`, `polish10-wordcount.mjs`.

## Known traps
- **Page is primary:** no tool may move, resize or unmount the page; the Typewriter zoom is the one ruled exception ([canon](../page-primacy-canon.md)).
- **A mode switch re-persists late** (about 1.1 s). A read sooner looks like data loss.
- **`window.wrizoFlushNow` does not save the editor.** Wait on the stored text, never on a flush call.
- **The paper click belongs to `ModeStage`**, not the editor. Search the wrapper before calling something a bug.
- **Outline Enter bypasses `marks.enter`.** Known, not urgent.
- **The pen is inert on non-Journal surfaces:** a stylus tap on a page does nothing, by ruling.
- **A Custom Highlight (paint layer) range detaches when the editor re-renders.**
