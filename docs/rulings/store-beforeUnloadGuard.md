# Rulings: `apps/desktop/src/store/beforeUnloadGuard.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[beforeUnloadGuard §n]` points here.

## beforeUnloadGuard §1

From `apps/desktop/src/store/beforeUnloadGuard.ts`, line 1 at `e2898deb` (the comment that stays: "closing the tab is the one act that turns "at risk" into "gone": while storage has failed and edits exist only in memory, the web build asks through the browser's own beforeunload; Electron is excluded (it would silently refuse to close)").

```ts
// STORAGE-FULL STEP 1 (Fable's byte review, item 3) — CLOSING THE TAB IS THE ONE ACT THAT TURNS "AT RISK" INTO
// "GONE." While storage has failed and either the account does not have every edit yet (state (a)) or there is no
// account at all to ever receive them (state (c)), the edit exists nowhere but this tab's memory — leaving closes
// the only copy. The web build asks first, through the browser's OWN "Leave site?" dialog (`beforeunload`): never a
// page of ours, and browsers deliberately ignore a script's own message on this event (so a page cannot manufacture
// a false warning) — the real words live in the sync notice instead, which is always on screen already.
//
// ELECTRON IS EXCLUDED, BY NAME. Chromium's "Leave site?" prompt is a BROWSER TAB affordance; Electron's
// BrowserWindow does not reproduce it, and `apps/desktop/src/main.ts` installs no `will-prevent-unload` handling —
// so calling `preventDefault()` there does not ask anything, it silently refuses to close the window with no way
// for the writer to see why or override it. Detected by Electron's own default user-agent token, which this app's
// main process never overrides (no `userAgentFallback` is set) — measured, never assumed.
```
