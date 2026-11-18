import { useEffect, useState } from 'react';
import { choiceOf, dataRoomOf, ROOM_HELP, type Choice } from './room';

// ARBOR v2 MOCKUP r17 (Fable, Nov 2: "Room control: put it right beside Page in the Themes menu (both mockups; it can stay in Mood too). Nick
// couldn't find 'light mode'"). The same in-session choice as the Mood menu's Room row: it writes data-room on <html> (light = Day, dark =
// Night, absent = By the clock), which mount.tsx's own observer turns into the room; it re-reads that attribute, so the two rows always agree.
// Arbor's words (the Wrizors' note, Nov 2, md5 a17aae25, gated by Fable): "Room: Light · Dark · By the clock", directly under Page; the row
// leaves the Mood menu. Nothing is stored.
export function ArborThemeRoomRow() {
  const root = document.documentElement;
  const [, tick] = useState(0);
  useEffect(() => {
    const mo = new MutationObserver(() => tick((x) => x + 1));
    mo.observe(root, { attributes: true, attributeFilter: ['data-room'] });
    return () => mo.disconnect();
  }, [root]);
  // r18 (Fable, Nov 3): the room's "?" comes onto this row - the Seg's own markup (label, then the choices) with the "?" after the choices, and
  // its note under the row when open (the Mood menu's r10 "?", guidance green)
  const [help, setHelp] = useState(false);
  const value = choiceOf(root.getAttribute('data-room'));
  const pick = (v: Choice) => { const d = dataRoomOf(v); if (d) root.setAttribute('data-room', d); else root.removeAttribute('data-room'); };
  return (
    <>
      <div className="mode-crow arbor2-theme-room">
        <span>Room</span>
        <span className="arbor2-theme-room-right">
          <div className="mode-seg">
            {([['day', 'Light'], ['night', 'Dark'], ['clock', 'By the clock']] as [Choice, string][]).map(([v, txt]) => (
              <button key={v} type="button" className={value === v ? 'on' : ''} onClick={() => pick(v)}>{txt}</button>
            ))}
          </div>
          <button type="button" className="arbor2-room-help" title={ROOM_HELP} aria-label={ROOM_HELP} aria-expanded={help} onClick={() => setHelp((h) => !h)}>?</button>
        </span>
      </div>
      {help && <div className="arbor2-room-help-line arbor2-theme-room-note" role="note">{ROOM_HELP}</div>}
    </>
  );
}
