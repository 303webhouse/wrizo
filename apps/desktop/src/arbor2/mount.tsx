import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/arbor-v2.css';

// ARBOR v2 WORKING MOCKUP - loaded only under ?arbor2=1 (main.tsx). Everything here is IN-SESSION: it writes attributes on
// <html> and React state, never storage (Fable's rulings 6 and "the flag", Oct 29).
//
//   data-arbor2              the flag is on (every rule in styles/arbor-v2.css is scoped under it and under Arbor's theme)
//   data-arbor2-room         night | day. Follows the theme's existing Page tone (data-page: dark = night, light = day)
//                            until the mockup's own Room switch overrides it for this session.
//   data-arbor2-night-prog   lamp | hidden-rhizome. Night's progress picture. Lamp is Fable's default; "hidden rhizome"
//                            is Nick's option (Oct 29): the rhizome is invisible while it grows and only shows at the goal,
//                            when the existing brass flash lights the whole web and its existing fade returns it to nothing.

type Room = 'night' | 'day';
type NightProg = 'lamp' | 'hidden-rhizome';

const root = document.documentElement;
let roomOverride: Room | null = null;

const toneRoom = (): Room => (root.getAttribute('data-page') === 'dark' ? 'night' : 'day');
const applyRoom = () => root.setAttribute('data-arbor2-room', roomOverride ?? toneRoom());

root.setAttribute('data-arbor2', 'true');
root.setAttribute('data-arbor2-night-prog', 'hidden-rhizome'); // Nick, Oct 29: "Let's keep that in dark mode" - the hidden rhizome is night's progress; Lamp stays as the alternative to compare
applyRoom();
new MutationObserver(applyRoom).observe(root, { attributes: true, attributeFilter: ['data-page'] });

function Seg<T extends string>({ label, value, opts, onPick }: { label: string; value: T; opts: [T, string][]; onPick: (v: T) => void }) {
  return (
    <div className="arbor2-bar-row" role="group" aria-label={label}>
      <span className="arbor2-bar-label">{label}</span>
      {opts.map(([v, text]) => (
        <button key={v} type="button" className="arbor2-bar-opt" aria-pressed={value === v} onClick={() => onPick(v)}>{text}</button>
      ))}
    </div>
  );
}

function MockupBar() {
  const [room, setRoom] = useState<Room>(() => (root.getAttribute('data-arbor2-room') as Room) ?? 'day');
  const [prog, setProg] = useState<NightProg>('hidden-rhizome');
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const mo = new MutationObserver(() => setRoom((root.getAttribute('data-arbor2-room') as Room) ?? 'day'));
    mo.observe(root, { attributes: true, attributeFilter: ['data-arbor2-room'] });
    return () => mo.disconnect();
  }, []);
  const pickRoom = (r: Room) => { roomOverride = r; applyRoom(); };
  const pickProg = (p: NightProg) => { setProg(p); root.setAttribute('data-arbor2-night-prog', p); };
  return (
    <div className="arbor2-bar" data-open={open ? 'true' : 'false'}>
      <button type="button" className="arbor2-bar-head" aria-expanded={open} onClick={() => setOpen(o => !o)}>Arbor mockup</button>
      {open && (
        <>
          <Seg label="Room" value={room} opts={[['night', 'Night'], ['day', 'Day']]} onPick={pickRoom} />
          <Seg label="Night progress" value={prog} opts={[['hidden-rhizome', 'Hidden rhizome'], ['lamp', 'Lamp']]} onPick={pickProg} />
          <p className="arbor2-bar-note">Hidden rhizome needs Progress set to Rhizome and a word goal.</p>
        </>
      )}
    </div>
  );
}

const host = document.createElement('div');
host.id = 'arbor2-mockup-bar';
document.body.appendChild(host);
ReactDOM.createRoot(host).render(<MockupBar />);
