import { useEffect, useReducer } from 'react';
import { getCurrentUser } from './currentUser';
import { getPlace, onPlaceChange, type Place } from './place';

// BIG PROJECTS 1a - the React side of store/place.ts. Kept apart so place.ts stays pure data (the harness bundles it with no React).

/** The account id the per-device place is kept under. Anonymous writing keeps a place too, under a fixed key. */
export function placeUid(): string {
  return getCurrentUser()?.id ?? 'anon';
}

/** Where the writer is. Re-renders when the place changes (a switcher choice, or the place following an opened page). */
export function usePlace(): Place {
  const [, force] = useReducer((n: number) => n + 1, 0);
  useEffect(() => onPlaceChange(force), []);
  return getPlace(placeUid());
}
