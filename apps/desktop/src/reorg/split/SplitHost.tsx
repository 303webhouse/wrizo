import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useDeskLexicon } from '../../store/deskLexicon';
import { flushNow, getJournalEntry, subscribe } from '../../store/persistence';
import { routeForEntry } from '../../store/routeForEntry';
import { restoreTripPage, startBoardTrip, takeTripBack } from './fullTrip';
import { plainLines } from '../../store/entryText';
import { liveBoxes } from '../../store/boxTombstones';
import { recordShadow } from '../../store/voiceWall';
import { clampFrac, closeSplit, dragSplit, openSplit, setSplitWidth, useSplit, useSplitWidth, type SplitRef } from './splitStore';
import { SplitBoard } from './SplitBoard';

// THE SPLIT SCREEN (the reorg, phase 4.2, behind ?reorg=1 in Machina). An asset opens on the RIGHT at half the room right of the rail, with a grip between the
// two sides. THE PAGE MOVES - Nick's one exception to "the page never moves" (Nov 10) - and only by a shift: its size and its top never change, it sits in the
// middle of its own side (Cursor 112), and closing the split takes the shift away, so the page is exactly where it was. Both menus are off in a split (Nick,
// Nov 14): they are hidden, not closed, so they come back as she left them (Cursor 116). The Typewriter is not offered in a split (splitBlocked).
// Nothing here is written to a page or an asset: the asset is read-only beside the page (it is a reader, as the dock is); only the grip's width is kept.

const SIDE_GAP = 16;    // the page's side starts this far right of the rail (Cursor 112)
const PAGE_GAP = 5;     // and ends this far short of the asset's side
const EDGE = 16;        // the asset's side stops this far short of the window's right edge
const ASSET_MIN = 336;  // never narrower than one Block and its margins (Cursor 114)
const STEP = 16;        // an arrow key moves the grip this far

interface Geo { left: number; top: number; height: number; width: number; min: number; max: number; roomLeft: number; roomW: number }

const PAPER = '.mode-page, .script-sheet';

/** Where the asset's side stands for a width fraction, and how far the page must be shifted to sit in the middle of its own side. Pure arithmetic over measured numbers. */
export function splitGeometry(railRight: number, winW: number, frac: number, pageW: number): { assetLeft: number; min: number; max: number } {
  const roomW = Math.max(1, winW - railRight);
  const min = railRight + SIDE_GAP + pageW + PAGE_GAP;       // the page's side is never narrower than the page
  const max = winW - EDGE - ASSET_MIN;                         // the asset's side is never narrower than ASSET_MIN
  const want = railRight + roomW * clampFrac(frac);
  const assetLeft = max < min ? min : Math.min(max, Math.max(min, want));
  return { assetLeft, min, max };
}

export function SplitHost({ pageId }: { pageId: string }) {
  const ref = useSplit(pageId);
  // leaving the page (or the app's surface) ends the split: the next page opens alone (Cursor 118)
  useEffect(() => () => closeSplit(), [pageId]);
  // BACK FROM A BOARD'S FULL SCREEN (§3b item 3, ./fullTrip.ts): the page she left takes the trip back - the split opens again on the same Board and
  // her scroll and caret are put back. Any other arrival at a page ends the trip.
  useEffect(() => {
    const trip = takeTripBack(pageId);
    if (!trip) return;
    openSplit(pageId, { entryId: trip.boardId });
    return restoreTripPage(trip.wb);
  }, [pageId]);
  return ref ? <SplitOpen pageId={pageId} asset={ref} /> : null;
}

function SplitOpen({ pageId, asset }: { pageId: string; asset: SplitRef }) {
  const { t } = useDeskLexicon();
  const navigate = useNavigate();
  const frac = useSplitWidth();
  const [geo, setGeo] = useState<Geo | null>(null);
  // FULL SCREEN (§3b item 3; Fable, Nov 21 11:45 am): a Block or a Doc fills the window over the faded page and split, which stay mounted and still;
  // Esc or Back gives the split back as it was. A Board opens its own screen instead (the trip, ./fullTrip.ts). Kept in memory only.
  const [full, setFull] = useState(false);
  const fullBtn = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { setFull(false); }, [asset.entryId, asset.boxId]);
  const onFull = (btn: HTMLButtonElement) => {
    fullBtn.current = btn;
    const e = getJournalEntry(asset.entryId);
    if (e && e.pageType === 'board' && !asset.boxId) {
      startBoardTrip(pageId, e.id);
      flushNow();
      navigate(routeForEntry(e));
      return;
    }
    setFull(true);
  };
  const closeFull = () => { setFull(false); window.setTimeout(() => fullBtn.current?.focus(), 0); };
  const shiftRef = useRef(0);
  const dragging = useRef(false);

  const measure = () => {
    const stage = document.querySelector<HTMLElement>('.desk-frame-stage');
    const strip = document.querySelector<HTMLElement>('.desk-frame-strip');
    const paper = stage?.querySelector<HTMLElement>(PAPER);
    if (!stage || !strip || !paper) return;
    const sr = stage.getBoundingClientRect();
    const pr = paper.getBoundingClientRect();
    const railRight = strip.getBoundingClientRect().right;
    const winW = window.innerWidth;
    // the paper's size and place WITHOUT the shift this host has applied: the shift is only ever a translate, so it is subtracted exactly
    const unshiftedLeft = pr.left - shiftRef.current;
    const g = splitGeometry(railRight, winW, frac, pr.width);
    const sideLeft = railRight + SIDE_GAP;
    const sideRight = g.assetLeft - PAGE_GAP;
    const target = (sideLeft + sideRight) / 2;
    const shift = Math.round((target - (unshiftedLeft + pr.width / 2)) * 100) / 100;
    shiftRef.current = shift;
    stage.style.setProperty('--wz-split-shift', `${shift}px`);
    stage.setAttribute('data-split', 'true');
    setGeo({ left: g.assetLeft, top: sr.top, height: sr.height, width: winW - EDGE - g.assetLeft, min: g.min, max: g.max, roomLeft: railRight, roomW: Math.max(1, winW - railRight) });
  };

  useLayoutEffect(() => {
    measure();
    const stage = document.querySelector<HTMLElement>('.desk-frame-stage');
    const ro = stage ? new ResizeObserver(() => measure()) : null;
    if (stage && ro) ro.observe(stage);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
      // closing the split gives the page back exactly: the shift and the mark go, nothing else was ever touched
      stage?.removeAttribute('data-split');
      stage?.style.removeProperty('--wz-split-shift');
      shiftRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frac]);

  const fracAt = (clientX: number): number => (geo ? (clientX - geo.roomLeft) / geo.roomW : frac);
  const clampLeft = (left: number): number => (geo ? (geo.max < geo.min ? geo.min : Math.min(geo.max, Math.max(geo.min, left))) : left);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !geo) return;
    dragSplit(fracAt(clampLeft(e.clientX)));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    (e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId);
    if (geo) setSplitWidth(fracAt(clampLeft(e.clientX)));
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!geo || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    setSplitWidth(fracAt(clampLeft(geo.left + (e.key === 'ArrowLeft' ? -STEP : STEP))));
  };

  if (!geo) return null;
  return (<>{createPortal(
    // a key pressed in the split's side is not the page's and not the menus': the Tutor's own document-level key rule would close its (hidden) drawer on the grip's arrow keys, and the menus must come back as she left them
    <aside className="wz-split-asset" onKeyDown={(e) => e.nativeEvent.stopPropagation()} data-split-asset={asset.entryId} {...(asset.boxId ? { 'data-split-box': asset.boxId } : {})}
      style={{ left: `${geo.left}px`, top: `${geo.top}px`, height: `${geo.height}px`, width: `${geo.width}px` }} aria-label={t('reorgSplitLabel')}>
      <div className="wz-split-grip" role="separator" aria-orientation="vertical" aria-label={t('reorgSplitGrip')} tabIndex={0}
        aria-valuemin={Math.round(geo.min)} aria-valuemax={Math.round(Math.max(geo.min, geo.max))} aria-valuenow={Math.round(geo.left)}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onKeyDown={onKeyDown} />
      <SplitReader asset={asset} onFull={onFull} />
    </aside>,
    document.body,
  )}{full && <SplitFull asset={asset} onClose={closeFull} />}</>);
}

// FULL SCREEN for a Block or a Doc: the asset over the whole window, the page and the split faded behind it (a shade, not a move: nothing under it
// changes size or place, and nothing unmounts). Its keys stop at its own edge, as the split's do; Esc closes it first, never the split.
function SplitFull({ asset, onClose }: { asset: SplitRef; onClose: () => void }) {
  const { t } = useDeskLexicon();
  const v = useAssetView(asset);
  const backRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { backRef.current?.focus(); }, []);
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.nativeEvent.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };
  return createPortal(
    <div className="wz-split-full" data-split-fullscreen={asset.entryId} role="dialog" aria-modal="true" aria-label={v.title} onKeyDown={onKeyDown}>
      <div className="wz-split-full-shade" data-split-full-shade="" aria-hidden="true" onClick={onClose} />
      <div className="wz-split-full-panel wz-split-reader" onCopy={() => { const sel = String(document.getSelection() || ''); if (sel) recordShadow(sel); }}>
        <div className="wz-split-head">
          <span className="wz-link-dock-kind">{v.kind}</span>
          <button type="button" ref={backRef} className="wz-link-dock-close" data-split-full-back="" onClick={onClose}>{t('reorgFullBack')}</button>
        </div>
        <div className="wz-link-dock-title">{v.title}</div>
        <div className="wz-link-dock-text">{v.lines.map((l, i) => <p key={i}>{l}</p>)}</div>
      </div>
    </div>,
    document.body,
  );
}

// what the reader draws for an asset: its kind, its title and its lines (a Board draws its canvas instead)
function useAssetView(asset: SplitRef): { e: ReturnType<typeof getJournalEntry>; isBoard: boolean; kind: string; title: string; lines: string[] } {
  const { t } = useDeskLexicon();
  const snap = useSyncExternalStore(subscribe, () => {
    const e = getJournalEntry(asset.entryId);
    return e ? e.updatedAt + '|' + liveBoxes(e.boxes).length : '';
  });
  void snap;
  const e = getJournalEntry(asset.entryId);
  const isBoard = !!e && e.pageType === 'board' && !asset.boxId;
  let title = t('linkDockGone');
  let kind = t('linksKindPage');
  let lines: string[] = [];
  if (e) {
    if (asset.boxId) {
      const b = liveBoxes(e.boxes).find((x) => x.id === asset.boxId);
      kind = t('linksKindCard');
      if (b && b.kind === 'text') { lines = plainLines(b.text ?? ''); title = lines[0] ?? t('linkDockGone'); lines = lines.length > 1 ? lines.slice(1) : []; }
    } else if (isBoard) {
      kind = t('linksKindBoard');
      title = plainLines(e.text ?? '')[0] || t('reorgUntitledBoard');
    } else {
      lines = plainLines(e.text ?? '');
      title = lines[0] ?? t('linkDockGone');
      lines = lines.length > 1 ? lines.slice(1) : [];
    }
  }
  return { e, isBoard, kind, title, lines };
}

// the asset, read-only: a Block (one card's words), a Doc (its text) or a Board (on its own canvas, with its views, pans and zooms: ./SplitBoard.tsx, §3b item 2a;
// it was its cards as a list, in the board's own order, until Nov 21). Full Screen stands beside Close for every asset (§3b item 3).
function SplitReader({ asset, onFull }: { asset: SplitRef; onFull: (btn: HTMLButtonElement) => void }) {
  const { t } = useDeskLexicon();
  const { e, isBoard, kind, title, lines } = useAssetView(asset);
  return (
    // text copied from the reader is the writer's own, so it passes the Voice Wall when pasted (the dock's own rule)
    <div className="wz-split-reader" onCopy={() => { const sel = String(document.getSelection() || ''); if (sel) recordShadow(sel); }}>
      <div className="wz-split-head">
        <span className="wz-link-dock-kind">{kind}</span>
        <span className="wz-split-head-acts">
          <button type="button" className="wz-link-dock-close" data-split-full="" disabled={!e} onClick={(ev) => onFull(ev.currentTarget)}>{t('reorgSplitFull')}</button>
          <button type="button" className="wz-link-dock-close" data-split-close="" aria-label={t('reorgSplitClose')} onClick={closeSplit}>{t('reorgSplitClose')}</button>
        </span>
      </div>
      <div className="wz-link-dock-title">{title}</div>
      {isBoard && e
        // keyed by the asset: another Board, or the split opened again, starts at home (Open, scale 1, the pan home): nothing of the view is kept
        ? <SplitBoard key={asset.entryId} entry={e} />
        : <div className="wz-link-dock-text">{lines.map((l, i) => <p key={i}>{l}</p>)}</div>}
    </div>
  );
}
