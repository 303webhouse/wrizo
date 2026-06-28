import type { AuthUser } from './api';

// The authenticated user, held in-module so any surface (the Desk headline) can
// read it synchronously. App sets it on the initial /auth/me and on sign-in /
// account-create; cleared on logout. Repopulated before the authed tree renders.
let current: AuthUser | null = null;

export function setCurrentUser(user: AuthUser | null): void {
  current = user;
}
export function getCurrentUser(): AuthUser | null {
  return current;
}
// First name / display name for the Desk headline, with graceful fallbacks.
export function deskOwnerName(): string {
  const n = current?.name?.trim();
  if (n) return n;
  const local = (current?.email || '').split('@')[0].trim();
  return local || 'Your';
}
