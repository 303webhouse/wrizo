// FLUX3 S4 - THE CORRIDOR (Nick's pick, Nov 9: "Love the grid"; flux-jacked-in-concepts.md, Style B). Jacked In's ground: a wireframe corridor, rectangular frames flying out of a
// vanishing point raised to 21% of the window, over one static SVG of rails (a fan across the floor, walls and ceiling, plus the horizon line) and their rib ticks. It is the WHOLE WINDOW
// (fixed, first in .mode-stage so the page column paints above it): the room, the sheet and the strips show nowhere around it. Aria-hidden, no pointer: nothing here moves, covers or reads the page.
//   - GEOMETRY (the Wrizors' Nov 9 numbers, from the approved video): eight frames at even steps of DEPTH, a frame's size = 1 / its depth, depths 1.1 + 1.03 n (half-widths 0.91 .47 .32 .24 .19 .16 .14
//     .12 of the screen's half). A frame is the window's own rectangle scaled about the vanishing point, so every rail (a ray through the vanishing point) meets it at its corner or rib.
//     Its line strength follows its depth (LINE_CONTRAST: nearest 2.85:1, the next two 1.85 and 1.65, the far five 1.3 to 1.2, against the ground #020C10).
//   - A STEP, NOT A RUN. Each frame element moves ONE slot a cycle (from the next slot's size to its own) and the cycle repeats: the picture at the end of a cycle is the picture at its start (the
//     nearest frame leaves, a new one fades in at the far end), so the corridor flows without a seam. One transform + one opacity per frame, the compositor's.
//   - PACE DRIVES IT (Nick's named exception, Jacked In only). A key does ONE thing here: it stamps its time into an array. Every 250 ms (4 Hz, never faster) one tick averages the keys of the last
//     PACE.windowMs and sets the animations' own playbackRate (updatePlaybackRate keeps every frame where it stands). No per-frame JS, no canvas, no layout.
//     #140 (Nick, Nov 2026: "too herky jerky"): the speed FOLLOWS HER PACE, NOT EACH KEY: it changes only when the average has moved by a clear step.
//     #140 ROUND TWO (Nick, Nov 26: "more of a ramp up and ramp down with a bit more of a buffer"; "a false stop and then lurches"): ONE EASED RAMP UP, ONE EASED RAMP DOWN.
//     From rest she has to be writing for PACE.startMs before anything moves; then the speed eases up (a critically damped follower, about 3 s, no corners).
//   - WHEN SHE STOPS nothing changes for PACE.quietMs; then ONE planned slow-down brings the corridor to rest EXACTLY on a slot (so the picture at rest is the video's). THE SPEED ONLY EVER FALLS: where the
//     slot is further than the slow-down would carry it, it holds its speed a little first; it never speeds up to get there. Writing again, it goes on slowing for PACE.startMs, then eases back up.
//     Nothing moves while she thinks. The animations START PAUSED (css: animation-play-state, [data-run] runs them), so one that begins
//     after the pace effect ran (flux-v3.css is a dynamic import) is never left running.
//   - AT SPEED a lime frame shows (never a score), asked of the flash budget like every flash.
//   - THE POP: a brass tint and one brass frame flying past, ~0.3 s, once per milestone (FluxCheckpointPop sends 'flux3-pop'); one change through the flash budget.
//   - THE GLOW (Nick, Nov 9 3:43 pm): it BUILDS as she nears her goal. It reads the same progress as the Glitch bar's units (useGoalProgress over WORD_GOAL, as the bar, the burst edge and the pop
//     do), is 0 at the start of a lap and none when no goal is set, and at the goal reaches the ruled recipe: --f3-goal-glow, #57D0F5 at 12% at the centre, 4% at 55%, none at the edge, never above
//     14%. One static gradient; only its opacity follows progress (the after-a-goal hold, the 40% floor and the easing are in the constants GLOW_*).
//   - THE QUIET LANE: a soft oval of the ground's own colour over the FRAMES AND RAILS around her writing line, so their motion never crosses it. It sits BELOW the glow, so it never covers it.
//   - The still state (reduced motion, Ambiance 0): the frames stand at their places, nothing runs, no lime, no brass tint.
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useAmbianceDial, prefersReducedMotion } from '../store/ambianceDial';
import { tryFlash } from '../store/flashBudget';
import { useWritingGoal } from '../store/writingGoal';
import { useWritingSettings } from '../store/writingSettings';
import { useGoalProgress, WORD_GOAL } from '../components/WritingIncentives';

export const PACE = {
  tickMs: 250,       // the speed is set at most this often (4 Hz)
  windowMs: 4000,    // her pace is the AVERAGE of the last 4 s (#140: 0.7 s moved the speed on almost every key)
  stepKps: 1.5,      // the speed follows only a clear step of that average: this many keys a second,
  stepShare: 0.4,    // or this share of the pace it is following, whichever is more
  startMs: 1000,     // she writes for this long (and startKeys keys) before the speed rises
  startKeys: 3,
  quietMs: 1200,     // this long without a key and she has stopped (her breaths between words are shorter)
  followPerSec: 1.3, // how fast the speed follows her pace: 90% of the way in about 3 s
  downMs: 3000,      // the slow-down to rest,
  downMinMs: 2400,   // stretched or shortened within these to land on a slot,
  downMaxMs: 3600,
  holdMaxMs: 2000,   // or held at speed this long first; further than that it stops where the slow-down ends
  maxStep: 0.45,     // never more than this much playbackRate in one tick, however far it has to go
  minRate: 0.6,      // while she writes, never slower than this (so a stop never drags)
  maxKps: 12,        // a fast typist's characters a second: the rate stops rising here
  limeKps: 8,        // at or above this (smoothed), the lime frame shows
};
export const POP_MS = 300;   // the brass tint's length
export const GLOW_HOLD_MS = 2000;     // after a goal the glow holds at full while CHECKPOINT shows
export const GLOW_SETTLE_MS = 3000;   // then eases down this long to the floor
export const GLOW_FLOOR = 0.4;        // and from her first goal on never falls under 40% for this session (memory only: nothing is saved)
export const GLOW_EASE_MS = 1200;     // a change in her count eases over this
const STEP_S = 1.1;          // a frame's step from one slot to the next at playbackRate 1 (flux-v3.css flux3-cor-step: keep the two in step)
const MAX_RATE = 5;          // the playbackRate at a fast typist's pace
// the playback rate while she writes at a pace in keys a second: minRate at least, MAX_RATE at maxKps and above
export const rateFor = (pace: number): number => Math.max(PACE.minRate, Math.min(1, pace / PACE.maxKps) * MAX_RATE);

// ---- the corridor's geometry (a frame's size = 1 / its depth; the vanishing point at 21% of the window's height) ----
export const FRAME_SLOTS = 8;                 // frames showing at once
export const DEPTH0 = 1.1, DEPTH_STEP = 1.03; // the nearest frame's depth, and the even step between frames
export const VP = { x: 50, y: 21 };           // the vanishing point, % of the window
export const depthOf = (n: number): number => DEPTH0 + DEPTH_STEP * n;
export const scaleOf = (n: number): number => 1 / depthOf(n);
// each slot's line strength as MEASURED in the render (the Wrizors' table: nearest 2.8-2.9:1, the next two 1.6-1.9, the far five 1.2-1.3, against the ground #020C10) and the opacity of a #57D0F5 line that gives it.
// A 1 px line stands on fractional pixels, so the opacity runs above the flat-pixel arithmetic (2.85:1 flat is .43; the render read 2.06 at that, 2.9 at .58); worked out in the render by a calibration run (Nov 9), then smoothed so a frame does not pulse as it passes.
export const LINE_CONTRAST = [2.85, 1.85, 1.7, 1.3, 1.3, 1.2, 1.25, 1.2];
export const LINE_ALPHA = [0.58, 0.39, 0.29, 0.19, 0.17, 0.17, 0.15, 0.16];
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
  // THE GLOW'S STRENGTH (draft 23, 6a.6): none when no goal is set (or the instruments are off, as the goal's own glow, or Ambiance 0); until a goal is met it is the bar's own fill, a straight line from
  // nothing; AT a goal it holds at full while CHECKPOINT shows, then eases down to 40%, and from then on it is 40% + 60% of the fill (the floor stays for this session, in memory only)
  const [holding, setHolding] = useState(false);
  const [settling, setSettling] = useState(false);
  const earned = useRef(false);
  const timers = useRef<number[]>([]);
  useEffect(() => {
    if (!celebrating) return;
    earned.current = true;
    setHolding(true);
    setSettling(false);
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [
      window.setTimeout(() => { setHolding(false); setSettling(true); }, GLOW_HOLD_MS),
      window.setTimeout(() => setSettling(false), GLOW_HOLD_MS + GLOW_SETTLE_MS),
    ];
  }, [celebrating]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const enabled = goal != null && goal.n > 0 && settings.instrumentsOn && dial !== 0;
  const reached = earned.current || celebrating;
  const glow = !enabled ? 0 : holding || celebrating ? 1 : reached ? GLOW_FLOOR + (1 - GLOW_FLOOR) * frac : frac;
  const glowEase = settling ? GLOW_SETTLE_MS : GLOW_EASE_MS;

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
    let pace = 0;            // the pace the speed is following: it moves only on a clear step
    let rate = 0;
    let vel = 0;             // how fast the speed itself is changing (per second), so a ramp has no corners
    let driving = false;     // she is writing and the speed follows her
    let fast = false;
    let settle = 0;
    // the slow-down in hand: when it began, the frames' own time then, how far it goes (in that time), from what speed, and its two parts
    let plan: { at: number; from: number; dist: number; r0: number; hold: number; down: number; land: boolean } | null = null;
    const STEP = STEP_S * 1000;
    // the FRAMES' animations only (CSSAnimation). The glow's opacity TRANSITION lives in the same box: stopping every animation at rest froze it mid-ease (the harness read its target at 0.40 and its
    // opacity stuck at 0.95 for ten seconds)
    const anims = () => box.getAnimations({ subtree: true }).filter((a) => 'animationName' in a);
    const frameTime = (): number | null => {
      const loop = anims().find((a) => a.effect && a.effect.getTiming().iterations === Infinity);
      return loop && typeof loop.currentTime === 'number' ? loop.currentTime : null;
    };
    const setRate = (r: number) => { rate = r; anims().forEach((a) => a.updatePlaybackRate(r)); };
    const rest = () => {
      window.clearTimeout(settle); settle = 0;
      const end = plan && plan.land ? plan.from + plan.dist : null;
      anims().forEach((a) => { a.updatePlaybackRate(0); if (end != null && a.effect && a.effect.getTiming().iterations === Infinity) a.currentTime = end; });
      rate = 0; vel = 0; plan = null;
      box.removeAttribute('data-run');
    };
    // ONE slow-down to rest, planned once: hold (only if the slot is far), then a smooth fall to nothing. It ends on a slot.
    const planStop = (now: number) => {
      const t = frameTime();
      if (t == null || rate <= 0) { rest(); return; }
      const r0 = rate;
      const slot = Math.ceil((t + (r0 * PACE.downMinMs) / 2) / STEP) * STEP;   // the first slot a short slow-down can still reach
      let dist = slot - t, hold = 0, down = (2 * dist) / r0, land = true;
      if (down > PACE.downMaxMs) { down = PACE.downMs; hold = (dist - (r0 * down) / 2) / r0; }
      if (hold > PACE.holdMaxMs) { hold = 0; down = PACE.downMs; dist = (r0 * down) / 2; land = false; }   // very slow already: stop where it ends
      plan = { at: now, from: t, dist, r0, hold, down, land };
    };
    // where the plan has the frames by e ms in (the speed is r0, then r0 * (1 - 3u^2 + 2u^3): level at both ends)
    const planned = (p: NonNullable<typeof plan>, e: number): number => {
      if (e <= p.hold) return p.r0 * e;
      const u = Math.min(1, (e - p.hold) / p.down);
      return p.r0 * p.hold + p.r0 * p.down * (u - u ** 3 + u ** 4 / 2);
    };
    const slowDown = (now: number) => {
      const p = plan;
      const t = frameTime();
      if (!p || t == null) { rest(); return; }
      if (settle) return;   // the last stretch is timed below
      const e = now - p.at, end = p.hold + p.down, gone = t - p.from;
      if (end - e <= PACE.tickMs * 1.5) {
        const left = Math.max(40, end - e);
        setRate(Math.max(0, Math.min(rate, (p.dist - gone) / left)));
        settle = window.setTimeout(rest, left);
        return;
      }
      // from where the frames ARE to where the plan has them a tick from now, and never faster than before
      setRate(Math.max(0, Math.min(rate, (planned(p, e + PACE.tickMs) - gone) / PACE.tickMs)));
      if (rate === 0) rest();   // already there
    };
    const tick = () => {
      const now = performance.now();
      while (keys.length && now - keys[0] > PACE.windowMs) keys.shift();
      const average = keys.length / (PACE.windowMs / 1000);
      // her unbroken run of keys: back from the newest while no gap is as long as quietMs
      let run = keys.length ? 1 : 0;
      while (run && run < keys.length && keys[keys.length - run] - keys[keys.length - run - 1] < PACE.quietMs) run += 1;
      const writing = run > 0 && now - keys[keys.length - 1] < PACE.quietMs;
      if (!writing) driving = false;
      else if (!driving && run >= PACE.startKeys && now - keys[keys.length - run] >= PACE.startMs) {
        driving = true; pace = 0; vel = 0;
        window.clearTimeout(settle); settle = 0; plan = null;
      }
      if (driving) {
        // her pace now: over the window, or over as much of it as she has been writing
        const heard = keys.length / (Math.min(PACE.windowMs, Math.max(1500, now - keys[0])) / 1000);
        if (!pace || Math.abs(heard - pace) >= Math.max(PACE.stepKps, pace * PACE.stepShare)) pace = heard;
        const to = rateFor(pace), w = PACE.followPerSec, dt = PACE.tickMs / 1000;
        const off = rate - to, b = vel + w * off, fall = Math.exp(-w * dt);
        const eased = to + (off + b * dt) * fall;
        const next = rate + Math.max(-PACE.maxStep, Math.min(PACE.maxStep, eased - rate));
        vel = next === eased ? (b - w * (off + b * dt)) * fall : (next - rate) / dt;
        box.setAttribute('data-run', '');
        setRate(next);
      } else if (rate > 0) {
        if (!plan) planStop(now);
        if (plan) slowDown(now);
      }
      const f = fast ? average >= PACE.limeKps * 0.75 : average >= PACE.limeKps;
      if (f !== fast && (!f || tryFlash('f3-corridor'))) { fast = f; if (f) box.setAttribute('data-fast', ''); else box.removeAttribute('data-fast'); }
    };
    document.addEventListener('keydown', onKey, { capture: true, passive: true });
    // the corridor stands still until she types: its animations start PAUSED (css), and [data-run] runs them
    const iv = window.setInterval(tick, PACE.tickMs);
    return () => { document.removeEventListener('keydown', onKey, { capture: true }); window.clearInterval(iv); window.clearTimeout(settle); box.removeAttribute('data-fast'); box.removeAttribute('data-run'); };
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
      <i className="flux3-cor-glow" data-glow={glow.toFixed(3)} style={{ opacity: glow, ['--glow-ease' as string]: `${glowEase}ms` }} />
    </>,
    box,
  );
}
