# Rulings: `apps/desktop/src/store/installedFonts.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[installedFonts §n]` points here.

## installedFonts §1

From `apps/desktop/src/store/installedFonts.ts`, line 3 at `7f1c6a84` (the comment that stays: "the writer's installed fonts: one device-local key (`wrizo-installed-fonts`, a JSON array of names), never synced; a page stores the existing face record; a missing face falls back to the theme's default; nothing here throws").

```ts
// TOOLS #10 ITEM 11 - THE WRITER'S OWN INSTALLED FONTS (Fable: GO, Oct 27). A writer can add a font that is installed on THIS device to the font list: through Chromium's local-font access (its permission prompt) or by typing a name.
//
// THE ONE STORED VALUE (named before building, approved): the device-local `localStorage` key `wrizo-installed-fonts` - a JSON array of family NAMES, nothing else. It is per DEVICE: never synced, never in a page, never in the database.
// What a page or card stores when the writer picks one of these is the face record that already existed - `{ name, generic, source: 'device' }` (types FaceSource) - so no page or card schema changes.
//
// WHEN THE FACE IS MISSING (another device, or the font was uninstalled): the stack is `'<name>', var(--font-prose)` (store/fontRoster.ts faceStack) - the theme's own default - and the font list says so quietly (TypeControl).
// Nothing here throws: a blocked or absent API, a corrupt value, a full storage all degrade to "no list" / "not added".
```
