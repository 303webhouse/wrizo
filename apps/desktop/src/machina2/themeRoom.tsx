import { useEffect, useState } from 'react';
import { Seg } from '../components/ModeStage';
import { readRoom, setRoom, type Choice } from './room';

// MACHINA v2 MOCKUP r8 (Fable, Nov 2: "Room control: put it right beside Page in the Themes menu (both mockups; it can stay in Mood too). Nick
// couldn't find 'light mode'"). The same in-session choice as the mockup panel's Lighting row (room.ts setRoom: a pick lands at once); it
// re-reads <html>'s attributes, so the two rows always agree. Machina's words (spec §2f, §11): Lighting ▸ Automatic · Day · Night. Nothing stored.
export function MachinaThemeLightingRow() {
  const root = document.documentElement;
  const [, tick] = useState(0);
  useEffect(() => {
    const mo = new MutationObserver(() => tick((x) => x + 1));
    mo.observe(root, { attributes: true, attributeFilter: ['data-room', 'data-machina2-room'] });
    return () => mo.disconnect();
  }, [root]);
  return (
    <Seg label="Lighting" value={readRoom().choice} opts={[['clock', 'Automatic'], ['light', 'Day'], ['dark', 'Night']]} onPick={(v) => setRoom(v as Choice)} />
  );
}
