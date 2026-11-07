// FLUX3 S4 - THE TUNNEL (the spec's §6: "a tunnel of signal that rushes faster the faster she writes (felt speed, never a score; lime streaks
// at speed)"; Nick, via Fable Nov 7: KEEP it, built to INK's lean B). Jacked In's ground: square frames rushing out of a vanishing point at the
// writing line's height (the zoom's anchor, the middle of the stage), a still field of rays, and at speed, lime streaks. It sits BEHIND the page,
// inside .mode-stage under the page column, aria-hidden and taking no pointer: nothing here moves, covers or reads the page. While jacked in the
// page has no paper (r9, the terminal), so the frames pass behind the words.
//   - COMPOSITOR ONLY. CSS animations of transform and opacity, nothing else: no canvas, no per-frame JS, no layout.
//   - ITS SPEED is re-set at most every TUNNEL.resetMs (2 s) from her trailing rate (the keys of the last 3 s), by the animations' own
//     playbackRate (updatePlaybackRate keeps every frame where it is: the speed changes, nothing jumps). Between re-sets no JS runs but one
//     timestamp per key.
//   - THE RECEDE EXCEPTION (named, Nick Nov 7): while she types, the chrome recedes and the tunnel does not. It is the one thing off the page that
//     stays, and moves, while keys land, because its speed IS her speed. Two one-line switches below undo it, if Nick changes his mind.
//   - The still state (reduced motion, Ambiance 0): the frames stand still at their places and the streaks are gone.
import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useAmbianceDial, prefersReducedMotion } from '../store/ambianceDial';
import { tryFlash } from '../store/flashBudget';

// THE SWITCHES (Nick, Nov 7: "each a one-line switch"). Each is one line; flipping one changes nothing else.
export const TUNNEL_SWITCHES = {
  recedeWhileTyping: false,   // true: the tunnel recedes with the chrome while she types (no exception: Nick's recede rule, whole)
  holdWhileTyping: false,     // true: the tunnel holds still while keys land and runs on her pauses (strict damping; it loses the felt speed)
};
export const TUNNEL = {
  resetMs: 2000,     // the speed is re-set at most this often
  windowMs: 3000,    // her trailing rate: the keys of the last 3 s
  streakKps: 2.5,    // at or above this many keys a second, the lime streaks show
};
const FRAMES = 12;
const STREAKS = 10;
const RUN_S = 9;     // a frame's run from the vanishing point to past the screen's edge, at rest (playbackRate 1)
// the playback rate for a rate of keys a second: 1 at rest, 5 at a fast typist's 6 keys a second and above
const rateFor = (kps: number): number => 1 + Math.min(1, kps / 6) * 4;

interface Props { scrollRef: RefObject<HTMLDivElement | null> }

export function FluxTunnel({ scrollRef }: Props) {
  const dial = useAmbianceDial();
  const still = prefersReducedMotion() || dial === 0;
  const [box, setBox] = useState<HTMLDivElement | null>(null);

  // the tunnel's box, FIRST in .mode-stage (so the page column and every other positioned piece of the stage paints above it)
  useLayoutEffect(() => {
    const stage = scrollRef.current?.closest('.mode-stage');
    if (!stage) return undefined;
    const el = document.createElement('div');
    el.className = 'flux3-tunnel';
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('data-flux3-tunnel', '');
    stage.prepend(el);
    setBox(el);
    return () => { el.remove(); setBox(null); };
  }, [scrollRef]);

  useLayoutEffect(() => {
    if (!box) return;
    const flag = (name: string, on: boolean) => { if (on) box.setAttribute(name, ''); else box.removeAttribute(name); };
    flag('data-recede', TUNNEL_SWITCHES.recedeWhileTyping);
    flag('data-hold', TUNNEL_SWITCHES.holdWhileTyping);
    flag('data-still', still);
  }, [box, still]);

  // NO HOLE (r9, Nick's terminal: the spec's draft 13 §6): the words stand on the room's own ground INSIDE the tunnel's frames, so nothing is cut
  // out of it. (r7 cut the page's rect out, while there was paper: the band mask's fade showed the tunnel behind the text on a sheet.)

  // THE SPEED: one timestamp per key; a re-set at most every 2 s
  useEffect(() => {
    if (!box || still) return undefined;
    const keys: number[] = [];
    const onKey = (e: KeyboardEvent) => { if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') keys.push(performance.now()); };
    let rate = 1;
    let fast = false;
    const reset = () => {
      const now = performance.now();
      while (keys.length && now - keys[0] > TUNNEL.windowMs) keys.shift();
      const kps = keys.length / (TUNNEL.windowMs / 1000);
      const next = rateFor(kps);
      if (Math.abs(next - rate) >= 0.05) { rate = next; box.getAnimations({ subtree: true }).forEach((a) => a.updatePlaybackRate(rate)); }
      const f = kps >= TUNNEL.streakKps;
      if (f !== fast && (!f || tryFlash('f3-tunnel'))) { fast = f; if (f) box.setAttribute('data-fast', ''); else box.removeAttribute('data-fast'); }
    };
    document.addEventListener('keydown', onKey, { capture: true, passive: true });
    const iv = window.setInterval(reset, TUNNEL.resetMs);
    return () => { document.removeEventListener('keydown', onKey, { capture: true }); window.clearInterval(iv); box.removeAttribute('data-fast'); };
  }, [box, still]);

  if (!box) return null;
  return createPortal(
    <>
      <div className="flux3-tunnel-rays" />
      {Array.from({ length: FRAMES }, (_, i) => {
        const d = i / FRAMES;   // where this frame stands on its run (also its still place)
        return <i key={i} className="flux3-tunnel-frame" style={{ animationDelay: `${-d * RUN_S}s`, ['--s' as string]: (0.04 + Math.pow(d, 2.2) * 0.96).toFixed(4), ['--o' as string]: (0.12 + d * 0.7).toFixed(3) }} />;
      })}
      <div className="flux3-tunnel-streaks">
        {Array.from({ length: STREAKS }, (_, i) => (
          <b key={i} style={{ transform: `rotate(${((i * 137.5) % 360).toFixed(1)}deg)` }}><i style={{ animationDelay: `${(-i * 0.37).toFixed(2)}s` }} /></b>
        ))}
      </div>
    </>,
    box,
  );
}
