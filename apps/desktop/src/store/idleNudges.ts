import { useCallback, useEffect, useRef, useState } from 'react';

// The idle-nudge system as a reusable hook, so every writing surface inherits the
// same re-tuned cadence (the sprint AND the HOME gate mount it). Behaviour: gaps
// SHORTEN as idle persists — first nudge at 3 min, second +2 min, third +1 min
// then it HOLDS; the first two are ephemeral (dissolve after 10s), the third
// persists; any activity (keystroke) resets the cycle. Crimson Pro italic render
// + reduced-motion are the consumer's concern (each surface dresses its own slip).

// v6's canonical 25-prompt pool — four implicit registers (bare sensory images /
// small concrete moves / permission-giving phrases / public-domain literary
// allusions). Sensory fragments carry no terminal period; full sentences do.
// US spelling ("color", "traveled"). Drawn at random without near-repeats.
export const NUDGE_POOL = [
  // sensory images
  'salt',
  'a door left open',
  'the road just before it rains',
  'warm bread, somewhere',
  'the last thing she said',
  'a key that fits nothing',
  'the color of that afternoon',
  'someone’s coat still on the chair',
  // small concrete moves
  'begin the next sentence with “but.”',
  'stop describing the door — open it.',
  'skip to the part you actually want to write.',
  'let someone lie, and see what it costs.',
  'write the worst version; you can’t fix a blank.',
  'what is someone here afraid to say out loud?',
  'who isn’t in the room, and why does it matter?',
  // permission-giving
  'change one thing, and keep going.',
  'write it badly, on purpose, fast.',
  'it doesn’t have to be good — only next.',
  'no one is reading this but you.',
  'a bad sentence still moves you forward.',
  'you’re allowed to be boring for a paragraph.',
  // public-domain literary allusions
  'follow the white rabbit toward the strange thing.',
  'take the sentence less traveled.',
  'name someone — “call them Ishmael” — and begin.',
  'kill the darling you’ve been protecting.',
];

const NUDGE_GAP_1 = 180_000;       // 3 min idle → first nudge
const NUDGE_GAP_2 = 120_000;       // +2 min still idle → second
const NUDGE_GAP_3 = 60_000;        // +1 min still idle → third (holds)
const NUDGE_EPHEMERAL_MS = 10_000; // first two dissolve back out after 10s
const NUDGE_FADE_MS = 1300;        // unmount after the fade-out (covers the slowest surface fade, ~1.2s)

export interface IdleNudges {
  nudge: string;       // current prompt text ('' = none mounted)
  shown: boolean;      // opacity gate (false during the ephemeral fade-out)
  pull: () => void;    // on-demand "take a nudge" → a held nudge
}

// `active`: run the cadence (e.g. the writer has started, or the surface is the
// active writing area). `activityKey`: changes on every keystroke → resets the
// cycle to the 3-min countdown.
export function useIdleNudges({ active, activityKey }: { active: boolean; activityKey: string | number }): IdleNudges {
  const [nudge, setNudge] = useState('');
  const [shown, setShown] = useState(false);
  const recentRef = useRef<number[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Pick a prompt at random, avoiding the recently-shown ones.
  const pick = useCallback((): string => {
    const avoid = new Set(recentRef.current);
    const open = NUDGE_POOL.map((_, i) => i).filter(i => !avoid.has(i));
    const pool = open.length ? open : NUDGE_POOL.map((_, i) => i);
    const idx = pool[Math.floor(Math.random() * pool.length)];
    recentRef.current.push(idx);
    if (recentRef.current.length > Math.min(NUDGE_POOL.length - 1, 12)) recentRef.current.shift();
    return NUDGE_POOL[idx];
  }, []);

  const show = useCallback((held: boolean) => {
    setNudge(pick());
    setShown(true);
    if (!held) {
      timersRef.current.push(setTimeout(() => {
        setShown(false);                                                    // fade out
        timersRef.current.push(setTimeout(() => setNudge(''), NUDGE_FADE_MS)); // then unmount
      }, NUDGE_EPHEMERAL_MS));
    }
  }, [pick]);

  // On-demand pull → held nudge; cancel any pending auto-cadence so a manual pull
  // and the cadence can never fire two at once.
  const pull = useCallback(() => {
    clearTimers();
    show(true);
  }, [clearTimers, show]);

  // The cadence. Resets on every activityKey change; stands down when inactive.
  useEffect(() => {
    clearTimers();
    setShown(false);   // a keystroke dismisses any shown nudge (no-op re-render if already clear)
    setNudge('');
    if (!active) return;
    const t = timersRef.current;
    t.push(setTimeout(() => show(false), NUDGE_GAP_1));                             // #1, ephemeral
    t.push(setTimeout(() => show(false), NUDGE_GAP_1 + NUDGE_GAP_2));               // #2, ephemeral
    t.push(setTimeout(() => show(true),  NUDGE_GAP_1 + NUDGE_GAP_2 + NUDGE_GAP_3)); // #3, holds
    return clearTimers;
  }, [active, activityKey, clearTimers, show]);

  return { nudge, shown, pull };
}
