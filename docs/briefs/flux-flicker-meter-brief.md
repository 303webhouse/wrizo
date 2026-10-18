FLUX GLITCH METER BRIEF (Fable, Oct 9)
What: Flux's own progress animation, "Glitch", replacing the rhizome under Flux. A monitor breaking down from heavy use in a dirty, Blade Runner-like city.
Nick's rulings:
1. Writing stops the flicker: a key pressed in the last 30 s means no flicker at all.
2. Idle ramps it up: from 30 s without a keystroke it slowly intensifies, peaking at 5 minutes.
3. Progress calms it: intensity = idle ramp × (1 − progress through the lap). Flickers get rarer and dimmer near the goal and stop at the goal. Crossing the goal resets the lap.
4. It covers the whole screen, page and text included (overrides the canon line), because it never runs while typing.
5. Easy to turn off: a Flicker on/off switch; off means none anywhere. The Ambiance dial can still scale it.
6. Approved mockup: cursor/flux-flicker-mockup @ 04643f2, plus the two safety fixes (0eb36a6a).
Reuse: Flux's Signal Loss vocabulary (tear lines, shear bands, noise, macroblocks, sync jumps, backlight dips) from ThemeEffectsLayer / fluxThemeFx. The RESPONSE glow and the sprint bar surge stay.
Safety floor (not optional):
- Never more than 3 flashes in any one second across the whole screen; a double backlight dip counts 2.
- Any event covering more than about a quarter of the screen stays low-contrast: no bright full-screen flash, no saturated red.
- Reduced motion (OS or Wrizo's own setting): a faint still scan/noise overlay whose opacity follows intensity, with no motion.
- At peak, the page text stays readable at a glance.
Open: the exact ramp curve, and peak strength (Nick can ask for more, within the floor).
