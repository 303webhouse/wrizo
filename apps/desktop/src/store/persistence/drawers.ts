import type { Drawer } from '../../types';
import { cache, clone, generateId, upsert } from './core';
import { getProject, saveProject } from './projects';

// --- Drawers (Drawers D1) -------------------------------------------------
// The top of the Drawers IA — a level OVER projects. CRUD mirrors every other
// collection (upsert → cache + dirty + debounced flush + notify); soft-delete,
// never hard-delete (a synced row must travel its deletion). A project's
// `drawerId` is set on the Project record (rides the existing project sync).

export function getDrawers(): Drawer[] {
  return cache.drawers.filter(d => !d.deletedAt).map(clone);
}

export function getDrawer(id: string): Drawer | null {
  const drawer = cache.drawers.find(d => d.id === id);
  return drawer && !drawer.deletedAt ? clone(drawer) : null;
}

export function saveDrawer(drawer: Drawer): void {
  upsert('drawers', cache.drawers, clone(drawer));
}

export function createDrawer(name: string): Drawer {
  const now = new Date().toISOString();
  const maxOrder = cache.drawers.reduce((m, d) => Math.max(m, d.order ?? 0), -1);
  const drawer: Drawer = {
    id: generateId(),
    name: name.trim() || 'New Drawer',
    order: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };
  saveDrawer(drawer);
  return drawer;
}

export function renameDrawer(id: string, name: string): void {
  const drawer = getDrawer(id);
  if (!drawer) return;
  drawer.name = name.trim() || drawer.name;
  saveDrawer(drawer);
}

export function softDeleteDrawer(id: string): void {
  const drawer = getDrawer(id);
  if (!drawer) return;
  drawer.deletedAt = new Date().toISOString();
  saveDrawer(drawer);
  // The drawer's projects fall back to "Unsorted" automatically — DrawersTree
  // treats a project whose drawerId points at a missing/deleted drawer as
  // unsorted — so we don't rewrite each project (keeps the move reversible).
}

export function setProjectDrawer(projectId: string, drawerId: string | null): void {
  const project = getProject(projectId);
  if (!project) return;
  project.drawerId = drawerId ?? undefined;
  saveProject(project);
}
