# Rulings: `apps/desktop/src/components/UnbornSurface.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[UnbornSurface §n]` points here.

## UnbornSurface §1

From `apps/desktop/src/components/UnbornSurface.tsx`, line 10 at `e2898deb` (the comment that stays: "a surface is unborn while opened but empty: live and typeable, with no row; editors read it through useUnborn(id), which returns null once born").

```ts
// PB1 — the unborn surface's own context (item 71; specification at
// docs/wrizo-alpha/pb1-unborn-surface.md).
//
// A surface is "unborn" while the writer has opened it but not yet put anything
// in it. It is fully live and typeable; it simply has no row. Both editors
// (PageEditorView, BoardEditor) reach that fact through `useUnborn(id)` rather
// than through prop-drilling, because the fact is about the SURFACE's
// lifecycle, not about any one control's props — and because the editors are
// deep trees whose children (the cascade, the Page face, the sliver) each need
// to answer for it independently.
//
// `useUnborn(id)` returns null the moment the surface is born, so every call
// site reads as "if this is still unborn, …" and the born path is the ordinary
// one, unchanged.
```
