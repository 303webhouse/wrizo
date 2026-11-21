import { useEffect } from 'react';
import { getPref, prefsHeardServer, setPref, subscribePrefs } from '../reorg/prefsSaved';
import { onRailReset } from '../reorg/railSavedKey';
import { DEFAULT_GOAL_LINES, setWritingGoal, useWritingGoal, type GoalUnit, type WritingGoal } from './writingGoal';

// THE WRITING GOAL, SAVED TO THE ACCOUNT (Fable, Nov 20, 5:15 pm: "the writing GOAL (n and unit) lives only in the device key wrizo-writing-goal-lines ... put the goal on the account
// the same way, a switchless fact in users.prefs with field stamps, not a new column"; Nick's SAVED DATA ruling, Nov 19). The sibling of store/writingPref.ts, for the one writing
// value that lives in its own module: store/writingGoal.ts is NOT touched (it keeps its key, its default and its readers), this bridge only calls its setter and watches its hook.
//   - the fact is `goal: { n, unit, at }`, or `goal: { off: true, at }` when she cleared it (a cleared goal is a choice, as it is on the device). One act sets n and unit together,
//     so the fact is whole: the later act wins, whole (reorg/prefsSaved.ts's ordinary rule - the per-field stamps writingPref.ts needs are for a fact of many switches);
//   - her act = the goal the hook reads changing to a value other than the one the account and this device last agreed on (observeGoal, run by useWritingGoalMirror in App.tsx);
//   - at boot and whenever the account's record changes, a usable fact is written into the goal (setWritingGoal, which also keeps the device key and tells every reader);
//     a fact this build cannot read (n not a positive number, a unit it does not know) is never applied;
//   - ADOPTION: a device whose goal is its own (not the shipped default) and finds the account has none, after a round has answered, gives it once. Never before the account has
//     answered, and a device that holds only the default has nothing to give;
//   - sign-out: back to the shipped default (the next account never inherits this one's, and its device never adopts it).
export const GOAL_FACT = 'goal';
const DEFAULT: WritingGoal = { n: DEFAULT_GOAL_LINES, unit: 'lines' };

const canonOf = (g: WritingGoal | null): string => (g === null ? 'off' : `${g.unit}:${g.n}`);
const isUnit = (u: unknown): u is GoalUnit => u === 'lines' || u === 'words';

/** The goal a fact says: a goal, null for cleared, undefined when there is no fact or it is not one this build can read. */
function wantOf(f: unknown): WritingGoal | null | undefined {
  if (!f || typeof f !== 'object') return undefined;
  const { n, unit, off } = f as { n?: unknown; unit?: unknown; off?: unknown };
  if (off === true) return null;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 && isUnit(unit) ? { n, unit } : undefined;
}

// what the goal was the last time the account and this device agreed: undefined until the hook's first look (that look is the boot value, not an act)
let base: string | undefined;
let latest: WritingGoal | null | undefined;
let applying = false;
let adopted = false;

function publish(g: WritingGoal | null): void {
  setPref(GOAL_FACT, g === null ? { off: true } : { n: g.n, unit: g.unit });
}

function apply(): void {
  const want = wantOf(getPref(GOAL_FACT));
  if (want === undefined) return;
  const c = canonOf(want);
  if (c === base) return;
  applying = true;
  try { setWritingGoal(want); } finally { applying = false; }
  base = c;
  latest = want;
}

// the account has answered and holds no goal for this device's own: it becomes the account's, once
function adopt(): void {
  if (adopted || !prefsHeardServer() || getPref(GOAL_FACT) || latest === undefined) return;
  if (canonOf(latest) === canonOf(DEFAULT)) return;
  adopted = true;
  publish(latest);
  base = canonOf(latest);
}

/** The hook's effect: the goal the app reads now. The first look only learns the boot value; a later, different one is her act. */
export function observeGoal(goal: WritingGoal | null): void {
  latest = goal;
  if (applying) return;
  const c = canonOf(goal);
  if (base === undefined) { base = c; adopt(); return; }
  if (base === c) return;   // not a change: not an act
  base = c;
  publish(goal);
}

/** Mounted once, where the app mounts (App.tsx): the goal's account mirror. Renders nothing. */
export function useWritingGoalMirror(): void {
  const goal = useWritingGoal();
  useEffect(() => { observeGoal(goal); }, [goal]);
}

apply();
subscribePrefs(apply);
subscribePrefs(adopt);
// the reset is not her act: it must not publish the default as a new fact
const resetGoal = (): void => {
  adopted = false;
  applying = true;
  try { setWritingGoal({ ...DEFAULT }); } finally { applying = false; }
  base = canonOf(DEFAULT);
  latest = { ...DEFAULT };
};
onRailReset(resetGoal);
