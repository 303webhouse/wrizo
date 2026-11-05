# Rulings: `apps/desktop/src/components/ChromeControls.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[ChromeControls §n]` points here.

## ChromeControls §1

From `apps/desktop/src/components/ChromeControls.tsx`, line 41 at `7f1c6a84` (the comment that stays: "which failed-storage state this is: records still unpushed (persistence's subscribe, which markClean fires too), and whether there is an account to reach").

```ts
  // STORAGE-FULL STEP 1 (Fable's byte review, item 2) - which of the three failed-storage states this is: dirty
  // records still unpushed (persistence.ts's own generic subscribe(), which markClean() now also fires - see its
  // own comment), and whether there is an account at all to reach (F2's local-first writing, signed out).
```
