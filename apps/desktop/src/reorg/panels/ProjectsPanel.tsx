import { useState } from 'react';
import type { CascadeContext } from '../../components/cascade/shared';
import { useDeskLexicon } from '../../store/deskLexicon';
import { useLexicon } from '../../store/themeLexicon';
import { createDrawer } from '../../store/persistence';
import { isDefaultRoot } from '../../store/place';
import { NOTEBOOK, railProjects, type RailProject } from '../railData';
import { isPinned, setOpenList, togglePin, useRailMemory } from '../railMemory';
import { RailBox } from '../RailBox';
import { useWhereSheIs } from '../ReorgRail';
import { BoxSettings } from './BoxSettings';

// PROJECTS (frame R4): All projects with a count; + New project; her pinned Projects (in the order she pinned them), then the rest (in her
// order), the Notebook LAST (the hidden Journal, a place of its own, its pin off: Nov 11, Q2). Each row: the box, the name, its Docs by the
// read-time rule, and a pin. Pins live in memory only (railMemory.ts). A row opens that Project's own list (step 3). BOX SETTINGS, for the
// Project she is in, is one closed drop-down at the foot (step 4). New project is today's own act (createDrawer, the switcher's route) and the
// only write here.

const fillN = (s: string, n: number): string => s.replace('{n}', String(n));
const fillName = (s: string, name: string): string => s.replace('{name}', name);

function useRows(): RailProject[] {
  const { t } = useDeskLexicon();
  const lex = useLexicon();
  return railProjects(lex.t('journal')).map((p) => (p.drawer && isDefaultRoot(p.drawer) ? { ...p, name: t('placeRootName') } : p));
}

/** The pop-out head's count: how many Projects All projects lists (the Notebook among them). */
export function ProjectsCount() {
  return <span className="wz-reorg-head-count" data-reorg-count="">{useRows().length}</span>;
}

export function ProjectsPanel({ subject, openCategory }: CascadeContext) {
  const { t } = useDeskLexicon();
  const rows = useRows();
  const memory = useRailMemory();
  const here = useWhereSheIs(subject.entry);
  const [naming, setNaming] = useState(false);
  const pinned = memory.pins.map((id) => rows.find((r) => r.id === id)).filter((r): r is RailProject => !!r);
  const rest = rows.filter((r) => !memory.pins.includes(r.id));
  const add = (name: string) => {
    setNaming(false);
    if (name.trim()) createDrawer(name);
  };
  const row = (r: RailProject) => {
    const pinnedNow = isPinned(r.id);
    return (
      <li key={r.id} className="wz-reorg-row" data-reorg-project={r.id} data-notebook={r.id === NOTEBOOK ? 'true' : undefined} aria-current={r.id === here ? 'location' : undefined}>
        <button type="button" className="wz-reorg-row-open" aria-label={fillName(t('reorgBoxOpen'), r.name)}
          onClick={() => { setOpenList(r.id); openCategory?.('reorg-list'); }}>
          <RailBox id={r.id} name={r.name} size="row" />
          <span className="wz-reorg-row-text">
            <span className="wz-reorg-row-name">{r.name}</span>
            <span className="wz-reorg-row-meta" data-reorg-docs={r.docs}>{fillN(t(r.docs === 1 ? 'reorgDocOne' : 'reorgDocMany'), r.docs)}</span>
          </span>
        </button>
        <button type="button" className="wz-reorg-row-pin" data-reorg-pin-toggle={r.id} aria-pressed={pinnedNow}
          aria-label={fillName(t(pinnedNow ? 'reorgUnpin' : 'reorgPin'), r.name)} title={fillName(t(pinnedNow ? 'reorgUnpin' : 'reorgPin'), r.name)}
          onClick={() => togglePin(r.id)}>
          <PinIcon filled={pinnedNow} />
        </button>
      </li>
    );
  };
  return (
    <div className="wz-cascade-panel-body wz-reorg-projects">
      {naming ? (
        <input className="wz-reorg-new-input" autoFocus aria-label={t('switcherNewDrawerName')} placeholder={t('switcherNewDrawerName')}
          // the field's own Enter and Escape stop here: React removes the field before the event reaches the Cascade's document listener, which
          // would read a detached target as a keystroke outside the pop-out and close it (harness reorg-rails P3, run on 7247c6f8)
          onKeyDown={(ev) => { if (ev.key === 'Enter') { ev.stopPropagation(); add((ev.target as HTMLInputElement).value); } else if (ev.key === 'Escape') { ev.stopPropagation(); setNaming(false); } }}
          onBlur={() => setNaming(false)} />
      ) : (
        <button type="button" className="wz-reorg-new" data-new="project" onClick={() => setNaming(true)}>
          <span aria-hidden="true">+</span> {t('reorgNewProject')}
        </button>
      )}
      {pinned.length > 0 && (
        <section className="wz-reorg-group" data-reorg-group="pinned" aria-label={t('reorgPinnedGroup')}>
          <div className="wz-reorg-group-head" aria-hidden="true"><PinIcon filled /> {pinned.length}</div>
          <ul className="wz-reorg-rows">{pinned.map(row)}</ul>
        </section>
      )}
      <section className="wz-reorg-group" data-reorg-group="rest" aria-label={t('reorgUnpinnedGroup')}>
        {pinned.length > 0 && <div className="wz-reorg-group-head" aria-hidden="true"><PinIcon filled={false} /> {rest.length}</div>}
        <ul className="wz-reorg-rows">{rest.map(row)}</ul>
      </section>
      <BoxSettings id={here} name={here == null ? '' : rows.find((r) => r.id === here)?.name ?? ''} />
    </div>
  );
}

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <path d="M8 3h8l-1 6 3 3H6l3-3z" />
      <path d="M12 12v8" fill="none" />
    </svg>
  );
}
