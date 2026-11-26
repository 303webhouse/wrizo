import { useEffect, useRef, useState } from 'react';
import type { DeskTermId } from '../../store/lexicon/terms';
import { PLAN_PRESETS, type PlanPreset } from './planPresets';
import { STRUCTURE_NOTES } from '../presetNotes';
import { openingPair, shapeOf, sharedTitles, structureFor } from './structureCompare';

// COMPARE STRUCTURES (PRESETS-B item 18, Nov 25; every word is PROPOSED): at the foot of the PLAN tab's Presets list (PresetsMenu.tsx). Two structures side by side: a list each to choose from, its size, its one-line note where it has one, its headings in order
// (an Act's steps indented), and the headings the two share. Choosing is a VIEW: nothing is written until she presses "Use" under a column, which is the list's own `onPick` (the same load as pressing that structure in the list). Esc or Close goes back to the list.
// The columns wrap to one under the other where the room is narrow (the PLAN tab's drawer), and sit side by side where it is not (a Board's Plan view).
export function CompareStructures({ t, onPick, onClose }: { t: (k: DeskTermId) => string; onPick: (p: PlanPreset) => void; onClose: () => void }) {
  const [pair, setPair] = useState(() => openingPair().map((p) => p.id) as [string, string]);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { root.current?.querySelector<HTMLElement>('select')?.focus(); }, []);
  const a = structureFor(pair[0]), b = structureFor(pair[1]);
  const shared = sharedTitles(a, b, t);
  const set = (i: 0 | 1, id: string) => setPair((p) => (i === 0 ? [id, p[1]] : [p[0], id]));
  const column = (i: 0 | 1, p: PlanPreset, other: PlanPreset) => {
    const s = shapeOf(p);
    const note = STRUCTURE_NOTES[p.id];
    const sel = `reorg-compare-sel-${i}`;
    const sharedHere = new Set(sharedTitles(p, other, t).map((w) => w.trim().toLowerCase()));
    return (
      <section className="reorg-compare-col" data-compare-col={i} aria-label={t(p.name)}>
        <label className="reorg-compare-label" htmlFor={sel}>{t(i === 0 ? 'reorgCompareFirst' : 'reorgCompareSecond')}</label>
        <select id={sel} className="reorg-compare-select" data-compare-select={i} value={p.id} onChange={(e) => set(i, e.target.value)}>
          {PLAN_PRESETS.map((x) => <option key={x.id} value={x.id}>{t(x.name)}</option>)}
        </select>
        <div className="reorg-compare-size" data-compare-size={i}>
          {t(s.rows === 1 ? 'reorgCompareRowsOne' : 'reorgCompareRowsMany').replace('{n}', String(s.rows))}
          {' · '}{s.groups > 0 ? t(s.groups === 1 ? 'reorgCompareGroupsOne' : 'reorgCompareGroupsMany').replace('{n}', String(s.groups)) : t('reorgCompareFlat')}
        </div>
        {note && <p className="reorg-compare-line" data-compare-line={i}>{t(note.line).replace(/\*/g, '')}</p>}
        <ol className="reorg-compare-rows" aria-label={t(p.name)}>
          {p.rows.map((r, k) => {
            const w = t(r.title);
            return <li key={k} className="reorg-compare-row" data-depth={r.depth} data-shared={sharedHere.has(w.trim().toLowerCase()) ? 'true' : 'false'} style={{ paddingLeft: r.depth * 12 }}>{w}</li>;
          })}
        </ol>
        <button type="button" className="reorg-compare-use" data-compare-use={i} onClick={() => onPick(p)}>{t('reorgCompareUse').replace('{name}', t(p.name))}</button>
      </section>
    );
  };
  return (
    <div ref={root} className="reorg-compare" data-compare="" role="group" aria-label={t('reorgCompare')}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); } }}>
      <div className="reorg-compare-cols">{column(0, a, b)}{column(1, b, a)}</div>
      <p className="reorg-compare-shared" data-compare-shared="">
        <strong>{t('reorgCompareShared')}</strong>{' '}{shared.length ? shared.join(', ') : t('reorgCompareSharedNone')}
      </p>
      <button type="button" className="reorg-compare-close" data-compare-close="" onClick={onClose}>{t('reorgCompareClose')}</button>
    </div>
  );
}
