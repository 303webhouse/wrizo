// FREE WRITE'S HOST, UPDATED BY APPENDING (bug-list #110 and #101; Fable, Nov 22, 2:30 pm). A committed word (Space) or a new line (Enter) used to give the editor a NEW html string for the WHOLE page, and React set the host's innerHTML to it:
// 254 KB at 50,000 words, every node of the page made again, its layout started from nothing, and the caret re-anchored on top of it (removeAllRanges 22 ms a key at 50,000 words against 6 for a letter, 10 against 2 at 20,000:
// space-enter-cost.mjs on main). But the page is drawn LINE BY LINE (decorateMarkdownForCard splits at every newline and decorates each line alone), so a word added at the end of the last run changes only the TAIL of that run's html:
// the new html is the old html with more at its end. This is the rule that says when that holds, as a pure function so it can be proved and shown to fail (scripts/harness/free-write-host-unit.mjs).
//   same    nothing changed
//   tail    the runs are the same count, none but the last differs, the last has the same wrapper and its html is the old html with MORE at its end: append that suffix inside the last run's element
//   newrun  one run was added after runs that did not change: add that run's element
//   full    anything else (a strike, an edit in the middle, the first paint, an empty page): the host is written whole, as it always was
export interface RunHtml { struck: boolean; inner: string }
export type HostPlan = { kind: 'same' } | { kind: 'tail'; suffix: string } | { kind: 'newrun'; run: RunHtml } | { kind: 'full' };

export const runElementHtml = (r: RunHtml): string => `<span class="fo-run${r.struck ? ' fo-struck' : ''}">${r.inner}</span>`;

const same = (a: RunHtml, b: RunHtml): boolean => a.struck === b.struck && a.inner === b.inner;

export function planHost(prev: readonly RunHtml[] | null, next: readonly RunHtml[]): HostPlan {
  if (!prev || prev.length === 0 || next.length === 0) return { kind: 'full' };
  if (next.length === prev.length) {
    for (let i = 0; i < next.length - 1; i += 1) if (!same(prev[i], next[i])) return { kind: 'full' };
    const a = prev[prev.length - 1];
    const b = next[next.length - 1];
    if (same(a, b)) return { kind: 'same' };
    // TAIL-ONLY: the same kind of run, and the new html begins with every character of the old
    if (a.struck === b.struck && !b.struck && b.inner.length > a.inner.length && b.inner.startsWith(a.inner)) return { kind: 'tail', suffix: b.inner.slice(a.inner.length) };
    return { kind: 'full' };
  }
  if (next.length === prev.length + 1) {
    for (let i = 0; i < prev.length; i += 1) if (!same(prev[i], next[i])) return { kind: 'full' };
    return { kind: 'newrun', run: next[next.length - 1] };
  }
  return { kind: 'full' };
}
