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

// The text of the last (trailing) unstruck run — the live tail the runway eats
// from. Struck runs accumulate at the end as the runway escalates.
export function lastUnstruckText(content: Run[]): string {
  for (let i = content.length - 1; i >= 0; i--) {
    if (!content[i].struck && content[i].text.length > 0) return content[i].text;
  }
  return '';
}

// Strike the trailing `n` characters of the last unstruck run — they move into
// their own struck run (stay visible, line-through; drop from derived prose); the
// rest of the run stays unstruck. Forward-only: nothing is erased, the run text
// is only re-partitioned. Reports whether anything changed (for locked presses).
export function strikeTail(content: Run[], n: number): { content: Run[]; changed: boolean } {
  if (n <= 0) return { content, changed: false };
  for (let i = content.length - 1; i >= 0; i--) {
    const run = content[i];
    if (run.struck || run.text.length === 0) continue;
    const take = Math.min(n, run.text.length);
    const head = run.text.slice(0, run.text.length - take);
    const tail = run.text.slice(run.text.length - take);
    const repl: Run[] = head ? [{ text: head, struck: false }, { text: tail, struck: true }]
                             : [{ text: tail, struck: true }];
    const next = content.slice();
    next.splice(i, 1, ...repl);
    return { content: next, changed: true };
  }
  return { content, changed: false };
}

// AB2 S2 — the forward lock's OFF path (store/forwardLock.ts). A real erase,
// not a strike: the trailing `n` characters of the last unstruck run are
// actually removed (never marked struck, never recoverable), mirroring
// strikeTail's tail-finding shape exactly so the two behaviors stay easy to
// compare. Never touches a struck run — an already-struck history stays
// exactly as it is regardless of the lock setting.
export function eraseTail(content: Run[], n: number): Run[] {
  if (n <= 0) return content;
  for (let i = content.length - 1; i >= 0; i--) {
    const run = content[i];
    if (run.struck || run.text.length === 0) continue;
    const take = Math.min(n, run.text.length);
    const head = run.text.slice(0, run.text.length - take);
    const next = content.slice();
    if (head) next.splice(i, 1, { ...run, text: head });
    else next.splice(i, 1);
    return next;
  }
  return content;
}

const SENT_END = /[.!?]/;
function trailingNonWS(t: string): number {
  let n = 0;
  for (let i = t.length - 1; i >= 0 && !/\s/.test(t[i]); i--) n++;
  return n;
}
// Trailing whitespace + the word before it (the "last full word").
function lastWordLen(t: string): number {
  let i = t.length - 1, ws = 0, w = 0;
  while (i >= 0 && /\s/.test(t[i])) { ws++; i--; }
  while (i >= 0 && !/\s/.test(t[i])) { w++; i--; }
  return ws + w;
}
// Chars from the end back to (not including) the previous sentence terminator —
// the "rest of the current sentence". At a sentence boundary (tail ends in a
// terminator), the LAST FULL sentence (back to the terminator before it).
function restOfSentenceLen(t: string): number {
  let last = -1;
  for (let i = t.length - 1; i >= 0; i--) { if (SENT_END.test(t[i])) { last = i; break; } }
  if (last === t.length - 1) {
    let prev = -1;
    for (let i = last - 1; i >= 0; i--) { if (SENT_END.test(t[i])) { prev = i; break; } }
    return t.length - (prev + 1);
  }
  return t.length - (last + 1); // last === -1 ⇒ whole tail (the sentence so far)
}

// The revised forward-only runway (Journal mode). Every backspace STRIKES — never
// deletes — escalating with CONSECUTIVE presses (typing resets to step 1):
//   1: last single char        2: next char back      3: rest of the current word
//   4: the previous word       5: rest of the current sentence    6+: locked
// Struck content stays visible and is excluded from derived/saved prose by
// derivedText (which filters by run.struck — granularity-agnostic).
export function strikeStep(content: Run[], step: number): { content: Run[]; changed: boolean } {
  const t = lastUnstruckText(content);
  let n: number;
  if (step === 1 || step === 2) n = 1;
  else if (step === 3) n = trailingNonWS(t) > 0 ? trailingNonWS(t) : lastWordLen(t);
  else if (step === 4) n = lastWordLen(t);
  else if (step === 5) n = restOfSentenceLen(t);
  else return { content, changed: false }; // 6+ locked
  return strikeTail(content, n);
}

// A space, newline, or tab flushes the active-word buffer into the runs.
export function isBoundary(ch: string): boolean {
  return ch === ' ' || ch === '\n' || ch === '\t';
}
