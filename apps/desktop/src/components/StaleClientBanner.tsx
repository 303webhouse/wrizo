import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import { useStaleClient } from '../store/staleClient';
import { flushAll } from '../store/flushRegistry';
import { flushForReload } from '../store/persistence';

// B10.1 - "WRIZO UPDATED, RELOAD". Shown when the server reports a build different from the one this tab loaded (see
// store/clientBuild.ts and sync.ts). Rendered by App on EVERY route and in every auth state (writing page, board, Arrival),
// never from one screen's chrome.
//
// The stale tab is READ-ONLY: the whole app root is made inert (nothing can be typed or clicked behind the banner) and
// persistence holds its automatic writes - several tabs share one localStorage, and an old tab flushing its cache would
// overwrite the live tab's. Making the root inert changes no layout: the page keeps its rect (PAGE IS PRIMARY), and the
// banner is a fixed overlay in a portal OUTSIDE the root, so it is the one thing still reachable.
//
// Reload is the only act. It runs flushAll() (every editor's pending text moves into its record), writes once with
// flushForReload() so the unsent edits are on this device, then reloads - and the new build pushes them.
export function StaleClientBanner() {
  const stale = useStaleClient();
  const { t } = useDeskLexicon();

  useEffect(() => {
    if (!stale) return;
    const root = document.getElementById('root');
    const active = document.activeElement;
    if (active instanceof HTMLElement && root?.contains(active)) active.blur();
    root?.setAttribute('inert', '');
    return () => { root?.removeAttribute('inert'); };
  }, [stale]);

  if (!stale) return null;
  const reload = () => {
    try { flushAll(); } catch { /* a failing editor must not stop the reload */ }
    try { flushForReload(); } catch { /* storage is best-effort here, as everywhere */ }
    window.location.reload();
  };
  return createPortal(
    <div className="wz-stale-banner" role="alert" data-stale-client="true">
      <span className="wz-stale-banner-text">{t('staleClientBody')}</span>
      <button type="button" className="wz-btn wz-primary wz-stale-banner-reload" onClick={reload} autoFocus>
        {t('staleClientReload')}
      </button>
    </div>,
    document.body,
  );
}
