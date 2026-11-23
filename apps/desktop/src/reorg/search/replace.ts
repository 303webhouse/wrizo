import { flushNow, getJournalEntry, patchJournalEntry, saveScriptDoc } from '../../store/persistence';
import { serializeScriptDoc } from '../../store/scriptText';
import type { DeskTermId } from '../../store/deskLexicon';
import type { ScriptDoc } from '../../types';
import { findAll, type Hit } from './searchFind';
import { adoptOpenScript, flushOpenScript } from './openScript';
import { replaceInScript, sameScriptLines } from './replaceScript';

// FIND AND REPLACE INSIDE THE CURRENT DOC (reorg plan draft 2, section 3 item 4; the prototype's replaceHits). Only the words of the Doc she is in
// are ever replaced (the menu passes this Doc's finds and nothing else); across a Project is a later bet. Each press is one step to undo. A find
// that starts with a capital keeps it ("Tolls" becomes "Fees"; PROPOSED, Fable, Nov 14). Every write goes through the store's own patch, and an
// open page adopts it (#76: a page with nothing unsaved shows the new words; one with unsaved words has the two merged). A find whose letters are
// no longer there (the words moved since the search read them) is left alone. An Undo restores a step only when every text it wrote is still as
// it wrote it; otherwise it refuses and writes nothing.
// A SCREENPLAY (SCRIPT #1): its words are its script lines, so those are what a replace and its Undo write (replaceScript.ts); the derived text follows
// them in the same save, and an open script page saves its typing first and takes the new lines afterwards (openScript.ts).

export interface ReplaceStep { before: Record<string, string>; after: Record<string, string>; scripts: Record<string, { before: ScriptDoc; after: ScriptDoc }> }
export interface ReplaceSaid { key: DeskTermId; vals: Record<string, string | number> }

const steps: ReplaceStep[] = [];

/** the replacement for one find: an all-caps find of two letters or more is replaced in all caps (MARA to DELIA; Fable, Nov 22); otherwise a capital first letter is kept when what she typed starts in lower case */
function keepCapital(found: string, put: string): string {
  const letters = found.replace(/\P{L}/gu, '');
  if ([...letters].length >= 2 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()) return put.toUpperCase();
  const first = found.charAt(0);
  if (first !== first.toLowerCase() && put.charAt(0) === put.charAt(0).toLowerCase()) return put.charAt(0).toUpperCase() + put.slice(1);
  return put;
}

/** A script page's finds after it saved its typing: the same offsets when nothing moved; every find when she pressed Replace all; otherwise each by its place among the finds, and none when their number changed (the words moved, so they are left alone). */
function currentFinds(list: Hit[], text: string, q: string): number[] {
  const seen = list[0].text;
  if (seen === text) return list.map((h) => h.at);
  const was = findAll(seen, q), now = findAll(text, q);
  if (list.length === was.length) return now;
  if (was.length !== now.length) return [];
  return list.map((h) => now[was.indexOf(h.at)]).filter((at): at is number => at !== undefined);
}

/** Replace these finds (all of this Doc's, or one) with `put`. Returns what to say, or null when nothing was replaced. */
export function replaceHits(hits: Hit[], q: string, put: string): ReplaceSaid | null {
  if (!put || !hits.length) return null;
  const byEntry = new Map<string, Hit[]>();
  for (const h of hits) if (h.boxId == null) byEntry.set(h.entryId, [...(byEntry.get(h.entryId) ?? []), h]);
  const step: ReplaceStep = { before: {}, after: {}, scripts: {} };
  let n = 0;
  for (const [id, list] of byEntry) {
    if (getJournalEntry(id)?.pageType === 'script') flushOpenScript(id);
    const e = getJournalEntry(id);
    if (!e) continue;
    if (e.pageType === 'script' && e.script) {
      const r = replaceInScript(e.script, currentFinds(list, serializeScriptDoc(e.script), q), q, put, keepCapital);
      if (!r.n) continue;
      saveScriptDoc(id, r.doc);
      adoptOpenScript(id);
      step.before[id] = e.text ?? '';
      step.after[id] = getJournalEntry(id)?.text ?? '';
      step.scripts[id] = { before: e.script, after: r.doc };
      n += r.n;
      continue;
    }
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
  for (const id of ids) if (step.scripts[id]) flushOpenScript(id);   // typing not saved yet counts as a change: Undo must see it
  const changed = (id: string) => {
    const e = getJournalEntry(id);
    return (e?.text ?? null) !== step.after[id] || (!!step.scripts[id] && !sameScriptLines(e?.script, step.scripts[id].after));
  };
  if (ids.some(changed)) return { key: 'reorgReplaceUndoNo', vals: {} };
  for (const id of ids) {
    const script = step.scripts[id];
    if (script) { saveScriptDoc(id, script.before); adoptOpenScript(id); } else patchJournalEntry(id, step.before[id], {});
  }
  flushNow();
  return { key: 'reorgReplaceUndone', vals: {} };
}

/** The search closed: its replace steps go with it. */
export function forgetReplaces(): void { steps.length = 0; }
