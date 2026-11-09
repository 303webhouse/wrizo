// FLUX3 S4 - THE CORRIDOR (Nick's pick, Nov 9: "Love the grid"; flux-jacked-in-concepts.md, Style B). Jacked In's ground: a wireframe corridor, thin
// rectangular frames flying out of a vanishing point raised to ~21% of the stage, over one static SVG of corner rails and floor ticks. It sits BEHIND
// the page (first in .mode-stage), aria-hidden, no pointer: nothing here moves, covers or reads the page.
//   - PACE DRIVES IT (Nick's named exception, Jacked In only). A key does ONE thing here: it stamps its time into an array. Every 250 ms (4 Hz, never
//     faster) one tick reads the keys of the last PACE.windowMs, smooths them into a single number, and sets the animations' own playbackRate
//     (updatePlaybackRate keeps every frame where it stands: the speed changes, nothing jumps). No per-frame JS, no canvas, no layout.
//   - WHEN SHE STOPS the pace eases to zero over ~1.5 s (PACE.ease 0.5 a tick) and the playbackRate reaches 0: the corridor HOLDS STILL. Nothing moves
//     while she thinks.
//   - AT SPEED a lime frame shows (never a score: speed you can feel), asked of the flash budget like every flash.
//   - THE POP: a brass tint and one brass frame flying past, for ~0.3 s, once per milestone (the CHECKPOINT letters, FluxCheckpointPop.tsx, send the
//     'flux3-pop' event); one change through the flash budget.
//   - THE QUIET LANE: a soft oval of the ground's own colour over the writing line, so the motion never crosses the line she is writing.
//   - The still state (reduced motion, Ambiance 0): the frames stand at their places, nothing runs, no lime, no brass tint.
import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useAmbianceDial, prefersReducedMotion } from '../store/ambianceDial';
import { tryFlash } from '../store/flashBudget';

export const PACE = {
  tickMs: 250,       // the speed is set at most this often (4 Hz)
  windowMs: 700,     // the keys it counts: those of the last 0.7 s
  ease: 0.5,         // each tick moves the smoothed pace halfway to the keys' own rate (a stop reads ~0 in ~1.5 s)
  maxKps: 12,        // a fast typist's characters a second: the rate stops rising here
  limeKps: 8,        // at or above this (smoothed), the lime frame shows
  stillBelow: 0.15,  // under this smoothed pace the corridor holds (playbackRate 0)
};
export const POP_MS = 300;   // the brass tint's length
const FRAMES = 8;            // thin frame elements (one-pixel borders) in a staggered scale-up loop
const RUN_S = 8;             // a frame's run from the vanishing point to past the edge at playbackRate 1
const MAX_RATE = 5;          // the playbackRate at a fast typist's pace
// the playback rate for a smoothed pace in keys a second: 0 at rest, MAX_RATE at maxKps and above
export const rateFor = (pace: number): number => (pace < PACE.stillBelow ? 0 : Math.min(1, pace / PACE.maxKps) * MAX_RATE);

interface Props { scrollRef: RefObject<HTMLDivElement | null> }

export function FluxCorridor({ scrollRef }: Props) {
  const dial = useAmbianceDial();
  const still = prefersReducedMotion() || dial === 0;
  const [box, setBox] = useState<HTMLDivElement | null>(null);

  // the corridor's box, FIRST in .mode-stage (so the page column and every other positioned piece of the stage paints above it)
  useLayoutEffect(() => {
    const stage = scrollRef.current?.closest('.mode-stage');
    if (!stage) return undefined;
    const el = document.createElement('div');
    el.className = 'flux3-corridor';
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('data-flux3-corridor', '');
    stage.prepend(el);
    setBox(el);
    return () => { el.remove(); setBox(null); };
  }, [scrollRef]);

  useLayoutEffect(() => {
    if (!box) return;
    if (still) box.setAttribute('data-still', ''); else box.removeAttribute('data-still');
  }, [box, still]);

  // THE PACE: one timestamp per key; one tick every PACE.tickMs
  useEffect(() => {
    if (!box || still) return undefined;
    const keys: number[] = [];
    const onKey = (e: KeyboardEvent) => { if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') keys.push(performance.now()); };
    let pace = 0;
    let rate = 0;
    let fast = false;
    const tick = () => {
      const now = performance.now();
      while (keys.length && now - keys[0] > PACE.windowMs) keys.shift();
      pace += (keys.length / (PACE.windowMs / 1000) - pace) * PACE.ease;
      const next = rateFor(pace);
      if (Math.abs(next - rate) >= 0.02 || (next === 0 && rate !== 0)) { rate = next; box.getAnimations({ subtree: true }).forEach((a) => a.updatePlaybackRate(rate)); }
      const f = fast ? pace >= PACE.limeKps * 0.75 : pace >= PACE.limeKps;
      if (f !== fast && (!f || tryFlash('f3-corridor'))) { fast = f; if (f) box.setAttribute('data-fast', ''); else box.removeAttribute('data-fast'); }
    };
    document.addEventListener('keydown', onKey, { capture: true, passive: true });
    // the corridor stands still until she types: its animations start paused
    box.getAnimations({ subtree: true }).forEach((a) => a.updatePlaybackRate(0));
    const iv = window.setInterval(tick, PACE.tickMs);
    return () => { document.removeEventListener('keydown', onKey, { capture: true }); window.clearInterval(iv); box.removeAttribute('data-fast'); };
  }, [box, still]);

  // THE POP: brass for POP_MS, once per milestone (FluxCheckpointPop asked the flash budget before it sent this)
  useEffect(() => {
    if (!box || still) return undefined;
    let off = 0;
    const onPop = () => {
      box.setAttribute('data-pop', '');
      window.clearTimeout(off);
      off = window.setTimeout(() => box.removeAttribute('data-pop'), POP_MS);
    };
    window.addEventListener('flux3-pop', onPop);
    return () => { window.removeEventListener('flux3-pop', onPop); window.clearTimeout(off); box.removeAttribute('data-pop'); };
  }, [box, still]);

  if (!box) return null;
  return createPortal(
    <>
      <svg className="flux3-cor-rails" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M50 21 L0 0 M50 21 L100 0 M50 21 L0 100 M50 21 L100 100" />
        <path d="M18 100 V97 M34 100 V97 M50 100 V96 M66 100 V97 M82 100 V97" />
      </svg>
      {Array.from({ length: FRAMES }, (_, i) => {
        const d = i / FRAMES;   // where this frame stands on its run (also its still place)
        return <i key={i} className="flux3-cor-frame" style={{ animationDelay: `${-d * RUN_S}s`, ['--s' as string]: (0.05 + Math.pow(d, 2.2) * 0.95).toFixed(4), ['--o' as string]: (0.14 + d * 0.66).toFixed(3) }} />;
      })}
      <i className="flux3-cor-frame" data-kind="lime" style={{ animationDelay: `${-0.3 * RUN_S}s`, ['--s' as string]: '0.4', ['--o' as string]: '0.9' }} />
      <i className="flux3-cor-frame" data-kind="brass" style={{ animationDelay: '0s', ['--s' as string]: '0.4', ['--o' as string]: '0' }} />
      <div className="flux3-cor-lane" />
    </>,
    box,
  );
}
