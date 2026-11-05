# Rulings: `apps/desktop/src/store/walk.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[walk §n]` points here.

## walk §1

From `apps/desktop/src/store/walk.ts`, line 49 at `7f1c6a84` (the comment that stays: "the swipe: a pure slide (both cards opaque, never a cross-fade), about 280 ms; reduced motion is an instant cut").

```ts
/** The swipe (Nick, 3:25 pm: no flash): a PURE SLIDE - both cards fully opaque (never a cross-fade), the outgoing one leaves one way as the next arrives from the other, about 280 ms; reduced motion is an instant cut. */
```

## walk §2

From `apps/desktop/src/store/walk.ts`, line 64 at `7f1c6a84` (the comment that stays: "the caret lands in the card, so arrows step only while it is empty; PageUp/PageDown and the chevrons always step; outside the editor the arrows step").

```ts
/** Nick, Oct 25: the caret lands in the card on opening and on stepping, so the arrows may only step while the card is EMPTY (nothing to move the caret through); with the writer's words in it they move the caret,
 *  and PageUp / PageDown (and the chevrons) always step. Outside the editor (focus on a door, the rail) the arrows step as ever. */
```
