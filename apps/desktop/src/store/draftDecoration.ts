// AB2 S0/S3 — the iA register. Draft's markdown conventions (S0: bold `**`,
// italic `*`, headings `#`/`##`, spacing = blank lines) live in `entry.text`
// as plain characters — no rich-text state, no hidden model. This module is
// the DISPLAY pass only: given the plain text, it returns an HTML string
// where the convention characters stay in the DOM (dimmed via `.md-mark`)
// and the effect they request renders live (bold/italic weight, heading
// size) — "the marks show their work." Pure and total: malformed/unclosed
// markers simply fall through as plain escaped text (never throws, never
// hides a character). Character COUNT is always preserved 1:1 against the
// input (only <span> wrapping is added), which is what lets a caller restore
// a plain-text caret offset after re-decorating (see ForwardOnlyEditor.tsx).

function escHtml(s: string): string {
  return s.replace(/[&<>]/g, c => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));
}

// Inline pass over one line: bold (`**..**`) before italic (`*..*`) so a
// bold run's own asterisks are never re-matched as italic markers.
function decorateInline(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const boldStart = text.indexOf('**', i);
    const italicStart = text.indexOf('*', i);
    if (boldStart === -1 && italicStart === -1) { out += escHtml(text.slice(i)); break; }
    if (boldStart !== -1 && (italicStart === -1 || boldStart <= italicStart)) {
      const close = text.indexOf('**', boldStart + 2);
      if (close === -1) { out += escHtml(text.slice(i)); break; }
      out += escHtml(text.slice(i, boldStart));
      const inner = text.slice(boldStart + 2, close);
      out += `<span class="md-bold"><span class="md-mark">**</span>${escHtml(inner)}<span class="md-mark">**</span></span>`;
      i = close + 2;
      continue;
    }
    const close = text.indexOf('*', italicStart + 1);
    if (close === -1) { out += escHtml(text.slice(i)); break; }
    out += escHtml(text.slice(i, italicStart));
    const inner = text.slice(italicStart + 1, close);
    out += `<span class="md-italic"><span class="md-mark">*</span>${escHtml(inner)}<span class="md-mark">*</span></span>`;
    i = close + 1;
  }
  return out;
}

const H2 = /^(##\s+)([\s\S]*)$/;
const H1 = /^(#\s+)([\s\S]*)$/;

export function decorateMarkdown(text: string): string {
  return text
    .split('\n')
    .map(line => {
      const h2 = line.match(H2);
      if (h2) return `<span class="md-h2"><span class="md-mark">${escHtml(h2[1])}</span>${decorateInline(h2[2])}</span>`;
      const h1 = line.match(H1);
      if (h1) return `<span class="md-h1"><span class="md-mark">${escHtml(h1[1])}</span>${decorateInline(h1[2])}</span>`;
      return decorateInline(line);
    })
    .join('\n');
}

// AB2 fix (post-build review) — a documented Chromium contenteditable
// quirk, proven via the harness's own typeKeys driving against a bare,
// React-free contenteditable: a caret positioned at the very end of a text
// node whose OWN content ends in '\n', with nothing after it, causes the
// NEXT typed character to land BEFORE that trailing newline instead of
// after it — even though window.getSelection() correctly reports the caret
// at the true end. Chrome's native default Enter handling doesn't hit this
// (it never leaves a bare trailing '\n' text node), but decorateMarkdown's
// flat-text redecoration always does whenever the caret needs to land at
// the tail of trailing-newline content. The standard workaround (used by
// every serious contenteditable-based editor for exactly this class of
// quirk): append an invisible zero-width-space sentinel and park the caret
// INSIDE it instead — a text node that does NOT itself end in '\n', which
// resolves the quirk. The sentinel is transient and MUST be stripped via
// readEditorPlainText before the result ever reaches entry.text — every
// caller that redecorates a live contenteditable through this module
// (ForwardOnlyEditor.tsx's drafting branch, PageEditor.tsx's rail format
// actions) shares this one pair of helpers so neither path can drift back
// into the unguarded bug.
const EOF_GUARD = '​';

/** Strip the EOF guard from raw DOM text, adjusting a raw caret offset to
 * account for any guard characters that preceded it. Wherever the guard
 * ends up in the string (not just the tail — once real typing continues
 * past it, it's no longer at the tail), it is removed. */
export function readEditorPlainText(raw: string, rawOffset: number | null): { plain: string; caret: number | null } {
  if (rawOffset === null) return { plain: raw.split(EOF_GUARD).join(''), caret: null };
  let removedBefore = 0;
  let plain = '';
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === EOF_GUARD) { if (i < rawOffset) removedBefore++; continue; }
    plain += raw[i];
  }
  return { plain, caret: rawOffset - removedBefore };
}

/** Redecorate `el`'s innerHTML from `plain` and restore the caret at
 * `caret`, guarding against the trailing-newline-at-EOF quirk above. The
 * one place a live contenteditable's decorated DOM is ever written from
 * plain text + a caret offset — do not `el.innerHTML = decorateMarkdown(...)`
 * directly outside this helper. */
export function decorateEditorFor(
  el: HTMLElement,
  plain: string,
  caret: number | null,
  setCaretOffset: (el: HTMLElement, target: number) => void,
): void {
  if (caret === null) return;
  const needsGuard = plain.endsWith('\n');
  el.innerHTML = decorateMarkdown(plain) + (needsGuard ? `<span class="md-eof-guard" aria-hidden="true">${EOF_GUARD}</span>` : '');
  if (needsGuard && caret === plain.length) {
    const guardText = el.lastElementChild?.firstChild as Text | null;
    const sel = window.getSelection();
    if (guardText && sel) {
      const r = document.createRange();
      r.setStart(guardText, guardText.data.length);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      return;
    }
  }
  setCaretOffset(el, caret);
}
