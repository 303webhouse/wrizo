import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDeskLexicon } from '../../store/deskLexicon';
import { useTheme } from '../../store/theme';
import { flushNow, getJournalEntry, subscribe } from '../../store/persistence';
import { routeForEntry } from '../../store/routeForEntry';
import { walkPlaceOf } from '../docSettings';
import { ensureDoc } from '../parts';
import { docOfPage, partOfRow, toPartHref } from '../backMenu/planPart';
import { GuideWalk } from './GuideWalk';
import { forgetWalk, leaveWalk, openWalk, useWalkDoor } from './walkDoor';
import { placeIn } from './stepModel';
import { stepsOfPage } from './walkData';
import { walkPageRect } from './pageRect';

// WHERE THE WALK STANDS (PRESETS-B, Nov 25): one host, inside the router, beside the routes (never around them: it can neither move nor unmount a page). It draws the walk over the page it belongs to, and, once she
// has left it, the chip above her page that brings her back in one tap ("The Guide · Midpoint · 5 of 9 ›"), on any page of that Doc.

const pageOfPath = (path: string): string | null => /^\/page\/(?!new$)([^/]+)$/.exec(path)?.[1] ?? null;
const sameDoc = (a: string, b: string): boolean => a === b || (!!docOfPage(a) && docOfPage(a) === docOfPage(b));

function WalkChip({ pageId, onOpen }: { pageId: string; onOpen: () => void }) {
  const { t } = useDeskLexicon();
  const flux = useTheme() === 'flux';
  const label = useSyncExternalStore(subscribe, () => {
    const steps = stepsOfPage(pageId);
    const id = placeIn(steps, walkPlaceOf(pageId));
    const step = steps.find((s) => s.id === id);
    return step ? `${step.number}\u0001${steps.length}\u0001${step.title}` : '';
  });
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const place = () => {
      const page = walkPageRect();
      const next = page ? { left: Math.round(page.left), top: Math.round(Math.max(4, page.top - 34)) } : null;
      setAt((was) => (JSON.stringify(was) === JSON.stringify(next) ? was : next));
    };
    place();
    const id = window.setInterval(place, 250);
    return () => window.clearInterval(id);
  }, []);
  if (!label || !at) return null;
  const [n, total, title] = label.split('\u0001');
  const num = (v: string) => (flux ? v.padStart(2, '0') : v);
  return (
    <button type="button" className="wz-walk-chip" data-walk-chip="" style={at} onClick={onOpen}>
      {t('guideWalkChip').replace('{step}', title || t('reorgUntitled')).replace('{n}', num(n)).replace('{total}', num(total))} ›
    </button>
  );
}

export function WalkHost() {
  const { open, left } = useWalkDoor();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const here = pageOfPath(pathname);
  // a Part still to be born ("Write this part"): its address names the Doc it will join, and the chip stands there too
  const newInDoc = pathname === '/page/new' ? new URLSearchParams(search).get('binder') : null;

  // the walk is drawn only over its own page: going elsewhere (Back, a link) leaves it, with the chip
  const [settled, setSettled] = useState<string | null>(null);
  useEffect(() => {
    if (!open) { setSettled(null); return; }
    if (here === open) { setSettled(open); return; }
    if (settled === open) leaveWalk();
    else { const e = getJournalEntry(open); if (e) navigate(routeForEntry(e)); else forgetWalk(); }
  }, [open, here]);

  const write = (step: { id: string; title: string }, boardId: string) => {
    if (!open) return;
    flushNow();
    let into = docOfPage(open);
    const have = partOfRow(boardId, step.id, into);
    leaveWalk();
    if (have) { const e = getJournalEntry(have.id); if (e) navigate(routeForEntry(e)); return; }
    if (!into) {
      const made = ensureDoc(open);
      if (!made.ok) return;
      into = made.docId;
      flushNow();
    }
    navigate(toPartHref(into, boardId, step.id, step.title, getJournalEntry(open)?.pageType === 'script' ? 'screenplay' : null));
  };

  if (open && here === open) return <GuideWalk key={open} pageId={open} onLeave={leaveWalk} onDone={forgetWalk} onWrite={write} />;
  if (left && ((here && sameDoc(left, here)) || (newInDoc && newInDoc === docOfPage(left)))) return <WalkChip pageId={left} onOpen={() => openWalk(left)} />;
  return null;
}
