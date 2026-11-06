// FLUX3 S3 - THE DOC'S FRAME: the schema gutter and the per-doc link ports (flux-rulings-oct31.md q10; the spec's §5; Fable's S3 rulings C, D).
// Behind ?flux3=1, in Flux, on a writing page. Both are OVERLAYS in the page's column (.mode-pagecol, the page's positioned parent, which stands
// under the hands): they sit outside the page's edges, so the page's rect, scroll, caret and text never move, and the page is never their parent
// (its overflow clips). Both carry chrome-fade, so they follow the recede rule: 0 while she types, back on the pause (the host's
// data-chrome-receded).
//   - THE GUTTER (ruling D): one row per paragraph (the editor's own rows, .wz-row; a blank line is no block), beside the paragraph's first line,
//     just outside the page's left edge: block number · words. Read from the DOM only when she pauses (a mutation only restarts a timer), on
//     resize and on scroll: zero work while keys land. It hides while the page is zoomed (the Typewriter). Under an open TOOLS hand.
//   - THE PORTS (ruling C): one square port per linked item on the page's right edge, from the page's grafts (store/grafts.ts graftsOf: the same
//     list the Grafts pane shows; nothing new is stored). A press draws the line into a box: the item's kind and name; Dock (a card or page, the
//     pane's own dock); Connect another (the pane's own graft picker); Disconnect (the pane's own remove, through the same confirm; it never
//     deletes). Flux's words are the connect register (flux-v2 LX2b forbids "link" in Flux strings).
//     No "Open as hologram" (C), and no "Go to the Schema": a board has no return chip back to a page, so it would be a departure without a
//     return (page primacy, law 3) - handed up.
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../store/theme';
import { useDeskLexicon } from '../store/deskLexicon';
import { countGoalWords } from '../store/writingGoal';
import { rowsFor } from '../store/lineRows';
import { graftsOf, type GraftRow } from '../store/grafts';
import { removePageLink, subscribe } from '../store/persistence';
import { requestDelete } from '../store/deleteGate';
import { setLinkDock } from '../store/linkDock';
import { GraftPicker } from '../components/GraftPicker';

/** A typing pause: the gutter is measured again this long after the last change to the text. */
export const GUTTER_PAUSE_MS = 700;
const PORT_TOP = 72;    // clear of the hands' grips (16..50 px down the page's edges)
const PORT_STEP = 26;
const GUTTER_GAP = 24;  // the gutter's right edge stands this far off the page's left edge (clear of the left grip)

interface Props {
  /** The page (.mode-page). */
  paperRef: RefObject<HTMLElement | null>;
  /** The page's own entry id. */
  entryId: string;
}

export function FluxDoc(props: Props) {
  const theme = useTheme();
  return theme === 'flux' ? <Doc {...props} /> : null;
}

interface GutterRow { n: number; words: number; y: number }
interface Frame { left: number; right: number; top: number; height: number; zoomed: boolean }

function Doc({ paperRef, entryId }: Props) {
  const { t } = useDeskLexicon();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [rows, setRows] = useState<GutterRow[]>([]);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [, setTick] = useState(0);
  const measures = useRef(0);

  // the column the page stands in: the overlay's positioned parent (it does not clip, and it stands under the hands)
  useEffect(() => { setHost(paperRef.current?.parentElement ?? null); }, [paperRef]);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);   // a link made or removed anywhere redraws the ports

  const measure = useCallback(() => {
    const page = paperRef.current;
    if (!page || !host) return;
    measures.current += 1;
    const hr = host.getBoundingClientRect(), pr = page.getBoundingClientRect();
    const scroller = page.querySelector<HTMLElement>('.mode-scroll');
    const sr = (scroller ?? page).getBoundingClientRect();
    // the words come from the editor's MODEL (store/lineRows.ts: one line per row), never from the rendered rows' text (the typing-latency
    // readers law: no count path reads the DOM); a row element is read only for where it stands. A stale map (a composition, a native edit not
    // yet re-rendered) is skipped: the next pause measures again
    const ed = page.querySelector<HTMLElement>('.forward-only-editor');
    const R = ed ? rowsFor(ed) : undefined;
    if (!R || R.stale) return;
    const out: GutterRow[] = [];
    let n = 0;
    R.lines.forEach((line, i) => {
      if (!line.trim()) return;
      n += 1;
      const row = R.rows[i];
      if (!row) return;
      const r = row.getBoundingClientRect();
      if (r.bottom <= sr.top || r.top >= sr.bottom) return;   // only what she can see beside it
      // a paragraph whose first line has scrolled above the page's text keeps its row at the text's top edge, beside what is left of it
      out.push({ n, words: countGoalWords(line), y: Math.round(Math.max(r.top, sr.top) - hr.top) });
    });
    setRows(out);
    setFrame({ left: pr.left - hr.left, right: pr.right - hr.left, top: pr.top - hr.top, height: pr.height, zoomed: host.dataset.zoom === 'true' });
  }, [paperRef, host]);

  useEffect(() => {
    const page = paperRef.current;
    if (!page || !host) return;
    let timer = 0, raf = 0;
    const later = () => { window.clearTimeout(timer); timer = window.setTimeout(measure, GUTTER_PAUSE_MS); };   // typing: only the timer moves
    const soon = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; measure(); }); };
    const scroller = page.querySelector<HTMLElement>('.mode-scroll');
    const mo = new MutationObserver(later);
    mo.observe(page, { subtree: true, childList: true, characterData: true });
    const zoom = new MutationObserver(soon);
    zoom.observe(host, { attributes: true, attributeFilter: ['data-zoom'] });
    scroller?.addEventListener('scroll', soon, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(soon) : null;
    ro?.observe(page);
    ro?.observe(host);
    later();
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      mo.disconnect();
      zoom.disconnect();
      scroller?.removeEventListener('scroll', soon);
      ro?.disconnect();
    };
  }, [paperRef, host, measure]);

  if (!host || !frame || frame.zoomed) return null;
  const g = graftsOf({ entryId });
  const ports: GraftRow[] = [...g.Cards, ...g.Boards, ...g.Pages, ...g.Sources];
  const room = Math.max(0, Math.floor((frame.height - PORT_TOP - 24) / PORT_STEP));
  const shown = ports.slice(0, room);
  const hidden = ports.length - shown.length;
  return createPortal(
    <>
      <div className="flux3-gutter chrome-fade" aria-hidden="true" data-flux3-gutter="" data-measures={measures.current}
        style={{ left: frame.left - GUTTER_GAP, top: 0 }}>
        {rows.map((r) => (
          <span key={r.n} className="flux3-gutter-row" data-block={r.n} style={{ top: r.y }}>
            <b>{String(r.n).padStart(2, '0')}</b> · {r.words} {r.words === 1 ? t('flux3WordOne') : t('flux3WordMany')}
          </span>
        ))}
      </div>
      <Ports ports={shown} hidden={hidden} entryId={entryId} x={frame.right} y={frame.top + PORT_TOP} />
    </>,
    host,
  );
}

function Ports({ ports, hidden, entryId, x, y }: { ports: GraftRow[]; hidden: number; entryId: string; x: number; y: number }) {
  const { t } = useDeskLexicon();
  const [open, setOpen] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLButtonElement>(null);
  const kindOf = (r: GraftRow) => (r.group === 'Cards' ? 'card' : r.group === 'Boards' ? 'board' : 'page');
  const kindWord = (k: string) => (k === 'page' ? t('linksKindPage') : k === 'board' ? t('linksKindBoard') : t('linksKindCard'));

  // a press anywhere else, or Esc, closes the box (the picker keeps its own)
  useEffect(() => {
    if (!open || picking) return;
    const away = (e: PointerEvent) => { if (!(e.target instanceof Node) || !boxRef.current?.parentElement?.contains(e.target)) setOpen(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('pointerdown', away, true);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away, true); document.removeEventListener('keydown', esc); };
  }, [open, picking]);
  useEffect(() => { if (open && !ports.some((p) => p.key === open)) setOpen(null); }, [open, ports]);

  const at = ports.findIndex((p) => p.key === open);
  const row = at >= 0 ? ports[at] : null;
  return (
    <div className="flux3-ports chrome-fade" data-flux3-ports="" style={{ left: x, top: y }}>
      {ports.map((p, i) => (
        <button key={p.key} type="button" className="flux3-port" data-port-kind={kindOf(p)} data-port-key={p.key} aria-expanded={open === p.key}
          aria-label={`${kindWord(kindOf(p))}: ${p.title}`} title={`${kindWord(kindOf(p))}: ${p.title}`} style={{ top: i * PORT_STEP }}
          onClick={() => { setPicking(false); setOpen((o) => (o === p.key ? null : p.key)); }} />
      ))}
      {hidden > 0 && <span className="flux3-port-more" aria-hidden="true" style={{ top: ports.length * PORT_STEP }}>+{hidden}</span>}
      {row && (
        <>
          <i className="flux3-port-line" aria-hidden="true" style={{ top: at * PORT_STEP }} />
          <div ref={boxRef} className="flux3-port-box" data-flux3-port-box="" style={{ top: at * PORT_STEP - 8 }}>
            <div className="flux3-port-head"><span className="flux3-port-kind">{kindWord(kindOf(row))}</span> {row.title}</div>
            {kindOf(row) !== 'board' && (
              <button type="button" className="flux3-port-act" data-port-act="dock"
                onClick={() => { setLinkDock(entryId, { entryId: row.entryId, ...(row.boxId ? { boxId: row.boxId } : {}) }); document.dispatchEvent(new Event('wz-link-dock-open')); setOpen(null); }}>
                {t('graftDock')}
              </button>
            )}
            <button ref={linkRef} type="button" className="flux3-port-act" data-port-act="link" aria-expanded={picking} onClick={() => setPicking((v) => !v)}>
              {t('flux3PortConnectAnother')}
            </button>
            {row.linkId && (
              <button type="button" className="flux3-port-act" data-port-act="unlink"
                onClick={() => { const id = row.linkId as string; setOpen(null); requestDelete(() => { removePageLink(id); }, { title: t('linksRemoveTitle'), always: true, noDontAsk: true }); }}>
                {t('flux3PortDisconnect')}
              </button>
            )}
          </div>
        </>
      )}
      {row && picking && <GraftPicker subject={{ entryId }} anchor={linkRef.current} cameFrom={null} onClose={() => setPicking(false)} />}
    </div>
  );
}
