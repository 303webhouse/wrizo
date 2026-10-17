import { useEffect, useRef, useState } from 'react';
import { parseTitlePage, serializeTitlePage, type TitleSheetFields } from '../store/titlePage';

// PAGE TEMPLATES, S5 (docs/plans/page-templates.md section 1; Fable Oct 16, Q1: a small STRUCTURED editor). The Title Page is five fields on the standard manuscript
// sheet - contact top-left, the word line top-right, then the title, the fixed word "by" and the author centred lower (the approved mockup). A flowing text editor cannot
// put the word line on the same row as the first contact line, so this is a small form over the page's own text: every edit serializes to the CANONICAL text
// (store/titlePage.ts, pure and golden-tested, written in the page dialect's `>> ` and `>< ` directives) and goes through the host's one onChange, so saving, birth
// on the first word, sync, export and copy are the page's own - there is no second model and no column. The text it reads back is parsed by structure; the host only
// mounts this when the text parses (otherwise the page draws as plain Draft text and nothing is lost).
//
// The title is stored as typed; the sheet's capitals and letter-spacing are CSS. "by" is drawn, never typed, and is written into the text only once a title or
// author exists, so a fresh Title Page is the empty string (no words, nothing born).

// SPELL-CHECK (Fable's ruling, Oct 17): ON for the title - it is the writer's own words, like the page - and OFF for the author, the contact block and the word line, which are
// names, addresses and a count the checker only underlines. The title carries NO spellCheck attribute at all (the browser's default is on), so the page-wide census in
// scripts/harness/revspell.mjs sees only the three deliberate `spellCheck={false}` fields and still finds no third host that turns the checker ON.
export function TitlePageSheet({
  text, onChange, onForward, onFocus, onBlur, autoFocus,
}: {
  text: string;
  onChange: (next: string) => void;
  onForward?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}) {
  const parsed = parseTitlePage(text);
  const [fields, setFields] = useState<TitleSheetFields>(() => parsed ?? { contact: [], words: '', title: '', author: '' });
  // What this sheet last wrote: a prop that equals it is our own echo; any other text (an undo, a sync pull, a hand edit) re-reads into the fields.
  const lastEmitted = useRef<string>(text);
  useEffect(() => {
    if (text === lastEmitted.current) return;
    const p = parseTitlePage(text);
    if (p) { lastEmitted.current = text; setFields(p); }
  }, [text]);

  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus) titleRef.current?.focus(); }, [autoFocus]);

  const commit = (next: TitleSheetFields) => {
    setFields(next);
    const t = serializeTitlePage(next);
    lastEmitted.current = t;
    onForward?.();
    onChange(t);
  };

  return (
    <div className="wz-title-sheet" data-lens="title" role="group" aria-label="Title page">
      <textarea
        className="wz-ts-contact" data-field="contact" rows={4} spellCheck={false}
        aria-label="Your name, address and email" placeholder="Name, address, email"
        value={fields.contact.join('\n')}
        onChange={e => commit({ ...fields, contact: e.target.value.split('\n') })}
        onFocus={onFocus} onBlur={onBlur}
      />
      <input
        className="wz-ts-words" data-field="words" type="text" spellCheck={false}
        aria-label="Word count line" placeholder="About 0 words"
        value={fields.words}
        onChange={e => commit({ ...fields, words: e.target.value })}
        onFocus={onFocus} onBlur={onBlur}
      />
      <div className="wz-ts-mid">
        <input
          ref={titleRef}
          className="wz-ts-title" data-field="title" type="text"
          aria-label="Title" placeholder="Title"
          value={fields.title}
          onChange={e => commit({ ...fields, title: e.target.value })}
          onFocus={onFocus} onBlur={onBlur}
        />
        <div className="wz-ts-by" aria-hidden="true">by</div>
        <input
          className="wz-ts-author" data-field="author" type="text" spellCheck={false}
          aria-label="Author" placeholder="Author"
          value={fields.author}
          onChange={e => commit({ ...fields, author: e.target.value })}
          onFocus={onFocus} onBlur={onBlur}
        />
      </div>
    </div>
  );
}
