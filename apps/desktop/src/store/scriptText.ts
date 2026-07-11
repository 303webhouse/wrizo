import type { ScriptDoc, ScriptElType } from '../types';

// S1 — the derived prose shadow (fragments-canon §2.4): a ScriptDoc's plain-
// text serialization, written to `entry.text` on every save so resume,
// mirror cards, `firstLine()`, and future search stay literate about a script
// page for free. This string is ALSO S3's future Fountain parser input — keep
// it boring and stable. Golden-string tested in `scripts/harness/s1.mjs`; a
// change here is a breaking change to that contract.
//
// Rules: elements render in document order (scene heading, then its body),
// blank-line separated between elements — EXCEPT a character line and the
// paren/dialogue lines that continue its speech stay directly beneath one
// another (no blank line), so a dialogue block reads as one visual unit.
// Sluglines/character/transition/shot render UPPERCASE (matching the
// house's "uppercase types store uppercased on commit" rule — by the time
// this runs, `el.text` is already the committed, cased value, but we
// uppercase defensively here too since this function is the single source
// of truth for the derived shadow). No indentation, no markup.

const UPPERCASE_TYPES: ReadonlySet<ScriptElType> = new Set(['scene', 'character', 'transition', 'shot']);

// A paren/dialogue line stays tight under a character line, or under another
// paren/dialogue line (a multi-line speech) — a run of dialogue-block members.
function isDialogueBlockMember(t: ScriptElType): boolean {
  return t === 'character' || t === 'paren' || t === 'dialogue';
}

export function serializeScriptDoc(doc: ScriptDoc): string {
  const parts: string[] = [];
  let prevType: ScriptElType | null = null;
  for (const scene of doc.scenes) {
    const elements = [scene.heading, ...scene.body];
    for (const el of elements) {
      const text = UPPERCASE_TYPES.has(el.t) ? el.text.toUpperCase() : el.text;
      const tight = prevType != null && isDialogueBlockMember(prevType) && (el.t === 'paren' || el.t === 'dialogue');
      if (parts.length === 0) parts.push(text);
      else if (tight) parts.push('\n' + text);
      else parts.push('\n\n' + text);
      prevType = el.t;
    }
  }
  return parts.join('');
}
