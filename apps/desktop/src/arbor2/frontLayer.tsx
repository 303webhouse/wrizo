// ARBOR v2 MOCKUP r18 -> r19 - THE FRONT DOOR, IN ORDER (spec draft 38 §12c, Nick Nov 4 1:01-1:45 pm; the Wrizors' note wrizors-to-ARBOR-nov4c.md
// md5 13e5db96; Fable's rules, Nov 4: the splash is ALWAYS skippable, Enter = Write at any moment, the nudge kept). Laid over Nick's drawing in
// its own coordinates (the canvas, 3374 x 2699 px: the splash box and the front door's box keep its aspect, so a percentage is a point of it).
//   1. the sketch runs as built (SplashMark); its "WRIZO (in abstract)" stays erased (r18's base);
//   2. THE LOGO, in the sketch's top-left just below PAGE (1366: left ~470, top ~232), writes itself out 0.2 s after the sketch's run is done
//      (logoWrite.tsx's strokes, as built), then the still logo in the same rect;
//   3. THE TAGLINE is TYPED 0.45 s after the logo completes: "For humans who write." in EB Garamond, cream #EFE4CB, 16 px at 1366 (scaled with
//      the box), tucked under the logo, its last letter ending just before the z's loop drops (1366: ~x 512, top ~257); ~60-90 ms a letter,
//      spaces a little longer; the brass page caret (1.5 px) appears just before the first letter, steady while typing, then blinks (1.06 s);
//   4. THE DOORS, 0.35 s after the full stop: Write fades in and rises 6 px over 0.42 s, Sign in 0.15 s later (signed in: Write only, into
//      the last page). Cream #EFE4CB (box and word), brass #FF9800 on hover and focus (0.16 s). THE NUDGE (Nick, kept): 5 s after the doors
//      arrive one gentle cream -> brass -> cream brightening of their outline, then every 30 s; any act stops it for good; never a flash.
//   Reduced motion: the finished frame at once, the caret steady, the outline a static brass.
// ONE TIMELINE (this module's `seq`) drives both places: the splash shows it (its hold's floor ends when the doors are in), and the front door
// shows its finished state in the same rects, so the hand-over is the same frame. A SKIP (any click, Esc or key on the splash: Splash.tsx)
// jumps the timeline to its end; Enter asks for Write too. Nothing is stored; window.wrizoArborFront is the proofs' read-only view.
import { useEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import { LOGO_STROKES, LOGO_WRITE_S } from './logoWrite';

const CW = 3374, CH = 2699;
export const TOP_LOGO = { x: 543, y: 534, w: 540, h: 240 };          // 1366: the logo box at (470, 232), 100.5 x 44.7
export const TAGLINE = { right: 768, top: 668, size: 86 };           // 1366: its last letter ends at ~x 512, top ~257, 16 px
export const DOORS = [
  { id: 'write', x: 2270, y: 2260, w: 450, h: 200 },
  { id: 'second', x: 2790, y: 2260, w: 450, h: 200 },
];
const TAGLINE_TEXT = 'For humans who write.';
const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const place = (r: { x: number; y: number; w: number; h: number }) => ({ left: pct(r.x, CW), top: pct(r.y, CH), width: pct(r.w, CW), height: pct(r.h, CH) });

// ---- THE TIMELINE (ms on performance.now()) ----
// the letters' times: ~60-90 ms each, a space a little longer (~1.7 s in all)
const LETTER_MS = [...TAGLINE_TEXT].map((ch, i) => (ch === ' ' ? 120 : 64 + ((i * 7) % 4) * 8));
const TYPE_MS = LETTER_MS.reduce((a, b) => a + b, 0);
const AFTER_SKETCH = 200, AFTER_LOGO = 450, CARET_LEAD = 150, AFTER_STOP = 350, DOOR_IN = 420, DOOR_STAGGER = 150;
type Seq = { sketchDone: number; logoStart: number; logoDone: number; tagStart: number; tagDone: number; doorsIn: number; shownAt: number;
  pulses: number[]; acted: boolean; skipped: boolean; wantWrite: boolean; reduced: boolean };
const seq: Seq = { sketchDone: 0, logoStart: 0, logoDone: 0, tagStart: 0, tagDone: 0, doorsIn: 0, shownAt: 0, pulses: [], acted: false, skipped: false, wantWrite: false, reduced: false };
if (typeof window !== 'undefined') (window as unknown as { wrizoArborFront?: Seq }).wrizoArborFront = seq;
const subs = new Set<() => void>();
const tell = () => subs.forEach((f) => f());
let timers: number[] = [];
let onShown: (() => void) | null = null;
const reducedNow = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const plan = (from: number) => {
  seq.logoStart = from + AFTER_SKETCH;
  seq.logoDone = seq.logoStart + LOGO_WRITE_S * 1000;
  seq.tagStart = seq.logoDone + AFTER_LOGO;
  seq.tagDone = seq.tagStart + TYPE_MS;
  seq.doorsIn = seq.tagDone + AFTER_STOP;
  seq.shownAt = seq.doorsIn + DOOR_IN + DOOR_STAGGER;
};
const arm = () => {
  timers.forEach((t) => window.clearTimeout(t)); timers = [];
  const now = performance.now();
  for (const at of [seq.logoStart, seq.logoDone, seq.tagStart - CARET_LEAD, seq.tagStart, seq.tagDone, seq.doorsIn, seq.shownAt]) if (at > now) timers.push(window.setTimeout(tell, at - now + 4));
  timers.push(window.setTimeout(() => { const f = onShown; onShown = null; f?.(); }, Math.max(0, seq.shownAt - now)));
  tell();
};
/** The sketch's run is done (SplashMark's floor): the logo, the tagline and the doors follow; `shown` when the doors are in. */
export function startArborFront(shown: () => void): void {
  onShown = shown;
  if (seq.sketchDone) { arm(); return; }
  seq.reduced = reducedNow();
  if (seq.reduced) { finishArborFront(); return; }
  seq.sketchDone = performance.now();
  plan(seq.sketchDone);
  arm();
}
/** Jump to the finished frame (a skip, or reduced motion): every step done now. `write` = the skip was Enter. */
export function finishArborFront({ write = false }: { write?: boolean } = {}): void {
  const now = performance.now();
  if (write) { seq.wantWrite = true; window.setTimeout(() => window.dispatchEvent(new Event(WANT_WRITE)), 0); }
  if (!seq.shownAt || seq.shownAt > now) {
    seq.skipped = !seq.reduced;
    if (!seq.sketchDone) seq.sketchDone = now;
    seq.logoStart = Math.min(seq.logoStart || now, now); seq.logoDone = now; seq.tagStart = now - TYPE_MS; seq.tagDone = now; seq.doorsIn = now; seq.shownAt = now;
  }
  arm();
}
export const WANT_WRITE = 'arbor2-want-write';
/** The front door takes the Write a skip asked for (once). */
export function takeWantWrite(): boolean { const w = seq.wantWrite; seq.wantWrite = false; return w; }
// THE RECORDING'S CLOCK (mockup only, in memory, like arbor2Clock): window.wrizoArborFrontClock(ms) reads the timeline at ms after the sketch's
// end, so a recording's frames are exact; null gives the real clock back. Nothing else uses it.
let clockAt: number | null = null;
const nowT = () => (clockAt == null ? performance.now() : seq.sketchDone + clockAt);
if (typeof window !== 'undefined') (window as unknown as { wrizoArborFrontClock?: (ms: number | null) => number }).wrizoArborFrontClock = (ms) => { clockAt = ms; tell(); return seq.sketchDone; };
const useSeq = () => { const [, bump] = useReducer((x: number) => x + 1, 0); useEffect(() => { subs.add(bump); return () => { subs.delete(bump); }; }, []); return nowT(); };

// ---- THE LOGO ----
const LAST_STROKE = LOGO_STROKES.reduce((a, s) => (s.at + s.dur > a.at + a.dur ? s : a)).id;
function Logo({ writeOut, now }: { writeOut: boolean; now: number }) {
  const due = seq.logoStart > 0 && now >= seq.logoStart;
  const finished = due && (now >= seq.logoDone || !writeOut || seq.skipped || seq.reduced);
  const [ended, setEnded] = useState(false);
  if (!due) return <div className="arbor2-top-logo" data-writing="wait" style={place(TOP_LOGO)} />;
  const writing = !finished && !ended;
  // THE HAND-OVER (r18, runs 41659053011 / 41672316457 / 41754120497): the still logo is the same kind of element as the writing - an SVG image
  // in the same viewBox, in a FRESH svg (keyed) - and replaces the strokes when the last stroke (the i's dot) ends: never a blank frame.
  return (
    <div className="arbor2-top-logo" data-writing={writing ? 'true' : 'still'} style={place(TOP_LOGO)}>
      <svg key={writing ? 'writing' : 'still'} className="arbor2-splash-logo-svg arbor2-top-svg" viewBox="0 0 900 400" preserveAspectRatio="xMidYMid meet"
        onAnimationEnd={(e) => { if (writing && e.animationName === 'arbor2-logo-write' && (e.target as Element).getAttribute('data-stroke') === LAST_STROKE) setEnded(true); }}>
        {writing ? (
          <>
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
          </>
        ) : (
          <image className="arbor2-top-still" href="/brand/arbor2/wrizo-logo-night.png" x="0" y="0" width="900" height="400" />
        )}
      </svg>
    </div>
  );
}

// ---- THE TAGLINE, typed ----
function Tagline({ now }: { now: number }) {
  const [, tick] = useReducer((x: number) => x + 1, 0);
  const typing = seq.tagStart > 0 && now >= seq.tagStart && now < seq.tagDone;
  useEffect(() => { if (!typing) return undefined; const t = window.setInterval(tick, 30); return () => window.clearInterval(t); }, [typing]);
  const t = nowT();
  let n = 0;
  if (seq.tagStart > 0 && t >= seq.tagStart) { let at = seq.tagStart; while (n < TAGLINE_TEXT.length && at + LETTER_MS[n] <= t) { at += LETTER_MS[n]; n++; } if (t >= seq.tagDone) n = TAGLINE_TEXT.length; }
  const caret = seq.tagStart > 0 && t >= seq.tagStart - CARET_LEAD;
  const state = !caret ? 'wait' : n < TAGLINE_TEXT.length ? 'typing' : 'done';
  return (
    <div className="arbor2-top-tagline" data-state={state} data-typed={n} style={{ right: pct(CW - TAGLINE.right, CW), top: pct(TAGLINE.top, CH) }}>
      {/* the typed letters, the caret (no width of its own), then the rest held invisibly - the line never moves as it types */}
      <span className="arbor2-tag-typed">{TAGLINE_TEXT.slice(0, n)}</span>
      {caret && <span className="arbor2-tag-caret" aria-hidden="true" />}
      <span className="arbor2-tag-rest" aria-hidden="true">{TAGLINE_TEXT.slice(n)}</span>
    </div>
  );
}

// a hand-drawn box: one stroke round, overshooting its start, and a second lighter pass along the top and the right (the box's own 450 x 200)
const SKETCH = 'M 22 24 Q 120 12 236 16 T 430 14 Q 440 104 432 186 Q 236 196 18 188 Q 8 104 16 20 L 70 22 M 40 30 Q 236 20 422 26 Q 430 100 426 172';
type Door = { word: string; cls: string; disabled: boolean; onClick: () => void };

// ---- THE DOORS ----
function Doors({ mode, now, authed, ready, landing, onWrite, onLogin }: { mode: 'splash' | 'door'; now: number; authed: boolean; ready: boolean; landing: boolean; onWrite: () => void; onLogin: () => void }) {
  const phase = !seq.doorsIn || now < seq.doorsIn ? 'wait' : now < seq.shownAt ? 'in' : 'shown';
  const [pulse, setPulse] = useState(0);
  // THE NUDGE (Nick, kept, via Fable Nov 4): 5 s after the doors arrive, then every 30 s; any act of the writer stops it for good. The front door only.
  const armed = useRef(false);
  useEffect(() => {
    if (mode !== 'door' || phase === 'wait' || seq.reduced || seq.acted || armed.current) return undefined;
    armed.current = true;
    const ts: number[] = [];
    const fire = () => { if (seq.acted) return; seq.pulses.push(performance.now()); setPulse((p) => p + 1); ts.push(window.setTimeout(fire, 30000)); };
    ts.push(window.setTimeout(fire, Math.max(0, seq.doorsIn + 5000 - performance.now())));
    const act = () => { seq.acted = true; ts.forEach((x) => window.clearTimeout(x)); };
    window.addEventListener('keydown', act, true); window.addEventListener('pointerdown', act, true);
    return () => { armed.current = false; ts.forEach((x) => window.clearTimeout(x)); window.removeEventListener('keydown', act, true); window.removeEventListener('pointerdown', act, true); };
  }, [mode, phase === 'wait']);   // eslint-disable-line react-hooks/exhaustive-deps
  const doors: Door[] = [
    { word: 'Write', cls: 'wz-arrival-write', disabled: mode === 'splash' || !ready || landing, onClick: onWrite },
    ...(authed ? [] : [{ word: 'Sign in', cls: 'wz-arrival-signin', disabled: mode === 'splash' || !ready, onClick: onLogin }]),
  ];
  return (
    <div className="arbor2-front-doors" data-phase={phase} data-pulse={pulse} data-mode={mode} data-reduced={seq.reduced ? 'true' : undefined}>
      {doors.map((d, i) => (
        <button key={d.word} type="button" className={`arbor2-door ${d.cls}`} data-door={DOORS[i].id} disabled={d.disabled} tabIndex={mode === 'splash' ? -1 : undefined} onClick={d.onClick}
          style={{ ...place(DOORS[i]), ['--arbor2-door-i' as string]: String(i) } as CSSProperties}>
          <svg key={pulse} className="arbor2-door-sketch" viewBox="0 0 450 200" preserveAspectRatio="none" aria-hidden="true">
            <path d={SKETCH} vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="arbor2-door-word">{d.word}</span>
        </button>
      ))}
    </div>
  );
}

/** The front door's layers in the drawing's box: on the splash (`mode='splash'`, the logo written out, the doors shown but not pressed) and on
 *  the front door (`mode='door'`, the same frame, the doors live). width = the drawing's box width (its height keeps the canvas's aspect). */
// part: 'all' (the splash), or the front door's two halves - 'top' (the logo and the tagline, inside the drawing's aria-hidden box) and 'doors'
// (the doors, in a twin box screen readers see)
export function ArborFront({ mode, part = 'all', width, authed = false, ready = false, landing = false, onWrite = () => {}, onLogin = () => {} }: {
  mode: 'splash' | 'door'; part?: 'all' | 'top' | 'doors'; width: number; authed?: boolean; ready?: boolean; landing?: boolean; onWrite?: () => void; onLogin?: () => void;
}) {
  const now = useSeq();
  // the front door never waits on a splash that is not there (a reload past the splash, a later visit in the session): the finished frame
  useEffect(() => { if (mode === 'door' && !seq.sketchDone && !document.querySelector('.wz-splash')) finishArborFront(); }, [mode]);
  return (
    <div className="arbor2-top" data-mode={mode} aria-hidden={mode === 'splash' ? 'true' : undefined} style={{ ['--arbor2-u' as string]: `${width / CW}px` } as CSSProperties}>
      {part !== 'doors' && <Logo writeOut={mode === 'splash'} now={now} />}
      {part !== 'doors' && <Tagline now={now} />}
      {part !== 'top' && <Doors mode={mode} now={now} authed={authed} ready={ready} landing={landing} onWrite={onWrite} onLogin={onLogin} />}
    </div>
  );
}
