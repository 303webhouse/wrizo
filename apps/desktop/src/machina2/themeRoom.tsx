import { useEffect, useState } from 'react';
import { readRoom, setRoom, type Choice } from './room';

// MACHINA v2 MOCKUP r8 (Fable, Nov 2: "Room control: put it right beside Page in the Themes menu (both mockups; it can stay in Mood too). Nick
// couldn't find 'light mode'"). The same in-session choice as the mockup panel's Lighting row (room.ts setRoom: a pick lands at once); it
// re-reads <html>'s attributes, so the two rows always agree. Machina's words (spec §2f, §11): Lighting ▸ Automatic · Day · Night. Nothing stored.
// r9 (the Wrizors' review of r8, wrizors-to-ARBOR-nov4.md md5 d1c1dcc2, via Fable, Nov 4): the row reads "Room: Light · Dark · Automatic",
// directly under Page, with a "?" whose line names it; the mockup panel keeps its Lighting row (the same choice, its own words).
const ROOM_HELP = 'the space around the page; Automatic = light by day, dark by night';
export function MachinaThemeRoomRow() {
  const root = document.documentElement;
  const [, tick] = useState(0);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const mo = new MutationObserver(() => tick((x) => x + 1));
    mo.observe(root, { attributes: true, attributeFilter: ['data-room', 'data-machina2-room'] });
    return () => mo.disconnect();
  }, [root]);
  const value = readRoom().choice;
  return (
    <>
      <div className="mode-crow machina2-theme-room">
        <span>Room</span>
        <span className="machina2-theme-room-right">
          <div className="mode-seg">
            {([['light', 'Light'], ['dark', 'Dark'], ['clock', 'Automatic']] as [Choice, string][]).map(([v, txt]) => (
              <button key={v} type="button" className={value === v ? 'on' : ''} onClick={() => setRoom(v)}>{txt}</button>
            ))}
          </div>
          <button type="button" className="machina2-readout-help machina2-room-help" title={ROOM_HELP} aria-label={ROOM_HELP} aria-expanded={help} onClick={() => setHelp((h) => !h)}>?</button>
        </span>
      </div>
      {help && <div className="machina2-room-help-line" role="note">{ROOM_HELP}</div>}
    </>
  );
}
