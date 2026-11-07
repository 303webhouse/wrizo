import { planLap, hashSeed, geometryKey, type GrowthGeometry, type GrowthSegment, type LapPlan } from '../store/rhizomeGrowth';

// ARBOR v2 MOCKUP, r5 - §8b THE RHIZOME'S LIFE (both rooms; spec draft 5; Nick 2:24 pm: by night fully hidden between flashes, no ghost).
//   1. GROWING: shoots lengthen as words land (the lap rule and the growth model, store/rhizomeGrowth.ts, unchanged).
//   2. THE GOAL: the brass flash, one pulse (RhizomeField, unchanged).
//   3. THE FADE: the finished network dims to about 40% and STAYS (by day; styles/arbor-v2.css draws the kept laps at .4).
//   4. NEW BRANCHING BEGINS AT THE TIP OF THE LAST GROWTH, full strength: lap v+1 grows from the last visible segment lap v drew (planLap's
//      own `start`: its first segment is that one, and every new shoot leaves its end). Off the flag a lap grows from a chosen root (today).
//   5. NIGHT: drawn only during the goal flash (the whole network then), dark between.
//   6. PERSISTENCE: IN-SESSION ONLY in the mockup (Fable, Oct 31: "Nothing is stored; storage comes from the ship brief"). This module holds,
//      per page and goal, the lap the page was first opened at in this session and the stack of clears; so leaving the page and coming back
//      keeps its history; a reload starts afresh. CLEAR RHIZOME (the mockup bar's Mood menu) clears the picture, never the writing or the
//      word count, and UNDO brings it back. The drawing regenerates from the page's seed and its count, so no drawing is held either.
// Nothing here touches storage (no localStorage, no collection, no setting).

type Clear = { count: number; lap: number; frac: number };
type Life = { firstLap: number; clears: Clear[] };
const lives = new Map<string, Life>();
let current: { key: string; count: number; lap: number; frac: number } | null = null;
let version = 0;
const listeners = new Set<() => void>();
const emit = () => { version++; listeners.forEach((fn) => fn()); };

/** The page's in-session life (made the first time the page is drawn in this session, at the lap it was opened at). */
export function lifeOf(key: string, lapNow: number): Life {
  let l = lives.get(key);
  if (!l) { l = { firstLap: lapNow, clears: [] }; lives.set(key, l); }
  return l;
}

/** RhizomeField says which page's rhizome is on screen, and where its count stands (what Clear acts on). */
export function setCurrentRhizome(key: string | null, count = 0, lap = 0, frac = 0): void {
  const was = current ? `${current.key}|${current.lap}` : '';
  current = key ? { key, count, lap, frac } : null;
  if (was !== (current ? `${current.key}|${current.lap}` : '')) emit();
}

export function hasRhizome(): boolean { return !!current; }
export function canUndoClear(): boolean { return !!current && (lives.get(current.key)?.clears.length ?? 0) > 0; }

/** Clear Rhizome: the picture starts again from here; the writing and the count are not touched. */
export function clearRhizome(): boolean {
  if (!current) return false;
  lifeOf(current.key, current.lap).clears.push({ count: current.count, lap: current.lap, frac: current.frac });
  emit();
  return true;
}

/** Undo the last Clear Rhizome on the page on screen. */
export function undoClearRhizome(): boolean {
  const l = current ? lives.get(current.key) : undefined;
  if (!l || !l.clears.length) return false;
  l.clears.pop();
  emit();
  return true;
}

export function subscribeLife(fn: () => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; }
export function lifeVersion(): number { return version; }

/** Where the drawing starts for this page now: the seed suffix (a new picture after each clear), the lap counted as visit 0, and the
 *  fraction of the current lap to draw (after a clear mid-lap the rest of that lap grows the whole new picture, so it is full at the goal). */
export function effective(life: Life, lap: number, frac: number): { suffix: string; baseLap: number; frac: number } {
  const c = life.clears[life.clears.length - 1];
  if (!c) return { suffix: '', baseLap: life.firstLap, frac };
  const f = lap === c.lap ? (c.frac >= 1 ? 1 : Math.max(0, Math.min(1, (frac - c.frac) / (1 - c.frac)))) : frac;
  return { suffix: `:clear${life.clears.length}`, baseLap: c.lap, frac: f };
}

/** The last segment of a lap that is drawn (visible): where the next lap branches from. */
export function tipOf(plan: LapPlan): GrowthSegment | null {
  for (let i = plan.segments.length - 1; i >= 0; i--) if (plan.segments[i].visible) return plan.segments[i];
  return plan.segments[plan.segments.length - 1] ?? null;
}

/** Lap `visit` (0-based, from the life's base lap): visit 0 sprouts at the page's centre; each later visit grows from the tip of the one before. */
const memo = new Map<string, LapPlan>();
export function lifePlan(geo: GrowthGeometry, seed: string, visit: number): LapPlan {
  const key = `${seed}#${visit}#${geometryKey(geo)}`;
  const hit = memo.get(key);
  if (hit) return hit;
  let start: GrowthSegment[] | null = null;
  if (visit > 0) {
    const tip = tipOf(lifePlan(geo, seed, visit - 1));
    if (tip) start = [{ ...tip, id: 0, thick: true, order: 0 }];
  }
  const plan = planLap(geo, hashSeed(`${seed}:life:${visit}`), start);
  if (memo.size > 48) memo.clear();
  memo.set(key, plan);
  return plan;
}

/** "x1,y1,x2,y2" to one decimal: how the proof (scripts/frames/arbor2-r5.mjs) compares a tip with the next lap's first segment. */
export function segKey(s: GrowthSegment | null | undefined): string | undefined {
  if (!s) return undefined;
  const f = (v: number) => (Math.round(v * 10) / 10).toString();
  return `${f(s.x1)},${f(s.y1)},${f(s.x2)},${f(s.y2)}`;
}
