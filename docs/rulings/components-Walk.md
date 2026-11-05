# Rulings: `apps/desktop/src/components/Walk.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[Walk §n]` points here.

## Walk §1

From `apps/desktop/src/components/Walk.tsx`, line 168 at `7f1c6a84` (the comment that stays: "the caret lands in the card, so left/right step only while it is empty; PageUp/PageDown and the chevrons always step; the listener is registered once and reads the latest handler through a ref, so it never falls behind others").

```ts
  // KEYBOARD (Nick, Oct 25): the caret lands in the card on opening and stepping, so left / right step only while the card is EMPTY (with words in it they move the caret); PageUp / PageDown and the chevrons always step.
  // Enter on a focused door is the door's own, Esc leaves.
  // The listener is registered ONCE and calls the latest handler through a ref: re-registering on every step (go changes with the card) moved it to the back of the document's listener list, behind any
  // handler that takes the arrows first.
```
