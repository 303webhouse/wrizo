import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { DeskTermId } from '../../store/deskLexicon';
import type { AssetGroup } from './assetGroups';
import { colorSlot } from '../parts';
import { slotLetter, SLOT_WORD } from '../colourSlots';
import { pendingAssetsFocus, subscribeAssetsFocus, takeAssetsFocus, type AssetsFocus } from './assetsFocus';

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
  // a Part row's link badge (assetsFocus.ts) opens its Part too: at mount when the press drew this tab, or while drawn (the tab already open)
  const [open, setOpen] = useState<ReadonlySet<string>>(() => { const f = pendingAssetsFocus(); return new Set(f ? [hereId, f.partId] : [hereId]); });
  const [ask, setAsk] = useState<AssetsFocus | null>(() => pendingAssetsFocus());
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => subscribeAssetsFocus(() => {
    const f = pendingAssetsFocus();
    if (!f) return;
    setOpen((s) => (s.has(f.partId) ? s : new Set(s).add(f.partId)));
    setAsk(f);
  }), []);
  // the asked Part's head brought to the top of the drawer's own scroller (never scrollIntoView: that also scrolls the page's ancestors); the
  // drawer may be opening in the same press, so a frame with no scroller holding more than it shows yet waits for the next (ten at most; none = all in view)
  useEffect(() => {
    if (!ask) return;
    takeAssetsFocus(ask.tick);
    let frames = 0;
    let raf = 0;
    const bring = () => {
      const root = rootRef.current;
      const sec = root ? [...root.querySelectorAll<HTMLElement>('[data-assets-part]')].find((el) => el.getAttribute('data-assets-part') === ask.partId) : undefined;
      let sc: HTMLElement | null = sec ? sec.parentElement : null;
      while (sc && !(/auto|scroll/.test(getComputedStyle(sc).overflowY) && sc.scrollHeight > sc.clientHeight + 1)) sc = sc.parentElement;
      if (!sec || !sc) { if (++frames < 10) raf = requestAnimationFrame(bring); return; }
      sc.scrollTop += sec.getBoundingClientRect().top - sc.getBoundingClientRect().top;
    };
    raf = requestAnimationFrame(bring);
    return () => cancelAnimationFrame(raf);
  }, [ask]);
  const flip = (id: string) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <div ref={rootRef} className="wz-back-parts" data-back-parts="">
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
