// FLUX3 S3 - THE DOC'S FRAME: the schema gutter and the per-doc link ports (flux-rulings-oct31.md q10; the spec's §5; Fable's S3 rulings C, D).
// Behind ?flux3=1, in Flux, on a writing page. Both are OVERLAYS in the page's column (.mode-pagecol, the page's positioned parent, which stands
// under the hands): they sit outside the page's edges, so the page's rect, scroll, caret and text never move, and the page is never their parent
// (its overflow clips). Both carry chrome-fade, so they follow the recede rule: 0 while she types, back on the pause (the host's
// data-chrome-receded).
//   - THE GUTTER (ruling D): one row per paragraph (the editor's own rows, .wz-row; a blank line is no block), beside the paragraph's first line,
//     just outside the page's left edge: block number · words. Read from the DOM only when she pauses (a mutation only restarts a timer), on
//     resize and on scroll: zero work while keys land. It hides while the page is zoomed (the Typewriter). Under an open TOOLS hand.
//   - THE PORTS (ruling C): one square port per linked item at the page's right edge (#125: just beyond it, clear of the page and its Part arrows), from the page's grafts (store/grafts.ts graftsOf: the same
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
import { getJournalEntry, removePageLink, subscribe } from '../store/persistence';
import { requestDelete } from '../store/deleteGate';
import { setLinkDock } from '../store/linkDock';
import { GraftPicker } from '../components/GraftPicker';
import { nodeHex } from './FluxNodeRecord';
import { liveBoxes } from '../store/boxTombstones';

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
/** #125 (Nov 24, Fable's rule: no control overlaps another control, the page, or its corner marks): `edge` is the page's right edge or, where the
 *  page's own Part arrows (reorg/PartMoves.tsx, centred on its scrollbar) reach past it, their right edge; the ports stand PORT_CLEAR beyond it. */
interface Frame { left: number; right: number; top: number; height: number; zoomed: boolean; textTop: number; edge: number }
const PORT_CLEAR = 4;
/** S4b L4: the header keeps this far clear of the first place text can show, and is not drawn at all when the page's top padding leaves less room than HEAD_MIN. */
const HEAD_GAP = 3;
const HEAD_MIN = 14;
/** S4b L4: the whole page's reading for the header (every block, not only the ones in view), taken on the same pause as the gutter. */
interface Totals { blocks: number; words: number }

function Doc({ paperRef, entryId }: Props) {
  const { t } = useDeskLexicon();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [rows, setRows] = useState<GutterRow[]>([]);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [totals, setTotals] = useState<Totals>({ blocks: 0, words: 0 });
  const [, setTick] = useState(0);
  const measures = useRef(0);
  const backOpen = useBackOpen();   // #125: the + and the ports step down while the Back menu is open

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
    let n = 0, total = 0;
    R.lines.forEach((line, i) => {
      if (!line.trim()) return;
      n += 1;
      total += countGoalWords(line);
      const row = R.rows[i];
      if (!row) return;
      const r = row.getBoundingClientRect();
      if (r.bottom <= sr.top || r.top >= sr.bottom) return;   // only what she can see beside it
      // a paragraph whose first line has scrolled above the page's text keeps its row at the text's top edge, beside what is left of it
      out.push({ n, words: countGoalWords(line), y: Math.round(Math.max(r.top, sr.top) - hr.top) });
    });
    setRows(out);
    setTotals((was) => (was.blocks === n && was.words === total ? was : { blocks: n, words: total }));
    // law 1 (Fable, Nov 21, 6:00 pm: the header "must never cover a line of text, at any size or scroll"): the header ends where the page's text can first
    // appear ON SCREEN, measured, never the CSS padding (the page is drawn scaled, so its padding in screen pixels is not its CSS number): the top of the
    // page's first in-flow child (the scroller, or a title above it), whose top edge is also where scrolled text is clipped
    let textTop = sr.top;
    for (const el of Array.from(page.children)) {
      const s = getComputedStyle(el);
      if (s.position === 'absolute' || s.position === 'fixed' || s.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.height > 0) textTop = Math.min(textTop, r.top);
    }
    let edge = pr.right;
    for (const a of Array.from(page.querySelectorAll<HTMLElement>('.reorg-part-arrow'))) { const r = a.getBoundingClientRect(); if (r.width > 0) edge = Math.max(edge, r.right); }
    setFrame({ left: pr.left - hr.left, right: pr.right - hr.left, top: pr.top - hr.top, height: pr.height, zoomed: host.dataset.zoom === 'true',
      textTop: textTop - hr.top, edge: edge - hr.left });
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

  if (!host || !frame) return null;
  // S4b L4: the mark says "this page wears the Flux 3 frame", so plain Flux's in-page ring, inset brackets and head stand down (flux-v3.css); it stays while the
  // page is zoomed (the Typewriter), where the frame itself is off as the gutter and ports are, so the old frame never comes back in its place
  const mark = <i className="flux3-docframe-mark" data-flux3-docframe="" hidden />;
  if (frame.zoomed) return createPortal(mark, host);
  const g = graftsOf({ entryId });
  const ports: GraftRow[] = [...g.Cards, ...g.Boards, ...g.Pages, ...g.Sources];
  const room = Math.max(0, Math.floor((frame.height - PORT_TOP - 24) / PORT_STEP));
  const shown = ports.slice(0, room);
  const hidden = ports.length - shown.length;
  // the header's height: from the glass's top edge down to HEAD_GAP above where text first shows; with less room than HEAD_MIN it is not drawn (it never covers a line)
  const headH = Math.floor(frame.textTop - (frame.top + 1)) - HEAD_GAP;
  return createPortal(
    <>
      {mark}
      {/* S4b L4 - THE PAGE'S FRAME (the mockup's #page::before/::after and #page .hd): two corner brackets just outside the glass (top-left and bottom-right,
          the room's cyan), and a readout header across the page's top edge inside its top padding, so it never covers a word: the page's address and its
          true counts (every block's words, the blocks, its connections: the same reading the gutter and the ports take, on the same pause; never per key) */}
      <span className="flux3-bracket flux3-bracket-tl chrome-fade" aria-hidden="true" data-flux3-bracket="tl" style={{ left: frame.left - 5, top: frame.top - 5 }} />
      <span className="flux3-bracket flux3-bracket-br chrome-fade" aria-hidden="true" data-flux3-bracket="br" style={{ left: frame.right - 11, top: frame.top + frame.height - 11 }} />
      {headH >= HEAD_MIN && (
        <div className="flux3-dochead chrome-fade" aria-hidden="true" data-flux3-dochead="" style={{ left: frame.left + 1, top: frame.top + 1, width: Math.max(0, frame.right - frame.left - 2), height: headH }}>
          <span className="flux3-dochead-id">{t('linksKindPage')} // <span className="flux3-dochead-hex">0x{nodeHex(entryId)}</span></span>
          <span className="flux3-dochead-n">
            {totals.words} {totals.words === 1 ? t('flux3WordOne') : t('flux3WordMany')} · {totals.blocks} {totals.blocks === 1 ? t('flux3BlockOne') : t('flux3BlockMany')} · {ports.length} {ports.length === 1 ? t('flux3LinkOne') : t('flux3LinkMany')}
          </span>
        </div>
      )}
      <div className="flux3-gutter chrome-fade" aria-hidden="true" data-flux3-gutter="" data-measures={measures.current}
        style={{ left: frame.left - GUTTER_GAP, top: 0 }}>
        {rows.map((r) => (
          <span key={r.n} className="flux3-gutter-row" data-block={r.n} style={{ top: r.y }}>
            <b>{String(r.n).padStart(2, '0')}</b> · {r.words} {r.words === 1 ? t('flux3WordOne') : t('flux3WordMany')}
          </span>
        ))}
      </div>
      <Ports ports={shown} hidden={hidden} entryId={entryId} x={frame.edge + PORT_CLEAR} y={frame.top + PORT_TOP} backOpen={backOpen} />
      <PlusCorner entryId={entryId} connections={ports.length} x={frame.right + PLUS_GAP} y={frame.top - 1} backOpen={backOpen} />
    </>,
    host,
  );
}

/** S4b N5: the + stands this far beyond the page's right edge (clear of the right hand's grip, which hugs the edge 16 px wide). */
const PLUS_GAP = 20;
const PLUS_LINE = 40;   // the line it draws down the page's side into its box

// S4b N5 - THE + AT THE PAGE'S TOP CORNER (the mockup's .plus: "Its menu draws a line down the page's side and opens into a box"). It REUSES the port box: the same box
// dress, the same Connect another (the Grafts pane's own picker, GraftPicker, with this page as its subject). It adds no action and writes nothing of its own: a
// connection made in the picker is the picker's. Esc or a press elsewhere closes it. A chrome overlay in the page's column, beyond the page: no rect moves.
/** #125: is the Back menu (the right hand's drawer, Tutor.tsx's .wz-tutor-panel) open? Watches that one element's data-open attribute: nothing
 *  else, so her typing never wakes it. The panel is looked up when the Doc's frame mounts, with up to 120 frames' retry (the hands mount beside it). */
function useBackOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let mo: MutationObserver | null = null, raf = 0, tries = 0;
    const find = () => {
      const panel = document.querySelector<HTMLElement>('.wz-tutor-panel');
      if (!panel) { if (tries++ < 120) raf = requestAnimationFrame(find); return; }
      const read = () => setOpen(panel.getAttribute('data-open') === 'true');
      read();
      mo = new MutationObserver(read);
      mo.observe(panel, { attributes: true, attributeFilter: ['data-open'] });
    };
    find();
    return () => { cancelAnimationFrame(raf); mo?.disconnect(); };
  }, []);
  return open;
}

function PlusCorner({ entryId, connections, x, y, backOpen }: { entryId: string; connections: number; x: number; y: number; backOpen: boolean }) {
  const { t } = useDeskLexicon();
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open || picking) return;
    const away = (e: PointerEvent) => { if (!(e.target instanceof Node) || !wrapRef.current?.contains(e.target)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away, true);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away, true); document.removeEventListener('keydown', esc); };
  }, [open, picking]);
  return (
    <div ref={wrapRef} className="flux3-plus-wrap chrome-fade" data-back-open={backOpen ? 'true' : undefined} style={{ left: x, top: y }}>
      <button type="button" className="flux3-plus" data-flux3-plus="" aria-expanded={open} aria-label={t('flux3PortConnectAnother')} title={t('flux3PortConnectAnother')}
        onClick={() => { setPicking(false); setOpen((o) => !o); }} />
      {open && (
        <>
          <i className="flux3-plus-line" data-flux3-plus-line="" aria-hidden="true" style={{ height: PLUS_LINE }} />
          <div className="flux3-port-box flux3-plus-box" data-flux3-plus-box="" style={{ top: 32 + PLUS_LINE }}>
            <div className="flux3-port-head" data-flux3-plus-head="">
              <span className="flux3-port-kind">{t('linksKindPage')}</span> · {connections} {connections === 1 ? t('flux3LinkOne') : t('flux3LinkMany')}
            </div>
            <button ref={linkRef} type="button" className="flux3-port-act" data-port-act="link" aria-expanded={picking} onClick={() => setPicking((v) => !v)}>
              {t('flux3PortConnectAnother')}
            </button>
          </div>
        </>
      )}
      {open && picking && <GraftPicker subject={{ entryId }} anchor={linkRef.current} cameFrom={null} onClose={() => setPicking(false)} />}
    </div>
  );
}

// S4b L5 - THE PORT BOX'S PREVIEW (the doc mockup's .pbox .node): the linked node itself, read-only, from what is already loaded (the stored page through getJournalEntry;
// a card is its board's own box): its address and kind, its name (the first line) in capitals, and a short body (the lines after it, clamped to three lines by CSS). A preset
// step is drawn in lime. A board shows its name only. No act lives here: Dock, Connect another and Disconnect stay the box's own; no hologram, no Go to the Schema (ruled).
function PortPreview({ row, kind, kindWord }: { row: GraftRow; kind: 'card' | 'board' | 'page'; kindWord: string }) {
  const entry = getJournalEntry(row.entryId);
  const card = kind === 'card' && row.boxId ? liveBoxes(entry?.boxes).find((b) => b.id === row.boxId) : undefined;   // a deleted card (a tombstone) is not previewed (box-tombstones T11)
  const raw = kind === 'card' ? (card?.text ?? '') : kind === 'page' ? (entry?.text ?? '') : '';
  const lines = raw.split('\n');
  const name = kind === 'board' ? row.title : (lines[0] || '').trim() || row.title;
  const body = kind === 'board' ? '' : lines.slice(1).join(' ').replace(/\s+/g, ' ').trim();
  const preset = !!card?.deckStep;
  return (
    <div className="flux3-port-node" data-flux3-port-node="" data-preset={preset ? 'true' : undefined}>
      <div className="flux3-port-node-h" data-port-node-h="">{kindWord} <span className="flux3-port-node-hex">0x{nodeHex(row.boxId ?? row.entryId)}</span></div>
      <div className="flux3-port-node-name" data-port-node-name="">{name}</div>
      {body && <div className="flux3-port-node-body" data-port-node-body="">{body}</div>}
    </div>
  );
}

function Ports({ ports, hidden, entryId, x, y, backOpen }: { ports: GraftRow[]; hidden: number; entryId: string; x: number; y: number; backOpen: boolean }) {
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
    <div className="flux3-ports chrome-fade" data-flux3-ports="" data-back-open={backOpen ? 'true' : undefined} style={{ left: x, top: y }}>
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
            <PortPreview row={row} kind={kindOf(row)} kindWord={kindWord(kindOf(row))} />
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
