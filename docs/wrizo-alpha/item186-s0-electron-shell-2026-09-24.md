# ITEM 186 · S0 — WHAT THE ELECTRON SHELL SHOWS ON A RIGHT-CLICK TODAY
### PW build lane · 2026-09-24 · the S0 question PLAN DESK's 186 brief left open

**THE TWO QUESTIONS, as Fable put them:** *does `main.ts` build any context menu at all, and what does
Electron's shell show on a right-click today?*

---

## 1 · DOES `main.ts` BUILD ONE? **NO — MEASURED, NOT ASSUMED.**

`apps/desktop/src/main.ts` line 1, in full:

```ts
import { app, BrowserWindow } from 'electron';
```

**That is the whole of its electron surface.** No `Menu`, no `MenuItem`, no
`Menu.buildFromTemplate`, no `menu.popup()`, and no `webContents.on('context-menu')` — the event an
Electron app has to handle to build one.

Swept across the whole client (`apps/desktop/src`, `*.ts` and `*.tsx`), the **only** import from
`electron` anywhere is that one line. There is also **no `Menu.setApplicationMenu`**, so the app
builds no application menu either — consistent, not an oversight in one place.

**So the app contributes nothing to a right-click on the desktop.**

---

## 2 · WHAT THE SHELL SHOWS: **NOTHING** — and here the claim changes register

Electron does **not** provide a default context menu in the renderer. Chromium's familiar
right-click menu is a feature of the **browser shell**, not of the web engine, and Electron ships the
engine without that shell. An app that never handles `context-menu` therefore has no context menu at
all on the desktop.

> **⚠ THE HONEST BOUND, stated because the two halves of this answer are not the same kind of claim.**
> Half 1 is **measured** — I read the source and swept it. Half 2 is a **platform fact** I have **not
> measured here**: proving it takes a run in the Electron shell, and every harness in this repo drives
> the **web** build through Edge. So nothing in the suite can confirm or refute it. It is stated as
> what it is, and the measurement that would settle it is named rather than implied.

---

## 3 · WHAT THAT MEANS FOR ITEM 186 — three consequences, and one of them re-reads a ruling

**(a) ON THE DESKTOP, ITEM 186's MENU TAKES NOTHING AWAY — it is purely additive.**
PLAN DESK's reason for Cut and Copy is *"replacing the native menu would otherwise take them away on
the web."* That reasoning is exactly right **for the web**, and on the desktop the same two items are
**new capability** rather than a restoration. Both readings lead to the same build, which is why this
finding changes no code — but they are different claims, and the record should not carry the wrong one.

**(b) ⚠ ON THE DESKTOP, SHIFT + RIGHT-CLICK HAS NOTHING TO FALL THROUGH TO.**
The fallthrough was ruled so the writer keeps *"cut, copy, paste and look-up"*. On the desktop there
is no native menu to keep, so Shift + right-click there shows **nothing at all** — it is a **web-only
escape hatch**. It is still correct to keep (it costs one line, and the web is where it matters), but
its stated rationale holds on one of the two surfaces, and a harness asserting "Shift shows the native
menu" would be asserting something untrue of the desktop build. **Named for routing, not fixed here.**

**(c) THE CAPABILITY WAS NEVER MISSING — ONLY THE MENU.**
`Ctrl/Cmd+X` and `Ctrl/Cmd+C` work on both surfaces today: Chromium handles them in the renderer
without any app menu. So what the desktop lacked was a **visible door**, not cut and copy themselves.
That matters for how the item is described: it adds a door, it does not add an ability.

---

## 4 · WHAT IS BUILT

`menuCut` / `menuCopy` join the menu **after B/I/U**, in PLAN DESK's order. **No Paste** — the paste
rail owns that door (the foreign-voice import wall). Both need WORDS, so both are **absent on a bare
caret**, never greyed.

**And `writingMenuHasItems` now counts them**, which matters for the one case that would otherwise
regress: a bare caret on Free Write with the switch off has **no** styling, **no** connect acts and
**no** clipboard items — so the menu still does not open, and the web writer still keeps the browser's
own menu. A menu that opened empty to show nothing would be worse than no menu at all.
