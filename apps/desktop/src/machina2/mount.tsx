import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/machina-v2.css';
import { useThemePrefs, setThemePrefs } from '../store/themePrefs';
import { useCast, setCast } from '../store/themeCast';
import { subscribeTheme } from '../store/theme';
import { initRoom, readRoom, setRoom } from './room';
import { mountChrome } from './chrome';
import { Nameplate } from './nameplate';
import { mountDrawerEdge } from './drawerEdge';
import { mountSheet } from './sheet';
import { isMachina2, machina2MockupBar } from './flag';

// MACHINA'S LOOK - on by default in Machina (flag.ts; Fable, Nov 19: "Machina's look SHIPS this weekend (rooms, colours, bars, splash; wow parts
// out)"), loaded by main.tsx when Machina is the theme at boot or the first time she switches to it. r10's mockup, LOOK ONLY: the rooms, the
// tokens, the flush bar and its nameplate, the drawer alignment and the zoomed page's sheet. OUT (Fable, Nov 19): the command line and its door,
// the readout bar, the Run's r10 behaviours, Outline -> Parts, Open beside, the keyboard legend, the Consultant's nonfiction asks, the 11 pt
// size and the mockup's switches.
//   data-machina2        the look is in force (every rule in styles/machina-v2.css is scoped under it and under Machina's theme); it follows the
//                        theme, live as she switches, so nothing of Machina's look reaches Arbor or Flux
//   data-room            the room's choice - light = Day, dark = Night, absent = Automatic (day 07:00-19:00 local). data-machina2-room is the
//                        room in force, the one the CSS reads; the clock's change waits until she isn't typing (room.ts).
// The mockup bar (Cast, Lighting, Page) is TEST-ONLY, under the explicit ?machina2=1; its rows are the app's own acts (setCast, setRoom,
// setThemePrefs) - nothing new is stored.
const root = document.documentElement;
const markMachina = () => { if (isMachina2()) root.setAttribute('data-machina2', 'true'); else root.removeAttribute('data-machina2'); };
markMachina();
subscribeTheme(() => markMachina());
initRoom();
mountChrome(root);   // r4 (Fable, Nov 1): the top bar flush to the window's top, the "..." inside it (chrome.ts)
mountDrawerEdge(root, '--machina2-drawer');   // r5 (Nick, via Fable, Nov 1): open, a drawer is flush to the page and its tab rides its outer edge
mountSheet();   // r10 (the Wrizors' r9 review; Fable, Nov 4): the zoomed page stays paper to its edges - the fade runs into the page's colour, not the room (sheet.ts)

function Panel() {
  const [open, setOpen] = useState(true);
  const [help, setHelp] = useState(false);
  const [, tick] = useState(0);
  const prefs = useThemePrefs();
  const cast = useCast();
  // the Lighting row redraws when the choice or the room in force moves
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
          <div className="machina2-bar-row" role="group" aria-label="Lighting">
            {/* r5 (spec draft 9 §2f, §11): the row is "Lighting ▸ Automatic · Day · Night", and a "?" explains Automatic in one line */}
            <span className="machina2-bar-label">Lighting</span>
            {([['clock', 'Automatic'], ['light', 'Day'], ['dark', 'Night']] as const).map(([c, text]) => <button key={c} type="button" className="machina2-bar-opt" data-room-opt={c} aria-pressed={room.choice === c} onClick={() => setRoom(c)}>{text}</button>)}
            <button type="button" className="machina2-bar-help" aria-label="What Automatic means" aria-expanded={help} onClick={() => setHelp((h) => !h)}>?</button>
          </div>
          {help && <p className="machina2-bar-help-line">Automatic follows the clock: Day from 07:00 to 19:00, Night after. It changes only while you aren't typing.</p>}
          <div className="machina2-bar-row" role="group" aria-label="Page">
            <span className="machina2-bar-label">Page</span>
            {(['light', 'dark'] as const).map((p) => <button key={p} type="button" className="machina2-bar-opt" aria-pressed={prefs.page === p} onClick={() => setThemePrefs({ page: p })}>{p === 'light' ? 'Light' : 'Dark'}</button>)}
          </div>
        </>
      )}
    </div>
  );
}

function Look() {
  return (<>{machina2MockupBar() && <Panel />}<Nameplate /></>);
}

const host = document.createElement('div');
host.id = 'machina2-mockup';
document.body.appendChild(host);
ReactDOM.createRoot(host).render(<Look />);
