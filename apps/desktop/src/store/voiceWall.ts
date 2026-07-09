// VW — the Voice Wall whisper channel. When a paste/drop is blocked on a prose
// surface, ONE calm inline line surfaces, at most once per SESSION (a page load),
// then the wall is silent — never a scold, never a modal, never red (Principle 5).
// The block protects flow; importing is an edge activity served by the Import
// door, so the whisper points there. A tiny module-level pub/sub so every prose
// surface (ForwardOnlyEditor's sprint/page/gate + the Journal editable) shares one
// once-per-session gate and one global whisper element.

export const WHISPER = 'Outside text stays outside — Import it from your binder if it’s yours.';

type Listener = (msg: string) => void;
const listeners = new Set<Listener>();
let shownThisSession = false;

// A prose surface blocked a foreign-voice paste. Fire the whisper once per session.
export function notePasteBlocked(): void {
  if (shownThisSession) return;
  shownThisSession = true;
  listeners.forEach(l => l(WHISPER));
}

export function subscribeWhisper(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
