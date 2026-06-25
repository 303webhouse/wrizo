// CW2 — the forward-only writing mechanic, as a pure engine on the DM1 Run
// model. This is the single source of the locked mechanic; ForwardOnlyEditor
// drives it and the gate / journal page (CW3) adopt the same component. Pure and
// immutable so React can hold `content` in state and so the rules are testable
// without a DOM.
//
// Mirrors the DM1 store op semantics (appendText / toggleStruck / a struck-run
// append) on an in-memory single-fragment `Run[]`. The editor derives prose from
// this and reports it up as draftText; persistence stays the host's job (DM1's
// store ops persist the real fragment graph — wired when fragment sync lands).
// Forward-only is total here too: text is appended, runs are struck, NOTHING is
// erased and no run text is edited in place.
import type { Run } from '../types';

// Seed a fragment's runs from an initial text (one unstruck run, or empty).
export function seedContent(text: string): Run[] {
  return text ? [{ text, struck: false }] : [];
}

// Derived prose: the unstruck runs concatenated (one fragment → no separators).
// This is sprintTextOf for a single spine fragment; the active (uncommitted)
// word is added by the editor on top of this.
export function derivedText(content: Run[]): string {
  return content.filter(r => !r.struck).map(r => r.text).join('');
}

// Append text: extend the last unstruck run, or start a new run (after a strike).
// Same rule as DM1 appendText.
export function append(content: Run[], text: string): Run[] {
  const last = content[content.length - 1];
  if (last && !last.struck) return [...content.slice(0, -1), { ...last, text: last.text + text }];
  return [...content, { text, struck: false }];
}

// Append a NEW struck run — the keyboard word-strike: a word scratched from the
// draft stays visible, struck, in its own run. Forward-only (never erased).
export function appendStruck(content: Run[], text: string): Run[] {
  return [...content, { text, struck: true }];
}

// Strike the most recent unstruck run (toggle to struck). Reports whether it
// changed anything, so the editor can count ineffective ("locked") presses.
export function strikeLastUnstruck(content: Run[]): { content: Run[]; changed: boolean } {
  for (let i = content.length - 1; i >= 0; i--) {
    if (!content[i].struck) {
      const next = content.slice();
      next[i] = { ...next[i], struck: true };
      return { content: next, changed: true };
    }
  }
  return { content, changed: false };
}

// A space, newline, or tab flushes the active-word buffer into the runs.
export function isBoundary(ch: string): boolean {
  return ch === ' ' || ch === '\n' || ch === '\t';
}
