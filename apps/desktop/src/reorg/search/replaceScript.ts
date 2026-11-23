import type { ScriptDoc } from '../../types';
import { UPPERCASE_TYPES } from '../../store/scriptMetrics';
import { scriptTextSpans } from '../../store/scriptText';
import { findAll } from './searchFind';

// FIND AND REPLACE ON A SCREENPLAY (SCRIPT #1; Fable, Nov 22, 10:10 pm). The search reads a page's derived text (`entry.text`), but a screenplay's words
// live in its script lines (`entry.script`): the derived text is only their rendering, rebuilt on every save. So a find is carried back to the line it
// was rendered from and the LINE is what changes. Pure: it builds a new document and writes nothing.

/** Replace the finds at these offsets of the document's derived text. Lines keep their ids and types. A line the app draws in capitals stores the replacement in capitals. A find whose letters are no longer there is left alone. */
export function replaceInScript(doc: ScriptDoc, ats: number[], q: string, put: string, capital: (found: string, put: string) => string): { doc: ScriptDoc; n: number } {
  const spans = scriptTextSpans(doc);
  const next: ScriptDoc = { ...doc, scenes: doc.scenes.map((s) => ({ ...s, heading: { ...s.heading }, body: s.body.map((el) => ({ ...el })) })) };
  const lineOf = (scene: number, el: number) => (el === 0 ? next.scenes[scene].heading : next.scenes[scene].body[el - 1]);
  const rawOf = (scene: number, el: number) => (el === 0 ? doc.scenes[scene].heading.text : doc.scenes[scene].body[el - 1].text);
  let n = 0;
  for (const at of [...ats].sort((a, b) => b - a)) {   // last first, so an edit never moves a find still to come in the same line
    const span = [...spans].reverse().find((s) => s.start <= at);
    if (!span) continue;
    const local = at - span.start;
    if (local + q.length > span.shown.length || span.shown.slice(local, local + q.length).toLowerCase() !== q.toLowerCase()) continue;
    const raw = rawOf(span.sceneIndex, span.elIndex);
    // capitals can change a word's length (ß is SS): then the find is located in the stored line by its place among the line's finds
    const rawAt = raw.length === span.shown.length ? local : findAll(raw, q)[findAll(span.shown, q).indexOf(local)];
    if (rawAt === undefined) continue;
    const found = raw.slice(rawAt, rawAt + q.length);
    if (found.toLowerCase() !== q.toLowerCase()) continue;
    const line = lineOf(span.sceneIndex, span.elIndex);
    const word = capital(found, put);
    line.text = line.text.slice(0, rawAt) + (UPPERCASE_TYPES.has(line.t) ? word.toUpperCase() : word) + line.text.slice(rawAt + q.length);
    n += 1;
  }
  return { doc: next, n };
}

/** The same lines, in the same order, with the same ids, types and words: what "still as the replace left it" means for a screenplay. */
export function sameScriptLines(a: ScriptDoc | undefined, b: ScriptDoc | undefined): boolean {
  const lines = (d: ScriptDoc | undefined) => JSON.stringify((d?.scenes ?? []).flatMap((s) => [s.heading, ...s.body]).map((e) => [e.id, e.t, e.text]));
  return lines(a) === lines(b);
}
