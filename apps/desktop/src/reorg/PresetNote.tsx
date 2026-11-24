import { useEffect, useRef, type ReactNode } from 'react';
import { DrawerNote } from '../components/DrawerNote';
import { useDeskLexicon } from '../store/deskLexicon';
import type { PresetNote } from './presetNotes';

// THE "?" BESIDE A NEW PRESET (PRESETS-B item 3, Nov 23): the app's own pressable DrawerNote (a button the keyboard reaches and Enter or Space opens; Escape or a press elsewhere closes it; never hover-only; an overlay that displaces nothing),
// one in the PLAN tab's Presets list and one in the PARTS menu's preset list. Its words are the note's lexicon keys (presetNotes.ts): in a line, what it does, the example, the credit, the line the "?" must say, the old names.
// A *starred* span in a word is italic (a book's title in a credit).
const emph = (s: string): ReactNode[] => s.split(/(\*[^*]+\*)/).map((p, i) => (/^\*[^*]+\*$/.test(p) ? <em key={i}>{p.slice(1, -1)}</em> : p));

// THE NOTE ESCAPES THE MENU (Nov 23, 7:28 pm, Fable: "YES to the escape rule"): both lists scroll (the PARTS menu is an overflow box), so a note drawn inside them was clipped to a sliver at the box's edge. The stylesheet makes the pop position:fixed (a fixed box
// is not clipped by an ancestor's overflow); this places it, from the "?" button's rect, below the button, and keeps its whole box inside the window: clamped left and right, flipped above the button when it would run off the bottom, scrolled inside itself if the window is shorter than it.
const EDGE = 8;
function place(root: HTMLElement) {
  const pop = root.querySelector<HTMLElement>('[role="note"]');
  const btn = root.querySelector<HTMLElement>('.wz-drawer-note-btn');
  if (!pop || !btn) return;
  const b = btn.getBoundingClientRect();
  const room = window.innerHeight - 2 * EDGE;
  pop.style.maxHeight = room + 'px';
  pop.style.overflowY = 'auto';
  const w = pop.offsetWidth, h = pop.offsetHeight;
  const left = Math.max(EDGE, Math.min(b.left, window.innerWidth - w - EDGE));
  let top = b.bottom + 4;
  if (top + h > window.innerHeight - EDGE) top = Math.max(EDGE, b.top - 4 - h);
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
  pop.style.right = 'auto';
}

export function PresetNoteButton({ id, name, note }: { id: string; name: string; note: PresetNote }) {
  const { t } = useDeskLexicon();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const go = () => place(root);
    const mo = new MutationObserver(go);   // the pop mounts when the "?" opens: placed before it is painted
    mo.observe(root, { childList: true, subtree: true });
    window.addEventListener('resize', go);
    window.addEventListener('scroll', go, true);
    return () => { mo.disconnect(); window.removeEventListener('resize', go); window.removeEventListener('scroll', go, true); };
  }, []);
  const label = (k: Parameters<typeof t>[0]) => <><strong>{t(k)}</strong>{': '}</>;
  return (
    <span ref={ref} className="reorg-preset-note" data-preset-note={id}>
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
