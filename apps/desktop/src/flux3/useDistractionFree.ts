// DISTRACTION FREE, for Flux's own drawing (the flourish spec §7.2): the one reader is store/flourish.ts distractionFree(); this only re-draws what asks when her saved fact changes.
// False under the older checks' pin, as the reader is (store/flourish.ts flourishPinned).
import { useSyncExternalStore } from 'react';
import { subscribePrefs } from '../reorg/prefsSaved';
import { distractionFree } from '../store/flourish';

export function useDistractionFree(): boolean {
  return useSyncExternalStore(subscribePrefs, distractionFree);
}
