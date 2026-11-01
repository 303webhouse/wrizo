import { useEffect, useState } from 'react';
import { useTheme } from '../store/theme';
import { isMachina2 } from './flag';
import { isOn, subscribeSwitches } from './switches';

// MACHINA v2 MOCKUP, r4 - THE DOORS AT REST (the Wrizors, Nov 1, wrizors-to-ARBOR-nov1b.md: "a door is availability, not a prompt (nothing arrives
// unbidden), so each feature needs a quiet, visible door at rest - never a nudge, tooltip tour or badge"). Two of them live here:
//   CommandDoor   door 1 - a hairline box in the top bar's right end, left of the "...": ">" in Plex Mono and the key in quiet grey (~120 px,
//                 "Commands" for screen readers). A click opens the line in the room beside the page (commandLine.tsx hears
//                 'machina2-cmd-open'); the box never opens anything by itself. Placed by chrome.ts's measures; shown while the command line's
//                 switch is on and a top bar is on screen; it recedes with the bar while she types.
//   Legend        door 5 - the keyboard legend in the rail's footer, three lines, quiet grey: the chords that exist (the registry's), so it is
//                 the index a new writer reads. The "Keyboard legend" switch takes it away.
// Presentation only: each door presses an act that already exists. Nothing is stored.
const mac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
const MOD = mac ? '⌘' : 'Ctrl+';

function useSwitchTick(): void {
  const [, tick] = useState(0);
  useEffect(() => subscribeSwitches(() => tick((x) => x + 1)), []);
}

export function CommandDoor() {
  useSwitchTick();
  const theme = useTheme();
  if (theme !== 'machina' || !isOn('command')) return null;
  return (
    <button type="button" className="machina2-door" aria-label="Commands" onClick={() => document.dispatchEvent(new Event('machina2-cmd-open'))}>
      <span className="machina2-door-prompt" aria-hidden="true">&gt;</span>
      <span className="machina2-door-hint" aria-hidden="true">{MOD}.</span>
    </button>
  );
}

/** Waits up to ~60 frames for a control to be on screen (every frame reads the DOM; the wait ends on what is there). */
const until = (find: () => HTMLElement | null, frames = 60): Promise<HTMLElement | null> => new Promise((done) => {
  const step = (n: number) => { const el = find(); if (el && el.getBoundingClientRect().width > 0) return done(el); if (n <= 0) return done(null); requestAnimationFrame(() => step(n - 1)); };
  step(frames);
});

// door 3's SECOND door (the Wrizors): the Plans pop-out's first row, "Outline → Parts" in the blue. It presses what is already there - the Build
// tab if the page is not in Build (the outline is Build's), then the Tools drawer's grip - and brings the OUTLINE section into view. Shown on a
// page (where Build exists), never on a board.
export function PlansOutline() {
  const theme = useTheme();
  const buildTab = () => [...document.querySelectorAll<HTMLElement>('.desk-mode-tab')].find((b) => /^build$/i.test((b.textContent || '').trim())) ?? null;
  if (!isMachina2() || theme !== 'machina' || !buildTab()) return null;
  const go = async () => {
    const tab = buildTab();
    if (tab && !tab.classList.contains('active')) tab.click();
    if (!document.querySelector(".wz-sliver[data-open='true']")) (await until(() => document.querySelector<HTMLElement>('.wz-sliver-grip')))?.click();
    (await until(() => document.querySelector<HTMLElement>(".wz-sliver[data-open='true'] #machina2-outline")))?.scrollIntoView({ block: 'start' });
  };
  return (
    <div className="wz-cascade-panel-body machina2-plans-outline-wrap">
      <button type="button" className="machina2-plans-outline" onClick={() => { void go(); }}>Outline → Parts</button>
    </div>
  );
}

export function Legend() {
  useSwitchTick();
  const theme = useTheme();
  if (!isMachina2() || theme !== 'machina' || !isOn('legend')) return null;
  return (
    <div className="machina2-legend" aria-label="Keyboard legend">
      <div className="machina2-legend-line"><kbd>{MOD}.</kbd> line</div>
      <div className="machina2-legend-line"><kbd>{MOD}K</kbd> link</div>
      <div className="machina2-legend-line"><kbd>{MOD}/</kbd> tools</div>
    </div>
  );
}
