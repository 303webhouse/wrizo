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

// Slice 4 — the own-ink clipboard shadow. Session-scoped, one slot, last-wins,
// NEVER persisted (a reload clears it — the session boundary is real, and
// provenance beyond the live session is unknowable by design; Import is the
// door for that). Populated by a copy/cut on a prose surface, or by "Copy
// page text". A paste/drop that matches the shadow is the writer's own words
// returning, not a foreign voice — it passes the wall silently.
let shadow: string | null = null;

export function recordShadow(text: string): void {
  if (text) shadow = text;
}

// Exact match, or both-sides-trimmed match (survives editor edge whitespace
// the round-trip through a contenteditable can introduce).
export function shadowAllows(text: string): boolean {
  if (!text || shadow == null) return false;
  return text === shadow || text.trim() === shadow.trim();
}

// The incoming text of a paste/drop, whichever event actually carries it —
// beforeinput's `dataTransfer`/`data`, or a raw ClipboardEvent/DragEvent's
// `clipboardData`/`dataTransfer` (surfaces guard both layers; see Slice 1).
export function extractIncomingText(e: Event): string {
  const anyE = e as InputEvent & ClipboardEvent & DragEvent;
  return anyE.dataTransfer?.getData('text/plain') || anyE.clipboardData?.getData('text/plain') || anyE.data || '';
}
