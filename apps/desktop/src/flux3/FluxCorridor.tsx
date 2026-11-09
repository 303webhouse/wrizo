// FLUX3 S4 - THE CORRIDOR (Nick's pick, Nov 9: "Love the grid"; flux-jacked-in-concepts.md, Style B). Jacked In's ground: a wireframe corridor, rectangular frames flying out of a
// vanishing point raised to 21% of the window, over one static SVG of rails (a fan across the floor, walls and ceiling, plus the horizon line) and their rib ticks. It is the WHOLE WINDOW
// (fixed, first in .mode-stage so the page column paints above it): the room, the sheet and the strips show nowhere around it. Aria-hidden, no pointer: nothing here moves, covers or reads the page.
//   - GEOMETRY (the Wrizors' Nov 9 numbers, from the approved video): eight frames at even steps of DEPTH, a frame's size = 1 / its depth, depths 1.1 + 1.03 n (half-widths 0.91 .47 .32 .24 .19 .16 .14
//     .12 of the screen's half). A frame is the window's own rectangle scaled about the vanishing point, so every rail (a ray through the vanishing point) meets it at its corner or rib.
//     Its line strength follows its depth (LINE_CONTRAST: nearest 2.85:1, the next two 1.85 and 1.65, the far five 1.3 to 1.2, against the ground #020C10).
//   - A STEP, NOT A RUN. Each frame element moves ONE slot a cycle (from the next slot's size to its own) and the cycle repeats: the picture at the end of a cycle is the picture at its start (the
//     nearest frame leaves, a new one fades in at the far end), so the corridor flows without a seam. One transform + one opacity per frame, the compositor's.
//   - PACE DRIVES IT (Nick's named exception, Jacked In only). A key does ONE thing here: it stamps its time into an array. Every 250 ms (4 Hz, never faster) one tick reads the keys of the last
//     PACE.windowMs, smooths them into a single number, and sets the animations' own playbackRate (updatePlaybackRate keeps every frame where it stands). No per-frame JS, no canvas, no layout.
//   - WHEN SHE STOPS the pace eases to zero over ~1.5 s and the playbackRate reaches 0: the corridor HOLDS STILL. Nothing moves while she thinks.
//   - AT SPEED a lime frame shows (never a score), asked of the flash budget like every flash.
//   - THE POP: a brass tint and one brass frame flying past, ~0.3 s, once per milestone (FluxCheckpointPop sends 'flux3-pop'); one change through the flash budget.
//   - THE GLOW (Nick, Nov 9 3:43 pm): it BUILDS as she nears her goal. It reads the same progress as the Glitch bar's units (useGoalProgress over WORD_GOAL, as the bar, the burst edge and the pop
//     do), is 0 at the start of a lap and none when no goal is set, and at the goal reaches the ruled recipe: --f3-goal-glow, #57D0F5 at 12% at the centre, 4% at 55%, none at the edge, never above
//     14%. One static gradient; only its opacity follows progress.
//   - THE QUIET LANE: a soft oval of the ground's own colour over the FRAMES AND RAILS around her writing line, so their motion never crosses it. It sits BELOW the glow, so it never covers it.
//   - The still state (reduced motion, Ambiance 0): the frames stand at their places, nothing runs, no lime, no brass tint.
import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useAmbianceDial, prefersReducedMotion } from '../store/ambianceDial';
import { tryFlash } from '../store/flashBudget';
import { useWritingGoal } from '../store/writingGoal';
import { useWritingSettings } from '../store/writingSettings';
import { useGoalProgress, WORD_GOAL } from '../components/WritingIncentives';

export const PACE = {
  tickMs: 250,       // the speed is set at most this often (4 Hz)
  windowMs: 700,     // the keys it counts: those of the last 0.7 s
  ease: 0.5,         // each tick moves the smoothed pace halfway to the keys' own rate (a stop reads ~0 in ~1.5 s)
  maxKps: 12,        // a fast typist's characters a second: the rate stops rising here
  limeKps: 8,        // at or above this (smoothed), the lime frame shows
  stillBelow: 0.15,  // under this smoothed pace the corridor holds (playbackRate 0)
};
export const POP_MS = 300;   // the brass tint's length
const STEP_S = 1.1;          // a frame's step from one slot to the next at playbackRate 1
const MAX_RATE = 5;          // the playbackRate at a fast typist's pace
// the playback rate for a smoothed pace in keys a second: 0 at rest, MAX_RATE at maxKps and above
export const rateFor = (pace: number): number => (pace < PACE.stillBelow ? 0 : Math.min(1, pace / PACE.maxKps) * MAX_RATE);

// ---- the corridor's geometry (a frame's size = 1 / its depth; the vanishing point at 21% of the window's height) ----
export const FRAME_SLOTS = 8;                 // frames showing at once
export const DEPTH0 = 1.1, DEPTH_STEP = 1.03; // the nearest frame's depth, and the even step between frames
export const VP = { x: 50, y: 21 };           // the vanishing point, % of the window
export const depthOf = (n: number): number => DEPTH0 + DEPTH_STEP * n;
export const scaleOf = (n: number): number => 1 / depthOf(n);
// each slot's line strength as a WCAG contrast against the ground #020C10, and the opacity of a #57D0F5 line that gives it (worked out in the lane's notes: contrast of the line composited on the ground)
export const LINE_CONTRAST = [2.85, 1.85, 1.65, 1.3, 1.27, 1.25, 1.22, 1.2];
export const LINE_ALPHA = [0.432, 0.281, 0.24, 0.148, 0.138, 0.13, 0.119, 0.112];
const alphaAt = (n: number): number => (n < 0 || n >= FRAME_SLOTS ? 0 : LINE_ALPHA[n]);
export const RAIL_ALPHA = 0.16;               // the rails and ribs: about 1.35:1, the far frames' strength

// the rails: one still picture. Each rail runs from the INNERMOST frame's edge out to the window's edge along a ray through the vanishing point; ribs are short ticks standing on each frame slot's
// edge at the rail (pointing in), longer on the near frames. viewBox 160 x 90 so a tick's length is the same in both directions.
const VBW = 160, VBH = 90;
const vpx = (VP.x / 100) * VBW, vpy = (VP.y / 100) * VBH;
type Side = 'top' | 'bottom' | 'left' | 'right' | 'corner';
function railPoints(): { x: number; y: number; side: Side }[] {
  const out: { x: number; y: number; side: Side }[] = [];
  for (let i = 0; i <= 8; i += 1) out.push({ x: (i * VBW) / 8, y: VBH, side: i === 0 || i === 8 ? 'corner' : 'bottom' });                 // the floor: nine rails
  for (let i = 0; i <= 6; i += 1) out.push({ x: (i * VBW) / 6, y: 0, side: i === 0 || i === 6 ? 'corner' : 'top' });                      // the ceiling: seven
  for (const y of [vpy, 46, 70]) { out.push({ x: 0, y, side: 'left' }); out.push({ x: VBW, y, side: 'right' }); }                          // the walls (the first pair is the horizon line)
  return out;
}
export function railsPath(): { rails: string; ribs: string } {
  const f = (n: number) => n.toFixed(2);
  const inner = scaleOf(FRAME_SLOTS - 1);
  let rails = '', ribs = '';
  for (const p of railPoints()) {
    rails += `M${f(vpx + inner * (p.x - vpx))} ${f(vpy + inner * (p.y - vpy))} L${f(p.x)} ${f(p.y)} `;
    if (p.side === 'corner') continue;
    for (let n = 0; n < FRAME_SLOTS; n += 1) {
      const s = scaleOf(n);
      const qx = vpx + s * (p.x - vpx), qy = vpy + s * (p.y - vpy);
      const h = 1.8 * Math.pow(s, 0.75);   // the rib's length (inward), longer near
      if (p.side === 'bottom') ribs += `M${f(qx)} ${f(qy)} V${f(qy - h)} `;
      else if (p.side === 'top') ribs += `M${f(qx)} ${f(qy)} V${f(qy + h)} `;
      else if (p.side === 'left') ribs += `M${f(qx)} ${f(qy)} H${f(qx + h)} `;
      else ribs += `M${f(qx)} ${f(qy)} H${f(qx - h)} `;
    }
  }
  return { rails, ribs };
}

interface Props { scrollRef: RefObject<HTMLDivElement | null>; unitCount: number }

export function FluxCorridor({ scrollRef, unitCount }: Props) {
  const dial = useAmbianceDial();
  const still = prefersReducedMotion() || dial === 0;
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const goal = useWritingGoal();
  const settings = useWritingSettings();
  const { frac, celebrating } = useGoalProgress(unitCount, WORD_GOAL);
  // none when no goal is set (or the instruments are off, as the goal's own glow); 0 at the start of a lap; the whole recipe at the goal
  const glow = goal != null && goal.n > 0 && settings.instrumentsOn && dial !== 0 ? (celebrating ? 1 : frac) : 0;

  // the corridor's box, FIRST in .mode-stage (so the page column and every other positioned piece of the stage paints above it) and FIXED to the window: nothing of the room or the sheet shows
  useLayoutEffect(() => {
    const stage = scrollRef.current?.closest('.mode-stage') as HTMLElement | null;
    if (!stage) return undefined;
    const el = document.createElement('div');
    el.className = 'flux3-corridor';
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('data-flux3-corridor', '');
    // the structural styles are inline, so the box can NEVER fall into the stage's flow: flux-v3.css is a dynamic import and can arrive after this mounts, and a static box ahead of the page
    // column made DeskFrame measure the page's room as 0 (the page, clipped to 0, hid every line she typed; frames found it, Nov 9). Fixed: it takes the window, the ground and all, and moves nothing.
    el.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;overflow:hidden;pointer-events:none;contain:strict;z-index:0;background:#020C10;';
    stage.prepend(el);
    // her writing line: the glow and the quiet lane centre on it (read once and on a resize, never per key)
    const place = () => { const r = stage.getBoundingClientRect(); el.style.setProperty('--cor-line-y', `${Math.round(r.top + r.height * 0.55)}px`); };
    place();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null;
    ro?.observe(stage);
    window.addEventListener('resize', place);
    setBox(el);
    return () => { ro?.disconnect(); window.removeEventListener('resize', place); el.remove(); setBox(null); };
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
  const { rails, ribs } = railsPath();
  // frame n (-1 .. 7): the nearest one (-1) leaves; frames 0..7 stand at their slots at the end of a step, one slot further out at the start; the far one (7) fades in from nothing
  const frames = Array.from({ length: FRAME_SLOTS + 1 }, (_, i) => i - 1);
  const vars = (n: number): Record<string, string> => {
    const a = n < 0 ? scaleOf(0) : scaleOf(n + 1);
    const b = n < 0 ? 1.9 : scaleOf(n);
    const mid = Math.sqrt(a * b);
    return { '--a': a.toFixed(4), '--b': b.toFixed(4), '--o0': (n < 0 ? alphaAt(0) : alphaAt(n + 1)).toFixed(3), '--o1': (n < 0 ? 0 : alphaAt(n)).toFixed(3), '--bw': `${(1 / mid).toFixed(2)}px`, '--os': (n < 0 ? 0 : alphaAt(n)).toFixed(3) };
  };
  return createPortal(
    <>
      <svg className="flux3-cor-rails" viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="none" aria-hidden="true">
        <path className="flux3-cor-fan" d={rails} />
        <path className="flux3-cor-ribs" d={ribs} />
      </svg>
      {frames.map((n) => <i key={n} className="flux3-cor-frame" data-slot={n} style={vars(n) as React.CSSProperties} />)}
      <i className="flux3-cor-frame" data-kind="lime" style={vars(0) as React.CSSProperties} />
      <i className="flux3-cor-frame" data-kind="brass" />
      <div className="flux3-cor-lane" />
      <i className="flux3-cor-glow" data-glow={glow.toFixed(3)} style={{ opacity: glow }} />
    </>,
    box,
  );
}
