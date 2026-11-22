import { flushNow, getJournalEntry, patchJournalEntry } from '../../store/persistence';
import type { DeskTermId } from '../../store/deskLexicon';
import type { Hit } from './searchFind';

// FIND AND REPLACE INSIDE THE CURRENT DOC (reorg plan draft 2, section 3 item 4; the prototype's replaceHits). Only the words of the Doc she is in
// are ever replaced (the menu passes this Doc's finds and nothing else); across a Project is a later bet. Each press is one step to undo. A find
// that starts with a capital keeps it ("Tolls" becomes "Fees"; PROPOSED, Fable, Nov 14). Every write goes through the store's own patch, and an
// open page adopts it (#76: a page with nothing unsaved shows the new words; one with unsaved words has the two merged). A find whose letters are
// no longer there (the words moved since the search read them) is left alone. An Undo restores a step only when every text it wrote is still as
// it wrote it; otherwise it refuses and writes nothing.

export interface ReplaceStep { before: Record<string, string>; after: Record<string, string> }
export interface ReplaceSaid { key: DeskTermId; vals: Record<string, string | number> }

const steps: ReplaceStep[] = [];

/** the replacement for one find: a capital first letter is kept when what she typed starts in lower case */
function keepCapital(found: string, put: string): string {
  const first = found.charAt(0);
  if (first !== first.toLowerCase() && put.charAt(0) === put.charAt(0).toLowerCase()) return put.charAt(0).toUpperCase() + put.slice(1);
  return put;
}

/** Replace these finds (all of this Doc's, or one) with `put`. Returns what to say, or null when nothing was replaced. */
export function replaceHits(hits: Hit[], q: string, put: string): ReplaceSaid | null {
  if (!put || !hits.length) return null;
  const byEntry = new Map<string, Hit[]>();
  for (const h of hits) if (h.boxId == null) byEntry.set(h.entryId, [...(byEntry.get(h.entryId) ?? []), h]);
  const step: ReplaceStep = { before: {}, after: {} };
  let n = 0;
  for (const [id, list] of byEntry) {
    const e = getJournalEntry(id);
    if (!e) continue;
    let text = e.text ?? '';
    const was = text;
    for (const h of [...list].sort((a, b) => b.at - a.at)) {
      const found = text.slice(h.at, h.at + h.len);
      if (found.toLowerCase() !== q.toLowerCase()) continue;
      text = text.slice(0, h.at) + keepCapital(found, put) + text.slice(h.at + h.len);
      n += 1;
    }
    if (text === was) continue;
    patchJournalEntry(id, text, {});
    step.before[id] = was;
    step.after[id] = text;
  }
  if (!n) return null;
  flushNow();
  steps.push(step);
  return n === 1 ? { key: 'reorgReplacedOne', vals: { q, with: put } } : { key: 'reorgReplacedMany', vals: { n, q, with: put } };
}

export const canUndoReplace = (): boolean => steps.length > 0;

/** Undo the last replace, when every text it wrote is still as it wrote it. */
export function undoReplace(): ReplaceSaid | null {
  const step = steps.pop();
  if (!step) return null;
  const ids = Object.keys(step.after);
  if (ids.some((id) => (getJournalEntry(id)?.text ?? null) !== step.after[id])) return { key: 'reorgReplaceUndoNo', vals: {} };
  for (const id of ids) patchJournalEntry(id, step.before[id], {});
  flushNow();
  return { key: 'reorgReplaceUndone', vals: {} };
}

/** The search closed: its replace steps go with it. */
export function forgetReplaces(): void { steps.length = 0; }
