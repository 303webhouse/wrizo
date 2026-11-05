import { useEffect, useRef, useState } from 'react';
import { parseTitlePage, serializeTitlePage, type TitleSheetFields } from '../store/titlePage';

// the Title Page: a small form over the page's own text; every edit serializes to the canonical text (store/titlePage.ts), so save, birth, sync, export and copy are the page's own; "by" is drawn, never typed [TitlePageSheet §1]

// spell-check on for the title (the writer's words), off for names, the contact block and the word line; the title carries no spellCheck attribute so only three deliberate `false` fields exist [TitlePageSheet §2]
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
  // preventScroll: focusing the title must not scroll the sheet and clip its first row [TitlePageSheet §3]
  useEffect(() => { if (autoFocus) titleRef.current?.focus({ preventScroll: true }); }, [autoFocus]);

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
