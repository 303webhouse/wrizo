import { useEffect, useState } from 'react';
import { Seg } from '../components/ModeStage';
import { choiceOf, dataRoomOf, type Choice } from './room';

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
  return (
    <Seg label="Room" value={choiceOf(root.getAttribute('data-room'))} opts={[['day', 'Light'], ['night', 'Dark'], ['clock', 'By the clock']]}
      onPick={(v) => { const d = dataRoomOf(v as Choice); if (d) root.setAttribute('data-room', d); else root.removeAttribute('data-room'); }} />
  );
}
