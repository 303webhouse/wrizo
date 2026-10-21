// GLITCH METER (plan docs/plans/glitch-meter.md section 1) - THE SIGNAL LOSS EVENT BUILDERS, one implementation with two callers: the
// ambient texture behind the page (store/fluxThemeFx.ts, canon section 7) and the Glitch meter over it (components/GlitchMeter.tsx). Lifted
// out of fluxThemeFx.ts unchanged in DOM, class and timing; what the meter adds is a brightness (`op` / `alpha` / the dip's peaks) set by its
// intensity. Called with no brightness, a builder draws Signal Loss's own fixed look, exactly as before.
//
// The caller asks the flash budget (store/flashBudget.ts) before calling a builder; a double dip or a double jump asks again, through
// `second`, before its second pulse (a second pulse is a flash too, and a refused one is not drawn).
//
// Every pulse stamps a fresh `data-pulse` value on the element it pulses, at the moment it pulses - one per storm, cluster, shear, patch,
// jump and dip, and one per second jump or dip. glitch-meter.mjs counts those stamps independently of the budget's own log (G4).

export const SL_BLUE = 'rgba(0,194,255,.6)';
export const SL_LIME = 'rgba(166,255,61,.5)';

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

let pulseSeq = 0;
function markPulse(el: Element, kind: string): void {
  pulseSeq += 1;
  el.setAttribute('data-pulse', `${kind}:${pulseSeq}`);
  // LEDGER 117, harness mode only (the budget's own flag, read at call time): the DRAW time of every pulse, beside the budget's grant log, so
  // glitch-meter G4 can pair grant -> draw -> observed. Plain data; unset, nothing happens.
  const w = typeof window !== 'undefined' ? (window as unknown as { __wzVerifyFlashes?: boolean; __wzDrawLog?: Array<{ t: number; kind: string; seq: number }> }) : null;
  if (w && w.__wzVerifyFlashes) (w.__wzDrawLog ??= []).push({ t: performance.now(), kind, seq: pulseSeq });
}

/** Tear-line storm: 3-5 lines, ~45 ms stagger, ~150 ms each, ~35% lime. One flash. `alive` (optional): asked before each staggered line - a
 *  storm under way when motion is turned off lays no more lines (Fable, Oct 21: cut the leftover lines the moment reduced motion lands). */
export function tearStorm(container: HTMLElement, op?: number, alive?: () => boolean): void {
  markPulse(container, 'tear');
  const n = 3 + Math.floor(Math.random() * 3);
  const base = rand(8, 82);
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      if (alive && !alive()) return;
      const el = document.createElement('div');
      el.className = 'theme-fx-tear';
      el.style.top = `${base + rand(-7, 7)}%`;
      const lime = Math.random() < 0.35;
      if (op === undefined) el.style.background = lime ? SL_LIME : SL_BLUE;
      else {
        el.style.background = lime ? `rgba(166,255,61,${op})` : `rgba(0,194,255,${op})`;
        el.style.setProperty('--op', String(op));
      }
      container.appendChild(el);
      void el.offsetWidth;
      el.classList.add('on');
      setTimeout(() => el.remove(), 200);
    }, i * 45);
  }
}

/** Shear band: a 26 px skewed band, ~160 ms, on the caller's persistent element. One flash. */
export function shearBand(el: HTMLElement, op?: number): void {
  el.style.top = `${rand(10, 82)}%`;
  if (op !== undefined) el.style.setProperty('--op', String(op));
  el.classList.remove('on');
  void el.offsetWidth;
  el.classList.add('on');
  markPulse(el, 'shear');
}

/** Noise patch: a 130 x 56 striped patch, ~150 ms, on the caller's persistent element. One flash. */
export function noisePatch(el: HTMLElement, op?: number): void {
  el.style.left = `${rand(0, 76).toFixed(1)}%`;
  el.style.top = `${rand(0, 80).toFixed(1)}%`;
  if (op !== undefined) el.style.setProperty('--op', String(op));
  el.classList.remove('on');
  void el.offsetWidth;
  el.classList.add('on');
  markPulse(el, 'noise');
}

/** Macroblock cluster: 5-9 blocks 10-30 px, 80-210 ms each. One flash. */
export function macroCluster(container: HTMLElement, alpha?: number): void {
  markPulse(container, 'macro');
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
    const lime = Math.random() < 0.35;
    el.style.background = alpha === undefined
      ? (lime ? 'rgba(166,255,61,.13)' : 'rgba(0,194,255,.14)')
      : (lime ? `rgba(166,255,61,${alpha})` : `rgba(0,194,255,${alpha})`);
    container.appendChild(el);
    setTimeout(() => el.remove(), rand(80, 210));
  }
}

/** Sync jump: the target layer jumps +-4 px for ~80 ms; a double jump follows ~60 ms later (its own flash, asked through `second`). */
export function syncJump(target: HTMLElement, double: boolean, second: () => boolean): void {
  markPulse(target, 'sync');
  target.classList.add('jmp');
  setTimeout(() => {
    target.classList.remove('jmp');
    if (!double) return;
    setTimeout(() => {
      if (!second()) return;
      markPulse(target, 'sync2');
      target.classList.add('jmp2');
      setTimeout(() => target.classList.remove('jmp2'), 70);
    }, 60);
  }, 80);
}

/** Backlight dip: the black overlay to `peak` for ~400 ms; a double dip rises again to `secondPeak` for ~250 ms (its own flash, asked through
 *  `second` - 0eb36a6a's rule: a double dip counts 2). */
export function backlightDip(el: HTMLElement, peak: number, secondPeak: number, double: boolean, second: () => boolean): void {
  markPulse(el, 'dip');
  el.style.opacity = String(peak);
  setTimeout(() => {
    el.style.opacity = '0';
    if (!double) return;
    setTimeout(() => {
      if (!second()) return;
      markPulse(el, 'dip2');
      el.style.opacity = String(secondPeak);
      setTimeout(() => { el.style.opacity = '0'; }, 250);
    }, 350);
  }, 400);
}
