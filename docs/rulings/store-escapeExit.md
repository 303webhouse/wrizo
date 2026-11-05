# Rulings: `apps/desktop/src/store/escapeExit.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[escapeExit §n]` points here.

## escapeExit §1

From `apps/desktop/src/store/escapeExit.ts`, line 1 at `7f1c6a84` (the comment that stays: "Esc leaves the writing surface (Tab indents, so Esc is the way out): a popup open closes first; if nothing was open or nothing closed, focus goes to the current mode tab").

```ts
// ESC LEAVES THE WRITING SURFACE (accessibility audit A1, cloud-a11y-audit @ 9c15c86: "the writing surface is a keyboard trap").
//
// Tab indents on the page by Nick's ruling (item 158, then 209), so Tab cannot also be the way out - and item 158's own comment
// promised "Escape is what leaves the surface". Nothing did that; the audit measured Esc leaving focus where it was. WCAG 2.1.2 allows
// a surface to keep Tab only when another key leads out, so Esc is that key: it moves focus to the CURRENT MODE TAB, the nearest
// chrome, in every mode.
//
// A MENU OR POPUP CLOSES FIRST. The page's popups (the rail panels, the Tutor, the beginnings row, sheets, dialogs, menus) already
// close on Esc through their OWN document/window listeners, which run AFTER the editor's (the event bubbles from the editor up).
// So the editor does not decide here which popup to close: it counts what is open now, lets the event finish, and looks again.
// If something closed, that Esc was the popup's. If nothing was open, or nothing closed (a popup with no Esc of its own), focus
// leaves - the trap is never re-made by a popup that ignores the key.
```

## escapeExit §2

From `apps/desktop/src/store/escapeExit.ts`, line 17 at `7f1c6a84` (the comment that stays: "the Tools drawer closes on Esc too, so it is counted").

```ts
// DRAWER MIRROR (Oct 24): the Tools drawer closes on Esc too now, so it is counted - else its Esc, having closed it, also took focus off the page.
```
