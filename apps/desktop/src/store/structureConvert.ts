import type { ScriptDoc } from '../types';
import { createEmptyScriptDoc, newElement } from './scriptDoc';

// AB2 S4 — the Structure picker's MECHANICAL conversions. No AI, no LLM
// calls: deterministic paragraph<->element mapping, the writer's words move
// verbatim. Pure functions; the caller (PageEditor.tsx / ScriptEditor.tsx)
// owns flushing pending text, the confirmation UI, and the actual
// persistence write (saveJournalEntry) — this module only ever builds the
// converted document/predicate, never touches storage.

// Prose -> Screenplay: each blank-line-separated paragraph becomes one
// 'action' element in a fresh single-scene ScriptDoc (the substrate's own
// birth path — createEmptyScriptDoc — reused verbatim, not reinvented).
export function proseTextToScriptDoc(text: string): ScriptDoc {
  const doc = createEmptyScriptDoc();
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);
  doc.scenes[0].body = paragraphs.map(p => newElement('action', p));
  return doc;
}

export function isProseEmpty(text: string): boolean {
  return text.trim().length === 0;
}

// Screenplay -> Prose: `entry.text` (the derived shadow, kept current by
// every script save — store/scriptText.ts's serializeScriptDoc) IS the
// prose rendering; nothing to compute here. Element types do not survive
// the trip (the one-way warning the caller shows before acting).
export function isScriptEmpty(doc: ScriptDoc): boolean {
  return doc.scenes.every(s => !s.heading.text.trim() && s.body.every(el => !el.text.trim()));
}
