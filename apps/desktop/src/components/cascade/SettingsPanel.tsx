import { useAskBeforeDelete, setAskBeforeDelete } from '../../store/deleteGate';
import type { NavigateFunction } from 'react-router-dom';
import { useDeskLexicon } from '../../store/deskLexicon';
import { getCurrentUser } from '../../store/currentUser';
import { requestLogout } from '../../store/logoutRequest';
import { useSigningOut } from '../../store/useSigningOut';
import { useTheme } from '../../store/theme';
import { useCast, setCast } from '../../store/themeCast';
import { FullscreenToggle, SyncIndicator } from '../ChromeControls';

// ---------------------------------------------------------------------------
// Settings (site-wide) — "what exists today ... invent nothing" (S3's own
// words): the SAME Sign out/Sync/Fullscreen controls GlobalHeader's corner
// cluster already carries, reused via components/ChromeControls.tsx, not
// rebuilt. Explicitly distinct from the sliver-foot gear (page/writing
// customization, FX3's own addition) — this category never touches it.
// ---------------------------------------------------------------------------
export function CascadeSettingsPanel({ navigate }: { navigate: NavigateFunction }) {
  const { t } = useDeskLexicon();
  const authed = !!getCurrentUser();
  const signingOut = useSigningOut();
  const askBeforeDelete = useAskBeforeDelete();
  const theme = useTheme();
  const cast = useCast();
  return (
    <div className="wz-cascade-panel-body">
      {/* the Cast row exists only under Machina: the stored value is kept across themes but means nothing outside it [CascadePanels §17] */}
      {theme === 'machina' && (
        <div className="wz-cascade-row wz-cascade-cast" role="group" aria-label="Cast">
          <span>Cast</span>
          {(['cool', 'neutral'] as const).map((c) => (
            <button key={c} type="button" className={`wz-cascade-action${cast === c ? ' active' : ''}`} aria-pressed={cast === c} data-cast-option={c} onClick={() => setCast(c)}>
              {c === 'cool' ? 'Cool' : 'Neutral'}
            </button>
          ))}
        </div>
      )}
      <div className="wz-cascade-row"><FullscreenToggle /></div>
      <div className="wz-cascade-row"><SyncIndicator /></div>
      {/* BOARD CONTEXT MENU: the one setting for every delete - ticking "Don't ask me again" in the dialog turns it off; this turns it back on (per device) */}
      <button type="button" className="wz-cascade-switch" role="switch" aria-checked={askBeforeDelete ? 'true' : 'false'} onClick={() => setAskBeforeDelete(!askBeforeDelete)}>
        <span>{t('settingsAskBeforeDelete')}</span>
        <span className="wz-cascade-switch-track" aria-hidden="true"><i /></span>
      </button>
      {authed && (
        <button
          type="button"
          className="wz-cascade-action"
          onClick={() => { requestLogout(); }}
          disabled={signingOut}
        >
          {signingOut ? t('logoutSigningOut') : t('cascadeSettingsSignOut')}
        </button>
      )}
    </div>
  );
}

