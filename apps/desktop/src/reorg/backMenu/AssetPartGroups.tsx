import { useState } from 'react';
import type { ReactNode } from 'react';
import type { DeskTermId } from '../../store/deskLexicon';
import type { AssetGroup } from './assetGroups';
import { colorSlot } from '../parts';
import { slotLetter, SLOT_WORD } from '../colourSlots';

// THE ASSETS TAB, A GROUP PER PART (the Team B restyle, slice 3; Nick, Nov 20: 1F '"Assets of this doc" becomes "Assets (11)"', 1H 'when the
// Assets tab first opens, only the Part she is in is open. Every other Part is closed'). Wide to narrow: the Doc's count, then each Part with
// assets in the Doc's order, its head naming it (its tag, its name, its count) and folding its own list. Which Parts are open is not remembered
// (no new data): the tab opens fresh each time with only her Part open. The page is never touched: the list grows inside the drawer.

export interface PartAssets {
  id: string;
  name: string;
  color?: string | null;
  count: number;
  groups: readonly AssetGroup[];
}

export function AssetPartGroups({ hereId, parts, total, t, render }: {
  hereId: string;
  parts: readonly PartAssets[];
  total: number;
  t: (term: DeskTermId) => string;
  /** The Part's own list (the Assets tab's AssetGroups, with its acts bound to that Part). */
  render: (part: PartAssets) => ReactNode;
}): ReactNode {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set([hereId]));
  const flip = (id: string) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <div className="wz-back-parts" data-back-parts="">
      <div className="wz-graft-gh wz-back-assets-head" data-back-assets-head="">{t('reorgAssetsHead').replace('{n}', String(total))}</div>
      {parts.map((p) => {
        const on = open.has(p.id);
        const slot = colorSlot(p.color);
        return (
          <section key={p.id} className={`wz-back-part${p.id === hereId ? ' is-here' : ''}`} data-assets-part={p.id}>
            <button type="button" className="wz-back-part-head" data-assets-part-toggle="" aria-expanded={on ? 'true' : 'false'}
              aria-label={t('reorgAssetsPartToggle').replace('{part}', p.name)} onClick={() => flip(p.id)}>
              <span className="wz-back-part-fold" aria-hidden="true">{on ? '▾' : '▸'}</span>
              {slot && <span className="wz-back-tag" data-colour-slot={slot} title={t(SLOT_WORD[slot])}>{slotLetter(slot)}</span>}
              <span className="wz-back-part-name">{p.name}</span>
              <span className="wz-back-part-count">{p.count}</span>
            </button>
            {on && <div className="wz-back-part-body">{render(p)}</div>}
          </section>
        );
      })}
    </div>
  );
}
