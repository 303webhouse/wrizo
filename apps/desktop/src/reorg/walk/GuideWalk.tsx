import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Box } from '../../types';
import { useDeskLexicon, type DeskTermId } from '../../store/deskLexicon';
import { useTheme } from '../../store/theme';
import { flushNow, generateId, getJournalEntry, restoreDeletedBox, saveBoardBoxes, stashDeletedBoxes, subscribe } from '../../store/persistence';
import { liveBoxes } from '../../store/boxTombstones';
import { keyMaySteps } from '../../store/walk';
import { markedHtml, rangeHas, type MarkKey, MARK_KEYS } from '../../store/textMarks';
import { setDocSetting, walkPlaceOf } from '../docSettings';
import { movePlanRow, renamePlanRow } from '../backMenu/planOps';
import { addScenesUnder, addStepAfter, addStepAtEnd, setStepNote, setStepSkipped, toggleStepMark } from './stepOps';
import { isScene, placeIn, walkSummary, type WalkStep } from './stepModel';
import { structureOfPlan } from './structureOfPlan';
import { STRUCTURE_NOTES } from '../presetNotes';
import { PresetNoteButton } from '../PresetNote';
import { ScenesPopover } from '../../components/ScenesPopover';
import { docNameOf, planOfPage, stepsOfPage, type PlanOfPage } from './walkData';
import { walkPageRect } from './pageRect';

// THE GUIDE AS A WALK (PRESETS-B, Nov 25; Fable 7:10 pm; the Wrizors' guide-walk frames): one step of her Plan at a time, in a card OVER the page. PAGE IS PRIMARY: the page is never moved or unmounted; the card is
// placed from the page's own rectangle (40 px wider than the page). THE PLAN IS THE PROGRESS: every step, note, mark and skip is a card of the page's own Plan board, written through the board's own save, the
// moment it is made (no word waits on a timer). Her place is the one other saved thing (docSettings walk.stepId), cleared at the end card.
// Her keys stay in the walk. Left/Right step only where the old Walk's rule lets them (outside the note, or on an empty one); PageUp/PageDown always; Escape leaves, and the chip brings her back.

let planMemo: (PlanOfPage & { pageId: string }) | null = null;
// the same object until the board or the hidden list has changed (a keystroke elsewhere re-renders nothing)
function planSnapshot(pageId: string): PlanOfPage {
  const next = planOfPage(pageId);
  if (planMemo && planMemo.pageId === pageId && planMemo.board === next.board && planMemo.hiddenKey === next.hiddenKey) return planMemo;
  planMemo = { ...next, pageId };
  return planMemo;
}

/** The note as the field holds it: its text nodes and line breaks (a last <br> is the field's own placeholder). */
function fieldText(el: HTMLElement): string {
  let out = '';
  const walk = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) out += n.textContent ?? '';
    else if (n.nodeName === 'BR') out += '\n';
    else n.childNodes.forEach(walk);
  };
  el.childNodes.forEach(walk);
  return el.lastChild?.nodeName === 'BR' ? out.slice(0, -1) : out;
}
/** Where the selection stands, as offsets into the note; null when it is not in the field. */
function fieldSelection(el: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  if (!el.contains(r.startContainer) || !el.contains(r.endContainer)) return null;
  const at = (node: Node, offset: number) => {
    const pre = document.createRange();
    pre.selectNodeContents(el);
    pre.setEnd(node, offset);
    return pre.toString().length;
  };
  return { start: at(r.startContainer, r.startOffset), end: at(r.endContainer, r.endOffset) };
}
function selectIn(el: HTMLElement, start: number, end: number): void {
  const point = (want: number): [Node, number] => {
    const it = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let seen = 0;
    for (let n = it.nextNode(); n; n = it.nextNode()) {
      const len = n.textContent?.length ?? 0;
      if (seen + len >= want) return [n, want - seen];
      seen += len;
    }
    return [el, el.childNodes.length];
  };
  const r = document.createRange();
  r.setStart(...point(start));
  r.setEnd(...point(end));
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(r);
}

interface Rect { left: number; top: number; width: number; height: number }
const SIDE = 222;
/** the greyed tabs' strip, at the card's right */
const TABS = 32;
/** The card over the page: 40 px wider than it, the same top; the steps list stands to its left. Nothing of the page changes. */
function useWalkPlace(): { card: Rect; side: Rect } {
  const place = () => {
    const page = walkPageRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const width = Math.min((page?.width ?? 620) + 40, vw - SIDE - TABS - 24);
    let left = page ? page.left - 20 : (vw - width) / 2;
    left = Math.max(SIDE + 8, Math.min(left, vw - width - TABS - 8));
    const top = Math.max(64, Math.min(page?.top ?? 96, 140));
    const height = Math.max(360, Math.min(page?.height ?? vh, vh - top - 16));
    return { card: { left, top, width, height }, side: { left: left - SIDE, top, width: SIDE, height } };
  };
  const [at, setAt] = useState(place);
  useLayoutEffect(() => {
    const again = () => setAt((was) => { const next = place(); return JSON.stringify(next) === JSON.stringify(was) ? was : next; });
    again();
    window.addEventListener('resize', again);
    const id = window.setInterval(again, 250);   // the page settles after it mounts, and its scale follows the window
    return () => { window.removeEventListener('resize', again); window.clearInterval(id); };
  }, []);
  return at;
}

const MARK_WORD: Record<MarkKey, DeskTermId> = { b: 'guideWalkBold', i: 'guideWalkItalic', u: 'guideWalkUnderline', s: 'guideWalkStrike' };
const GLYPH: Record<MarkKey, string> = { b: 'B', i: 'I', u: 'U', s: 'S' };

export interface GuideWalkProps {
  pageId: string;
  /** leave the walk (the chip brings her back) */
  onLeave: () => void;
  /** close for good: the end card's Close */
  onDone: () => void;
  /** "Write this section": open this row's Part */
  onWrite: (step: { id: string; title: string }, boardId: string) => void;
}

export function GuideWalk({ pageId, onLeave, onDone, onWrite }: GuideWalkProps) {
  const { t } = useDeskLexicon();
  const theme = useTheme();
  const plan = useSyncExternalStore(subscribe, () => planSnapshot(pageId), () => planSnapshot(pageId));
  const steps = stepsOfPage(pageId, plan);
  const [current, setCurrent] = useState<string | null>(() => placeIn(stepsOfPage(pageId), walkPlaceOf(pageId)));
  const [ended, setEnded] = useState(false);
  const [tab, setTab] = useState<'steps' | 'format'>('steps');
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [dropped, setDropped] = useState<{ boardId: string; boxId: string; ids: string[]; title: string } | null>(null);
  const [scenesFor, setScenesFor] = useState<string | null>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const shownRef = useRef<string>('');
  const at = useWalkPlace();

  const step: WalkStep | undefined = steps.find((s) => s.id === current) ?? steps.find((s) => s.id === placeIn(steps, null));
  const index = step ? steps.indexOf(step) : -1;
  const summary = walkSummary(steps);

  // the one write door: the board's LIVE cards through its own save (tombstones carried, syncs like any board edit)
  const write = (fn: (b: Box[]) => Box[] | null): void => {
    if (!plan.boardId) return;
    const cur = liveBoxes(getJournalEntry(plan.boardId)?.boxes);
    const next = fn(cur);
    if (next && next !== cur) saveBoardBoxes(plan.boardId, next);
  };

  // her place: saved as she goes, taken off at the end card
  useEffect(() => {
    if (ended) setDocSetting(pageId, { walk: null });
    else if (step) setDocSetting(pageId, { walk: { stepId: step.id } });
  }, [pageId, step?.id, ended]);
  // a step that gained words in its Part is no longer "skipped"
  useEffect(() => { if (step && step.state === 'noted') write((b) => setStepSkipped(b, step.id, false)); }, [step?.id]);

  // the field is filled from the card when she comes to a step, or when the card changed under it (a sync); never while she types, so her caret never jumps
  const redraw = (force = false) => {
    const el = fieldRef.current;
    if (!el || !step) return;
    if (force || shownRef.current !== step.id || fieldText(el) !== step.note) {
      el.innerHTML = markedHtml(step.note, step.marks);
      shownRef.current = step.id;
    }
  };
  useLayoutEffect(() => { redraw(); });
  // where the walk's focus goes: her note, the caret after her last word; at the end card, its first button
  const enter = () => {
    const el = fieldRef.current;
    if (el && el.isConnected) { el.focus(); selectIn(el, fieldText(el).length, fieldText(el).length); }
    else rootRef.current?.querySelector<HTMLElement>('[data-walk-primary], [data-walk-done]')?.focus();
  };
  useEffect(() => {
    setMenu(false); setRenaming(false); setScenesFor(null);
    enter();
  }, [step?.id, ended]);
  // HER KEYS ARE THE WALK'S while it is open. Everything behind the card is made INERT (the app's root; the walk itself is drawn outside it): nothing there can take the focus or a key, not even an editor that takes its
  // focus back when it loses it (Free Write's does), so no word meant for a step lands on the page. Inert changes no rectangle. Leaving lifts it and gives the focus back to what had it.
  useLayoutEffect(() => {
    const had = document.activeElement as HTMLElement | null;
    const sel = window.getSelection();
    const caret = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const app = document.getElementById('root');
    app?.setAttribute('inert', '');
    const timers = [window.setTimeout(enter, 0), window.setTimeout(() => { if (rootRef.current && !rootRef.current.contains(document.activeElement)) enter(); }, 300)];
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      app?.removeAttribute('inert');
      // her caret comes back where it was. When nothing had it (Start guided: the walk arrived with the page), the page's own editor takes it, the caret after her words, so what she types next lands.
      window.setTimeout(() => {
        const back = had?.isConnected && had !== document.body ? had : document.querySelector<HTMLElement>('.mode-pagecol [contenteditable="true"], .mode-pagecol textarea');
        if (!back) return;
        back.focus();
        if (!back.isContentEditable) return;
        const range = caret && back.contains(caret.startContainer) ? caret : document.createRange();
        if (range !== caret) { range.selectNodeContents(back); range.collapse(false); }
        const s = window.getSelection();
        s?.removeAllRanges();
        s?.addRange(range);
      }, 0);
    };
  }, []);

  // the FORMAT tab's buttons read pressed from the selection, so it is drawn again as the selection moves
  const [, setSelectionTick] = useState(0);
  useEffect(() => {
    if (tab !== 'format') return undefined;
    const moved = () => setSelectionTick((n) => n + 1);
    document.addEventListener('selectionchange', moved);
    return () => document.removeEventListener('selectionchange', moved);
  }, [tab]);

  const onInput = () => {
    const el = fieldRef.current;
    if (el && step) write((b) => setStepNote(b, step.id, fieldText(el)));
  };
  const mark = (key: MarkKey) => {
    const el = fieldRef.current;
    if (!el || !step) return;
    const sel = fieldSelection(el);
    if (!sel || sel.end <= sel.start) return;
    write((b) => toggleStepMark(setStepNote(b, step.id, fieldText(el)), step.id, sel.start, sel.end, key));
    // drawn again from the card, the selection kept
    window.requestAnimationFrame(() => {
      const fresh = stepsOfPage(pageId).find((s) => s.id === step.id);
      if (!fresh || !fieldRef.current) return;
      fieldRef.current.innerHTML = markedHtml(fresh.note, fresh.marks);
      selectIn(fieldRef.current, sel.start, sel.end);
    });
  };

  const goTo = (id: string) => { setEnded(false); setCurrent(id); };
  const back = () => {
    if (ended) { if (steps.length) goTo(steps[steps.length - 1].id); return; }
    if (index > 0) goTo(steps[index - 1].id);
  };
  const forward = () => {
    if (ended || !step) return;
    // Skip marks an empty step; a noted step is simply passed
    if (step.state !== 'noted') write((b) => setStepSkipped(b, step.id, true));
    if (index < steps.length - 1) goTo(steps[index + 1].id); else setEnded(true);
  };

  const newStep = (add: (b: Box[], id: string) => Box[]) => {
    const id = generateId();
    write((b) => add(b, id));
    goTo(id);
    window.setTimeout(() => setRenaming(true), 0);
  };
  const scenesOf = (stepId: string): string[] => liveBoxes(plan.board?.boxes).filter((b) => b.parentId === stepId && isScene(b)).map((b) => b.id);
  // DROP (Fable, Nov 25, 8:30 pm: a noted step too): to the Trash as a board's own delete sends a card there, its scenes with it, one Undo for all of it
  const drop = () => {
    if (!step || !plan.boardId) return;
    const going = new Set([step.id, ...scenesOf(step.id)]);
    // the next step that stays, or the one before when it was the last
    const next = (steps.slice(index + 1).find((s) => !going.has(s.id)) ?? steps.slice(0, index).reverse().find((s) => !going.has(s.id)))?.id ?? null;
    flushNow();
    const ids = stashDeletedBoxes(plan.boardId, [step.id, ...scenesOf(step.id)]);
    if (!ids.length) return;
    setDropped({ boardId: plan.boardId, boxId: step.id, ids, title: step.title });
    setMenu(false);
    if (next) setCurrent(next); else setEnded(true);
  };
  const undoDrop = () => {
    if (!dropped) return;
    dropped.ids.forEach((id) => restoreDeletedBox(dropped.boardId, id));
    goTo(dropped.boxId);
    setDropped(null);
  };

  const onKey = (e: ReactKeyboardEvent) => {
    e.stopPropagation();   // nothing leaves the walk: no pop-out shuts, and the page behind hears no key
    const field = fieldRef.current;
    const inField = !!field && field.contains(e.target as Node);
    if (e.key === 'Escape') {
      e.preventDefault();
      if (scenesFor) setScenesFor(null); else if (menu) setMenu(false); else if (renaming) setRenaming(false); else onLeave();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (MARK_KEYS as readonly string[]).includes(e.key.toLowerCase())) { e.preventDefault(); if (inField) mark(e.key.toLowerCase() as MarkKey); return; }
    if (e.key === 'Tab') {
      const items = [...(rootRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"]), input, [contenteditable]') ?? [])];
      const here = items.indexOf(document.activeElement as HTMLElement);
      const to = e.shiftKey ? (here <= 0 ? items.length - 1 : -1) : (here < 0 || here === items.length - 1 ? 0 : -1);
      if (to >= 0) { e.preventDefault(); items[to]?.focus(); }
      return;
    }
    if (renaming || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const dir = e.key === 'ArrowRight' || e.key === 'PageDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'PageUp' ? -1 : 0;
    if (!dir || !keyMaySteps(e.key, { inEditor: inField, empty: !field || !fieldText(field) })) return;
    e.preventDefault();
    if (dir < 0) back(); else if (index < steps.length - 1 && !ended) goTo(steps[index + 1].id);
  };

  // the steps under their headings, in the Plan's order
  const groups: { act: string; steps: WalkStep[] }[] = [];
  for (const s of steps) {
    const last = groups[groups.length - 1];
    if (last && last.act === s.act) last.steps.push(s); else groups.push({ act: s.act, steps: [s] });
  }
  // Flux counts in two figures ("STEP 05/09"); the others as they are
  const num = (n: number) => (theme === 'flux' ? String(n).padStart(2, '0') : String(n));
  const planCards = liveBoxes(plan.board?.boxes);
  const structure = structureOfPlan(planCards, t);
  const note = structure ? STRUCTURE_NOTES[structure.id] : undefined;
  const stepCard = step ? planCards.find((b) => b.id === step.id) : undefined;
  const fill = (key: DeskTermId, values: Record<string, string | number>) => Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), t(key));
  const stateWord = (s: WalkStep) => t(s.state === 'noted' ? 'guideWalkStateNoted' : s.state === 'skipped' ? 'guideWalkStateSkipped' : 'guideWalkStateEmpty');
  const names = (list: WalkStep[]) => list.map((s) => s.title || t('reorgUntitled')).join(', ');
  const box = (r: Rect): CSSProperties => ({ left: r.left, top: r.top, width: r.width, height: r.height });
  const firstEmpty = steps.find((s) => s.id === summary.next);
  const canDrop = !!step;
  const has = (k: MarkKey) => { const el = fieldRef.current; const sel = el ? fieldSelection(el) : null; return !!step && !!sel && rangeHas(step.marks, sel.start, sel.end, k); };

  return createPortal(
    <div className="wz-walk" ref={rootRef} role="dialog" aria-modal="true" aria-label={t('guideWalkDialog')} tabIndex={-1} data-walk="" data-walk-theme={theme} onKeyDown={onKey}>
      <aside className="wz-walk-side" style={box(at.side)} data-walk-side="">
        <div className="wz-walk-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'format'} data-walk-tab="format" onClick={() => setTab('format')}>{t('guideWalkFormat')}</button>
          <button type="button" role="tab" aria-selected={tab === 'steps'} data-walk-tab="steps" onClick={() => setTab('steps')}>{t('reorgFrontParts')}</button>
        </div>
        {tab === 'format' ? (
          <div className="wz-walk-format" data-walk-format="">
            <div className="wz-walk-small">{t('guideWalkFormatHead')}</div>
            <div className="wz-walk-marks-row">
              {MARK_KEYS.map((k) => (
                <button key={k} type="button" data-walk-mark={k} aria-label={t(MARK_WORD[k])} title={t(MARK_WORD[k])} aria-pressed={has(k)} disabled={!step || ended}
                  onMouseDown={(e) => e.preventDefault()} onClick={() => mark(k)}>{GLYPH[k]}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="wz-walk-list" data-walk-list="">
            <div className="wz-walk-small">{fill('guideWalkNotedOf', { n: num(summary.noted), total: num(summary.total) })}</div>
            {summary.skipped.length > 0 && <div className="wz-walk-small">{fill('guideWalkSkippedCount', { n: summary.skipped.length })}</div>}
            {groups.map((g, gi) => (
              <div key={gi} role="group" aria-label={g.act || undefined}>
                {g.act && <div className="wz-walk-actname">{g.act}</div>}
                {g.steps.map((s) => (
                  <button key={s.id} type="button" className="wz-walk-row" data-walk-row={s.id} data-scene={s.under !== undefined ? '' : undefined} data-state={s.state} aria-current={!ended && s.id === step?.id ? 'step' : undefined} onClick={() => goTo(s.id)}>
                    <span className="wz-walk-num">{s.number}</span><span className="wz-walk-rowname">{s.title || t('reorgUntitled')}</span>
                  </button>
                ))}
              </div>
            ))}
            <button type="button" className="wz-walk-addend" data-walk-add-end="" onClick={() => newStep((b, id) => addStepAtEnd(b, t('guideWalkNewStep'), () => id, steps[steps.length - 1]?.id ?? null))}>{t('guideWalkAddEnd')}</button>
          </div>
        )}
      </aside>
      <section className="wz-walk-card" style={box(at.card)} data-walk-card="">
        <header className="wz-walk-head">
          <span>{[t('guideWalkHead'), docNameOf(pageId)].filter(Boolean).join(' · ')}</span>
          <button type="button" className="wz-walk-x" data-walk-leave="" aria-label={t('guideClose')} onClick={onLeave}>×</button>
        </header>
        <div className="wz-walk-trail" role="list" aria-label={t('guideWalkTrail')}>
          {groups.map((g, gi) => (
            <div key={gi} className="wz-walk-trailgroup" style={{ flexGrow: g.steps.length }}>
              <div className="wz-walk-pips">
                {g.steps.map((s) => (
                  <button key={s.id} type="button" role="listitem" className="wz-walk-pip" data-walk-pip={s.id} data-state={s.state} aria-current={!ended && s.id === step?.id ? 'step' : undefined}
                    aria-label={`${s.number}. ${s.title || t('reorgUntitled')}: ${stateWord(s)}`} title={s.title} onClick={() => goTo(s.id)} />
                ))}
              </div>
              {/* under the marks, the heading's short name ("Act Three"); the list shows it whole */}
              {g.act && <div className="wz-walk-pipact" title={g.act}>{g.act.split(':')[0]}</div>}
            </div>
          ))}
        </div>
        {!step ? (
          <div className="wz-walk-body"><p className="wz-walk-hint">{t('reorgPlanEmpty')}</p></div>
        ) : ended ? (
          <div className="wz-walk-body" data-walk-end="">
            <div className="wz-walk-actname">{t('guideWalkEndHead')}</div>
            <h2 className="wz-walk-title">{fill('guideWalkEndNoted', { n: num(summary.noted), total: num(summary.total) })}</h2>
            {summary.skipped.length > 0 && <p className="wz-walk-hint" data-walk-end-skipped="">{fill('guideWalkEndSkipped', { list: names(summary.skipped) })}</p>}
            {summary.empty.length > 0 && <p className="wz-walk-hint" data-walk-end-empty="">{fill('guideWalkEndEmpty', { list: names(summary.empty) })}</p>}
            <div className="wz-walk-endacts">
              {firstEmpty && <button type="button" className="wz-walk-primary" data-walk-primary="" data-walk-goto={firstEmpty.id} onClick={() => goTo(firstEmpty.id)}>{fill('guideWalkGoTo', { step: firstEmpty.title || t('reorgUntitled') })}</button>}
              <button type="button" className="wz-walk-quiet" data-walk-write-first="" onClick={() => plan.boardId && onWrite(steps[0], plan.boardId)}>{t('guideWalkWriteFirst')}</button>
            </div>
            <p className="wz-walk-small">{t('guideWalkStays')}</p>
          </div>
        ) : (
          <div className="wz-walk-body" data-walk-step={step.id}>
            <div className="wz-walk-actname">{[step.act, step.under].filter(Boolean).join(' · ')}</div>
            <div className="wz-walk-titlerow">
              {renaming ? (
                <input className="wz-walk-rename" data-walk-rename="" autoFocus defaultValue={step.title} aria-label={t('reorgPlanRename')}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
                  onBlur={(e) => { const v = e.target.value.trim(); if (v) write((b) => renamePlanRow(b, step.id, v)); setRenaming(false); }} />
              ) : (
                <div className="wz-walk-titlewrap">
                  <h2 className="wz-walk-title" data-walk-title="">{step.title || t('reorgUntitled')}</h2>
                  {/* the structure's own "?" note, opened in place and never a hover tip */}
                  {structure && note && <PresetNoteButton key={step.id} id={structure.id} name={t(structure.name)} note={note} />}
                </div>
              )}
              <button type="button" ref={moreRef} className="wz-walk-more" data-walk-more="" aria-haspopup="true" aria-expanded={menu} aria-label={t('guideWalkMore')} onClick={() => setMenu((m) => !m)}>⋯</button>
              {menu && (
                <div className="wz-walk-menu" data-walk-menu="" role="group" aria-label={t('guideWalkMore')}>
                  <button type="button" autoFocus data-walk-act="rename" onClick={() => { setMenu(false); setRenaming(true); }}>{t('guideWalkRename')}</button>
                  <button type="button" data-walk-act="add" onClick={() => { setMenu(false); newStep((b, id) => addStepAfter(b, step.id, t('guideWalkNewStep'), () => id)); }}>{t('guideWalkAddAfter')}</button>
                  {stepCard && !isScene(stepCard) && <button type="button" data-walk-act="scenes" onClick={() => { setMenu(false); setScenesFor(step.id); }}>{t('kidDoor_scene')}</button>}
                  <button type="button" data-walk-act="up" onClick={() => { setMenu(false); write((b) => movePlanRow(b, step.id, -1)); }}>{t('reorgPlanUp')}</button>
                  <button type="button" data-walk-act="down" onClick={() => { setMenu(false); write((b) => movePlanRow(b, step.id, 1)); }}>{t('reorgPlanDown')}</button>
                  {step.state === 'skipped' && <button type="button" data-walk-act="unskip" onClick={() => { setMenu(false); write((b) => setStepSkipped(b, step.id, false)); }}>{t('guideWalkNotSkipped')}</button>}
                  {canDrop && <button type="button" data-walk-act="drop" className="wz-walk-drop" onClick={drop}>{t('guideWalkDrop')}<span>{t('guideWalkDropNote')}</span></button>}
                </div>
              )}
            </div>
            {scenesFor === step.id && (
              <ScenesPopover kicker={t('kidKicker').replace('{plural}', t('kidPlural_scene'))} question={t('kidHowMany').replace('{plural}', t('kidPlural_scene'))} note={t('kidNote').replace('{step}', step.title)}
                addLabel={t('kidAdd')} anchor={moreRef.current} onClose={() => setScenesFor(null)}
                onAdd={(n) => {
                  setScenesFor(null);
                  const ids: string[] = [];
                  write((b) => addScenesUnder(b, step.id, n, { title: t('kidTitle_scene'), question: t('kidQ_scene'), newId: () => { const id = generateId(); ids.push(id); return id; } }));
                  if (ids.length) goTo(ids[0]);
                }} />
            )}
            {step.hint && <p className="wz-walk-hint" id="wz-walk-hint">{step.hint}</p>}
            {/* plain text only: her formatting is the card's marks (store/textMarks.ts), never markup in the text */}
            <div key={step.id} ref={(el) => { fieldRef.current = el; if (el && shownRef.current !== step.id) redraw(true); }} className="wz-walk-field" data-walk-field="" contentEditable={'plaintext-only' as unknown as boolean} suppressContentEditableWarning
              role="textbox" aria-multiline="true" aria-label={fill('guideWalkNoteLabel', { step: step.title })} aria-describedby={step.hint ? 'wz-walk-hint' : undefined}
              data-placeholder={t('guideWalkPlaceholder')} onInput={onInput} />
            <div className="wz-walk-under">
              <button type="button" className="wz-walk-link" data-walk-write="" onClick={() => plan.boardId && onWrite(step, plan.boardId)}>{t('guideWalkWrite')}</button>
              <span className="wz-walk-small">{t('guideWalkKept')}</span>
            </div>
          </div>
        )}
        {dropped && (
          <div className="wz-walk-undo" role="status">
            <span>{fill('guideWalkDropped', { step: dropped.title || t('reorgUntitled') })}</span>
            <button type="button" data-walk-undo="" onClick={undoDrop}>{t('graftUndo')}</button>
          </div>
        )}
        <footer className="wz-walk-foot">
          <button type="button" className="wz-walk-quiet" data-walk-back="" disabled={!ended && index <= 0} onClick={back}>‹ {t('guideBack')}</button>
          <span className="wz-walk-small" aria-live="polite">{!ended && step ? fill('guideWalkStepOf', { n: num(index + 1), total: num(steps.length) }) : ''}</span>
          {ended || !step
            ? <button type="button" className="wz-walk-quiet" data-walk-done="" onClick={onDone}>{t('guideClose')}</button>
            : <button type="button" className="wz-walk-primary" data-walk-next="" onClick={forward}>{t(step.state === 'noted' ? 'guideWalkNext' : 'guideWalkSkip')} ›</button>}
        </footer>
      </section>
      {/* the Back menu's other tabs, greyed: locked while she walks, by the app's own rule for a locked tab */}
      <div className="wz-walk-back" role="tablist" aria-orientation="vertical" aria-label={t('guideWalkLocked')} style={{ left: at.card.left + at.card.width, top: at.card.top + 44 }}>
        {(['reorgBackPlan', 'drawerLinks'] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected="false" aria-disabled="true" data-locked="true" tabIndex={-1} aria-describedby="wz-walk-locked-note" data-walk-locked={k}>{t(k)}</button>
        ))}
        <span id="wz-walk-locked-note" className="wz-walk-sr">{t('guideWalkLocked')}</span>
      </div>
    </div>,
    document.body,
  );
}
