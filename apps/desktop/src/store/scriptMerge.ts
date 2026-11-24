import type { ScriptDoc, ScriptEl } from '../types';
import { mergeText } from './textMerge';
import { flattenScenes, groupIntoScenes, newElement } from './scriptDoc';
import { serializeScriptDoc } from './scriptText';
import { UPPERCASE_TYPES } from './scriptMetrics';

// SCRIPT #115 (Fable, Nov 23, 5:10 pm): two copies of a screenplay, each changed since they last agreed, put back together with prose's own three-way merge (store/textMerge.ts, #76), one script line to one merge line, so it
// never drops a word either side wrote and keeps both WHOLE versions of a line both sides changed. A line is compared as the page renders it (capitals for the types that show them), because the base may be only the derived
// text (a device's sync base). A merged line takes its element, with its type and id, from this side when this side has it, else from the other. Pure: no DOM, no storage, no clock.

const NL = '\n';
const INNER_BREAK = '\u0003';   // a line break inside one element must not read as two lines

const keyOf = (el: ScriptEl): string => (UPPERCASE_TYPES.has(el.t) ? el.text.toUpperCase() : el.text).split(NL).join(INNER_BREAK);

export const scriptLineKeys = (elements: ScriptEl[]): string[] => elements.map(keyOf);

export interface ScriptLinesMerge { elements: ScriptEl[]; kept: boolean }

export function mergeScriptLines(baseKeys: string[], mine: ScriptEl[], theirs: ScriptEl[]): ScriptLinesMerge {
  const r = mergeText(baseKeys.join(NL), scriptLineKeys(mine).join(NL), scriptLineKeys(theirs).join(NL));
  const pool = new Map<string, ScriptEl[]>();
  for (const el of [...mine, ...theirs]) {
    const k = keyOf(el);
    const list = pool.get(k);
    if (list) list.push(el); else pool.set(k, [el]);
  }
  const used = new Set<string>();
  const elements = r.text.split(NL).map((k) => {
    const el = pool.get(k)?.shift() ?? newElement('action', k.split(INNER_BREAK).join(NL));
    if (used.has(el.id)) return newElement(el.t, el.text);   // both sides' versions of one line: each needs its own id
    used.add(el.id);
    return el;
  });
  return { elements, kept: r.kept };
}

/** The store's half: `baseText` is the derived text the two copies last agreed on. */
export function mergeScriptDocs(baseText: string, mine: ScriptDoc, theirs: ScriptDoc): { doc: ScriptDoc; text: string; kept: boolean } {
  const r = mergeScriptLines(baseText.split(/\n+/), flattenScenes(mine.scenes), flattenScenes(theirs.scenes));
  const doc: ScriptDoc = { v: 1, scenes: groupIntoScenes(r.elements, [...mine.scenes, ...theirs.scenes]) };
  return { doc, text: serializeScriptDoc(doc), kept: r.kept };
}
