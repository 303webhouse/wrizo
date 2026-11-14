import type { ReactNode } from 'react';
import { renderCategoryPanel, type CategoryId, type CascadeContext } from '../../components/CascadePanels';

// The rail's pop-out bodies (the reorg, behind ?reorg=1 in Machina). Its own doors render here; THEME and SETTINGS are today's panels, unchanged.
// Step 1: no door of its own is lit yet (PROJECTS comes in step 2).
export function renderReorgPanel(category: CategoryId, ctx: CascadeContext): ReactNode {
  return renderCategoryPanel(category, ctx);
}

/** What a rail pop-out's head shows after its title (step 2: All projects' count). */
export function reorgHeadExtra(_category: CategoryId): ReactNode {
  return null;
}
