import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/arbor-v2.css';
import { mountSun } from './sun';

// ARBOR v2 WORKING MOCKUP - loaded only under ?arbor2=1 (main.tsx). Everything here is IN-SESSION: it writes attributes on
// <html> and React state, never storage (Fable's rulings 6 and "the flag", Oct 29).
//
//   data-arbor2              the flag is on (every rule in styles/arbor-v2.css is scoped under it and under Arbor's theme)
//   data-arbor2-room         night | day. Follows the theme's existing Page tone (data-page: dark = night, light = day)
//                            until the mockup's own Room switch overrides it for this session.
//   Night's progress is the hidden rhizome (Nick's idea, Fable approved Oct 29: one Rhizome style, no new setting, the lamp is
//   ambience only), so there is no progress switch here: styles/arbor-v2.css draws it from the room alone.

type Room = 'night' | 'day';

const root = document.documentElement;
let roomOverride: Room | null = null;

const toneRoom = (): Room => (root.getAttribute('data-page') === 'dark' ? 'night' : 'day');
const applyRoom = () => root.setAttribute('data-arbor2-room', roomOverride ?? toneRoom());

root.setAttribute('data-arbor2', 'true');
applyRoom();
mountSun(root);   // item 6: the day room's pergola light (drawn only in the day room by styles/arbor-v2.css; in memory, stores nothing)
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
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const mo = new MutationObserver(() => setRoom((root.getAttribute('data-arbor2-room') as Room) ?? 'day'));
    mo.observe(root, { attributes: true, attributeFilter: ['data-arbor2-room'] });
    return () => mo.disconnect();
  }, []);
  const pickRoom = (r: Room) => { roomOverride = r; applyRoom(); };
  return (
    <div className="arbor2-bar" data-open={open ? 'true' : 'false'}>
      <button type="button" className="arbor2-bar-head" aria-expanded={open} onClick={() => setOpen(o => !o)}>Arbor mockup</button>
      {open && (
        <>
          <Seg label="Room" value={room} opts={[['night', 'Night'], ['day', 'Day']]} onPick={pickRoom} />
          <p className="arbor2-bar-note">By night the rhizome is hidden until the goal (Progress: Rhizome, with a word goal).</p>
        </>
      )}
    </div>
  );
}

const host = document.createElement('div');
host.id = 'arbor2-mockup-bar';
document.body.appendChild(host);
ReactDOM.createRoot(host).render(<MockupBar />);
