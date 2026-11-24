import type { ScriptEl } from '../types';

// S1 — smart conversions that happen WHILE typing (live), distinct from the
// autocomplete popover. Pure/testable, no DOM.

// A leading int./ext./i/e, followed by a period, a space or a slash, promotes
// an action element to a scene heading, live — as soon as it's recognizable,
// not on commit. SCRIPT #7: the mark must be finished, so Interesting, Extra and
// Estelle stay action; and EST counts only in capitals, because "Est. 1962" is
// a sentence.
const SLUGLINE_PROMOTE_RE = /^\s*(int|ext|i\/e)[.\s/]/i;
const ESTABLISHING_PROMOTE_RE = /^\s*EST[.\s/]/;

export function shouldPromoteToScene(text: string): boolean {
  return SLUGLINE_PROMOTE_RE.test(text) || ESTABLISHING_PROMOTE_RE.test(text);
}

// SCRIPT #7: a parenthetical wears its parentheses once the line is left. A finished one is untouched; a blank one stays blank.
export function withParentheses(text: string): string {
  const s = text.trim();
  if (!s) return text;
  const opens = s.startsWith('(');
  const closes = s.endsWith(')');
  if (opens && closes) return text;
  if (opens) return `${s})`;
  return closes && !s.includes('(') ? `(${s}` : `(${s})`;
}

// Auto (CONT'D): committing a character element whose name (sans extension)
// matches the most recent PRIOR character element, with at least one action
// element between them, gains " (CONT'D)" — unless it's already present.
export function applyAutoContd(elements: ScriptEl[], activeIndex: number, text: string): string {
  const el = elements[activeIndex];
  if (!el || el.t !== 'character') return text;
  if (/\(CONT'D\)\s*$/i.test(text)) return text;
  const currentName = text.split('(')[0].trim().toUpperCase();
  if (!currentName) return text;
  let sawAction = false;
  for (let i = activeIndex - 1; i >= 0; i--) {
    const other = elements[i];
    if (other.t === 'character') {
      const priorName = other.text.split('(')[0].trim().toUpperCase();
      return sawAction && priorName === currentName ? `${text} (CONT'D)` : text;
    }
    if (other.t === 'action') sawAction = true;
  }
  return text;
}
