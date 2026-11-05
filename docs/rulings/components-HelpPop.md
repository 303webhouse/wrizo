# Rulings: `apps/desktop/src/components/HelpPop.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[HelpPop §n]` points here.

## HelpPop §1

From `apps/desktop/src/components/HelpPop.tsx`, line 6 at `7f1c6a84` (the comment that stays: "the one help overlay, position:fixed in a body portal so no writing surface moves for it; closes on the same "?", an outside press or Esc - never on a timer - and returns focus to its "?"").

```ts
// HELP BUTTONS — the one shared sentence overlay (mounted ONCE, App.tsx —
// ContextMenuHost.tsx's own proven pattern). position:fixed in a body
// portal: it takes no space in the document anywhere, so no writing surface
// it floats over can ever move or resize for it — page primacy holds by
// construction. Closes on a second tap of the SAME "?" (store/help.ts's own
// toggle), a tap/press anywhere outside it, or Esc; NEVER on a timer (Nick's
// own ruling, the mockup's own commit d4d1c835 removed an earlier one). Esc
// and outside-close both return focus to the "?" that opened it — the SAME
// returnFocus-ref mechanism ContextMenuHost.tsx already uses.
```

## HelpPop §2

From `apps/desktop/src/components/HelpPop.tsx`, line 39 at `7f1c6a84` (the comment that stays: "the "?" that owns the pop (aria-expanded=true) is not "outside": its own click is what closes it").

```ts
    // FIX (Fable, Oct 17, ledger 88-90): this listener only ever excluded the
    // POPOVER (ref) from "outside" — never the "?" that owns it. A second
    // press on that SAME "?" landed here on pointerdown (mousedown, before
    // the button's own click fires), read as outside, and closed the pop —
    // then the button's own onClick toggled the now-closed store back open.
    // Net effect: closes on mousedown, reopens on click (never actually
    // closes). The trigger currently showing this pop always carries
    // aria-expanded="true" (HelpButton.tsx) while it is open, which is
    // exactly "the '?' that owns the pop" — exclude it too, and let ITS OWN
    // click (store/help.ts's toggleHelp) be the one thing that closes it.
```
