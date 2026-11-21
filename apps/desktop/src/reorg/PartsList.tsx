import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import type { DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { JournalEntry } from '../types';
import { useDeskLexicon } from '../store/deskLexicon';
import { flushNow, getJournalEntry, isAutoSet, removePageLink, subscribe } from '../store/persistence';
import { routeForEntry } from '../store/routeForEntry';
import { unbornHref } from '../store/unbornPage';
import { partsOfDoc, type PartRow } from './partsSeam';
import {
  ensureDoc, isPartColor, joinPart, movePart, partById, partsOfDoc as inkPartsOf, runOf, setPartColor, setPartLevel, undoJoin, undoSplit, MAX_PART_LEVEL, PART_COLORS,
  type JoinToken, type PartColor, type SplitToken,
} from './parts';
import { assetTitle, connectAssetToPart, isAssetDrag, readAssetDrag } from './assetConnect';
import { bandAt, isPartDrag, makeDrop, planDrop, DWELL_MS, PART_DRAG, type Band, type DropKind, type Refusal } from './partDrag';
import { SLOT_WORD, slotLetter } from './colourSlots';
import { assetCountOf } from './partAssets';
import { DocKindMenu, type DocMenuHost } from './DocKindMenu';

// THE FRONT MENU'S PARTS TAB (plan step 3.2; the prototype's frontMenu PARTS rows, frame P2-13A). Every Part of the Doc she is in, in her order
// (reorg/partsSeam.ts over INK's reorg/parts.ts): its number, its colour tag (its slot's letter on its colour; no colour, an empty place of the
// same size), its name (or its first words), its words, the one she is on marked, and a Part one or two levels in drawn further in. A row opens
// that Part the way every list in the app opens a page (save, then go), so the left rail's return chip brings her back. A one-Part Doc lists its
// one Part ("Part 1", Fable's ruling A, Nov 14).
//
// THE TOOLS (Fable, Nov 19 9:20 pm; what each stage offers is the stage table, accepted as drawn on Nick's walk, Nov 20): SPRINT "New part" only;
// BUILD "New part", "Split here" and each row's menu (up, down, in, out, join, colour); EDIT "Split here" and each row's menu without the levels.
// No `stage` (the top rail's drop) is the plain list. Every write is INK's (reorg/parts.ts): nothing here writes a word itself. "New part" opens a
// fresh page filed last in the Doc and stores nothing until her first word (PB1); on a page that is not yet a Doc of its own, INK's ensureDoc
// makes it one first. "Split here" is the host's (it owns the caret and her unsaved words). A split or a join can be undone from the line under
// the tools while she stays here (INK's undo refuses when either side changed since).

/** The route state a join of the open Part travels in: the id of the Part to join onto the page that receives it. */
export const REORG_JOIN_STATE = 'reorgJoinPart';

const fill = (s: string, vals: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vals ? String(vals[k]) : m));

export type PartsStage = 'sprint' | 'build' | 'edit';
/** How far from a row's left edge a press counts as the brass bar's (the bar is 3px; a finger's or a pointer's slack around it). */
const BAR_ZONE = 10;
/** What the host lends the list: its own flush (her unsaved words reach the store before a write that touches them) and, on a prose page,
 *  the split at her caret. */
export interface PartsHost {
  flush: () => void;
  splitHere?: () => { ok: true; token: SplitToken } | { ok: false; why: 'caret' | 'text' };
}

// THE TEAM B RESTYLE (slice 1, Nov 20): a Part's colour is a SLOT (Fable's ruling; INK's PART_COLORS), named by Machina's tags (Outline, Pale, Blue,
// Yellow, Mid, Solid: reorg/colourSlots.ts SLOT_WORD, the Assets tab's own names) and drawn by the same tokens; its tag reads the SLOT's letter
// ("a label first, the colour second", Nick, Nov 11), so a Part and its assets read as one thread.

// THE TEAM B RESTYLE (slice 2, Nov 20): in BUILD and EDIT the Doc's kind heads the tab (./DocKindMenu.tsx); "New Part" stays the zone's one main
// act, and Split, Move, Merge and Nest / Unnest for the Part she is on sit in "Structure", closed by default (1D; the row menus keep them too, "also
// in the Structure section"); the Part she is on wears the brass bar only on a default colour (1C; all six slots are the defaults until the picker
// arrives) and its tile's tint when it has one; each Part with assets carries its link badge (Decision 2), the count of its Assets tab's rows, which
// POLISH wires to open the Assets tab at that Part.
export function PartsList({ entry, beforeLeave, stage = null, host, docMenu }: { entry: JournalEntry; beforeLeave?: () => void; stage?: PartsStage | null; host?: PartsHost; docMenu?: DocMenuHost }) {
  const { t } = useDeskLexicon();
  const navigate = useNavigate();
  // follows the store (a rename in the top rail, a pull, a tool's write), never her keystrokes: the signature changes only with what the list draws
  useSyncExternalStore(subscribe, () => {
    const latest = getJournalEntry(entry.id) ?? entry;
    return partsOfDoc(latest).parts.map((p) => `${p.id}:${p.name}:${p.words}:${p.level}:${p.color ?? ''}:${assetCountOf(p.id)}`).join('\u0001');
  });
  const [structOpen, setStructOpen] = useState(false);
  const latest = getJournalEntry(entry.id) ?? entry;
  const { doc, parts, here } = partsOfDoc(latest);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ kind: 'split'; token: SplitToken } | { kind: 'join'; token: JoinToken } | null>(null);
  const listRef = useRef<HTMLElement>(null);

  const menus = stage === 'build' || stage === 'edit';
  const canNew = stage === 'sprint' || stage === 'build';
  const canSplit = (stage === 'build' || stage === 'edit') && !!host?.splitHere && parts[here - 1]?.kind === 'text';
  const docId = doc.set && !isAutoSet(doc.set) ? doc.set.id : null;
  const save = () => { if (host) host.flush(); else flushNow(); };
  const say = (s: string | null, u: typeof undo = null) => { setSaid(s); setUndo(u); };

  // a row's menu closes on Escape and on a press outside it
  useEffect(() => {
    if (!openMenu) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpenMenu(null); } };
    const press = (e: PointerEvent) => { const m = listRef.current?.querySelector(`[data-part-li="${CSS.escape(openMenu)}"]`); if (m && !m.contains(e.target as Node)) setOpenMenu(null); };
    document.addEventListener('keydown', key, true);
    document.addEventListener('pointerdown', press, true);
    return () => { document.removeEventListener('keydown', key, true); document.removeEventListener('pointerdown', press, true); };
  }, [openMenu]);

  const open = (id: string) => {
    if (id === latest.id) return;
    const target = getJournalEntry(id);
    if (!target) return;
    // the top rail's drop hands in the host's flush (her typing first); the Front menu's tab needs none (the press there blurs the editor)
    if (beforeLeave) beforeLeave(); else save();
    navigate(routeForEntry(target));
  };
  // AN ASSET ONTO A PART (reorg/assetConnect.ts): a row takes a drag of the Assets tab's own type and nothing else; the line below the list says
  // what happened (role status), with Undo when a connection was made. The list grows inside the drawer: the page never moves.
  const [over, setOver] = useState<string | null>(null);
  const [line, setLine] = useState<{ text: string; undo?: () => void } | null>(null);
  useEffect(() => { setLine(null); setOver(null); }, [latest.id]);
  const partWord = (p: { n: number; name: string }) => (parts.length > 1 ? (p.name || t('reorgUntitled')) : fill(t('reorgPartN'), { n: p.n }));
  const onOver = (id: string) => (e: DragEvent) => {
    if (partOver(id, e)) return;
    if (!isAssetDrag(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'link';
    if (over !== id) setOver(id);
  };
  const onDrop = (p: PartRow) => (e: DragEvent) => {
    setOver(null);
    if (partDrop(p, e)) return;
    if (!isAssetDrag(e.dataTransfer)) return;
    e.preventDefault();
    const asset = readAssetDrag(e.dataTransfer);
    if (!asset) return;
    const vals = { title: assetTitle(asset) || t('reorgUntitled'), part: partWord(p) };
    const r = connectAssetToPart(p.id, asset, latest.id);
    if (r.made === 'link') { const id = r.linkId; setLine({ text: fill(t('reorgConnectedLine'), vals), undo: () => { removePageLink(id); } }); }
    else setLine({ text: fill(t(r.made === 'already' ? 'reorgAlreadyConnected' : 'reorgConnectRefused'), vals) });
  };
  const refusal = (reason: string) => t(reason === 'carries' ? 'reorgPartJoinCarries' : reason === 'not-text' ? 'reorgPartJoinScript' : 'reorgPartJoinNo');
  // DRAG TO MOVE, MERGE AND NEST (reorg plan v2.1 §3b, ARBOR item 1; ./partDrag.ts): a row is dragged in BUILD and EDIT on a Doc of its own; the
  // row under the pointer names the act (data-drop, and its words for nest, merge and a refusal) and the release makes it through INK's acts.
  // Nesting is BUILD's (the row menu's In / Out are); a merge arms only on a dwell. The drawer holds the list: the page never moves.
  const canDrag = menus && !!docId;
  const dragRef = useRef<string | null>(null);
  // THE HANDLE (P2, Nick's word; Fable, Nov 21 12:10 am): a Part is dragged by its tile, or by the brass bar on the Part she is on; the rest of the row
  // stays for clicking and renaming. The bar is the row's ::before (no element of its own), so the press is read where it lands: on the tile, or within
  // BAR_ZONE of the row's left edge on the Part she is on. A drag begun anywhere else is cancelled before it starts.
  const armRef = useRef<string | null>(null);
  const onRowPress = (p: PartRow, on: boolean) => (e: React.PointerEvent<HTMLButtonElement>) => {
    const onTile = !!(e.target as Element).closest?.('.reorg-parts-tag');
    const onBar = on && e.clientX - e.currentTarget.getBoundingClientRect().left < BAR_ZONE;
    armRef.current = canDrag && (onTile || onBar) ? p.id : null;
  };
  // THE MERGE ASKS FIRST (Nick, Nov 21 12:07 am; claude/wrizors/machina-drag-parts-words.md): a release that would merge writes nothing; it opens a small
  // confirm under the tools, and only its Merge makes the join (re-read then, so a stale ask can only do what a fresh drop would).
  const [ask, setAsk] = useState<{ from: string; target: string; part: string; into: string } | null>(null);
  const askGo = useRef<HTMLButtonElement>(null);
  useEffect(() => { setAsk(null); }, [latest.id]);
  useEffect(() => { if (ask) askGo.current?.focus(); }, [ask]);
  const dwellRef = useRef<{ id: string; since: number; armed: boolean } | null>(null);
  const [drop, setDrop] = useState<{ id: string; kind: DropKind; why?: Refusal } | null>(null);
  const clearDrag = () => { dragRef.current = null; dwellRef.current = null; setDrop(null); };
  const readBand = (e: DragEvent): Band => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); return bandAt(e.clientY, r.top, r.height); };
  const onDragStart = (p: PartRow) => (e: DragEvent) => {
    const armed = armRef.current === p.id;
    armRef.current = null;
    if (!canDrag || !armed) { e.preventDefault(); return; }
    e.dataTransfer.setData(PART_DRAG, p.id);
    e.dataTransfer.effectAllowed = 'move';
    dragRef.current = p.id; dwellRef.current = null;
    setOpenMenu(null);
  };
  // the pointer's dwell on one row's middle: armed once it has held there DWELL_MS (a real drag sends dragover every few tens of ms while it holds)
  const dwell = (id: string, band: Band): boolean => {
    if (band !== 'middle') { dwellRef.current = null; return false; }
    const now = performance.now(), d = dwellRef.current;
    if (!d || d.id !== id) { dwellRef.current = { id, since: now, armed: false }; return false; }
    if (!d.armed && now - d.since >= DWELL_MS) d.armed = true;
    return d.armed;
  };
  const partOver = (id: string, e: DragEvent): boolean => {
    const from = dragRef.current;
    if (!from || !docId || !isPartDrag(e.dataTransfer)) return false;
    const band = readBand(e);
    const plan = planDrop(inkPartsOf(docId), from, id, band, dwell(id, band), stage === 'build');
    if (plan.kind !== 'none' && plan.kind !== 'no') { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
    else e.dataTransfer.dropEffect = 'none';
    if (plan.kind === 'none') { if (drop) setDrop(null); return true; }
    if (!drop || drop.id !== id || drop.kind !== plan.kind || drop.why !== plan.why) setDrop({ id, kind: plan.kind, why: plan.why });
    return true;
  };
  const partDrop = (p: PartRow, e: DragEvent): boolean => {
    const from = dragRef.current;
    if (!from || !docId || !isPartDrag(e.dataTransfer)) return false;
    e.preventDefault();
    const band = readBand(e);
    const held = band === 'middle' && !!dwellRef.current && dwellRef.current.id === p.id && dwellRef.current.armed;
    const moved = parts.find((x) => x.id === from);
    clearDrag();
    if (!moved) return true;
    // a refusal is said and writes nothing: not even her own flush runs for it
    const plan = planDrop(inkPartsOf(docId), from, p.id, band, held, stage === 'build');
    if (plan.kind === 'none') return true;
    if (plan.kind === 'no') { say(plan.why === 'deep' ? fill(t('reorgDragNestNo'), { part: p.name || t('reorgUntitled') }) : refusal(plan.why ?? 'unknown')); return true; }
    if (plan.kind === 'merge') { say(null); setAsk({ from, target: p.id, part: moved.name || t('reorgUntitled'), into: p.name || t('reorgUntitled') }); return true; }
    save();
    const r = makeDrop(docId, from, p.id, band, held, stage === 'build', latest.id);
    flushNow();
    const name = (x: PartRow) => x.name || t('reorgUntitled');
    if (r.done === 'moved') say(fill(t('reorgDragMoved'), { part: name(moved) }));
    else if (r.done === 'nested') say(fill(t('reorgDragNested'), { part: name(moved), target: name(p) }));
    // tsconfig is strict:false, so r.done does not narrow the union: the refusal is read by its presence
    else { const why = (r as { why?: Refusal }).why; if (why) say(why === 'deep' ? fill(t('reorgDragNestNo'), { part: name(p) }) : refusal(why)); }
    return true;
  };
  const mergeNow = () => {
    const a = ask;
    setAsk(null);
    if (!a || !docId) return;
    save();
    const r = makeDrop(docId, a.from, a.target, 'middle', true, stage === 'build', latest.id);
    flushNow();
    if (r.done === 'merged') say(fill(t('reorgDragMerged'), { part: a.part, target: a.into }), { kind: 'join', token: r.token });
    else if (r.done === 'merge-open') { const target = getJournalEntry(a.target); if (target) navigate(routeForEntry(target), { state: { [REORG_JOIN_STATE]: a.from } }); }
    else { const why = (r as { why?: Refusal }).why; say(why === 'deep' ? fill(t('reorgDragNestNo'), { part: a.into }) : refusal(why ?? 'unknown')); }
  };
  const dropWords = (p: PartRow): string | null => {
    if (!drop || drop.id !== p.id) return null;
    const part = p.name || t('reorgUntitled');
    if (drop.kind === 'nest') return fill(t('reorgDragNest'), { part });
    if (drop.kind === 'merge') return fill(t('reorgDragMerge'), { part });
    if (drop.kind === 'no') return drop.why === 'deep' ? fill(t('reorgDragNestNo'), { part }) : refusal(drop.why ?? 'unknown');
    return null;
  };
  const fresh = () => {
    save();
    let into = docId;
    if (!into) {
      const r = ensureDoc(latest.id);
      if (!r.ok) { say(t('reorgPartsNewNo')); return; }
      into = r.docId;
      flushNow();
    }
    navigate(unbornHref({ binderId: into }));
  };
  const split = () => {
    if (!host?.splitHere) return;
    const r = host.splitHere();
    // tsconfig is strict:false, so `!r.ok` does not narrow the union: each refusal's field is read by its presence
    if (!r.ok) { say(t(('why' in r ? r.why : 'text') === 'caret' ? 'reorgPartsSplitCaret' : 'reorgPartsSplitNo')); return; }
    say(fill(t('reorgPartsSplitDone'), { n: here + 1 }), { kind: 'split', token: r.token });
  };
  const run = (i: number): [number, number] => runOf(parts.map((p) => p.level), i);
  const move = (p: PartRow, by: -1 | 1) => {
    if (!docId) return;
    const [s] = run(p.n - 1);
    save();
    movePart(docId, p.id, s + by);
    flushNow();
    setOpenMenu(null);
  };
  const level = (p: PartRow, by: -1 | 1) => {
    if (!docId) return;
    save();
    setPartLevel(docId, p.id, p.level + by);
    flushNow();
    setOpenMenu(null);
  };
  const join = (p: PartRow) => {
    save();
    setOpenMenu(null);
    // the Part she is on: deleting the open page while it is mounted lets the page's own not-found guard send her to the Desk. INK's refusals
    // are read first; then she goes to the Part above CARRYING the join (route state), and that page runs it once it has mounted, when this one
    // is gone (pages/PageEditor.tsx, REORG_JOIN_STATE): it adopts the joined words through #76
    if (p.id === latest.id) {
      const me = partById(p.id), above = parts[p.n - 2] ? getJournalEntry(parts[p.n - 2].id) : null;
      if (!me || !above || p.n < 2) { say(refusal('unknown')); return; }
      if (me.carries) { say(refusal('carries')); return; }
      if (me.kind === 'script' || above.pageType === 'script') { say(refusal('not-text')); return; }
      navigate(routeForEntry(above), { state: { [REORG_JOIN_STATE]: p.id } });
      return;
    }
    const r = joinPart(p.id);
    if (!r.ok) { say(refusal('reason' in r ? r.reason : 'unknown')); return; }
    flushNow();
    say(fill(t('reorgPartsJoinDone'), { n: p.n - 1 }), { kind: 'join', token: r.token });
  };
  const colour = (p: PartRow, c: PartColor | null) => { setPartColor(p.id, c); flushNow(); setOpenMenu(null); };
  const back = () => {
    if (!undo) return;
    save();
    const done = undo.kind === 'split' ? undoSplit(undo.token) : undoJoin(undo.token);
    flushNow();
    say(t(done ? 'reorgPartsUndone' : 'reorgPartsUndoNo'));
  };

  const tools = canNew;
  // Structure: the acts for the Part she is on, the row menu's own (move, level, join) and the host's split
  const hp = parts[here - 1];
  const [hs, he] = hp ? run(here - 1) : [0, 0];
  const hcap = here <= 1 ? 0 : Math.min(MAX_PART_LEVEL, parts[here - 2].level + 1);
  return (
    <section ref={listRef} className="reorg-parts" data-reorg-parts aria-label={fill(t('reorgPartsOf'), { name: doc.name || t('reorgUntitled') })}>
      {menus && <DocKindMenu entry={latest} docId={docId} host={docMenu} beforeWrite={save} />}
      <div className="reorg-parts-head">{fill(t('reorgPartsHead'), { n: parts.length })}</div>
      {tools && (
        <div className="reorg-parts-tools" data-parts-tools>
          {canNew && (
            <button type="button" className="reorg-parts-tool" data-parts-new onClick={fresh}>
              <span aria-hidden="true">+</span> {t('reorgPartsNew')}
            </button>
          )}
        </div>
      )}
      {menus && hp && (
        <div className="reorg-parts-structure" data-parts-structure="">
          <button type="button" className="reorg-parts-structure-btn" data-parts-structure-toggle="" aria-expanded={structOpen ? 'true' : 'false'}
            onClick={() => setStructOpen((o) => !o)}>
            <span>{t('reorgPartsStructure')}</span><span className="reorg-parts-structure-fold" aria-hidden="true">{structOpen ? '▾' : '▸'}</span>
          </button>
          <div className="reorg-parts-structure-body" hidden={!structOpen}>
            {canSplit && (
              // a press keeps her caret where it is: the button never takes the focus from the page on the way down
              <button type="button" className="reorg-parts-tool" data-parts-split data-structure-act="split" onMouseDown={(e) => e.preventDefault()} onClick={split}>{t('reorgPartsSplit')}</button>
            )}
            <button type="button" className="reorg-parts-tool" data-structure-act="up" disabled={!docId || hs === 0} onClick={() => move(hp, -1)}>{t('reorgPartUp')}</button>
            <button type="button" className="reorg-parts-tool" data-structure-act="down" disabled={!docId || he >= parts.length} onClick={() => move(hp, 1)}>{t('reorgPartDown')}</button>
            {stage === 'build' && <button type="button" className="reorg-parts-tool" data-structure-act="in" disabled={!docId || hp.level >= hcap} onClick={() => level(hp, 1)}>{t('reorgPartIn')}</button>}
            {stage === 'build' && <button type="button" className="reorg-parts-tool" data-structure-act="out" disabled={!docId || hp.level === 0} onClick={() => level(hp, -1)}>{t('reorgPartOut')}</button>}
            <button type="button" className="reorg-parts-tool" data-structure-act="join" disabled={here <= 1} onClick={() => join(hp)}>{t('reorgPartJoin')}</button>
          </div>
        </div>
      )}
      {ask && (
        <div className="reorg-parts-ask" data-parts-ask="" role="alertdialog" aria-labelledby="reorg-parts-ask-q"
          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setAsk(null); } }}>
          <span id="reorg-parts-ask-q">{fill(t('reorgDragMergeAsk'), { part: ask.part, target: ask.into })}</span>
          <button type="button" ref={askGo} className="reorg-parts-tool" data-ask-merge="" onClick={mergeNow}>{t('reorgDragMergeGo')}</button>
          <button type="button" className="reorg-parts-tool" data-ask-cancel="" onClick={() => setAsk(null)}>{t('reorgDragMergeCancel')}</button>
        </div>
      )}
      {said && (
        <div className="reorg-parts-said" data-parts-said role="status">
          <span>{said}</span>
          {undo && <button type="button" className="reorg-parts-undo" data-parts-undo onClick={back}>{t('reorgPartsUndo')}</button>}
        </div>
      )}
      <ol className="reorg-parts-list" data-parts-drag={canDrag ? '' : undefined}>
        {parts.map((p, i) => {
          const on = p.n === here;
          const label = p.name || t('reorgUntitled');
          const shown = parts.length > 1 ? label : fill(t('reorgPartN'), { n: p.n });
          const [s, e] = run(i);
          const cap = i === 0 ? 0 : Math.min(MAX_PART_LEVEL, parts[i - 1].level + 1);
          const menuOpen = openMenu === p.id;
          const assets = assetCountOf(p.id);
          return (
            <li key={p.id} data-part-li={p.id} data-part-level={p.level} data-drop={drop && drop.id === p.id ? drop.kind : undefined} style={{ ['--part-level' as string]: p.level } as CSSProperties}>
              <button type="button" className={`reorg-parts-row${on ? ' is-here' : ''}${over === p.id ? ' is-drop' : ''}`} data-part-row={p.id} aria-current={on ? 'true' : undefined}
                data-here-bar={on && (!p.color || isPartColor(p.color)) ? 'brass' : undefined} data-tint={on && p.color ? p.color : undefined}
                onClick={() => open(p.id)} onDragOver={onOver(p.id)} onDrop={onDrop(p)}
                onDragLeave={(e) => { if (e.currentTarget.contains(e.relatedTarget as Node)) return; if (over === p.id) setOver(null); if (drop && drop.id === p.id) setDrop(null); }}
                draggable={canDrag ? true : undefined} onPointerDown={onRowPress(p, on)} onDragStart={onDragStart(p)} onDragEnd={clearDrag}>
                <span className="reorg-parts-num">{p.n}</span>
                <span className="reorg-parts-tag" data-part-tag data-colour={p.color ?? undefined} aria-hidden="true">{p.color ? slotLetter(p.color) : ''}</span>
                <span className="reorg-parts-name">{shown}</span>
                <span className="reorg-parts-words">{fill(t(p.words === 1 ? 'reorgWordsOne' : 'reorgWordsMany'), { n: p.words })}</span>
              </button>
              {dropWords(p) && <span className="reorg-parts-droplabel" data-drop-label="" aria-hidden="true">{dropWords(p)}</span>}
              {assets > 0 && (
                // the link badge (Decision 2): its count only; POLISH wires its press to open the Assets tab at this Part
                <span className="reorg-parts-assets" data-part-assets={p.id} aria-label={fill(t(assets === 1 ? 'reorgPartAssetsOne' : 'reorgPartAssetsMany'), { n: assets })}
                  title={fill(t(assets === 1 ? 'reorgPartAssetsOne' : 'reorgPartAssetsMany'), { n: assets })}>
                  <span aria-hidden="true">⛓</span> {assets}
                </span>
              )}
              {menus && (
                <button type="button" className={`reorg-parts-more${menuOpen ? ' is-open' : ''}`} data-part-more={p.id} aria-expanded={menuOpen}
                  aria-label={fill(t('reorgPartMore'), { part: shown })} title={fill(t('reorgPartMore'), { part: shown })}
                  onClick={() => setOpenMenu(menuOpen ? null : p.id)}>
                  <span aria-hidden="true">⋯</span>
                </button>
              )}
              {menus && menuOpen && (
                <div className="reorg-part-menu" data-part-menu={p.id} role="group" aria-label={fill(t('reorgPartMenu'), { part: shown })}>
                  <div className="reorg-part-acts">
                    <button type="button" data-part-act="up" disabled={!docId || s === 0} onClick={() => move(p, -1)}>{t('reorgPartUp')}</button>
                    <button type="button" data-part-act="down" disabled={!docId || e >= parts.length} onClick={() => move(p, 1)}>{t('reorgPartDown')}</button>
                    {stage === 'build' && <button type="button" data-part-act="in" disabled={!docId || p.level >= cap} onClick={() => level(p, 1)}>{t('reorgPartIn')}</button>}
                    {stage === 'build' && <button type="button" data-part-act="out" disabled={!docId || p.level === 0} onClick={() => level(p, -1)}>{t('reorgPartOut')}</button>}
                    <button type="button" data-part-act="join" disabled={i === 0} onClick={() => join(p)}>{t('reorgPartJoin')}</button>
                  </div>
                  <div className="reorg-part-colours" role="group" aria-label={t('reorgPartColour')}>
                    <button type="button" className="reorg-part-swatch" data-part-colour="none" aria-pressed={!p.color} aria-label={t('reorgPartColourNone')} title={t('reorgPartColourNone')}
                      onClick={() => colour(p, null)} />
                    {PART_COLORS.map((c) => (
                      <button key={c} type="button" className="reorg-part-swatch" data-part-colour={c} data-colour={c} aria-pressed={p.color === c} aria-label={t(SLOT_WORD[c])} title={t(SLOT_WORD[c])}
                        onClick={() => colour(p, c)} />
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="reorg-parts-live" role="status">
        {line && (
          <div className="reorg-parts-line" data-reorg-connect-line="">
            <span data-line-text="">{line.text}</span>
            {line.undo && <button type="button" data-line-undo="" onClick={() => { line.undo?.(); setLine(null); }}>{t('graftUndo')}</button>}
          </div>
        )}
      </div>
    </section>
  );
}
