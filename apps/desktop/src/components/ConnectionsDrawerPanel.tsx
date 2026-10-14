import { useDeskLexicon } from '../store/deskLexicon';

// PHASE 1 (S3) - the right drawer's second pane: EMPTY for now (Phase 3 fills it). Its name is the theme's word (Grafts in Arbor, Links in
// Flux), read from the lexicon, never written here.
export function ConnectionsDrawerPanel() {
  const { t } = useDeskLexicon();
  return (
    <div className="wz-links-pane" data-links-pane="">
      <div className="wz-tutor-h">{t('drawerLinks')}</div>
      <div className="wz-tutor-empty">{t('drawerLinksEmpty')}</div>
    </div>
  );
}
