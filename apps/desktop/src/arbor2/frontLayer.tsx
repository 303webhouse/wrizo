// ARBOR v2 MOCKUP r18 - NICK'S SPLASH CHANGES (Fable, Nov 2-3). Two layers laid over Nick's drawing, in the drawing's own coordinates (its
// canvas, 3374 x 2699 px; the splash box and the front door's box keep its aspect, so a percentage of the box is a point of the drawing):
//   ArborTopLogo  - the hand-drawn logo where the erased "WRIZO (in abstract)" line stood (scripts/arbor2-splash-r18.mjs), with
//                   "For humans who write." under it (stand-in type until Nick's lettering). On the splash it is written out (logoWrite.tsx's
//                   strokes, 2.0 s, then the still logo); on the front door it is the still logo, in the same rect, so nothing moves.
//   ArborFrontDoors - the doors as hand-drawn brass boxes on the drawing's empty ground, Write and Log in (signed in: Write and Open). They
//                   come LAST: after the splash has gone and after the logo's writing, drawing themselves in. No click for 5 s and their
//                   outline brightens once, gently, then every 30 s; any act of the writer stops it for good. Reduced motion: there at once,
//                   at full strength, still.
// Both rects are checked against the drawing's ink offline (scripts/harness/arbor2-r18-unit.mjs). Nothing is stored.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LOGO_STROKES, LOGO_WRITE_S } from './logoWrite';

const CW = 3374, CH = 2699;
export const TOP_LOGO = { x: 1910, y: 0, w: 540, h: 240 };
export const TAGLINE = { cx: 2180, top: 250 };
export const DOORS = [
  { id: 'write', x: 2270, y: 2260, w: 450, h: 200 },
  { id: 'second', x: 2790, y: 2260, w: 450, h: 200 },
];
const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const place = (r: { x: number; y: number; w: number; h: number }) => ({ left: pct(r.x, CW), top: pct(r.y, CH), width: pct(r.w, CW), height: pct(r.h, CH) });

// the timing, for the order of things and the proofs (scripts/frames/arbor2-r18.mjs reads it; nothing writes it but this file)
type FrontTiming = { logoStart: number; logoDone: number; doorsIn: number; shownAt: number; pulses: number[]; acted: boolean };
const timing: FrontTiming = { logoStart: 0, logoDone: 0, doorsIn: 0, shownAt: 0, pulses: [], acted: false };
if (typeof window !== 'undefined') (window as unknown as { wrizoArborFront?: FrontTiming }).wrizoArborFront = timing;
const LOGO_DONE = 'arbor2-logo-done';
const reducedNow = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The logo and the tagline at the top of the drawing. `write` = the splash's write-out; otherwise the still logo. */
export function ArborTopLogo({ write, width }: { write: boolean; width: number }) {
  const [writing, setWriting] = useState(write);
  useEffect(() => {
    if (write) { timing.logoStart = performance.now(); timing.logoDone = 0; }
    else if (!timing.logoStart) { timing.logoDone = performance.now(); }
  }, [write]);
  const done = () => { setWriting(false); timing.logoDone = performance.now(); window.dispatchEvent(new Event(LOGO_DONE)); };
  return (
    <div className="arbor2-top" aria-hidden="true" style={{ ['--arbor2-u' as string]: `${width / CW}px` } as CSSProperties}>
      <div className="arbor2-top-logo" data-writing={writing ? 'true' : 'still'} style={place(TOP_LOGO)}>
        {writing && (
          <svg className="arbor2-splash-logo-svg" viewBox="0 0 900 400" preserveAspectRatio="xMidYMid meet" onAnimationEnd={(e) => { if (e.animationName === 'arbor2-logo-svg-off') done(); }}>
            <defs>
              {(['letters', 'brass'] as const).map((layer) => (
                <mask key={layer} id={`arbor2-top-mask-${layer}`} maskUnits="userSpaceOnUse" x="0" y="0" width="900" height="400">
                  {LOGO_STROKES.filter((s) => s.layer === layer).map((s) => (
                    <path key={s.id} className="arbor2-logo-stroke" data-stroke={s.id} d={s.d} pathLength={1} fill="none" stroke="#fff" strokeWidth={s.width}
                      strokeLinecap="round" strokeLinejoin="round" style={{ animationDelay: `${s.at}s`, animationDuration: `${s.dur}s` }} />
                  ))}
                </mask>
              ))}
            </defs>
            <image href="/brand/arbor2/wrizo-logo-night-letters.png" x="0" y="0" width="900" height="400" mask="url(#arbor2-top-mask-letters)" />
            <image href="/brand/arbor2/wrizo-logo-night-brass.png" x="0" y="0" width="900" height="400" mask="url(#arbor2-top-mask-brass)" />
          </svg>
        )}
      </div>
      <div className="arbor2-top-tagline" data-writing={writing ? 'true' : 'still'} style={{ left: pct(TAGLINE.cx, CW), top: pct(TAGLINE.top, CH) }}>For humans who write.</div>
    </div>
  );
}

// a hand-drawn box: one stroke round, overshooting its start, and a second lighter pass along the top and the right (the box's own 450 x 200)
const SKETCH = 'M 22 24 Q 120 12 236 16 T 430 14 Q 440 104 432 186 Q 236 196 18 188 Q 8 104 16 20 L 70 22 M 40 30 Q 236 20 422 26 Q 430 100 426 172';

type Door = { word: string; cls: string; disabled: boolean; onClick: () => void };
/** The doors as hand-drawn boxes inside the drawing. width/height = the drawing's box (the same as the mark's). */
export function ArborFrontDoors({ width, height, authed, ready, landing, onWrite, onOpen, onLogin }: {
  width: number; height: number; authed: boolean; ready: boolean; landing: boolean; onWrite: () => void; onOpen: () => void; onLogin: () => void;
}) {
  const reduced = useRef(reducedNow()).current;
  const [phase, setPhase] = useState<'wait' | 'in' | 'shown'>('wait');
  const [pulse, setPulse] = useState(0);
  // THE ORDER: wait for the splash to go and for the logo's writing (its end, or its 2.0 s when the splash left before it finished)
  useEffect(() => {
    if (phase !== 'wait') return undefined;
    let t = 0;
    const check = () => {
      if (document.querySelector('.wz-splash') || document.documentElement.dataset.splashHold) return;
      const logoEnd = timing.logoStart ? Math.max(timing.logoDone, timing.logoStart + LOGO_WRITE_S * 1000) : 0;
      const wait = timing.logoStart && !timing.logoDone ? logoEnd - performance.now() : 0;
      if (wait > 0) { window.clearTimeout(t); t = window.setTimeout(check, wait + 16); return; }
      timing.doorsIn = performance.now();
      if (reduced) { timing.shownAt = timing.doorsIn; setPhase('shown'); } else setPhase('in');
    };
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-splash-hold'] });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener(LOGO_DONE, check);
    check();
    return () => { mo.disconnect(); window.removeEventListener(LOGO_DONE, check); window.clearTimeout(t); };
  }, [phase, reduced]);
  // THE RE-EMPHASIS: 5 s after the doors came in, then every 30 s; any act of the writer (a key, a press) stops it for good
  useEffect(() => {
    if (phase === 'wait' || reduced || timing.acted) return undefined;
    const timers: number[] = [];
    const fire = () => { if (timing.acted) return; timing.pulses.push(performance.now()); setPulse((p) => p + 1); timers.push(window.setTimeout(fire, 30000)); };
    timers.push(window.setTimeout(fire, Math.max(0, timing.doorsIn + 5000 - performance.now())));
    const act = () => { timing.acted = true; timers.forEach((x) => window.clearTimeout(x)); };
    window.addEventListener('keydown', act, true); window.addEventListener('pointerdown', act, true);
    return () => { timers.forEach((x) => window.clearTimeout(x)); window.removeEventListener('keydown', act, true); window.removeEventListener('pointerdown', act, true); };
  }, [phase === 'wait', reduced]);   // eslint-disable-line react-hooks/exhaustive-deps
  const doors: Door[] = [
    { word: 'Write', cls: 'wz-arrival-write', disabled: !ready || landing, onClick: onWrite },
    authed ? { word: 'Open', cls: 'wz-arrival-open', disabled: !ready || landing, onClick: onOpen } : { word: 'Log in', cls: 'wz-arrival-signin', disabled: !ready, onClick: onLogin },
  ];
  return (
    <div className="arbor2-front-doors" data-phase={phase} data-pulse={pulse} style={{ width: `${width}px`, height: `${height}px`, ['--arbor2-u' as string]: `${width / CW}px` } as CSSProperties}>
      {doors.map((d, i) => (
        <button key={d.word} type="button" className={`arbor2-door ${d.cls}`} data-door={DOORS[i].id} disabled={d.disabled} onClick={d.onClick} style={{ ...place(DOORS[i]), ['--arbor2-door-i' as string]: String(i) } as CSSProperties}>
          <svg key={pulse} className="arbor2-door-sketch" viewBox="0 0 450 200" preserveAspectRatio="none" aria-hidden="true">
            <path d={SKETCH} pathLength={1} vectorEffect="non-scaling-stroke"
              onAnimationEnd={(e) => { if (e.animationName === 'arbor2-door-draw' && i === doors.length - 1) { timing.shownAt = performance.now(); setPhase('shown'); } }} />
          </svg>
          <span className="arbor2-door-word">{d.word}</span>
        </button>
      ))}
    </div>
  );
}
