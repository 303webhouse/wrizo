import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/machina-v2.css';
import { CommandLine } from './commandLine';
import { getSwitches, setSwitch, subscribeSwitches, initSwitches, type SwitchKey } from './switches';
import { useThemePrefs, setThemePrefs } from '../store/themePrefs';
import { useCast, setCast } from '../store/themeCast';
import { initRoom, readRoom, setRoom } from './room';
import { mountChrome } from './chrome';
import { CommandDoor } from './doors';

// MACHINA v2 WORKING MOCKUP - loaded only under ?machina2=1 (main.tsx). Everything here is IN-SESSION: attributes on <html> and React state,
// never storage (Fable's rulings, Oct 31: "a URL flag, all CSS in its own file, switches in-session, no new data").
//   data-machina2        the flag is on (every rule in styles/machina-v2.css is scoped under it and under Machina's theme)
//   data-machina2-off    the per-feature switches turned off this session (spec §11), a space list
//   data-machina2-run    the Run's unit this session: words (default) | parts (spec §7, Fable ruling 3)
//   data-room            r3 (Nick's pick, via Fable, Nov 1): the Room row's choice - light = Always day, dark = Always night, absent = Follow
//                        the clock (day 07:00-19:00 local) - in session only. data-machina2-room is the room in force, the one the CSS reads;
//                        the clock's change waits until the writer isn't typing (src/machina2/room.ts).
// The panel's Page and Cast rows are the app's own preferences (setThemePrefs / setCast), the same acts as the Theme pop-out - nothing new
// is stored.
const root = document.documentElement;
root.setAttribute('data-machina2', 'true');
initSwitches();
initRoom();
mountChrome(root);   // r4 (Fable, Nov 1): the top bar flush to the window's top, the "..." and the command-line door inside it (chrome.ts)

const LABEL: Record<SwitchKey, string> = {
  command: 'Command line', readout: 'Readout bar', run: 'Run strip', asks: 'Consultant asks', legend: 'Keyboard legend',
};

function Panel() {
  const [open, setOpen] = useState(true);
  const [, tick] = useState(0);
  useEffect(() => subscribeSwitches(() => tick((x) => x + 1)), []);
  const sw = getSwitches();
  const prefs = useThemePrefs();
  const cast = useCast();
  // the Room row redraws when the choice or the room in force moves
  useEffect(() => {
    const mo = new MutationObserver(() => tick((x) => x + 1));
    mo.observe(root, { attributes: true, attributeFilter: ['data-machina2-room', 'data-room'] });
    return () => mo.disconnect();
  }, []);
  const room = readRoom();
  return (
    <div className="machina2-bar" data-open={open ? 'true' : 'false'}>
      <button type="button" className="machina2-bar-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>Machina mockup</button>
      {open && (
        <>
          <div className="machina2-bar-row" role="group" aria-label="Cast">
            <span className="machina2-bar-label">Cast</span>
            {(['cool', 'neutral'] as const).map((c) => <button key={c} type="button" className="machina2-bar-opt" aria-pressed={cast === c} onClick={() => setCast(c)}>{c === 'cool' ? 'Cool' : 'Neutral'}</button>)}
          </div>
          <div className="machina2-bar-row" role="group" aria-label="Room">
            <span className="machina2-bar-label">Room</span>
            {/* r4 (Fable, Nov 1): the words are Automatic · Day · Night */}
            {([['clock', 'Automatic'], ['light', 'Day'], ['dark', 'Night']] as const).map(([c, text]) => <button key={c} type="button" className="machina2-bar-opt" data-room-opt={c} aria-pressed={room.choice === c} onClick={() => setRoom(c)}>{text}</button>)}
          </div>
          <div className="machina2-bar-row" role="group" aria-label="Page">
            <span className="machina2-bar-label">Page</span>
            {(['light', 'dark'] as const).map((p) => <button key={p} type="button" className="machina2-bar-opt" aria-pressed={prefs.page === p} onClick={() => setThemePrefs({ page: p })}>{p === 'light' ? 'Light' : 'Dark'}</button>)}
          </div>
          <div className="machina2-bar-row" role="group" aria-label="Run unit">
            <span className="machina2-bar-label">Run unit</span>
            {(['words', 'parts'] as const).map((u) => <button key={u} type="button" className="machina2-bar-opt" aria-pressed={sw.runUnit === u} onClick={() => setSwitch('runUnit', u)}>{u === 'words' ? 'Words' : 'Parts'}</button>)}
          </div>
          <ul className="machina2-switches" aria-label="Theme switches">
            {(Object.keys(LABEL) as SwitchKey[]).map((k) => (
              <li key={k} className="machina2-switch-row">
                <span>{LABEL[k]}</span>
                <button type="button" role="switch" className="machina2-bar-opt machina2-switch" data-switch={k} aria-checked={!sw.off.includes(k)} aria-label={LABEL[k]}
                  onClick={() => setSwitch(k, sw.off.includes(k))}>{sw.off.includes(k) ? 'Off' : 'On'}</button>
              </li>
            ))}
          </ul>
          <p className="machina2-bar-note">{navigator.platform.toLowerCase().includes('mac') ? '⌘. opens the command line · ⌘K adds a link · ⌘/ the Controls drawer.' : 'Ctrl+. opens the command line · Ctrl+K adds a link · Ctrl+/ the Controls drawer.'}</p>
        </>
      )}
    </div>
  );
}

// (the readout bar is drawn by RunStrip itself, under the page - components/RunStrip.tsx, flag-gated)
function Mockup() {
  return (<><Panel /><CommandLine /><CommandDoor /></>);
}

const host = document.createElement('div');
host.id = 'machina2-mockup';
document.body.appendChild(host);
ReactDOM.createRoot(host).render(<Mockup />);
