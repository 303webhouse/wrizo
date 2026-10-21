import { useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { createDrawer } from '../store/persistence';
import { UNSORTED, JOURNAL, isDefaultRoot, listPlaces, setPlace, type Place } from '../store/place';
import { placeUid, usePlace } from '../store/usePlace';

// BIG PROJECTS 1a - THE SWITCHER. Opened by the place block. Two flat groups - Drawers, then Journals - then + New Drawer. A virtual group for
// binders that sit in no Drawer appears only when such binders exist (nothing is moved behind the writer's back). Choosing a place changes where
// the writer is and closes the panel; it never navigates - the page underfoot stays put (PAGE IS PRIMARY).
export function PlaceSwitcher({ onChosen }: { onChosen: () => void }) {
  const { t } = useDeskLexicon();
  const here = usePlace();
  const [naming, setNaming] = useState(false);
  const { drawers, unsorted, journals } = listPlaces();
  const uid = placeUid();
  const choose = (p: Place) => { setPlace(uid, p); onChosen(); };
  const current = (kind: Place['kind'], id: string): 'true' | undefined => (here.kind === kind && here.id === id ? 'true' : undefined);
  const addDrawer = (name: string) => {
    setNaming(false);
    if (!name.trim()) return;
    const d = createDrawer(name);
    choose({ kind: 'drawer', id: d.id, setId: null });
  };
  return (
    <div className="wz-cascade-panel-body wz-switcher">
      <div className="wz-switcher-group" data-group="drawers">
        <div className="wz-switcher-label">{t('switcherDrawers')}</div>
        {drawers.map(d => (
          <button key={d.id} type="button" className="wz-switcher-item" data-place-kind="drawer" data-place-id={d.id} aria-current={current('drawer', d.id)}
            onClick={() => choose({ kind: 'drawer', id: d.id, setId: null })}>{isDefaultRoot(d) ? t('placeRootName') : d.name}</button>
        ))}
        {unsorted.length > 0 && (
          <button type="button" className="wz-switcher-item" data-place-kind="drawer" data-place-id={UNSORTED} aria-current={current('drawer', UNSORTED)}
            onClick={() => choose({ kind: 'drawer', id: UNSORTED, setId: null })}>{t('switcherUnsorted')}</button>
        )}
      </div>
      <div className="wz-switcher-group" data-group="journals">
        <div className="wz-switcher-label">{t('switcherJournals')}</div>
        {journals.map(j => (
          <button key={j.id} type="button" className="wz-switcher-item" data-place-kind="journal" data-place-id={j.id} aria-current={current('journal', j.id)}
            onClick={() => choose({ kind: 'journal', id: JOURNAL, setId: null })}>{t('drawerPlaceJournal')}</button>
        ))}
      </div>
      {naming ? (
        <input className="wz-switcher-new-input" autoFocus aria-label={t('switcherNewDrawerName')} placeholder={t('switcherNewDrawerName')}
          onKeyDown={(ev) => { if (ev.key === 'Enter') addDrawer((ev.target as HTMLInputElement).value); else if (ev.key === 'Escape') setNaming(false); }}
          onBlur={() => setNaming(false)} />
      ) : (
        <button type="button" className="wz-switcher-new wz-cascade-link" data-new="drawer" onClick={() => setNaming(true)}>{t('switcherNewDrawer')}</button>
      )}
    </div>
  );
}
