import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/arbor-v2.css';
import { mountSun } from './sun';
import { mountPaper } from './paper';

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
mountPaper();     // the zoomed page stays a whole opaque sheet, and the sun layer has a hole over the page (paper.ts; Fable, Oct 29)
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

// §14 item 8 - THE MOOD MENU (spec §13): one switch per Arbor feature, IN-SESSION ONLY. The switched-off set is a space list on <html>
// (data-arbor2-off) that styles/arbor-v2.css and src/arbor2/shoots.ts read; nothing is stored. No default is ruled (Fable's call, with
// device-or-account): the mockup opens with everything on. Two of the spec's nine cannot switch anything here, and say why.
const MOOD: { key: string; label: string; why?: string }[] = [
  { key: 'breath', label: 'Lamp breath' },
  { key: 'lamp-progress', label: 'Lamp as progress', why: 'retired: the lamp is ambience (Fable)' },
  { key: 'shadows', label: 'Day shadows' },
  { key: 'afternoon', label: 'Afternoon lengthening' },
  { key: 'flutter', label: 'Leaf flutter' },
  { key: 'variation', label: 'Rhizome variation' },
  { key: 'pull', label: 'Drawer pull motion' },
  { key: 'tabs', label: 'Coloured tabs' },
  { key: 'dim', label: 'Dim room with drawer open', why: 'not built: §6.2 waits on a ruling' },
];

function MoodMenu({ off, flip }: { off: string[]; flip: (k: string) => void }) {
  return (
    <ul className="arbor2-mood" aria-label="Mood">
      {MOOD.map(({ key, label, why }) => (
        <li key={key} className="arbor2-mood-row">
          <span className="arbor2-mood-label">{label}</span>
          {why ? <span className="arbor2-mood-why">{why}</span> : (
            <button type="button" role="switch" className="arbor2-bar-opt arbor2-mood-switch" data-mood={key}
              aria-checked={!off.includes(key)} aria-label={label} onClick={() => flip(key)}>
              {off.includes(key) ? 'Off' : 'On'}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function MockupBar() {
  const [room, setRoom] = useState<Room>(() => (root.getAttribute('data-arbor2-room') as Room) ?? 'day');
  const [open, setOpen] = useState(true);
  const [mood, setMood] = useState(false);
  // the switched-off set lives here (the bar never unmounts), so folding the bar or the list keeps every switch where she left it
  const [off, setOff] = useState<string[]>([]);
  useEffect(() => {
    if (off.length) root.setAttribute('data-arbor2-off', off.join(' '));
    else root.removeAttribute('data-arbor2-off');
  }, [off]);
  const flip = (k: string) => setOff((o) => (o.includes(k) ? o.filter((x) => x !== k) : [...o, k]));
  // item 9: the logo's orange o and dot - kept brass, or sage with the rest (Nick's call, spec §12); in-session, an attribute on <html>
  const [logo, setLogo] = useState<'brass' | 'all'>('brass');
  useEffect(() => {
    if (logo === 'all') root.setAttribute('data-arbor2-logo', 'all');
    else root.removeAttribute('data-arbor2-logo');
  }, [logo]);
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
          <Seg<'brass' | 'all'> label="Logo o" value={logo} opts={[['brass', 'Brass'], ['all', 'Sage']]} onPick={setLogo} />
          <button type="button" className="arbor2-bar-head" aria-expanded={mood} onClick={() => setMood(m => !m)}>Mood {mood ? '▾' : '▸'}</button>
          {mood && <MoodMenu off={off} flip={flip} />}
        </>
      )}
    </div>
  );
}

const host = document.createElement('div');
host.id = 'arbor2-mockup-bar';
document.body.appendChild(host);
ReactDOM.createRoot(host).render(<MockupBar />);
