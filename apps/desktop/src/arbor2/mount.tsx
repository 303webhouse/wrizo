import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/arbor-v2.css';
import { mountSun } from './sun';
import { mountPaper } from './paper';
import { mountChrome } from './chrome';
import { mountDrawerEdge } from './drawerEdge';
import { clearRhizome, undoClearRhizome, canUndoClear, hasRhizome, subscribeLife } from './rhizomeLife';

// ARBOR v2 WORKING MOCKUP - loaded only under ?arbor2=1 (main.tsx). Everything here is IN-SESSION: it writes attributes on
// <html> and React state, never storage (Fable's rulings 6 and "the flag", Oct 29).
//
//   data-arbor2              the flag is on (every rule in styles/arbor-v2.css is scoped under it and under Arbor's theme)
//   data-arbor2-room         night | day: the room in force, the one styles/arbor-v2.css reads.
//   data-room                r9 (Nick's pick, via Fable, Nov 1): the Mood menu's Room row writes it - light = Always day, dark = Always
//                            night, absent = Follow the clock (day 07:00-19:00 local). In session only; saving it comes with the ship brief.
//   data-arbor2-dayness      0 (night) .. 1 (day): where the room stands; between the two only while the clock's crossfade runs.
//   Night's progress is the hidden rhizome (Nick's idea, Fable approved Oct 29: one Rhizome style, no new setting, the lamp is
//   ambience only), so there is no progress switch here: styles/arbor-v2.css draws it from the room alone.

import { choiceOf, dataRoomOf, dayness, mixValue, parseColour, parseClock, warmDelta, lampShare, sunShare, MID, LETTERING, type Choice, type Room, type RGB3 } from './room';

const root = document.documentElement;

// ---- r9: THE ROOM FOLLOWS THE CLOCK, AND CROSSFADES (src/arbor2/room.ts) ----
// Following the clock, the room fades over 20 minutes centred on 07:00 and 19:00. The room's own rules (styles/arbor-v2.css, keyed on
// data-arbor2-room) are two discrete looks, so the fade is drawn like this: every room token whose two values have the same shape (the ground,
// its glow, the pool's colour and strength, the hairlines, the shoots' ink) is written on <html> as the blend for the moment; the lettering and
// the surfaces that carry text switch in ONE step, at the crossover (the dayness where the night's lettering and the day's read alike on the
// fading ground), and data-arbor2-room flips with them. Reduced motion: a cut at the hour. In memory only.
// r10 (the Wrizors, Nov 1; Fable: "the floors hold at EVERY moment"): the blend passes through the WARM STOP (#D9C3A2 at 50%, room.ts), the
// lettering, the surfaces that carry text and the room's rules switch at the MIDDLE (MID), and the pool HANDS OVER - the lamp fades out over
// the first half and the sun (its pool and the pergola layer) fades in over the second, never both at once.
const POOL = ['--arbor-lamp-rgb', '--arbor2-pool-a', '--arbor2-pool-b'];
let clockOverride: number | null = null;   // the harness's clock (window.arbor2Clock), in memory; null = the real local clock
const nowMinutes = () => { if (clockOverride !== null) return clockOverride; const d = new Date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; };
const reducedMQ = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
type Tok = { name: string; night: string; day: string };
let fadeToks: Tok[] | null = null, fadeDelta: RGB3 | undefined, poolN = new Map<string, string>(), poolD = new Map<string, string>(), inlined: string[] = [];
const clearInline = () => { for (const n of inlined) root.style.removeProperty(n); inlined = []; };
// the room tokens, read from the stylesheet's two room blocks, and their two values (read by flipping data-arbor2-room in one synchronous
// pass: no frame is painted between the flips)
const measureRoom = () => {
  const names = new Set<string>();
  for (const sheet of [...document.styleSheets]) {
    let rules: CSSRuleList; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of [...rules]) {
      // (the browser serialises the selector with DOUBLE quotes, whatever the source wrote: r9's first green leg read no tokens at all)
      if (!(r instanceof CSSStyleRule) || !/\[data-arbor2-room=["']?(night|day)["']?\]$/.test(r.selectorText)) continue;
      for (const p of [...r.style]) if (p.startsWith('--')) names.add(p);
    }
  }
  clearInline();
  const was = root.getAttribute('data-arbor2-room');
  const read = (room: Room) => { root.setAttribute('data-arbor2-room', room); const cs = getComputedStyle(root); return new Map([...names].map((n) => [n, cs.getPropertyValue(n).trim()])); };
  const n = read('night'), d = read('day');
  if (was) root.setAttribute('data-arbor2-room', was); else root.removeAttribute('data-arbor2-room');
  fadeToks = [...names].filter((x) => !LETTERING.includes(x) && !POOL.includes(x) && n.get(x) !== d.get(x)).map((x) => ({ name: x, night: n.get(x) ?? '', day: d.get(x) ?? '' }));
  poolN = new Map(POOL.map((x) => [x, n.get(x) ?? ''])); poolD = new Map(POOL.map((x) => [x, d.get(x) ?? '']));
  const g0 = parseColour(n.get('--ink-950') ?? ''), g1 = parseColour(d.get('--ink-950') ?? '');
  fadeDelta = g0 && g1 ? warmDelta(g0, g1) : undefined;
};
// the pool for the moment: the lamp's colour at its share over the first half, the sun's at its share over the second
const poolAt = (t: number): [string, string][] => {
  const lamp = t < MID, src = lamp ? poolN : poolD, k = lamp ? lampShare(t) : sunShare(t);
  const scaled = (name: string) => String(Math.round((Number(src.get(name)) || 0) * k * 1000) / 1000);
  return [['--arbor-lamp-rgb', src.get('--arbor-lamp-rgb') ?? ''], ['--arbor2-pool-a', scaled('--arbor2-pool-a')], ['--arbor2-pool-b', scaled('--arbor2-pool-b')], ['--arbor2-sun-in', String(Math.round(sunShare(t) * 1000) / 1000)]];
};
const applyRoom = () => {
  const t = dayness(root.getAttribute('data-room'), nowMinutes(), !!reducedMQ?.matches);
  const fading = t > 0 && t < 1;
  if (!fading) { fadeToks = null; clearInline(); }
  else if (!fadeToks) measureRoom();
  const want: Room = fading ? (t >= MID ? 'day' : 'night') : t >= 1 ? 'day' : 'night';
  if (root.getAttribute('data-arbor2-room') !== want) root.setAttribute('data-arbor2-room', want);
  if (fading && fadeToks) {
    const next: string[] = [];
    for (const k of fadeToks) { const v = mixValue(k.night, k.day, t, fadeDelta); if (v !== null) { root.style.setProperty(k.name, v); next.push(k.name); } }
    for (const [name, v] of poolAt(t)) { root.style.setProperty(name, v); next.push(name); }
    for (const n of inlined) if (!next.includes(n)) root.style.removeProperty(n);
    inlined = next;
  }
  const dn = String(Math.round(t * 1000) / 1000);
  if (root.getAttribute('data-arbor2-dayness') !== dn) root.setAttribute('data-arbor2-dayness', dn);
};
const setRoom = (c: Choice) => { const v = dataRoomOf(c); if (v) root.setAttribute('data-room', v); else root.removeAttribute('data-room'); applyRoom(); };
// THE HARNESS'S CLOCK (mockup only, in memory): window.arbor2Clock('07:00') sets the time the room reads; arbor2Clock(null) gives the real
// clock back. Returns the dayness. A reload forgets it.
(window as unknown as { arbor2Clock?: (s: string | null) => string | null }).arbor2Clock = (s) => {
  clockOverride = s === null ? null : parseClock(s);
  applyRoom();
  return root.getAttribute('data-arbor2-dayness');
};

root.setAttribute('data-arbor2', 'true');
applyRoom();
mountSun(root);   // item 6: the day room's pergola light (drawn only in the day room by styles/arbor-v2.css; in memory, stores nothing)
mountPaper();     // the zoomed page stays a whole opaque sheet, and the sun layer has a hole over the page (paper.ts; Fable, Oct 29)
mountChrome(root);    // r5 §2c.1: the top bar drawn flush to the window's top, the "..." inside it (chrome.ts; the page never moves)
mountDrawerEdge(root, '--arbor2-drawer-r');   // r11 (Nick, via Fable, Nov 1): open, a drawer is flush to the page and its tab rides its outer edge
new MutationObserver(applyRoom).observe(root, { attributes: true, attributeFilter: ['data-room'] });
setInterval(applyRoom, 10_000);   // the clock moves the room (a 20-minute fade in 10 s steps: each step is under 1% of the change)
document.addEventListener('visibilitychange', applyRoom);
reducedMQ?.addEventListener?.('change', applyRoom);

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
// device-or-account): the mockup opens with everything on. One of the spec's nine cannot switch anything here, and says why.
const MOOD: { key: string; label: string; why?: string }[] = [
  { key: 'breath', label: 'Lamp breath' },
  { key: 'lamp-progress', label: 'Lamp as progress', why: 'retired: the lamp is ambience (Fable)' },
  { key: 'shadows', label: 'Day shadows' },
  { key: 'afternoon', label: 'Afternoon lengthening' },
  { key: 'flutter', label: 'Leaf flutter' },
  { key: 'variation', label: 'Rhizome variation' },
  { key: 'pull', label: 'Drawer pull motion' },
  { key: 'tabs', label: 'Coloured tabs' },
  { key: 'dim', label: 'Dim room with drawer open' },   // §6.2 (Fable, Oct 29): the further step while a drawer is open; the rest dim stays
];

// r5 (spec §2c.4, §8b.6; Fable): CLEAR RHIZOME lives in the Mood menu, plain words, with UNDO; it never touches the writing or the word count.
// In the mockup it is in-session only (src/arbor2/rhizomeLife.ts): nothing is stored.
function RhizomeRow() {
  const [, tick] = useState(0);
  useEffect(() => subscribeLife(() => tick((x) => x + 1)), []);
  const on = hasRhizome(), undo = canUndoClear();
  return (
    <li className="arbor2-mood-row arbor2-rhizome-row">
      <span className="arbor2-mood-label">Rhizome</span>
      <span>
        <button type="button" className="arbor2-bar-opt arbor2-rhizome-clear" disabled={!on} onClick={() => clearRhizome()}>Clear Rhizome</button>
        {undo && <button type="button" className="arbor2-bar-opt arbor2-rhizome-undo" onClick={() => undoClearRhizome()}>Undo</button>}
      </span>
    </li>
  );
}

// r9: THE ROOM CONTROL (Nick's pick, via Fable, Nov 1) - three choices at the head of the Mood menu: Follow the clock (the default: no
// data-room), Always day, Always night. The pressed one is the CHOICE, not the room in force (following the clock, the room moves on its own).
const ROOM_HELP = 'By the clock: day 07:00–19:00';
function RoomRow() {
  const [choice, setC] = useState<Choice>(() => choiceOf(root.getAttribute('data-room')));
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const mo = new MutationObserver(() => setC(choiceOf(root.getAttribute('data-room'))));
    mo.observe(root, { attributes: true, attributeFilter: ['data-room'] });
    return () => mo.disconnect();
  }, []);
  return (
    <li className="arbor2-mood-row arbor2-room-row" role="group" aria-label="Room">
      <span className="arbor2-mood-label">Room</span>
      {/* r10 (the Wrizors, Nov 1; spec §2e): the spec's shorter words - By the clock · Day · Night - so the row holds one line; its "?" names the clock */}
      <span className="arbor2-room-opts">
        {([['clock', 'By the clock'], ['day', 'Day'], ['night', 'Night']] as [Choice, string][]).map(([v, text]) => (
          <button key={v} type="button" className="arbor2-bar-opt" data-room-opt={v} aria-pressed={choice === v} onClick={() => setRoom(v)}>{text}</button>
        ))}
        <button type="button" className="arbor2-room-help" title={ROOM_HELP} aria-label={ROOM_HELP} aria-expanded={help} onClick={() => setHelp((h) => !h)}>?</button>
      </span>
      {help && <span className="arbor2-room-help-line" role="note">{ROOM_HELP}</span>}
    </li>
  );
}

function MoodMenu({ off, flip }: { off: string[]; flip: (k: string) => void }) {
  return (
    <ul className="arbor2-mood" aria-label="Mood">
      <RoomRow />
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
      <RhizomeRow />
    </ul>
  );
}

function MockupBar() {
  const [open, setOpen] = useState(true);
  const [mood, setMood] = useState(false);
  // the switched-off set lives here (the bar never unmounts), so folding the bar or the list keeps every switch where she left it
  const [off, setOff] = useState<string[]>([]);
  useEffect(() => {
    if (off.length) root.setAttribute('data-arbor2-off', off.join(' '));
    else root.removeAttribute('data-arbor2-off');
  }, [off]);
  const flip = (k: string) => setOff((o) => (o.includes(k) ? o.filter((x) => x !== k) : [...o, k]));
  // item 9: the logo - r5: ALL SAGE by default (Nick's pick, Oct 31 1:34 pm); the row keeps the brass o to compare. In-session, an attribute on <html>
  const [logo, setLogo] = useState<'brass' | 'all'>('all');
  useEffect(() => {
    if (logo === 'brass') root.setAttribute('data-arbor2-logo', 'brass');
    else root.removeAttribute('data-arbor2-logo');
  }, [logo]);
  return (
    <div className="arbor2-bar" data-open={open ? 'true' : 'false'}>
      <button type="button" className="arbor2-bar-head" aria-expanded={open} onClick={() => setOpen(o => !o)}>Arbor mockup</button>
      {open && (
        <>
          <p className="arbor2-bar-note">The rhizome (Progress: Rhizome, with a word goal) keeps its finished laps faint by day; by night it shows only at the goal.</p>
          <Seg<'brass' | 'all'> label="Logo" value={logo} opts={[['all', 'Sage'], ['brass', 'Brass o']]} onPick={setLogo} />
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
