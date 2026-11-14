import type { ReactNode } from 'react';
import { renderCategoryPanel, type CategoryId, type CascadeContext } from '../../components/CascadePanels';
import { ProjectsCount, ProjectsPanel } from './ProjectsPanel';

// The rail's pop-out bodies (the reorg, behind ?reorg=1 in Machina). Its own doors render here; THEME and SETTINGS are today's panels, unchanged.
export function renderReorgPanel(category: CategoryId, ctx: CascadeContext): ReactNode {
  switch (category) {
    case 'reorg-projects': return <ProjectsPanel {...ctx} />;
    default: return renderCategoryPanel(category, ctx);
  }
}

/** What a rail pop-out's head shows after its title: All projects' count (frame R4). */
export function reorgHeadExtra(category: CategoryId): ReactNode {
  return category === 'reorg-projects' ? <ProjectsCount /> : null;
}
