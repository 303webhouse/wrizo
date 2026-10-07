import { useSyncExternalStore } from 'react';
import { getSigningOut, subscribeSigningOut } from './logoutGuard';

// LOGOUT TIME LIMIT — the sign-out buttons read this to show "Signing out…" and to ignore a second click.
export function useSigningOut(): boolean {
  return useSyncExternalStore(subscribeSigningOut, getSigningOut, getSigningOut);
}
