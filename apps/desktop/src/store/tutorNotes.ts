import { useCallback, useEffect, useState } from 'react';
import { getCurrentUser, subscribeCurrentUser } from './currentUser';

// THE TUTOR'S NOTES ON FILE, the client half (TUTOR item 7, step 1). The server owns the notes (apps/server/src/tutorNotes.ts: its own table, one row per note, kept only on her yes,
// she sees, edits and wipes them, wipe truly deletes). Nothing here keeps a copy of a note beyond what is on her screen: no localStorage, no cache, nothing that survives a wipe.
// A PROPOSAL is the AI's offer of a note. It lives in this module's memory and nowhere else until she presses yes; "yes" is the one call that saves it, "no" is no call at all.

export type NoteKind = 'tendency' | 'interest' | 'blocker' | 'goal';
export type NoteSource = 'proposed' | 'interview' | 'own';
export const NOTE_KINDS: NoteKind[] = ['tendency', 'interest', 'blocker', 'goal'];
export const NOTE_MAX_CHARS = 400; // the server's own limit (tutorNotes.ts)

export interface TutorNote { id: string; kind: NoteKind; text: string; source: NoteSource; createdAt: string; updatedAt: string }
export interface NoteProposal { kind: NoteKind; text: string }

type Res<T> = { ok: true; value: T } | { ok: false; status: number };

async function call<T>(method: string, path: string, body?: unknown): Promise<Res<T>> {
  try {
    const res = await fetch(path, {
      method, credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, value: (await res.json()) as T };
  } catch {
    return { ok: false, status: 0 };
  }
}

export const apiNotesList = () => call<{ notes: TutorNote[] }>('GET', '/api/tutor/notes');
export const apiNotesAdd = (n: { kind: NoteKind; text: string; source: NoteSource }) => call<{ note: TutorNote }>('POST', '/api/tutor/notes', n);
export const apiNotesEdit = (id: string, patch: { kind?: NoteKind; text?: string }) => call<{ note: TutorNote }>('PATCH', `/api/tutor/notes/${encodeURIComponent(id)}`, patch);
export const apiNotesRemove = (id: string) => call<{ deleted: number }>('DELETE', `/api/tutor/notes/${encodeURIComponent(id)}`);
export const apiNotesWipe = () => call<{ deleted: number }>('DELETE', '/api/tutor/notes');

// ---- the proposal (in memory only) ----
let proposal: NoteProposal | null = null;
const proposalListeners = new Set<() => void>();
export function proposeNote(p: NoteProposal | null): void {
  proposal = p && p.text.trim() ? { kind: p.kind, text: p.text.trim().slice(0, NOTE_MAX_CHARS) } : null;
  proposalListeners.forEach((l) => l());
}
export function useNoteProposal(): NoteProposal | null {
  const [p, setP] = useState<NoteProposal | null>(proposal);
  useEffect(() => {
    const l = () => setP(proposal);
    proposalListeners.add(l);
    l();
    return () => { proposalListeners.delete(l); };
  }, []);
  return p;
}
// test/inspection only, like the persistence seams: a fixture offers a proposal the way the ask will (step 2)
if (typeof window !== 'undefined') (window as unknown as Record<string, unknown>).wrizoProposeNote = (p: NoteProposal | null) => proposeNote(p);

// ---- her list ----
export type NotesState = 'anon' | 'loading' | 'ready' | 'error';
export function useTutorNotes() {
  const [signedIn, setSignedIn] = useState(!!getCurrentUser());
  const [notes, setNotes] = useState<TutorNote[]>([]);
  const [state, setState] = useState<NotesState>(signedIn ? 'loading' : 'anon');
  const [failed, setFailed] = useState(false); // the last act did not reach the server: say so, change nothing on screen

  useEffect(() => subscribeCurrentUser((u) => setSignedIn(!!u)), []);

  const reload = useCallback(async () => {
    if (!signedIn) { setNotes([]); setState('anon'); return; }
    setState('loading');
    const r = await apiNotesList();
    if (r.ok) { setNotes(r.value.notes); setState('ready'); } else setState('error');
  }, [signedIn]);
  useEffect(() => { void reload(); }, [reload]);

  // every act waits for the server: the screen shows what is on file, never what it hopes is on file
  const add = useCallback(async (kind: NoteKind, text: string, source: NoteSource): Promise<boolean> => {
    const r = await apiNotesAdd({ kind, text, source });
    setFailed(!r.ok);
    if (r.ok) setNotes((cur) => [...cur, r.value.note]);
    return r.ok;
  }, []);
  const edit = useCallback(async (id: string, patch: { kind?: NoteKind; text?: string }): Promise<boolean> => {
    const r = await apiNotesEdit(id, patch);
    setFailed(!r.ok);
    if (r.ok) setNotes((cur) => cur.map((n) => (n.id === id ? r.value.note : n)));
    return r.ok;
  }, []);
  const remove = useCallback(async (id: string): Promise<boolean> => {
    const r = await apiNotesRemove(id);
    // 404 = already gone (another device wiped it): the screen agrees with the server either way
    const gone = r.ok || ('status' in r && r.status === 404);
    setFailed(!gone);
    if (gone) setNotes((cur) => cur.filter((n) => n.id !== id));
    return gone;
  }, []);
  const wipe = useCallback(async (): Promise<boolean> => {
    const r = await apiNotesWipe();
    setFailed(!r.ok);
    if (r.ok) setNotes([]);
    return r.ok;
  }, []);

  return { state, notes, failed, add, edit, remove, wipe, reload };
}
