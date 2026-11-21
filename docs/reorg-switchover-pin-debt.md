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

## The debt

Each file below still tests the Machina from before the switch-over. A Machina writer no longer sees that Machina by default. Porting a
file means opening it with the reorg on and re-reading its checks. Any falsified check is parked verbatim as SUPERSEDED, with a
successor.

### Measured at the build (main 2556db13 + reorg-switchover)

- **Population:** 360 harness files.
- **Name Machina:** 61.
- **Ask for the reorg somewhere:** 9 (`?reorg=1`).
- **Ask for the default:** 1 (`reorg-switchover.mjs`, `WS_REORG=1`).

Branches merged after main 2556db13 add files. Re-measure at the last train with `node apps/desktop/scripts/reorg-pin-debt.mjs`.

**Ride the pin on every load (52):**
arbor-canvas, arbor-default-on, bug83-count-row, cascade-motion, deck-rows, drawer-mirror, fit-icon, flux-wirein-flagoff, fog-a,
freewrite-typewriter, glue-9, guided-add-scenes, guided-w2, guided-w5, help-choose-census, help-choose, letter-measure-guard,
machina-deckwizard, machina-doc-word, machina-forms-logic, machina-forms, machina-intake, machina-mark-start, machina-step-source,
machina-step, page-size, pagebreaks, polish-arbor-chrome, polish-arbor-room, polish10-12-part2, polish10-13-part2, polish10-board,
polish10-card, polish10-ground, polish10-hint, polish10-linkdock, polish10-page, polish10-recede, popout-width-probe, rail-bug4,
reflow-open, size-box, size-words, sized-by-hand, strip-no-help, th-machina-source, th-machina, th1, theme-fonts-source,
theme-picker-logic, wa-red-70, width-gate.

**Ask on some loads, ride the pin on the others (8):**
flux-v2, reorg-backmenu, reorg-connect-doc, reorg-front-menu, reorg-part-moves, reorg-rails-speed, reorg-rails, reorg-top-rail.

The list is a text match: "names Machina" means the file quotes `'machina'`. Some of these files only read source, so for them the pin
changes nothing. The full pair on Chat 1's train is what measures the pin.
