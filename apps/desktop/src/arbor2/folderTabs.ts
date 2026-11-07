import { useEffect, useLayoutEffect, useState } from 'react';
import { useTheme } from '../store/theme';
import type { DrawerSide } from '../store/drawerShell';
import { isArbor2 } from './flag';

// ARBOR v2 MOCKUP r17 - NICK'S C2 FOLDER TABS (Nick, Nov 2, 8:28 pm; spec draft 23 §9c; the Wrizors' note md5 a17aae25, gated by Fable). "A tab must
// stick off the drawer with a body of its own": the Tools drawer's tabs stand up from its TOP edge, the Tutor drawer's off its RIGHT (outer) edge.
// A drawer clips what it holds to its own box (its panel scrolls), so a tab that stands OFF the drawer cannot be drawn inside it. The tab row is
// drawn instead beside the drawer's own opener, in the layer the opener lives in (the Tools drawer's anchor; the Tutor grip's anchor), and it
// travels as the opener does (styles/arbor-v2.css). The row is the same element with the same handlers, ids and roles (a React portal), so the
// tab panel still names its tab. The openers, the drawers and their contents are untouched (Nick: "don't change ANYTHING about the open/close
// tabs"). Returns where to draw the row, or null for the drawer's own place (other themes, the mockup's "tabs" switch off, another drawer).
const offTabs = () => (document.documentElement.getAttribute('data-arbor2-off') || '').split(' ').includes('tabs');
export function useFolderTabsHost(side: DrawerSide, idPrefix: string, on: boolean): Element | null {
  const theme = useTheme();
  const [off, setOff] = useState(() => (typeof document === 'undefined' ? true : offTabs()));
  const [host, setHost] = useState<Element | null>(null);
  useEffect(() => {
    const mo = new MutationObserver(() => setOff(offTabs()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-arbor2-off'] });
    return () => mo.disconnect();
  }, []);
  useLayoutEffect(() => {
    const want = on && !off && isArbor2() && theme === 'plateau' && (idPrefix === 'wz-sliver' || idPrefix === 'wz-tutor');
    setHost(want ? document.querySelector(side === 'left' ? '.desk-frame-sliver-anchor' : '.desk-frame-tutor-anchor') : null);
  }, [on, off, theme, side, idPrefix]);
  return host;
}
