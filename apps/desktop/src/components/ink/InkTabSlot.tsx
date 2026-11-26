import { useEffect, useState } from 'react';
import { useDeskLexicon } from '../../store/deskLexicon';
import type { InkTab, InkOpts } from './InkTab';
import { retryInkKit } from './inkKit';

// VISUAL 1a.1 - THE INK TAB'S DOOR IN THE FIRST DOWNLOAD: the tab and what draws (the painter, the stroke input) are fetched together on the first INK open and kept. Not React.lazy: a failed
// fetch (offline, a deploy under an open window) must never throw past the page she is writing on. (Fable, Nov 25: a failure says so in one line, with a Retry, never an empty tab.)
let loaded: typeof InkTab | null = null;

export function InkTabSlot({ opts }: { opts: InkOpts }) {
  const { t } = useDeskLexicon();
  const [Tab, setTab] = useState<typeof InkTab | null>(() => loaded);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (Tab) return;
    let alive = true;
    setFailed(false);
    Promise.all([import('./InkTab'), import('../InkStratum'), import('./inkCapture')])
      .then(([m]) => {
        loaded = m.InkTab;
        if (attempt) retryInkKit();
        if (alive) setTab(() => m.InkTab);
      })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [Tab, attempt]);
  if (Tab) return <Tab opts={opts} />;
  if (!failed) return null;
  return (
    <div className="wz-ink-fail" role="status">
      <span>{t('inkLoadFail')}</span>
      <button type="button" className="mode-tbtn wz-ink-retry" onClick={() => setAttempt((a) => a + 1)}>{t('inkRetry')}</button>
    </div>
  );
}
