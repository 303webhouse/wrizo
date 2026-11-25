import { useEffect, useState } from 'react';
import type { InkTab, InkOpts } from './InkTab';

// VISUAL 1a.1 - THE INK TAB'S DOOR IN THE FIRST DOWNLOAD: the tab itself (the face, Studio) is fetched on the first INK open and kept. Not React.lazy: a failed fetch (offline, a
// deploy under an open window) must never throw past the page she is writing on; the tab is empty until the next try.
let loaded: typeof InkTab | null = null;

export function InkTabSlot({ opts }: { opts: InkOpts }) {
  const [Tab, setTab] = useState<typeof InkTab | null>(() => loaded);
  useEffect(() => {
    if (Tab) return;
    let alive = true;
    import('./InkTab')
      .then((m) => { loaded = m.InkTab; if (alive) setTab(() => m.InkTab); })
      .catch(() => { /* the next INK open tries again */ });
    return () => { alive = false; };
  }, [Tab]);
  return Tab ? <Tab opts={opts} /> : null;
}
