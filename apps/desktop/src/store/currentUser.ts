import type { AuthUser } from './api';

// The authenticated user, held in-module so any surface (the Desk headline) can
// read it synchronously. App sets it on the initial /auth/me and on sign-in /
// account-create; cleared on logout. Repopulated before the authed tree renders.
let current: AuthUser | null = null;

// STORAGE-FULL STEP 1 — subscribable, so the sync notice (mounted in more than one place — ChromeControls' own
// header names both) can tell "signed in" from "writing anonymously, local-first (F2)" without re-deriving it from
// React auth state that lives in App.tsx alone. A small addition to an existing module, not a new one.
const listeners = new Set<(user: AuthUser | null) => void>();

export function setCurrentUser(user: AuthUser | null): void {
  current = user;
  listeners.forEach((l) => {
    try { l(current); } catch { /* a misbehaving listener must never break sign-in/out */ }
  });
}
export function getCurrentUser(): AuthUser | null {
  return current;
}
export function subscribeCurrentUser(listener: (user: AuthUser | null) => void): () => void {
  listeners.add(listener);
  listener(current);
  return () => { listeners.delete(listener); };
}
// First name / display name for the Desk headline, with graceful fallbacks.
export function deskOwnerName(): string {
  const n = current?.name?.trim();
  if (n) return n;
  const local = (current?.email || '').split('@')[0].trim();
  return local || 'Your';
}
