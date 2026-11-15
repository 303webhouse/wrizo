import type { ReactNode } from 'react';
import { DrawerTabs, type DrawerTabItem } from './DrawerTabs';
import type { DrawerSide } from '../store/drawerShell';

// PHASE 1 - THE SHARED DRAWER FRAME, one component for both hands (and, in S4, the card).
//
// WHAT IT IS, AND WHAT IT IS NOT. It is the SLIDING LAYER (S1): the visible box (background, border) that travels in from behind the
// fixed tab, plus the optional tab row and the body under it. The element around it - the panel - stays with its host (Sliver.tsx,
// Tutor.tsx) because that panel carries the dissolve classes, the pop-out-hold law, the open state and the clip/scroll; those must
// stay on one element and have long comments explaining why. So the host renders the panel and puts <SideDrawer> inside it.
//
// The tab row is optional: a surface with one tab (Draft, Revise, today's Tutor) shows none, never a single lonely tab.

export interface DrawerTabsConfig<T extends string> {
  items: readonly DrawerTabItem<T>[];
  /** Adornments beside a tab's word, keyed by tab (the "?" note). */
  notes?: Partial<Record<T, ReactNode>>;
  value: T;
  onChange: (next: T) => void;
  /** Accessible name of the tab row (a lexicon term, so it follows the theme). */
  label: string;
}

interface Props<T extends string> {
  side: DrawerSide;
  /** Prefix for ids; unique per drawer on a page ("wz-sliver", "wz-tutor"). */
  idPrefix: string;
  tabs?: DrawerTabsConfig<T>;
  children: ReactNode;
  /** Standing furniture that belongs to every tab (the goal foot, the instruments row) - rendered after the body, outside the tab panel. */
  foot?: ReactNode;
}

export function SideDrawer<T extends string>({ side, idPrefix, tabs, children, foot }: Props<T>) {
  const hasTabs = !!tabs && tabs.items.length > 1;
  return (
    <div className={`wz-drawer-slide wz-drawer-slide--${side}`}>
      {hasTabs && tabs && (
        <DrawerTabs items={tabs.items} notes={tabs.notes} value={tabs.value} onChange={tabs.onChange} label={tabs.label} idPrefix={idPrefix} />
      )}
      {hasTabs && tabs ? (
        <div className="wz-drawer-body" role="tabpanel" id={`${idPrefix}-panel`} aria-labelledby={`${idPrefix}-tab-${tabs.value}`}>
          {children}
        </div>
      ) : (
        <div className="wz-drawer-body" id={`${idPrefix}-panel`}>{children}</div>
      )}
      {foot}
    </div>
  );
}
