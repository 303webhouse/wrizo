import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getWritingSettings, useWritingSettings } from '../store/writingSettings';
import { goalCount, useWritingGoal } from '../store/writingGoal';
import { useTheme } from '../store/theme';
import { getAmbianceDial, prefersReducedMotion } from '../store/ambianceDial';
import { tryFlash } from '../store/flashBudget';
import { backlightDip, macroCluster, noisePatch, shearBand, syncJump, tearStorm } from '../store/signalLossEvents';
import { bright, idleSeconds, meterIntensity, meterSeam, meterState, nextGapMs, noteKeystroke, type MeterKind } from '../store/glitchMeter';

// THE GLITCH METER - Flux's own progress animation, "Glitch", replacing the rhizome under Flux (brief docs/briefs/flux-flicker-meter-brief.md;
// plan docs/plans/glitch-meter.md, approved Oct 17; mockup cursor/flux-flicker-mockup @ 0eb36a6a). A monitor breaking down from heavy use.
//
// WHEN: a Flux writing page (PageEditor passes `glitch` to DeskInstrument; the Journal sheet does not), Progress on (the foot's Progress toggle,
// Progress: Words), the style set to Glitch (stored as 'rhizome' - the Bar | Rhizome axis, labelled Glitch under Flux), a goal set, and the
// Flicker switch on. The same gate as RhizomeField's, with the theme the other way round, plus the switch.
//
// WHAT: Nick's rule (store/glitchMeter.ts) - silent if a key was pressed in the last 30 s, ramping to a peak at 5 minutes idle, calmed by the
// lap's progress. It draws Flux's Signal Loss vocabulary (store/signalLossEvents.ts, one implementation shared with the ambient texture),
// brighter and more often as the intensity rises, OVER the whole screen, page and text included (Nick's ruling, overriding the canon line,
// because it never runs while typing) - in its own fixed, pointer-events:none layer, portalled to <body> so no stage's stacking context can
// cap it. The ambient Signal Loss texture stays behind the page, untouched.
//
// SAFETY (the brief's floor, not optional): every flash asks store/flashBudget.ts first (never more than 3 in any second across the whole
// screen, the ambient texture's included; a double dip or jump counts 2). Large events stay low-contrast: the dip is black at <= .14, the
// shear a 26 px band, nothing red. Under reduced motion - the OS setting, followed live, or the Ambiance dial at 0 (Wrizo's own "no motion")
// - it fires nothing and shows a faint still scan overlay whose opacity follows intensity (index.css .glitch-meter-still: under the OS
// setting it appears with no easing - the global reduced-motion rule, honoured by Fable's ruling, ledger 90; at Ambiance 0 it eases in).
const SPANS: Record<MeterKind, [number, number]> = {
  tear: [7000, 12000], shear: [9000, 15000], noise: [8000, 14000], macro: [2600, 4800], sync: [9000, 15000], dip: [10000, 17000],
};
const KINDS = Object.keys(SPANS) as MeterKind[];

export function GlitchMeter({ text }: { text: string }) {
  const settings = useWritingSettings();
  const goal = useWritingGoal();
  const theme = useTheme();
  const active = theme === 'flux' && settings.instrumentsOn && settings.progress === 'words' && settings.progressStyle === 'rhizome'
    && goal != null && goal.n > 0;
  // the lap's progress: the same count and lap the rhizome draws (crossing the goal starts the next lap at 0)
  const n = goal?.n ?? 0;
  const count = goal && n > 0 ? goalCount(text, goal) : 0;
  const fracRef = useRef(0);
  fracRef.current = n > 0 ? (count % n) / n : 0;
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!active || !layer) { meterState.running = false; return; }
    const make = (cls: string) => { const el = document.createElement('div'); el.className = cls; layer.appendChild(el); return el; };
    const still = make('glitch-meter-still');
    const shear = make('theme-fx-shear');
    const noise = make('theme-fx-noise');
    const dip = make('theme-fx-backlight');
    // only keystrokes count as activity (Nick's rule); opening the page counts as one, so it starts silent
    noteKeystroke();
    const onKey = () => noteKeystroke();
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('beforeinput', onKey, true);   // a soft keyboard or an IME may send no keydown
    const isStill = () => prefersReducedMotion() || getAmbianceDial() === 0;
    const double = (p: number) => meterSeam.forceDouble || Math.random() < p;
    let I = 0;
    // LEDGER 114 (G6 intermittent): a double dip's second pulse comes 750 ms after its first, a double jump's 140 ms after - long enough for
    // reduced motion (or Ambiance 0) to land in between. The second pulse is a NEW flash, so it asks the same question fire() asks, at ITS
    // moment, before it asks the budget: under reduced motion nothing new reaches the screen, even from an event already under way.
    const second = (kind: string) => () => !isStill() && tryFlash(kind);
    const fire = (kind: MeterKind): boolean => {
      if (I <= 0 || isStill()) return false;
      if (!tryFlash(`gm-${kind}`)) return false;
      switch (kind) {
        case 'tear': tearStorm(layer, bright(I, 0.28, 0.72), () => !isStill()); break;   // a storm under way lays no more lines once still
        case 'shear': shearBand(shear, bright(I, 0.35, 0.85)); break;
        case 'noise': noisePatch(noise, bright(I, 0.4, 1)); break;
        case 'macro': macroCluster(layer, bright(I, 0.08, 0.16)); break;
        case 'sync': syncJump(layer, double(0.4), second('gm-sync2')); break;
        case 'dip': { const peak = bright(I, 0.05, 0.14); backlightDip(dip, peak, peak * 0.7, double(0.5), second('gm-dip2')); break; }
      }
      return true;
    };
    meterSeam.fire = fire;
    // one clock: the intensity per frame, and each event fired when it falls due. While silent (or still) nothing is scheduled; when the
    // meter wakes, each event waits a fresh gap first - the six never all fire on the frame it wakes.
    const next: Partial<Record<MeterKind, number>> = {};
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const idle = idleSeconds(now);
      const lap = meterSeam.lapFracOverride ?? fracRef.current;
      const flicker = getWritingSettings().flicker;
      const reduced = isStill();
      I = flicker ? meterIntensity(idle, lap) : 0;
      meterState.I = I; meterState.idleSec = idle; meterState.lapFrac = lap; meterState.reduced = reduced; meterState.flicker = flicker; meterState.running = true;
      still.style.opacity = reduced ? String(I * 0.42) : '0';
      // Fable, Oct 21: the moment motion is turned off, a tear storm's lines still on screen go too (the first still frame; they are its only
      // pieces that outlive the flash's own instant)
      if (reduced) layer.querySelectorAll('.theme-fx-tear').forEach((el) => el.remove());
      if (reduced || I <= 0) { for (const k of KINDS) delete next[k]; return; }
      const dial = getAmbianceDial();
      for (const k of KINDS) {
        const due = next[k];
        if (due !== undefined && now >= due) fire(k);
        if (due === undefined || now >= due) next[k] = now + nextGapMs(SPANS[k][0], SPANS[k][1], I, dial);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('beforeinput', onKey, true);
      meterSeam.fire = null;
      meterState.running = false;
      meterState.I = 0;
      still.remove(); shear.remove(); noise.remove(); dip.remove();
    };
  }, [active]);

  if (!active || typeof document === 'undefined') return null;
  return createPortal(<div ref={layerRef} className="glitch-meter-layer" aria-hidden="true" />, document.body);
}
