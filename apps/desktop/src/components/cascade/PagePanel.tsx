import { useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { useDeskLexicon } from '../../store/deskLexicon';
import { DrawerNote } from '../DrawerNote';
import { saveJournalEntry } from '../../store/persistence';
import { setUserPageDefaults } from '../../store/pageDefaults';
import { PAGE_SETTINGS_FALLBACK, type PageSettings } from '../../types';
import { PageFace, type PageFaceSubject } from '../PageFace';
import { SectionsPopout } from '../SectionsPopout';
import { PlacesPanel } from '../PlacesPanel';
import type { JournalEntry } from '../../types';

// the Page pop-out: New Page (a loose page via createLooseHomePage, opened at /page/:id), then the Page face, then Places [CascadePanels §4]
export function PagePanel({ subject, navigate }: { subject: PageFaceSubject; navigate: NavigateFunction }) {
  const { t } = useDeskLexicon();
  // BIG PROJECTS 1a - THE PAGES POP-OUT (components/SectionsPopout.tsx) replaces the New Page door and the Open Pages list: the place's sections in
  // the writer's own order, + New Page (into where you are), + New set, Presets, and X out to the Journal. The Page face, Page Setup and Places stay
  // beneath it until step 1b moves them into the page header.
  // ITEM 83 M6 (R13.i/ii) - on a BOARD the pop-out's rows keep their secondary act, "Place on this board" (PW1 S3).
  const onBoard = subject.entry.pageType === 'board';
  return (
    <>
      {/* A Fragment, not a second `.wz-cascade-panel-body` wrapper -
          PageFace already carries its own `.wz-pageface` padding, so
          nesting a second panel-body around both would double it up. */}
      <SectionsPopout view="pages" currentId={subject.entry.id} navigate={navigate} boardId={onBoard ? subject.entry.id : undefined} journalLabel={t('drawerPlaceJournal')} />
      <PageFace subject={subject} />
      {/* ITEM 83 M3 (R6) — the Page menu's charter: general page options
          governing the OPEN page. Sits between the page's own face and its
          Places, because it is about this sheet rather than about where the
          sheet lives. */}
      <PageSetupZone entry={subject.entry} />
      {/* B2 S4 — Places: the Home zone (single-select) + Boards zone (true
          checkboxes), for the page underfoot. Supersedes PageFace's own
          retired Move/Copy verb. */}
      <PlacesPanel entry={subject.entry} />
    </>
  );
}

// ITEM 170 (P0), kept as history: the list that used to stand here (Open Pages) was the way to OPEN a page - a click on a row GOES, placing it on a
// board is the row's secondary act, one list of every live page that is not a board, uncapped. BIG PROJECTS 1a replaced the list with
// SectionsPopout, which keeps all three properties (the row opens the page; "Place on this board" stays behind the row's more-menu on a board;
// nothing is capped) and scopes it to where the writer is.

// page setup: the paper is the preview (margins and spacing write custom properties on the live sheet, no Apply); numbers, headers and footers are stored for print and export and do not paint on screen [CascadePanels §5]
function PageSetupZone({ entry }: { entry: JournalEntry }) {
  const { t } = useDeskLexicon();
  const [saved, setSaved] = useState(false);
  const current = entry.pageSettings ?? PAGE_SETTINGS_FALLBACK;

  // One writer, one shape: every control funnels through here, so a partial
  // update can never drop a sibling field.
  const patch = (next: Partial<PageSettings>) => {
    const merged: PageSettings = { ...current, ...next };
    saveJournalEntry({ ...entry, pageSettings: merged, updatedAt: new Date().toISOString() });
    setSaved(false);
  };

  return (
    <div className="wz-cascade-panel-body wz-page-setup">
      <div className="wz-cascade-panel-title">
        {t('pageSetupHeading')}{' '}
        {/* the export note sits behind a "?" beside the heading [CascadePanels §6] */}
        <DrawerNote label="About export and print">{t('pageSetupExportNote')}</DrawerNote>
      </div>

      <div className="wz-page-setup-row">
        <span className="wz-page-setup-label">{t('pageSetupMargins')}</span>
        <div className="wz-page-setup-seg" role="radiogroup" aria-label={t('pageSetupMargins')}>
          {(['normal', 'narrow', 'wide'] as const).map(m => (
            <button key={m} type="button" role="radio" aria-checked={current.margins === m}
              className="wz-page-setup-chip" onClick={() => patch({ margins: m })}>
              {t(m === 'normal' ? 'pageSetupMarginsNormal' : m === 'narrow' ? 'pageSetupMarginsNarrow' : 'pageSetupMarginsWide')}
            </button>
          ))}
        </div>
      </div>

      <div className="wz-page-setup-row">
        <label className="wz-page-setup-label" htmlFor="wz-page-leading">{t('pageSetupLineSpacing')}</label>
        <input id="wz-page-leading" className="wz-page-setup-range" type="range"
          min="1.2" max="2.2" step="0.1" value={current.lineSpacing}
          onChange={e => patch({ lineSpacing: Number(e.target.value) })} />
        <span className="wz-page-setup-value">{current.lineSpacing.toFixed(1)}</span>
      </div>

      <div className="wz-page-setup-row">
        <span className="wz-page-setup-label">{t('pageSetupNumbers')}</span>
        <button type="button" className="wz-page-setup-chip" aria-pressed={current.pageNumbers.on}
          onClick={() => patch({ pageNumbers: { ...current.pageNumbers, on: !current.pageNumbers.on } })}>
          {t(current.pageNumbers.on ? 'pageSetupOn' : 'pageSetupOff')}
        </button>
      </div>
      {current.pageNumbers.on && (
        <div className="wz-page-setup-seg wz-page-setup-seg--wrap" role="radiogroup" aria-label={t('pageSetupNumbers')}>
          {(['bottom-center', 'bottom-right', 'top-right'] as const).map(p => (
            <button key={p} type="button" role="radio" aria-checked={current.pageNumbers.placement === p}
              className="wz-page-setup-chip" onClick={() => patch({ pageNumbers: { ...current.pageNumbers, placement: p } })}>
              {t(p === 'bottom-center' ? 'pageSetupNumbersPlacementBottomCenter'
                : p === 'bottom-right' ? 'pageSetupNumbersPlacementBottomRight'
                : 'pageSetupNumbersPlacementTopRight')}
            </button>
          ))}
        </div>
      )}

      {(['headers', 'footers'] as const).map(k => (
        <div key={k}>
          <div className="wz-page-setup-row">
            <span className="wz-page-setup-label">{t(k === 'headers' ? 'pageSetupHeaders' : 'pageSetupFooters')}</span>
            <button type="button" className="wz-page-setup-chip" aria-pressed={current[k].on}
              onClick={() => patch({ [k]: { ...current[k], on: !current[k].on } } as Partial<PageSettings>)}>
              {t(current[k].on ? 'pageSetupOn' : 'pageSetupOff')}
            </button>
          </div>
          {current[k].on && (
            <input className="wz-page-setup-text" type="text" value={current[k].text}
              aria-label={t(k === 'headers' ? 'pageSetupHeaderText' : 'pageSetupFooterText')}
              placeholder={t(k === 'headers' ? 'pageSetupHeaderText' : 'pageSetupFooterText')}
              onChange={e => patch({ [k]: { ...current[k], text: e.target.value } } as Partial<PageSettings>)} />
          )}
        </div>
      ))}

      {/* R6's own closing clause: the writer's defaults live at the bottom of
          the PAGE menu, and are a COPY of this page's settings (see
          store/pageDefaults.ts on why a copy rather than a live link). */}
      <button type="button" className="wz-cascade-action"
        onClick={() => { setUserPageDefaults(current); setSaved(true); }}>
        {t('pageSetupSaveDefaults')}
      </button>
      {saved && <p className="wz-page-setup-note wz-page-setup-note--ok">{t('pageSetupSavedDefaults')}</p>}
    </div>
  );
}

