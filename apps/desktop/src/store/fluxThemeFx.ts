import { registerThemeFx } from '../components/ThemeEffectsLayer';
import { dialIntervalScale } from './ambianceDial';
import { tryFlash } from './flashBudget';
import { backlightDip, macroCluster, noisePatch, shearBand, syncJump, tearStorm } from './signalLossEvents';

// TH2 Slice 4 — the Signal Loss texture dialect (canon §7), registered onto
// TH1's effects scaffold via registerThemeFx('flux', ...) — the seam the
// scaffold was built for. Ported faithfully from the normative visual
// reference (docs/theme-foundations/flux/flux-rc2.html's #g4t machinery) —
// exact timings/rates, translated from its vanilla-JS setTimeout loops into
// this module's mount/cleanup shape. All six event types render into ONE
// texture container behind the page, plus the container-level fast-damp/
// slow-re-emerge (canon §6) and the sync-jump/backlight-dip pair that act
// on the container itself rather than spawning a child element.

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Fable's R2 (TH2 review) — the dial used to be a boolean (0 vs >0); every
// scheduled delay now reads dialIntervalScale(getDial()) LIVE at scheduling
// time (not once at mount), so a mid-session dial change takes effect on
// the very next tick. `minMs * FLOOR_FRACTION` is this loop's own
// structural floor — at dial 100 (the fastest multiplier, ~0.55x) the
// scaled delay can never breach it, which is what actually protects the
// ≤3Hz-family spacing canon §7 requires; dialIntervalScale itself only
// supplies the multiplier, never the safety floor. Exported (not just used
// internally by loop() below) so the harness can assert the floor
// mathematically rather than by observing real-timer DOM mutations across
// six independently-scheduled loops, which coincidentally overlap by
// chance often enough to make that kind of test flaky.
const FLOOR_FRACTION = 0.4;
export function clampedIntervalMs(minMs: number, maxMs: number, dial: number): number {
  return Math.max(minMs * FLOOR_FRACTION, rand(minMs, maxMs) * dialIntervalScale(dial));
}

// A self-rescheduling jittered loop, ported from the mockup's `(function
// st(){ setTimeout(function(){ if(!busy()){...} st() }, delay) })()`
// pattern. `dial === 0` is the "fully static Flux" hard floor (canon §7);
// otherwise every fire is gated on `isBusy()` (TEXTURE damps while typing —
// canon §6) so a busy tick simply reschedules without acting.
function loop(minMs: number, maxMs: number, isBusy: () => boolean, getDial: () => number, fire: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  const nextDelay = () => clampedIntervalMs(minMs, maxMs, getDial());
  const tick = () => {
    if (stopped) return;
    if (!isBusy() && getDial() > 0) fire();
    if (!stopped) timer = setTimeout(tick, nextDelay());
  };
  timer = setTimeout(tick, nextDelay());
  return () => { stopped = true; if (timer) clearTimeout(timer); };
}

type SignalLossKind = 'tear' | 'shear' | 'noise' | 'macro' | 'sync' | 'dip';
// the mounted texture's own fire, for the harness seam (null while Flux's texture is not mounted)
let slFire: ((kind: SignalLossKind) => boolean) | null = null;

function mount(container: HTMLDivElement, getDial: () => number, isBusy: () => boolean): () => void {
  const stops: Array<() => void> = [];

  // Container-level fast-damp/slow-re-emerge — polled rather than event-
  // driven (isBusy is a callback, not a subscribable signal here); 250ms is
  // fast enough that the .45s damp transition still reads as immediate.
  let wasBusy = false;
  const poll = setInterval(() => {
    const busy = isBusy();
    if (busy !== wasBusy) {
      wasBusy = busy;
      container.style.transition = busy ? 'opacity .45s ease' : 'opacity 9s ease';
      container.style.opacity = busy ? '.13' : '1';
    }
  }, 250);
  stops.push(() => clearInterval(poll));

  // GLITCH METER (plan docs/plans/glitch-meter.md sections 1 and 3): the six events now come from store/signalLossEvents.ts - lifted from
  // here unchanged in DOM, class and timing (called with no brightness, a builder draws this texture's own fixed look) - so the Glitch meter
  // draws the same vocabulary from one implementation. And EVERY flash here asks the global budget first (store/flashBudget.ts: never more than
  // 3 in any second across the whole screen, the meter's included); a double jump or dip asks again for its second pulse. A refused flash is
  // skipped, as a busy tick is.

  // Tear-line storm — 7-12s, 3-5 lines, ~45ms stagger, ~150ms each, ~35% lime.
  // Each event is ONE named fire, asked of the budget: its loop calls it, and so does the harness seam below (ledger 90 - the loops skip
  // while the session reads busy, so a check that must see this texture pulse beside the meter forces it here, through the same code).
  const fires: Record<SignalLossKind, () => boolean> = {
    tear: () => { if (!tryFlash('sl-tear')) return false; tearStorm(container); return true; },
    shear: () => { if (!tryFlash('sl-shear')) return false; shearBand(shear); return true; },
    noise: () => { if (!tryFlash('sl-noise')) return false; noisePatch(noise); return true; },
    macro: () => { if (!tryFlash('sl-macro')) return false; macroCluster(container); return true; },
    // LEDGER 114: a second jump / dip comes 140 / 750 ms after the first - it asks this texture's own gate again at ITS moment (the dial, which
    // reads 0 under reduced motion: the loops' own test), so an event under way when motion is turned off draws no new flash
    sync: () => { if (!tryFlash('sl-sync')) return false; syncJump(container, Math.random() < 0.4, () => getDial() > 0 && tryFlash('sl-sync2')); return true; },
    dip: () => { if (!tryFlash('sl-dip')) return false; backlightDip(dip, 0.13, 0.09, Math.random() < 0.5, () => getDial() > 0 && tryFlash('sl-dip2')); return true; },
  };
  slFire = (kind) => (fires[kind] ? fires[kind]() : false);
  stops.push(() => { slFire = null; });

  stops.push(loop(7000, 12000, isBusy, getDial, () => { fires.tear(); }));

  // Shear band — 9-15s, 26px band, skewX(-12deg), ~160ms.
  const shear = document.createElement('div');
  shear.className = 'theme-fx-shear';
  container.appendChild(shear);
  stops.push(() => shear.remove());
  stops.push(loop(9000, 15000, isBusy, getDial, () => { fires.shear(); }));

  // Noise patch — 8-14s, 130x56 striped patch, ~150ms.
  const noise = document.createElement('div');
  noise.className = 'theme-fx-noise';
  container.appendChild(noise);
  stops.push(() => noise.remove());
  stops.push(loop(8000, 14000, isBusy, getDial, () => { fires.noise(); }));

  // Macroblock cluster — 2.6-4.8s, 5-9 blocks 10-30px, 80-210ms each.
  stops.push(loop(2600, 4800, isBusy, getDial, () => { fires.macro(); }));

  // Sync jump — 9-15s, texture layer ±4px, ~80ms; 40% double-jump (the second jump is its own flash).
  stops.push(loop(9000, 15000, isBusy, getDial, () => { fires.sync(); }));

  // Backlight dip — 10-17s, black overlay to .13 for ~400ms; 50% double-dip to .09 (the second dip is its own flash).
  const dip = document.createElement('div');
  dip.className = 'theme-fx-backlight';
  container.appendChild(dip);
  stops.push(() => dip.remove());
  stops.push(loop(10000, 17000, isBusy, getDial, () => { fires.dip(); }));

  return () => stops.forEach(stop => stop());
}

registerThemeFx('flux', { mount });

// Test/inspection seam (the resumeVocab.ts / wrizoVocab pattern) — the
// macroblock loop's own minMs (2600ms) is the fastest of the six, so its
// floor (2600 * 0.4 = 1040ms) is the binding one across the whole dialect.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoFluxFx?: unknown }).wrizoFluxFx = {
    clampedIntervalMs,
    macroblockFloorMs: 2600 * FLOOR_FRACTION,
    // GLITCH METER (ledger 90): one Signal Loss event NOW, through the flash budget like any other (true if it was granted and drawn)
    fire: (kind: SignalLossKind) => (slFire ? slFire(kind) : false),
  };
}
