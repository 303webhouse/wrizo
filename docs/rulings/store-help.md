# Rulings: `apps/desktop/src/store/help.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[help §n]` points here.

## help §1

From `apps/desktop/src/store/help.ts`, line 4 at `e2898deb` (the comment that stays: "the one sentence behind each "?": carries the trigger's own rect (an anchor), not menu items; the useSyncExternalStore one-overlay pattern").

```ts
// HELP BUTTONS (Nick approved Oct 12, cursor/help-buttons @ d4d1c835) — the
// one plain sentence behind each "?". Deliberately NOT store/contextMenu.ts's
// own OpenMenu shape reused verbatim — that one carries ITEMS (a menu);
// this carries the TRIGGERING BUTTON'S OWN RECT (an anchor to position
// against), which is the one thing HelpPop.tsx actually needs. Same
// useSyncExternalStore pattern (ContextMenuHost.tsx's own proven mechanism:
// one shared overlay, Esc/outside-click closes, focus returns on close).
```
