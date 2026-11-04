# Rulings: `apps/desktop/src/pages/QuickSprint.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[QuickSprint §n]` points here.

## QuickSprint §1

From `apps/desktop/src/pages/QuickSprint.tsx`, line 425 at `4d6af3d9` (the comment that stays: "Postures + the Publish file action inline in one strip (the Workshop tab is hidden until built)").

```ts
        {/* Postures + the Publish file action inline in one strip (Workshop tab hidden until built - Nick, Oct 23 11:01 am). */}
```

## QuickSprint §2

From `apps/desktop/src/pages/QuickSprint.tsx`, line 606 at `4d6af3d9` (the comment that stays: "key by draftId so the surface remounts on a route param change, as PageEditor's key={id} and JournalEntry's do: otherwise /project/A/sprint to /project/B/sprint reuses the instance, useWayBack's capture-on-unmount never fires for A, and its liveRef would label A's scroll/caret under B's id").

```ts
// W2 Fable R1 — key by draftId so the surface actually remounts on a route
// param change, matching PageEditor's `key={id}` and JournalEntry's
// `key={id ?? 'new'}`. Without this, navigating /project/A/sprint ->
// /project/B/sprint reused the SAME component instance (React Router sees
// an unchanged `element`) — useWayBack's capture-on-unmount never fired for
// A at all, and worse, its liveRef (updated unconditionally every render,
// not gated by entryId) would already read B's identity by the time A's
// effect cleanup ran on the entryId-change, mislabeling A's scroll/caret
// under B's id. Keying forces a real unmount+mount, the same invariant every
// other writing surface already relies on.
```
