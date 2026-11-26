import { useMemo, useSyncExternalStore } from 'react';
import type { JournalEntry } from '../types';
import { useDeskLexicon } from '../store/deskLexicon';
import { subscribe } from '../store/persistence';
import { beforeExport } from './beforeExportRules';
import { publicationAttach, publicationFacts, publicationSignature, unattachedPlanRows } from './publishing';
import { useAttached, usePickOff } from './publishPick';
import { paintScaleOf } from '../store/paintScale';

// BEFORE YOU EXPORT (reorg-plan-v2, INK queue item 4; the stage menus, F4; Nick, Nov 20, 1:20 pm: FINALIZE keeps the Back menu, and Before You Export stays there). A tab of the Back menu that exists only while the
// publishing sheet is open (Tutor.tsx). It READS what the sheet is showing (the Parts, and which are ticked out: publishPick.ts) and says, in plain lines, what would stop the export (no Part ticked) and what is
// worth a look first (Parts with no words). A line is a button: it takes the SHEET to that Part, scrolling the sheet's own list and nothing else, so the page under the sheet, her caret and the tab stay put (PAGE
// IS PRIMARY). It writes nothing: no word, no tick, no setting. The rules are beforeExportRules.ts (pure, unit-checked).

const fill = (s: string, vals: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vals ? String(vals[k]) : m));

/** Bring one Part of the sheet into the sheet's own view. Only the sheet's scroller moves (never scrollIntoView, which would move every scrolling ancestor, the page's column included). */
function jumpTo(partId: string): void {
  const sc = document.querySelector('[data-reorg-pub] [data-pub-scroll]') as HTMLElement | null;
  const el = sc?.querySelector(`[data-pub-part="${partId}"]`) as HTMLElement | null;
  if (!sc || !el) return;
  sc.scrollTop += (el.getBoundingClientRect().top - sc.getBoundingClientRect().top) / paintScaleOf(sc) - 12;   // the sheet stands inside the painted page (#133)
}

export function BeforeExport({ entry, onShowPlan }: { entry: JournalEntry; onShowPlan?: () => void }) {
  const { t } = useDeskLexicon();
  const sig = useSyncExternalStore(subscribe, () => publicationSignature(entry.id));
  const parts = useMemo(() => publicationFacts(entry.id), [entry.id, sig]);   // eslint-disable-line react-hooks/exhaustive-deps
  const off = usePickOff(entry.id);
  const picked = useAttached(entry.id);
  // the assets she ticked that are still there (a reminder of what is going out, item 5b)
  const attached = publicationAttach(entry.id, '', '', picked)?.items.length ?? 0;
  // the Plan rows with no Part: read again whenever the store changes (her first word in a row's Part makes one), as a number so the snapshot is stable
  const unattached = useSyncExternalStore(subscribe, () => unattachedPlanRows(entry.id));
  const r = beforeExport(parts, off, attached, unattached);
  const clear = r.blocks.length === 0 && r.notes.length === 0;
  return (
    <section className="reorg-bx" data-back-export aria-label={t('reorgBxLabel')}>
      {r.blocks.map((b) => (
        <p key={b.kind} className="reorg-bx-block" data-bx-block={b.kind} role="status">{t('reorgBxNoneTicked')}</p>
      ))}
      {r.notes.map((n) => (n.kind === 'planRows' ? (
        // a press opens the Back menu's Plan tab, where each row has its "→ Part"; nothing moves on the page
        <button key={n.kind} type="button" className="reorg-bx-note" data-bx-note={n.kind} onClick={() => onShowPlan?.()}>
          {fill(n.count === 1 ? t('reorgBxPlanOne') : t('reorgBxPlanMany'), { n: n.count })}
        </button>
      ) : (
        <button key={n.kind} type="button" className="reorg-bx-note" data-bx-note={n.kind} onClick={() => jumpTo(n.partIds[0])}>
          {fill(n.count === 1 ? t('reorgBxEmptyOne') : t('reorgBxEmptyMany'), { n: n.count })}
        </button>
      )))}
      {r.attached > 0 && <p className="reorg-bx-attached" data-bx-attached={r.attached}>{fill(r.attached === 1 ? t('reorgBxAttachedOne') : t('reorgBxAttachedMany'), { n: r.attached })}</p>}
      {clear && <p className="reorg-bx-clear" data-bx-clear>{t('reorgBxClear')}</p>}
    </section>
  );
}
