# Rulings: `apps/desktop/src/store/signedOutHere.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[signedOutHere §n]` points here.

## signedOutHere §1

From `apps/desktop/src/store/signedOutHere.ts`, line 1 at `f079d49e` (the comment that stays: "signed out here, a per-device flag: set on explicit sign-out, cleared on sign-in; while set, writing routes go back to sign-in; it lives outside the collections resetLocalData clears; every access is wrapped").

```ts
// SIGNED OUT HERE — a per-device flag (Nick's ruling, 2026-10-06). Set on an
// explicit sign-out; cleared on sign-in. While it is set, the app goes to the
// sign-in screen and stays there: a route, a key or a click that would open a
// writing surface is sent back to sign-in until the writer signs in again.
//
// Scope: only a device that signed out. A device that was never signed in keeps
// anonymous Write as it does today. The flag lives in localStorage, NOT in the
// collections resetLocalData() clears, so it survives the logout that sets it.
// Every storage access is wrapped: a blocked or full storage must never trap a
// writer on the sign-in screen, nor crash the app.
```
