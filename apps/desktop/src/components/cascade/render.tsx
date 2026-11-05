import { type ReactNode } from 'react';
import { ThemePicker } from '../ThemePicker';
import type { CategoryId, CascadeContext } from './shared';
import { JournalPanel } from './JournalPanel';
import { PagePanel } from './PagePanel';
import { PlanPanel } from './PlanPanel';
import { DrawersPanel } from './DrawersPanel';
import { TrashPanel } from './TrashPanel';
import { CascadeSettingsPanel } from './SettingsPanel';

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------
export function renderCategoryPanel(category: CategoryId, ctx: CascadeContext): ReactNode {
  switch (category) {
    case 'journal': return <JournalPanel {...ctx} />;
    case 'page': return <PagePanel subject={ctx.subject} navigate={ctx.navigate} />;
    case 'plan': return <PlanPanel {...ctx} />;
    case 'drawers': return <DrawersPanel {...ctx} />;
    case 'trash': return <TrashPanel navigate={ctx.navigate} />;
    case 'settings': return <CascadeSettingsPanel navigate={ctx.navigate} />;
    case 'theme': return <ThemePicker />;
    default: return null;
  }
}

