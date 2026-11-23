# The switch-over's driver pin: the debt list

Written for: Chat 1, Fable, and whoever ports the harness to the reorg.

## What the pin is

Fable's switch-over ruling (Nov 20, 6:00 pm) turns the reorg on by default in Machina, with `?reorg=0` as an off switch for tests only.
The harness driver (`apps/desktop/scripts/runtime-verify.mjs`) serves `window.__wrizoReorgOff`, read by `src/reorg/flag.ts`, to every
harness file that does not ask for the reorg. So each of these files opens Machina exactly as it did before the switch-over, and none of
its assertions changed.

The URL decides first:

- `?reorg=1` is on and `?reorg=0` is off, whatever the driver serves.
- With neither, the reorg is on unless the driver pinned it off.
- A file asks for the default itself with `WS_REORG=1` (only `reorg-switchover.mjs` does).

**Machina only (Fable, Nov 21, 9:40 pm).** The default is on in Machina alone. Arbor and Flux keep `?reorg=1` until all six of their cells
pass: a cell flipped on for them in `src/reorg/themeGate.ts` lights only when the page load asked by name (`REORG_DEFAULT_ON`, `reorgFor`).
So the pin matters only for Machina; an Arbor or Flux file without `?reorg=1` sees no reorg with or without it.

## The debt

Each file below still tests the Machina from before the switch-over. A Machina writer no longer sees that Machina by default. Porting a
file means opening it with the reorg on and re-reading its checks. Any falsified check is parked verbatim as SUPERSEDED, with a
successor.

### Measured again (main ad8a5999, train H, + reorg-switchover)

- **Population:** 422 harness files.
- **Name Machina:** 101.
- **Ask for the reorg somewhere:** 46 (`?reorg=1`).
- **Ask for the default:** 1 (`reorg-switchover.mjs`, `WS_REORG=1`).

The first measure (main 2556db13) read 360 files, 61 naming Machina, 9 asking, 52 riding and 8 mixed. Re-measure at the last train with
`node apps/desktop/scripts/reorg-pin-debt.mjs`.

**Ride the pin on every load (55):**
arbor-canvas, arbor-default-on, bug83-count-row, cascade-motion, deck-rows, drawer-mirror, fit-icon, flux-wirein-flagoff, fog-a,
freewrite-typewriter, glue-9, guided-add-scenes, guided-w2, guided-w5, help-choose-census, help-choose, letter-measure-guard,
machina-deckwizard, machina-doc-word, machina-forms-logic, machina-forms, machina-intake, machina-look-musts, machina-look-unit,
machina-look, machina-mark-start, machina-step-source, machina-step, page-size, pagebreaks, polish-arbor-chrome, polish-arbor-room,
polish10-12-part2, polish10-13-part2, polish10-board, polish10-card, polish10-ground, polish10-hint, polish10-linkdock, polish10-page,
polish10-recede, popout-width-probe, rail-bug4, reflow-open, size-box, size-words, sized-by-hand, strip-no-help, th-machina-source,
th-machina, th1, theme-fonts-source, theme-picker-logic, wa-red-70, width-gate.

**Ask on some loads, ride the pin on the others (45):**
flux-v2, machina-brass-chosen, machina-logo-wrizo, reorg-asset-colours, reorg-asset-to-part, reorg-assets-plus, reorg-attach-live,
reorg-b-assets, reorg-b-parts, reorg-b-text, reorg-b-words, reorg-backmenu, reorg-badge, reorg-bx-live, reorg-bx-plan-live,
reorg-chrome-scale, reorg-colour-b, reorg-connect-doc, reorg-feedback-lenses, reorg-footnotes-live, reorg-front-find, reorg-front-menu,
reorg-heading-picker-live, reorg-part-moves, reorg-parts-drag, reorg-parts-ui, reorg-plan-connected, reorg-plan-presets-board,
reorg-plan-presets, reorg-plan-to-part, reorg-publish-live, reorg-rails-speed, reorg-rails, reorg-replace, reorg-search,
reorg-split-board, reorg-split-edit, reorg-split-full, reorg-sprint-back, reorg-sprint-consultant, reorg-supsub-live,
reorg-theme-gate-unit, reorg-top-rail, room-pref, sprint-no-menus.

The list is a text match: "names Machina" means the file quotes `'machina'`. Some of these files only read source, so for them the pin
changes nothing. The full pair on Chat 1's train is what measures the pin.
