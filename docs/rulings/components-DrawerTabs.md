# Rulings: `apps/desktop/src/components/DrawerTabs.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[DrawerTabs §n]` points here.

## DrawerTabs §1

From `apps/desktop/src/components/DrawerTabs.tsx`, line 4 at `e2898deb` (the comment that stays: "a real tablist: role=tab, aria-selected and a roving tabindex; the chosen tab reads olive (where you are), brass stays for action controls; controlled by the host").

```ts
// PHASE 1 - THE DRAWER'S TAB ROW (TEXT | INK now; TUTOR | the theme's links word in S3).
//
// Tabs, not buttons-that-look-like-tabs: role=tablist / tab with aria-selected and a ROVING tabindex (only the chosen tab is in the Tab
// order; Left/Right/Home/End move between them and choose). tutor-drawer-mirror ROUND 2 (Nick, live bug report, confirmed by
// scripts/harness/tutor-drawer-probe.mjs): the chosen tab reads OLIVE now, the same "where you are" state the drawer's own arrow tab
// already carries - choosing a tab is that state too, not a one-off action, so brass stays reserved for actual action controls.
// SUPERSEDED (Nick, Oct 9, quoted verbatim): "The chosen tab wears a BRASS OUTLINE and nothing else - no fill (brass-outlined choices
// lose the light-orange background). The drawer's arrow tab stays olive; that is 'where you are', this is 'what you chose'."
//
// Controlled: the host owns the value (for Free Write that is PageEditor's `instrument`, so the paper, the caret and the drawer agree).
```
