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
