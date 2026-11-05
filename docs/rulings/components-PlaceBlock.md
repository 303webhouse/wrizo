# Rulings: `apps/desktop/src/components/PlaceBlock.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[PlaceBlock §n]` points here.

## PlaceBlock §1

From `apps/desktop/src/components/PlaceBlock.tsx`, line 22 at `7f1c6a84` (the comment that stays: "a real rack's full path reads "RACK ▸ <name>"; the narrow rail shows only the place name on one line (ellipsis), the full path in the title and the breadcrumb").

```ts
  // FLUX V2: a real rack's full path reads "RACK ▸ <name>". POLISH #10 item 14 (Nick, Oct 28): the narrow rail shows ONLY the place name on ONE line with an ellipsis; the full path is the button's title (hover/focus) and stays in the breadcrumb; the aria-label keeps the plain name.
```
