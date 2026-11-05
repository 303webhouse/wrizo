import { useDeskLexicon } from '../../store/deskLexicon';
import { getJournalPages } from '../../store/persistence';
import { unbornHref } from '../../store/unbornPage';
import { routeForEntry } from '../../store/routeForEntry';
import { openJournalBoard, type CascadeContext, itemTitle, byRecent, FoldSection } from './shared';

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------
export function JournalPanel({ navigate, openSurvey }: CascadeContext) {
  const { t } = useDeskLexicon();
  const pages = getJournalPages().slice().sort(byRecent);
  const recent = pages.slice(0, 5);
  // no row until the first word; the door's origin rides in the address [CascadePanels §3]
  const newPage = () => navigate(unbornHref({ origin: 'journal' })); // FX14 S1 — every New Page opens in THE Page
  return (
    <div className="wz-cascade-panel-body">
      {/* B1 S5 — travels to the Journal BOARD now (the section's own
          "Journal destination"), not the retired list surface. */}
      <button type="button" className="wz-cascade-action" onClick={() => openJournalBoard(navigate)}>{t('cascadeJournalOpen')}</button>
      <button type="button" className="wz-cascade-action" onClick={newPage}>{t('cascadeJournalNewPage')}</button>
      {/* FX9 S1 — "Recent" gains the fold. Keyed by a fixed, content-
          independent literal (there's only ever one Recent list here, no
          per-entity identity to ride). `recent` is capped at 5 (line above),
          so this section can never itself exercise S2's ">6 collapses"
          default in practice — it still gets the SAME toggle, per the
          brief's own explicit S1 roster, and still remembers a writer's own
          explicit choice once made. */}
      <FoldSection sectionKey="journalRecent" title={t('cascadeJournalRecent')} itemCount={recent.length} headerVariant="journal">
        <div className="wz-cascade-list">
          {recent.length === 0 && <div className="wz-cascade-empty">{t('placeFaceEmpty')}</div>}
          {recent.map((e) => (
            <div key={e.id} className="wz-cascade-list-item">
              <button type="button" className="wz-cascade-list-title" onClick={() => navigate(routeForEntry(e))}>{itemTitle(e)}</button>
            </div>
          ))}
        </div>
      </FoldSection>
      {pages.length > 0 && (
        <div className="wz-cascade-panel-footer">
          <button type="button" className="wz-cascade-link" onClick={() => openSurvey({ category: 'journal' })}>{t('cascadeJournalAll')}</button>
        </div>
      )}
    </div>
  );
}

