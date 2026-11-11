import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { samePageElsewhere, setOpenPage, subscribeSamePage } from '../store/windowPresence';
import { useDeskLexicon } from '../store/deskLexicon';

// #76 PART 2 - the same page is open in another window too: ONE quiet line, in both windows, while that is true. Not a pop-up: no dialog, no button, nothing that can take focus, pointer-events off, so it never
// blocks typing or clicks. It goes by itself when one window closes or leaves the page. It saves nothing (store/windowPresence.ts: the windows only signal each other). The words are the Wrizors'.
export function SamePageNotice() {
  const location = useLocation();
  const { t } = useDeskLexicon();
  const open = /^\/page\/([^/?#]+)/.exec(location.pathname);
  const id = open && open[1] !== 'new' ? decodeURIComponent(open[1]) : null;
  const [elsewhere, setElsewhere] = useState(() => samePageElsewhere());
  useEffect(() => { setOpenPage(id); return () => setOpenPage(null); }, [id]);
  useEffect(() => subscribeSamePage(() => setElsewhere(samePageElsewhere())), []);
  if (!id || !elsewhere) return null;
  return <div className="wz-same-page-line" role="status" aria-live="off" data-same-page-elsewhere="true">{t('samePageElsewhere')}</div>;
}
