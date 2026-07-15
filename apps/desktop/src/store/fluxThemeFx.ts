import { registerThemeFx } from '../components/ThemeEffectsLayer';
import { dialIntervalScale } from './ambianceDial';

// TH2 Slice 4 — the Signal Loss texture dialect (canon §7), registered onto
// TH1's effects scaffold via registerThemeFx('flux', ...) — the seam the
// scaffold was built for. Ported faithfully from the normative visual
// reference (docs/theme-foundations/flux/flux-rc2.html's #g4t machinery) —
// exact timings/rates, translated from its vanilla-JS setTimeout loops into
// this module's mount/cleanup shape. All six event types render into ONE
// texture container behind the page, plus the container-level fast-damp/
// slow-re-emerge (canon §6) and the sync-jump/backlight-dip pair that act
// on the container itself rather than spawning a child element.

const EVENT_COLORS_BLUE = 'rgba(0,194,255,.6)';
const EVENT_COLORS_LIME = 'rgba(166,255,61,.5)';

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

  // Tear-line storm — 7-12s, 3-5 lines, ~45ms stagger, ~150ms each, ~35% lime.
  stops.push(loop(7000, 12000, isBusy, getDial, () => {
    const n = 3 + Math.floor(Math.random() * 3);
    const base = rand(8, 82);
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'theme-fx-tear';
        el.style.top = `${base + rand(-7, 7)}%`;
        el.style.background = Math.random() < 0.35 ? EVENT_COLORS_LIME : EVENT_COLORS_BLUE;
        container.appendChild(el);
        void el.offsetWidth;
        el.classList.add('on');
        setTimeout(() => el.remove(), 200);
      }, i * 45);
    }
  }));

  // Shear band — 9-15s, 26px band, skewX(-12deg), ~160ms.
  const shear = document.createElement('div');
  shear.className = 'theme-fx-shear';
  container.appendChild(shear);
  stops.push(() => shear.remove());
  stops.push(loop(9000, 15000, isBusy, getDial, () => {
    shear.style.top = `${rand(10, 82)}%`;
    shear.classList.remove('on');
    void shear.offsetWidth;
    shear.classList.add('on');
  }));

  // Noise patch — 8-14s, 130x56 striped patch, ~150ms.
  const noise = document.createElement('div');
  noise.className = 'theme-fx-noise';
  container.appendChild(noise);
  stops.push(() => noise.remove());
  stops.push(loop(8000, 14000, isBusy, getDial, () => {
    noise.style.left = `${rand(0, 76).toFixed(1)}%`;
    noise.style.top = `${rand(0, 80).toFixed(1)}%`;
    noise.classList.remove('on');
    void noise.offsetWidth;
    noise.classList.add('on');
  }));

  // Macroblock cluster — 2.6-4.8s, 5-9 blocks 10-30px, 80-210ms each.
  stops.push(loop(2600, 4800, isBusy, getDial, () => {
    const ax = rand(4, 92);
    const ay = rand(4, 86);
    const n = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'theme-fx-macroblock';
      el.style.left = `${(ax + rand(-6.5, 6.5)).toFixed(1)}%`;
      el.style.top = `${(ay + rand(-6.5, 6.5)).toFixed(1)}%`;
      el.style.width = `${rand(10, 30).toFixed(0)}px`;
      el.style.height = `${rand(8, 23).toFixed(0)}px`;
      el.style.background = Math.random() < 0.35 ? 'rgba(166,255,61,.13)' : 'rgba(0,194,255,.14)';
      container.appendChild(el);
      setTimeout(() => el.remove(), rand(80, 210));
    }
  }));

  // Sync jump — 9-15s, texture layer ±4px, ~80ms; 40% double-jump.
  stops.push(loop(9000, 15000, isBusy, getDial, () => {
    container.classList.add('jmp');
    setTimeout(() => {
      container.classList.remove('jmp');
      if (Math.random() < 0.4) {
        setTimeout(() => {
          container.classList.add('jmp2');
          setTimeout(() => container.classList.remove('jmp2'), 70);
        }, 60);
      }
    }, 80);
  }));

  // Backlight dip — 10-17s, black overlay to .13 for ~400ms; 50% double-dip.
  const dip = document.createElement('div');
  dip.className = 'theme-fx-backlight';
  container.appendChild(dip);
  stops.push(() => dip.remove());
  stops.push(loop(10000, 17000, isBusy, getDial, () => {
    dip.style.opacity = '.13';
    setTimeout(() => {
      dip.style.opacity = '0';
      if (Math.random() < 0.5) {
        setTimeout(() => {
          dip.style.opacity = '.09';
          setTimeout(() => { dip.style.opacity = '0'; }, 250);
        }, 350);
      }
    }, 400);
  }));

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
  };
}
