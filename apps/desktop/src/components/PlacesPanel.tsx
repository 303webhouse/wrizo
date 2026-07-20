import { useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import {
  getProjects, getJournalEntry, setPageHome, createBinder,
  getAllUserBoards, getBoardsPinning, pinPageToBoard, unpinPageFromBoard,
  inJournalView, flushNow, getSystemKind,
} from '../store/persistence';
import { useActionToast } from './ActionToast';
import type { JournalEntry } from '../types';

// B2 S4 — the Places panel: the Page pop-out's own Home zone (single-
// select) + Boards zone (true checkboxes), the successor to the old
// "Add to…" Moves flow's single-page doorway (PageFace's own retired
// Move/Copy button). Reads the store DIRECTLY and fresh on every render
// (`getJournalEntry(entry.id)` rather than trusting the `entry` prop after
// this panel's own writes — the same "no cached snapshot" discipline every
// cascade panel already uses), so its own Home-zone radios and Boards-zone
// checkboxes always reflect what was just clicked, immediately.
//
// A16 (verbatim, the law this whole ticket serves): on every action here,
// checkboxes (the Boards zone) write ONLY membership (page-pin boxes, via
// pinPageToBoard/unpinPageFromBoard); ONLY the Home zone's own explicit
// single-select act writes projectId (via setPageHome — the SAME store
// path the old Moves verb always used); nothing, ever, writes origin.
// Every write below is traceable to exactly one of those two calls —
// there is no third path and no code here that touches `entry.origin`.
//
// The one-shot confirmation (S4: "the SAME one-shot confirmation the
// Moves verb already carries today") is a LOCAL toast (useActionToast,
// the same hook/mechanism AddToSheet's own callers already use) rather
// than router-state handed to a surface this panel might unmount out
// from under — the cascade panel does not unmount when a page's home
// changes (unlike the old dedicated Journal list surface AddToSheet was
// built against), so there is no "the view no longer applies" problem to
// solve by forcing a navigate; the writer stays put and sees the same
// quiet confirmation line, right where the click happened.
export function PlacesPanel({ entry: entryProp }: { entry: JournalEntry }) {
  const { t } = useDeskLexicon();
  const toast = useActionToast();
  const [newDrawerOpen, setNewDrawerOpen] = useState(false);
  const [newDrawerName, setNewDrawerName] = useState('');

  const entry = getJournalEntry(entryProp.id) ?? entryProp;

  // B1's own inherited law, extended: a system Board's home/membership is
  // never alterable via generic sending grammar (filing it would break
  // "no project home"; pinning it is explicitly forbidden). Move/Copy and
  // Pin were both made inert no-ops on a system Board's own Page face
  // (B1 S3); Places supersedes Move/Copy — the SAME guard now means "don't
  // render the interactive controls at all" (a substantial panel, unlike a
  // single button — absence reads clearer than a functional-looking
  // control that quietly refuses every click). system boards never appear
  // in the Boards zone's own OWN checkbox list either way (getAllUserBoards
  // excludes them), but a system Board's OWN Page category must never
  // offer to file ITSELF into a project — this early return is that guard.
  if (getSystemKind(entry) !== undefined) return null;

  const projects = getProjects();
  const inJournal = inJournalView(entry);
  const filedProjectId = entry.projectId;
  const isLoose = !inJournal && filedProjectId == null;

  const fileTo = (target: string, label: string) => {
    setPageHome(entry.id, target);
    flushNow();
    toast.show(`Filed to ${label}.`);
  };

  const selectJournal = () => { if (!inJournal) fileTo('journal', t('drawerPlaceJournal')); };
  const selectLoose = () => { if (!isLoose) fileTo('loose', t('placesLoose')); };
  const selectProject = (id: string, title: string) => { if (filedProjectId !== id) fileTo(id, title || 'Untitled'); };

  const createAndFile = () => {
    const name = newDrawerName.trim() || 'New Drawer';
    const project = createBinder(name, 'other');
    setPageHome(entry.id, project.id);
    flushNow();
    setNewDrawerOpen(false);
    setNewDrawerName('');
    toast.show(`Filed to ${project.title}.`);
  };

  // Boards zone — every board this page COULD join (any project, any
  // drawer — the SAME flat reach PinToBoardSheet's own drill-down already
  // allows), minus the page itself (a board can't pin itself — the same
  // self-pin guard PinToBoardSheet.tsx's own leaf exclusion carries).
  const allBoards = getAllUserBoards().filter(b => b.id !== entry.id);
  const pinnedIds = new Set(getBoardsPinning(entry.id).map(b => b.id));
  const toggleBoard = (boardId: string, checked: boolean) => {
    if (checked) pinPageToBoard(entry.id, boardId);
    else unpinPageFromBoard(entry.id, boardId);
    flushNow();
  };
  const boardTitle = (b: JournalEntry) => (b.text.trim() ? b.text.trim().split('\n')[0].slice(0, 60) : 'Untitled board');

  return (
    <div className="wz-places">
      <div className="wz-cascade-panel-title wz-places-title">{t('placesTitle')}</div>

      <div className="wz-places-home" role="radiogroup" aria-label={t('placesHomeZoneLabel')}>
        <label className="wz-places-radio">
          <input type="radio" name={`places-home-${entry.id}`} checked={inJournal} onChange={selectJournal} />
          {t('drawerPlaceJournal')}
        </label>
        {projects.map(p => (
          <label key={p.id} className="wz-places-radio">
            <input type="radio" name={`places-home-${entry.id}`} checked={filedProjectId === p.id} onChange={() => selectProject(p.id, p.title)} />
            {p.title || 'Untitled'}
          </label>
        ))}
        <label className="wz-places-radio">
          <input type="radio" name={`places-home-${entry.id}`} checked={isLoose} onChange={selectLoose} />
          {t('placesLoose')}
        </label>

        {newDrawerOpen ? (
          <div className="wz-places-newdrawer">
            <input
              className="wz-places-newdrawer-input"
              value={newDrawerName}
              onChange={e => setNewDrawerName(e.target.value)}
              placeholder={t('placesNewDrawerPlaceholder')}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') createAndFile();
                else if (e.key === 'Escape') setNewDrawerOpen(false);
              }}
            />
            <button type="button" className="btn-quiet wz-places-newdrawer-create" onClick={createAndFile}>{t('placesNewDrawerCreate')}</button>
            <button type="button" className="btn-quiet" onClick={() => setNewDrawerOpen(false)}>{t('placesNewDrawerCancel')}</button>
          </div>
        ) : (
          <button type="button" className="wz-places-newdrawer-btn" onClick={() => setNewDrawerOpen(true)}>{t('placesNewDrawer')}</button>
        )}
      </div>

      <div className="wz-places-boards" role="group" aria-label={t('placesBoardsZoneLabel')}>
        <div className="wz-cascade-panel-title wz-places-title">{t('placesBoardsTitle')}</div>
        {allBoards.length === 0 && <div className="wz-cascade-empty">{t('placesBoardsEmpty')}</div>}
        {allBoards.map(b => (
          <label key={b.id} className="wz-places-checkbox">
            <input type="checkbox" checked={pinnedIds.has(b.id)} onChange={e => toggleBoard(b.id, e.target.checked)} />
            {boardTitle(b)}
          </label>
        ))}
      </div>

      {toast.node}
    </div>
  );
}
