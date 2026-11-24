import { useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { NOTE_KINDS, NOTE_MAX_CHARS, proposeNote, useNoteProposal, useTutorNotes, type NoteKind, type TutorNote } from '../store/tutorNotes';

// THE TUTOR'S NOTES ON FILE, the screen (TUTOR item 7, step 1; Fable's ruled shape, Nov 23). One section in the Tutor's own panel, under the Bible, built the way the Bible is
// (a list, Edit / Delete on each, an add row), so the panel is no new shape. It is a TOOL, not a page: it lives inside the panel's fixed track, and nothing here touches the editor.
//   - Only a signed-in writer has notes (they live on her account); signed out, the section does not render at all.
//   - A note is kept only on her yes: a PROPOSAL card (what the ask will offer in step 2) has Yes and No; No saves nothing and makes no call; Yes is the one call that keeps it.
//   - She sees every note, edits any (text and kind), deletes one (no confirm: it is one note) or wipes them all (ONE confirm first: "this can't be undone").
//   - Every act waits for the server, so the screen shows what is on file and never what it hopes is. If an act does not reach the server, one quiet line says so and nothing on screen changes.
// Reuses the Bible's classes (styles/14-ink-options.css); no new CSS.

const KIND_TERM = { tendency: 'tutorNotesKindTendency', interest: 'tutorNotesKindInterest', blocker: 'tutorNotesKindBlocker', goal: 'tutorNotesKindGoal' } as const;

export function TutorNotes() {
  const { t } = useDeskLexicon();
  const { state, notes, failed, add, edit, remove, wipe } = useTutorNotes();
  const proposal = useNoteProposal();
  const [input, setInput] = useState('');
  const [kind, setKind] = useState<NoteKind>('tendency');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editKind, setEditKind] = useState<NoteKind>('tendency');
  const [wiping, setWiping] = useState(false); // the one confirm before a wipe
  const [busy, setBusy] = useState(false);

  if (state === 'anon') return null;

  const act = async (f: () => Promise<boolean>): Promise<boolean> => { setBusy(true); try { return await f(); } finally { setBusy(false); } };
  const addOwn = async () => {
    const text = input.trim();
    if (!text || busy) return;
    if (await act(() => add(kind, text, 'own'))) setInput('');
  };
  const startEdit = (n: TutorNote) => { setEditingId(n.id); setEditText(n.text); setEditKind(n.kind); };
  const cancelEdit = () => { setEditingId(null); setEditText(''); };
  const commitEdit = async (n: TutorNote) => {
    const text = editText.trim();
    if (!text || busy) return;
    const patch: { kind?: NoteKind; text?: string } = {};
    if (text !== n.text) patch.text = text;
    if (editKind !== n.kind) patch.kind = editKind;
    if (Object.keys(patch).length === 0 || (await act(() => edit(n.id, patch)))) cancelEdit();
  };
  const removeOne = async (id: string) => { if (!busy && (await act(() => remove(id))) && editingId === id) cancelEdit(); };
  const doWipe = async () => { if (!busy && (await act(() => wipe()))) { setWiping(false); cancelEdit(); } };
  // her yes: the one call that keeps a proposal. Her no: nothing is called, the proposal is only dropped.
  const keepProposal = async () => { if (proposal && !busy && (await act(() => add(proposal.kind, proposal.text, 'proposed')))) proposeNote(null); };

  const kindSelect = (value: NoteKind, onChange: (k: NoteKind) => void, label: string) => (
    <select className="wz-tutor-bible-input wz-tutor-notes-kind" aria-label={label} value={value} onChange={(e) => onChange(e.target.value as NoteKind)} style={{ flex: '0 0 auto' }}>
      {NOTE_KINDS.map((k) => <option key={k} value={k}>{t(KIND_TERM[k])}</option>)}
    </select>
  );

  return (
    <div className="wz-tutor-section" data-testid="tutor-notes">
      <div className="wz-tutor-h">{t('tutorNotesTitle')}</div>
      <div className="wz-tutor-empty">{t('tutorNotesNote')}</div>

      {proposal && (
        <div className="wz-tutor-bible-fact" data-testid="tutor-notes-proposal" role="group" aria-label={t('tutorNotesProposed')}>
          <span className="wz-tutor-bible-text"><strong>{t('tutorNotesProposed')}</strong> {t(KIND_TERM[proposal.kind])}: {proposal.text}</span>
          <span className="wz-tutor-bible-actions">
            <button type="button" className="wz-tutor-bible-btn" disabled={busy} onClick={() => void keepProposal()}>{t('tutorNotesYes')}</button>
            <button type="button" className="wz-tutor-bible-btn" disabled={busy} onClick={() => proposeNote(null)}>{t('tutorNotesNo')}</button>
          </span>
        </div>
      )}

      {state === 'loading' && <div className="wz-tutor-empty">{t('tutorNotesLoading')}</div>}
      {state === 'error' && <div className="wz-tutor-empty">{t('tutorNotesError')}</div>}
      {state === 'ready' && notes.length === 0 && <div className="wz-tutor-empty">{t('tutorNotesEmpty')}</div>}
      {state === 'ready' && notes.length > 0 && (
        <div className="wz-tutor-bible-list">
          {notes.map((n) => (
            <div key={n.id} className="wz-tutor-bible-fact" data-note-id={n.id}>
              {editingId === n.id ? (
                <div className="wz-tutor-bible-edit">
                  {kindSelect(editKind, setEditKind, t('tutorNotesKindLabel'))}
                  <input
                    className="wz-tutor-bible-input"
                    type="text"
                    value={editText}
                    maxLength={NOTE_MAX_CHARS}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); void commitEdit(n); }
                      if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                    }}
                    autoFocus
                  />
                  <button type="button" className="wz-tutor-bible-btn" disabled={busy} onClick={() => void commitEdit(n)}>{t('tutorBibleSave')}</button>
                  <button type="button" className="wz-tutor-bible-btn" onClick={cancelEdit}>{t('tutorBibleCancel')}</button>
                </div>
              ) : (
                <>
                  <span className="wz-tutor-bible-text">{t(KIND_TERM[n.kind])}: {n.text}</span>
                  <span className="wz-tutor-bible-actions">
                    <button type="button" className="wz-tutor-bible-btn" disabled={busy} onClick={() => startEdit(n)}>{t('tutorBibleEdit')}</button>
                    <button type="button" className="wz-tutor-bible-btn" disabled={busy} onClick={() => void removeOne(n.id)}>{t('tutorBibleDelete')}</button>
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {state === 'ready' && (
        <div className="wz-tutor-bible-row">
          {kindSelect(kind, setKind, t('tutorNotesKindLabel'))}
          <input
            className="wz-tutor-bible-input"
            type="text"
            value={input}
            maxLength={NOTE_MAX_CHARS}
            placeholder={t('tutorNotesAddPlaceholder')}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addOwn(); } }}
          />
          <button type="button" className="wz-tutor-bible-add" disabled={!input.trim() || busy} onClick={() => void addOwn()}>{t('tutorBibleAdd')}</button>
        </div>
      )}

      {state === 'ready' && notes.length > 0 && (wiping ? (
        <div className="wz-tutor-bible-fact" data-testid="tutor-notes-wipe-confirm" role="group" aria-label={t('tutorNotesWipeAsk')}>
          <span className="wz-tutor-bible-text">{t('tutorNotesWipeAsk')}</span>
          <span className="wz-tutor-bible-actions">
            <button type="button" className="wz-tutor-bible-btn" disabled={busy} onClick={() => void doWipe()}>{t('tutorNotesWipeYes')}</button>
            <button type="button" className="wz-tutor-bible-btn" onClick={() => setWiping(false)}>{t('tutorBibleCancel')}</button>
          </span>
        </div>
      ) : (
        <button type="button" className="wz-tutor-bible-btn" disabled={busy} onClick={() => setWiping(true)}>{t('tutorNotesWipe')}</button>
      ))}

      {failed && <div className="wz-tutor-convo-status" role="status">{t('tutorNotesFailed')}</div>}
    </div>
  );
}
