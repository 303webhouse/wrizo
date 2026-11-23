import type { ReactNode } from 'react';
import { DrawerNote } from '../components/DrawerNote';
import { useDeskLexicon } from '../store/deskLexicon';
import type { PresetNote } from './presetNotes';

// THE "?" BESIDE A NEW PRESET (PRESETS-B item 3, Nov 23): the app's own pressable DrawerNote (a button the keyboard reaches and Enter or Space opens; Escape or a press elsewhere closes it; never hover-only; an overlay that displaces nothing),
// one in the PLAN tab's Presets list and one in the PARTS menu's preset list. Its words are the note's lexicon keys (presetNotes.ts): in a line, what it does, the example, the credit, the line the "?" must say, the old names.
// A *starred* span in a word is italic (a book's title in a credit).
const emph = (s: string): ReactNode[] => s.split(/(\*[^*]+\*)/).map((p, i) => (/^\*[^*]+\*$/.test(p) ? <em key={i}>{p.slice(1, -1)}</em> : p));

export function PresetNoteButton({ id, name, note }: { id: string; name: string; note: PresetNote }) {
  const { t } = useDeskLexicon();
  const label = (k: Parameters<typeof t>[0]) => <><strong>{t(k)}</strong>{': '}</>;
  return (
    <span className="reorg-preset-note" data-preset-note={id}>
      <DrawerNote label={t('reorgPreNoteLabel').replace('{name}', name)}>
        <span className="reorg-preset-note-line" data-note-part="line"><strong>{emph(t(note.line))}</strong></span><br />
        <span className="reorg-preset-note-line" data-note-part="does">{emph(t(note.does))}</span>
        {note.eg && <><br /><span className="reorg-preset-note-line" data-note-part="eg">{label('reorgPreNoteEg')}{emph(t(note.eg))}</span></>}
        {note.names && <><br /><span className="reorg-preset-note-line" data-note-part="names">{label('reorgPreNoteNames')}{emph(t(note.names))}</span></>}
        {note.must && <><br /><span className="reorg-preset-note-line" data-note-part="must">{emph(t(note.must))}</span></>}
        {note.credit && <><br /><span className="reorg-preset-note-line" data-note-part="credit">{label('reorgPreNoteCredit')}{emph(t(note.credit))}</span></>}
      </DrawerNote>
    </span>
  );
}
