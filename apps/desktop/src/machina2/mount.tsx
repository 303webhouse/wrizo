import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/machina-v2.css';
import { CommandLine } from './commandLine';
import { getSwitches, setSwitch, subscribeSwitches, initSwitches, type SwitchKey } from './switches';
import { useThemePrefs, setThemePrefs } from '../store/themePrefs';
import { useCast, setCast } from '../store/themeCast';
import { initRoom, readRoom, setRoom } from './room';

// MACHINA v2 WORKING MOCKUP - loaded only under ?machina2=1 (main.tsx). Everything here is IN-SESSION: attributes on <html> and React state,
// never storage (Fable's rulings, Oct 31: "a URL flag, all CSS in its own file, switches in-session, no new data").
//   data-machina2        the flag is on (every rule in styles/machina-v2.css is scoped under it and under Machina's theme)
//   data-machina2-off    the per-feature switches turned off this session (spec §11), a space list
//   data-machina2-run    the Run's unit this session: words (default) | parts (spec §7, Fable ruling 3)
//   data-room            r2 (Nick's pick, via Fable, Oct 31): the Room row's choice, light | dark, in session only; unset = the room follows
//                        the Page tone. data-machina2-room is the room in force, the one the CSS reads (src/machina2/room.ts).
// The panel's Page and Cast rows are the app's own preferences (setThemePrefs / setCast), the same acts as the Theme pop-out - nothing new
// is stored.
const root = document.documentElement;
root.setAttribute('data-machina2', 'true');
initSwitches();
initRoom();

const LABEL: Record<SwitchKey, string> = {
  command: 'Command line', readout: 'Readout bar', run: 'Run strip', asks: 'Consultant asks', legend: 'Keyboard legend', wash: 'Blue wash',
};

function Panel() {
  const [open, setOpen] = useState(true);
  const [, tick] = useState(0);
  useEffect(() => subscribeSwitches(() => tick((x) => x + 1)), []);
  const sw = getSwitches();
  const prefs = useThemePrefs();
  const cast = useCast();
  // the Room row redraws when the page tone moves (while data-room is unset the room follows it)
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
            {(['light', 'dark'] as const).map((r) => <button key={r} type="button" className="machina2-bar-opt" data-room-opt={r} aria-pressed={room.room === r} onClick={() => setRoom(r)}>{r === 'light' ? 'Light' : 'Dark'}</button>)}
            {!room.set && <span className="machina2-bar-note">follows Page</span>}
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
          <p className="machina2-bar-note">{navigator.platform.toLowerCase().includes('mac') ? '⌘/ opens the command line · ⌘K adds a link.' : 'Ctrl+/ opens the command line · Ctrl+K adds a link.'}</p>
        </>
      )}
    </div>
  );
}

// (the readout bar is drawn by RunStrip itself, under the page - components/RunStrip.tsx, flag-gated)
function Mockup() {
  return (<><Panel /><CommandLine /></>);
}

const host = document.createElement('div');
host.id = 'machina2-mockup';
document.body.appendChild(host);
ReactDOM.createRoot(host).render(<Mockup />);
