import { getProject, getDrawer } from './persistence';
import { sectionsOf, UNSORTED } from './place';
import { routeForEntry } from './routeForEntry';

// #13 step 12a (Fable, Oct 29 and Nov 12): the old project screens are deleted, and `/project/:id`, its sub-routes and `/sprint` stay only
// as this redirect, so every door that still points there (the editors' back links, the last-place pointer, the resume card, the Drawers
// list) lands on a live surface by the door ruling: the project's FIRST page in the Pages pop-out's own order; else, for a project with no
// pages, its Drawer's first page with the Pages pop-out open; else home. Never a blank screen. It only reads.

export interface LegacyTarget { route: string; openPages: boolean }

export function legacyProjectTarget(projectId: string | undefined): LegacyTarget {
  const project = projectId ? getProject(projectId) : null;
  if (!project) return { route: '/', openPages: false };
  const drawerId = project.drawerId && getDrawer(project.drawerId) ? project.drawerId : UNSORTED;
  const groups = sectionsOf({ kind: 'drawer', id: drawerId }, 'pages');
  const own = groups.find(g => g.set?.id === project.id)?.items[0];
  if (own) return { route: routeForEntry(own), openPages: false };
  const first = groups[0]?.items[0];
  return first ? { route: routeForEntry(first), openPages: true } : { route: '/', openPages: false };
}
