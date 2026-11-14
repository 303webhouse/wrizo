import type { CascadeContext } from '../../components/cascade/shared';
import type { JournalEntry } from '../../types';
import { useDeskLexicon, type DeskTermId } from '../../store/deskLexicon';
import { useLexicon } from '../../store/themeLexicon';
import { firstLine } from '../../store/entryText';
import { getJournalEntries, getSystemKind, isPairedPlanBoard } from '../../store/persistence';
import { unbornHref, type UnbornDescriptor } from '../../store/unbornPage';
import { wordCount } from '../../store/wordCount';
import { setWritingSettings, useWritingSettings } from '../../store/writingSettings';
import { newTargetOf, projectOfEntry } from '../railData';
import { useProjectName, useWhereSheIs } from '../ReorgRail';

// DOCS (step 5, frame R7). NEW DOC: Blank, Screenplay, Research paper, More kinds, and Board (Nick's first door for a Board, Nov 14, 11:14 am),
// each through today's own route into the Project she is in (an unborn page or board in its set, made by the first keystroke): Blank and
// Screenplay are today's presets; Research paper is today's research-paper deck; More kinds is today's library; Board is today's new board.
// In Unfiled writing they land loose, as today. RECENT: her three most recently changed Docs, anywhere, each with its Project and its words.
// PAGE DEFAULTS, EVERY DOC: Typewriter mode and Progress bars are today's two saved settings (the Tools strip's own switches), unchanged in
// meaning; this is one more door to them. Opening a Recent row is a departure with the return chip.

const RECENT = 3;
const fill = (s: string, k: string, v: string | number): string => s.replace(`{${k}}`, String(v));

function titleOf(e: JournalEntry, t: (k: DeskTermId) => string): string {
  if (!e.text.trim()) return (e.strokes?.length ?? 0) > 0 ? t('reorgSketch') : t('reorgUntitled');
  return firstLine(e.text).slice(0, 60);
}

function recentDocs(): JournalEntry[] {
  return getJournalEntries()
    .filter((e) => !e.deletedAt && !e.purgedAt && !getSystemKind(e) && !isPairedPlanBoard(e.id) && e.pageType !== 'board')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id))
    .slice(0, RECENT);
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

export function DocsPanel({ subject, navigate, travelFromCascade }: CascadeContext) {
  const { t } = useDeskLexicon();
  const lex = useLexicon();
  const nameOf = useProjectName();
  const here = useWhereSheIs(subject.entry);
  const settings = useWritingSettings();
  const recent = recentDocs();
  const base = () => (here == null ? { origin: 'loose' as const } : newTargetOf(here, t('reorgUntitled')));
  const go = (extra: Partial<UnbornDescriptor>) => {
    const b = base();
    if (!b) return;
    navigate(unbornHref({ ...b, ...extra }));
  };
  const kinds: { id: string; label: string; act: () => void; more?: boolean }[] = [
    { id: 'blank', label: t('reorgKindBlank'), act: () => go({}) },
    { id: 'screenplay', label: t('reorgKindScreenplay'), act: () => go({ structure: 'screenplay' }) },
    { id: 'research-paper', label: t('reorgKindResearch'), act: () => go({ kind: 'board', deck: 'research-paper' }) },
    { id: 'board', label: lex.t('board'), act: () => go({ kind: 'board' }) },
    { id: 'more', label: t('reorgKindMore'), act: () => go({ kind: 'board', deck: 'library' }), more: true },
  ];
  return (
    <div className="wz-cascade-panel-body wz-reorg-docs">
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
      </section>
      <section className="wz-reorg-group" data-reorg-group="recent" aria-label={t('reorgRecent')}>
        <div className="wz-reorg-group-head">{t('reorgRecent')}</div>
        <ul className="wz-reorg-rows">
          {recent.map((e) => {
            const words = wordCount(e.text);
            return (
              <li key={e.id} className="wz-reorg-list-row" data-entry-id={e.id} aria-current={e.id === subject.entry.id ? 'page' : undefined}>
                <button type="button" className="wz-reorg-list-open wz-reorg-two-line" onClick={() => travelFromCascade(e)}>
                  <span className="wz-reorg-list-title">{titleOf(e, t)}</span>
                  <span className="wz-reorg-row-meta">{nameOf(projectOfEntry(e))} · {fill(t(words === 1 ? 'reorgWordsOne' : 'reorgWordsMany'), 'n', words.toLocaleString('en-US'))}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="wz-reorg-group" data-reorg-group="defaults" aria-label={t('reorgDefaults')}>
        <div className="wz-reorg-group-head">{t('reorgDefaults')}</div>
        <Toggle id="typewriter" label={t('reorgTypewriter')} on={settings.typewriter} onPick={(on) => setWritingSettings({ typewriter: on })} t={t} />
        <Toggle id="progress" label={t('reorgProgressBars')} on={settings.instrumentsOn} onPick={(on) => setWritingSettings({ instrumentsOn: on, progress: on ? 'words' : 'off' })} t={t} />
      </section>
    </div>
  );
}
