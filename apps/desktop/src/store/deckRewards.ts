import type { Box } from '../types';
import { splitCard } from './guided';
import { effectiveAmbianceDial } from './ambianceDial';

const CELEBRATE_GLOW_MS = 1100;   // the celebration grammar's own length (components/WritingIncentives.tsx CELEBRATE_MS; not imported here so the store never pulls in a component)

// W5 - GAPS AND THE THREE REWARD MOMENTS (brief Downloads\w5-gaps-rewards-brief.md; Nick's rulings Oct 26). The PURE decisions and the ONE device-local memory live here; components/DeckGaps.tsx draws the line,
// components/useDeckRewards.ts times the moments, and the stylesheet's W5 zone dresses them. Everything is computed from `kindled()` (store/guided.ts) - the single gate - which this file is handed, never re-derives.
//
// THE GUARDRAILS (binding; harness guided-w5 pins them): names, never a count; a moment happens ONCE per step and per Deck, identical every time; rewards only for the writer's words or a graft to a page, never for
// a click or a view; nothing speaks first (no toast, no reminder, no idle nudge); a writer who never opens a Deck sees nothing new. Lit (the writer's own mark) never celebrates and never counts.

/** The line names at most this many steps, then an ellipsis. */
export const GAPS_MAX = 3;
const NAME_MAX = 32;
const UNTITLED = 'Untitled';

export interface Gap { id: string; name: string }
export interface GapsLine { names: Gap[]; more: boolean }

/** A step's NAME for the line: its title line (a dealt step's title is the deck's step name), shortened; a step with no title is still named, never blank. */
function nameOf(box: Pick<Box, 'text'>): string {
  const title = splitCard(box.text).title.trim();
  if (!title) return UNTITLED;
  return title.length > NAME_MAX ? `${title.slice(0, NAME_MAX - 1).trimEnd()}\u2026` : title;
}

/** THE GAPS LINE: the steps with nothing yet, as NAMES (never a count, never "N left"): the Deck's order starting AFTER the current step and wrapping round, so the current step comes last. At most GAPS_MAX names,
 *  and `more` says there are others (rendered "..."). `fromIndex` is the current step's index in the Walk, or -1 in Open (no current: from the first). Null when every step is kindled - the line simply disappears. */
export function gapsOf(order: readonly Box[], kindledIds: ReadonlySet<string>, fromIndex: number): GapsLine | null {
  const n = order.length;
  const start = fromIndex + 1;
  const rotated = Array.from({ length: n }, (_, i) => order[(start + i) % n]);
  const gaps = rotated.filter((b) => !kindledIds.has(b.id));
  if (gaps.length === 0) return null;
  return { names: gaps.slice(0, GAPS_MAX).map((b) => ({ id: b.id, name: nameOf(b) })), more: gaps.length > GAPS_MAX };
}

/** WHICH MOMENTS FIRE, as a pure decision over two frames of the kindled set. `prev` null is the first frame (the mount): a baseline, nothing fires. `newly` = the steps that turned kindled between the frames (her words,
 *  or a graft - never a Lit mark, which changes no kindled set). A step's moment fires only if it was never celebrated on this device (a re-kindle after deleting and retyping does not fire again). The Deck's fires only
 *  when a kindle was the one that completed it and it never has: deleting the one empty step completes nothing - a reward is for words or pages, never for a click. */
export function kindleMoments(a: { prev: ReadonlySet<string> | null; next: ReadonlySet<string>; stepIds: readonly string[]; celebratedCards: ReadonlySet<string>; deckDone: boolean }): { cards: string[]; deck: boolean } {
  const { prev, next, stepIds, celebratedCards, deckDone } = a;
  if (!prev) return { cards: [], deck: false };
  const newly = stepIds.filter((id) => next.has(id) && !prev.has(id));
  const cards = newly.filter((id) => !celebratedCards.has(id));
  const complete = stepIds.length > 0 && stepIds.every((id) => next.has(id));
  return { cards, deck: newly.length > 0 && complete && !deckDone };
}

// ---- the ONE device-local memory ("already celebrated": card ids and deck ids; the planTrail / deckHint pattern - no saved data; a second device may celebrate once more, and that is fine) --------------------------
export const CELEBRATED_KEY = 'wrizo-celebrated';
type Kind = 'card' | 'deck';
interface Memory { cards: string[]; decks: string[] }

function readMemory(): Memory {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CELEBRATED_KEY) : null;
    const p = raw ? JSON.parse(raw) : null;
    return { cards: Array.isArray(p?.cards) ? p.cards.filter((x: unknown): x is string => typeof x === 'string') : [], decks: Array.isArray(p?.decks) ? p.decks.filter((x: unknown): x is string => typeof x === 'string') : [] };
  } catch { return { cards: [], decks: [] }; }
}

export function hasCelebrated(kind: Kind, id: string): boolean {
  const m = readMemory();
  return (kind === 'card' ? m.cards : m.decks).includes(id);
}

/** Remember that this step / Deck has had its moment (or was already begun when the Deck was opened). Idempotent; blocked storage simply means this device does not remember. */
export function markCelebrated(kind: Kind, id: string): void {
  try {
    const m = readMemory();
    const list = kind === 'card' ? m.cards : m.decks;
    if (list.includes(id)) return;
    list.push(id);
    localStorage.setItem(CELEBRATED_KEY, JSON.stringify(m));
  } catch { /* blocked: this device simply does not remember */ }
}

/** The moment-two door for FIX's W2 (a page born from a step): ONE glow on the return chip as the page opens. Exported here and wired there. Idempotent: an element that has glowed does not glow again, and a missing
 *  element is a no-op. Reduced motion and Ambiance 0 get the still state (the stylesheet turns the animation off; the marker still lands). Returns whether it glowed now. */
export function celebrateReturnChip(el: Element | null | undefined): boolean {
  if (!el) return false;
  if (el.hasAttribute('data-celebrated')) return false;
  el.setAttribute('data-celebrated', 'true');
  if (effectiveAmbianceDial() === 0) return true;   // reduced motion / Ambiance 0: the still state - the marker lands, nothing plays
  el.classList.add('return-chip-glow');
  const t = setTimeout(() => el.classList.remove('return-chip-glow'), CELEBRATE_GLOW_MS);
  (t as unknown as { unref?: () => void }).unref?.();
  return true;
}
