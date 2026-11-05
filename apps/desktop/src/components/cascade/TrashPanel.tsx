import type { NavigateFunction } from 'react-router-dom';
import { useDeskLexicon } from '../../store/deskLexicon';
import { openTrashBoard } from './shared';

// ---------------------------------------------------------------------------
// Trash (B1 S5) — joins the cascade "quietly at the foot of section C —
// reachable, never prominent, no count anywhere near it." One plain button,
// nothing else: no row list, no preview, no number of anything — the Trash
// is a place, not a nag (A18's anti-solicitation core, held here the same
// way it's held on the Board itself: Delete stays quiet everywhere, and so
// does the door to where deleted pages wait).
// ---------------------------------------------------------------------------
export function TrashPanel({ navigate }: { navigate: NavigateFunction }) {
  const { t } = useDeskLexicon();
  return (
    <div className="wz-cascade-panel-body">
      <button type="button" className="wz-cascade-action" onClick={() => openTrashBoard(navigate)}>{t('cascadeTrashOpen')}</button>
    </div>
  );
}

