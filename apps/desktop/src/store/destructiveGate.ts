// DELETE FOR GOOD (docs/plans/delete-for-good.md; Fable's change 1, Oct 18) - the in-app typed confirmation that unlocks the account-wide
// destructive paths (window.wrizoDelete, window.wrizoSeed) for this page session. RED-FIRST STUB: today there is no gate - everything is open.
export interface DestructiveRequest { title: string; lines: string[]; phrase: string }
export function isDestructiveUnlocked(): boolean { return true; }
export function unlockDestructiveForTest(): boolean { return true; }
export function requestDestructiveConfirm(req: DestructiveRequest): Promise<boolean> { void req; return Promise.resolve(true); }
export function submitDestructiveConfirm(typed: string, trusted: boolean): boolean { void typed; void trusted; return true; }
