import { useLayoutEffect, useRef, useState } from 'react';
import type { CascadeContext } from '../../components/cascade/shared';
import type { JournalEntry } from '../../types';
import { useDeskLexicon, type DeskTermId } from '../../store/deskLexicon';
import { useLexicon } from '../../store/themeLexicon';
import { firstLine } from '../../store/entryText';
import { getJournalEntries, getJournalEntry, getSystemKind, isPairedPlanBoard } from '../../store/persistence';
import { routeForEntry } from '../../store/routeForEntry';
import { GuidePanel } from '../GuidePanel';
import { newGuideDoc } from '../presetGuideActs';
import type { GuidePick } from '../presetGuide';
import { openWalk } from '../walk/walkDoor';
import { planOfPage, walksToContinue } from '../walk/walkData';
import { structureOfPlan } from '../walk/structureOfPlan';
import { liveBoxes } from '../../store/boxTombstones';
import { setDocSetting } from '../docSettings';
import { unbornHref, type UnbornDescriptor } from '../../store/unbornPage';
import { wordCount } from '../../store/wordCount';
import { setWritingSettings, useWritingSettings } from '../../store/writingSettings';
import { pageStageOf } from '../pageStage';
import { SessionGroup } from '../session/SessionGroup';
import { allDocRows, newTargetOf, projectOfEntry, RECENT_DOCS } from '../railData';
import { useTheme } from '../../store/theme';
import { useProjectName, useWhereSheIs } from '../ReorgRail';

// DOCS (step 5, frame R7). NEW DOC: Blank, Screenplay, Research paper, Guide, Board, More kinds (Nick's first door for a Board, Nov 14, 11:14 am;
// the Guide's place ruled by Fable, Nov 25: after the kinds and before Board). Each but the Guide goes through today's own route into the Project
// she is in (an unborn page or board in its set, made by the first keystroke): Blank and Screenplay are today's presets; Research paper is today's
// research-paper deck; Board is today's new board; More kinds is today's library. THE GUIDE opens its own panel over the dimmed room (GuidePanel.tsx;
// never by itself, writing nothing); its Start makes a new Doc in the same place (presetGuideActs.ts newGuideDoc) and opens its first Part, with the
// return chip; its Blank is the Blank row.
// In Unfiled writing they land loose, as today. RECENT: her most recently changed Docs, anywhere, each with its Project and its words.
// LONG (Fable, Nov 20, 12:15 pm and 1:27 pm): up to 25 of them in a box five rows tall that scrolls past the fifth (a thin scrollbar), with a
// sort: Changed (newest first, the default), Name (A to Z, numbers as numbers), Words (most first); a tie keeps the newest first. The sort is
// the menu's own state while it is open: nothing is stored (a saved sort would be a new users.prefs key, which waits on Nick's word).
// PAGE DEFAULTS, EVERY DOC: Typewriter mode and Progress bars are today's two saved settings (the Tools strip's own switches), unchanged in
// meaning; this is one more door to them. Opening a Recent row is a departure with the return chip.
// THE SESSION (Fable, Nov 20, 12:15 pm; shared since Nov 22: reorg/session/SessionGroup.tsx): DOCS' last group, closed each time DOCS opens (in-session state; nothing stored), moved here from the
// Front menu's foot. Its rows follow the stage table (accepted as drawn, Nick's walk Nov 20): SPRINT the goal, what it counts, the timer,
// progress; BUILD the goal, the timer, progress; EDIT progress only. Each row writes today's own saved setting (store/writingGoal.ts, the
// timer and Progress tracking in store/writingSettings.ts): nothing new is stored. A Board has no session.

const RECENT = RECENT_DOCS;
/** the rows the box shows before it scrolls */
const RECENT_SHOWN = 5;
type RecentSort = 'changed' | 'name' | 'words';
const SORTS: { id: RecentSort; word: DeskTermId }[] = [
  { id: 'changed', word: 'reorgSortChanged' },
  { id: 'name', word: 'reorgSortName' },
  { id: 'words', word: 'reorgSortWords' },
];
const fill = (s: string, k: string, v: string | number): string => s.replace(`{${k}}`, String(v));

function titleOf(e: JournalEntry, t: (k: DeskTermId) => string): string {
  if (!e.text.trim()) return e.pageType !== 'board' && (e.strokes?.length ?? 0) > 0 ? t('reorgSketch') : t('reorgUntitled');
  return firstLine(e.text).slice(0, 60);
}

function recentDocs(): JournalEntry[] {
  return getJournalEntries()
    .filter((e) => !e.deletedAt && !e.purgedAt && !getSystemKind(e) && !isPairedPlanBoard(e.id) && e.pageType !== 'board')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id))
    .slice(0, RECENT);
}

/** FLUX: Recent is one row a Doc (the Wrizors' rail pass 1, REAL 2: a set of Tracks is one Doc, as her Drive counts it): its name, its words, and the Track she changed last as the way in. */
function recentByDoc(t: (k: DeskTermId) => string) {
  return allDocRows().slice(0, RECENT).map((d) => ({ e: d.lead, title: d.set ? d.set.title : titleOf(d.lead, t), words: d.parts.reduce((n, p) => n + wordCount(p.text), 0), ids: d.parts.map((p) => p.id) }));
}

/** Recent in the chosen order. `recentDocs` is newest first, so a stable sort leaves a tie newest first. */
function sortRecent<R extends { title: string; words: number }>(rows: R[], by: RecentSort): R[] {
  if (by === 'name') return [...rows].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));
  if (by === 'words') return [...rows].sort((a, b) => b.words - a.words);
  return rows;
}

function Toggle({ id, label, on, onPick, t }: { id: string; label: string; on: boolean; onPick: (on: boolean) => void; t: (k: DeskTermId) => string }) {
  return (
    <div className="wz-reorg-default" data-reorg-default={id}>
      <span className="wz-reorg-default-label" id={`wz-reorg-default-${id}`}>{label}</span>
      <span className="wz-reorg-toggle" role="group" aria-labelledby={`wz-reorg-default-${id}`}>
        <button type="button" data-toggle="off" aria-pressed={!on} onClick={() => onPick(false)}>{t('reorgOff')}</button>
        <button type="button" data-toggle="on" aria-pressed={on} onClick={() => onPick(true)}>{t('reorgOn')}</button>
      </span>
    </div>
  );
}

export function DocsPanel({ subject, navigate, travelFromCascade, closeCascade }: CascadeContext) {
  const { t } = useDeskLexicon();
  const lex = useLexicon();
  const nameOf = useProjectName();
  const here = useWhereSheIs(subject.entry);
  const settings = useWritingSettings();
  const [sort, setSort] = useState<RecentSort>('changed');
  const flux = useTheme() === 'flux';
  const recent = sortRecent<{ e: JournalEntry; title: string; words: number; ids?: string[] }>(flux ? recentByDoc(t) : recentDocs().map((e) => ({ e, title: titleOf(e, t), words: wordCount(e.text) })), sort);
  // the box is five rows tall: measured from the rows themselves (a row is two lines, set by the theme's type), again whenever the box
  // changes size (the pop-out opens from no width at all) and when a sort brings other rows to the top; a short list is never held to it
  const rowsRef = useRef<HTMLUListElement>(null);
  useLayoutEffect(() => {
    const ul = rowsRef.current;
    if (!ul) return undefined;
    const fit = () => {
      const rows = ul.children;
      const h = rows.length > RECENT_SHOWN ? rows[RECENT_SHOWN].getBoundingClientRect().top - rows[0].getBoundingClientRect().top : 0;
      const want = h > 0 ? `${h}px` : '';
      if (ul.style.maxHeight !== want) ul.style.maxHeight = want;
    };
    fit();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    ro?.observe(ul);
    return () => ro?.disconnect();
  }, [recent.length, sort]);
  const base = () => (here == null ? { origin: 'loose' as const } : newTargetOf(here, t('reorgUntitled')));
  const go = (extra: Partial<UnbornDescriptor>) => {
    const b = base();
    if (!b) return;
    navigate(unbornHref({ ...b, ...extra }));
  };
  const [guideOpen, setGuideOpen] = useState(false);
  const startFromGuide = (pick: GuidePick, guided = false) => {
    setGuideOpen(false);
    if (!pick.preset && !pick.structure) { go({}); return; }
    const b = base();
    if (!b) return;
    const made = getJournalEntry(newGuideDoc(pick, b, t));
    if (!made) return;
    // a departure she can walk back from in one tap, when what she left is a page that exists
    const from = getJournalEntry(subject.entry.id);
    navigate(routeForEntry(made), from?.text.trim() ? { state: { fromBoardId: from.id, fromBoardTitle: firstLine(from.text).slice(0, 60) } } : undefined);
    if (guided) openWalk(made.id);
  };
  // CONTINUE YOUR GUIDE (the walk's frames, state K): every Doc with a saved place; its x takes the place off (the Plan and every word stay)
  const [, setForgot] = useState(0);
  const toContinue = walksToContinue();
  // the row's second line: the count; in Flux the structure's name before it, and two figures ("Three-Act · step 05/09")
  const continueLine = (w: (typeof toContinue)[number]): string => {
    const num = (n: number) => (flux ? String(n).padStart(2, '0') : String(n));
    const line = fill(fill(t('guideWalkContinueLine'), 'n', num(w.step.number)), 'total', num(w.total));
    const structure = flux ? structureOfPlan(liveBoxes(planOfPage(w.pageId).board?.boxes), t) : null;
    return structure ? `${t(structure.name)} · ${line}` : line;
  };
  const kinds: { id: string; label: string; act: () => void; more?: boolean }[] = [
    { id: 'blank', label: t('reorgKindBlank'), act: () => go({}) },
    { id: 'screenplay', label: t('reorgKindScreenplay'), act: () => go({ structure: 'screenplay' }) },
    { id: 'research-paper', label: t('reorgKindResearch'), act: () => go({ kind: 'board', deck: 'research-paper' }) },
    { id: 'guide', label: t('guideRow'), act: () => setGuideOpen(true) },
    { id: 'board', label: lex.t('board'), act: () => go({ kind: 'board' }) },
    { id: 'more', label: t('reorgKindMore'), act: () => go({ kind: 'board', deck: 'library' }), more: true },
  ];
  return (
    <div className="wz-cascade-panel-body wz-reorg-docs">
      {toContinue.length > 0 && (
        <section className="wz-reorg-group" data-reorg-group="guide" aria-label={t('guideWalkContinue')}>
          <div className="wz-reorg-group-head">{t('guideWalkContinue')}</div>
          <ul className="wz-reorg-rows">
            {toContinue.map((w) => (
              <li key={w.pageId} className="wz-reorg-list-row wz-reorg-continue" data-continue={w.pageId}>
                <button type="button" className="wz-reorg-list-open wz-reorg-two-line" onClick={() => { closeCascade?.(); openWalk(w.pageId); }}>
                  <span className="wz-reorg-list-title">{[w.doc, w.step.title].filter(Boolean).join(' · ')}</span>
                  <span className="wz-reorg-row-meta">{continueLine(w)} ›</span>
                </button>
                <button type="button" className="wz-reorg-continue-x" data-continue-forget="" aria-label={t('guideWalkForget')} title={t('guideWalkForget')}
                  onClick={() => { setDocSetting(w.pageId, { walk: null }); setForgot((n) => n + 1); }}>×</button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="wz-reorg-group" data-reorg-group="new" aria-label={t('reorgNewDocHeading')}>
        <div className="wz-reorg-group-head">{t('reorgNewDocHeading')}</div>
        <ul className="wz-reorg-rows">
          {kinds.map((k) => (
            <li key={k.id} className="wz-reorg-list-row">
              <button type="button" className="wz-reorg-new wz-reorg-kind" data-new-kind={k.id} onClick={k.act}>
                <span aria-hidden="true">+</span> {k.label}{k.more ? <span aria-hidden="true"> ›</span> : null}
              </button>
            </li>
          ))}
        </ul>
        {guideOpen && <GuidePanel onStart={(p) => startFromGuide(p)} onStartGuided={(p) => startFromGuide(p, true)} onClose={() => setGuideOpen(false)} />}
      </section>
      <section className="wz-reorg-group" data-reorg-group="recent" aria-label={t('reorgRecent')}>
        <div className="wz-reorg-group-head wz-reorg-recent-head">
          <span>{t('reorgRecent')}</span>
          <span className="wz-reorg-recent-sort" role="group" aria-label={t('reorgRecentSort')} data-recent-sort>
            {SORTS.map((o) => (
              <button key={o.id} type="button" data-sort={o.id} aria-pressed={sort === o.id} onClick={() => setSort(o.id)}>{t(o.word)}</button>
            ))}
          </span>
        </div>
        <ul className="wz-reorg-rows wz-reorg-recent-rows" ref={rowsRef}>
          {recent.map(({ e, title, words, ids }) => {
            return (
              <li key={e.id} className="wz-reorg-list-row" data-entry-id={e.id} aria-current={(ids ?? [e.id]).includes(subject.entry.id) ? 'page' : undefined}>
                <button type="button" className="wz-reorg-list-open wz-reorg-two-line" onClick={() => travelFromCascade(e)}>
                  <span className="wz-reorg-list-title">{title}</span>
                  <span className="wz-reorg-row-meta">{nameOf(projectOfEntry(e))} · {fill(t(words === 1 ? 'reorgWordsOne' : 'reorgWordsMany'), 'n', words.toLocaleString('en-US'))}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="wz-reorg-group" data-reorg-group="defaults" aria-label={t('reorgDefaults')}>
        <div className="wz-reorg-group-head">{t('reorgDefaults')}</div>
        <Toggle id="progress" label={t('reorgProgressBars')} on={settings.instrumentsOn} onPick={(on) => setWritingSettings({ instrumentsOn: on })} t={t} />
      </section>
      {subject.entry.pageType !== 'board' && <SessionGroup stage={pageStageOf(subject.entry)} />}
    </div>
  );
}
