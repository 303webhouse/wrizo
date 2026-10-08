import { useEffect, useRef, useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { requestLogout } from '../store/logoutRequest';
import { clearLogoutBlock, getLogoutBlock, logoutWords, rejectedLine, subscribeLogoutBlock } from '../store/logoutGuard';

// LOGOUT SAFETY — shown when a sign-out was refused because writing has not reached the account. An OVERLAY beside
// the routes (like the guest claim sheet): the page stays mounted and keeps its place. "Stay signed in" is the
// default and is where focus starts; Esc is the same. Signing out anyway is a SECOND step behind an explicit confirm,
// and only that confirm re-requests the sign-out with force.
function focusablesIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLButtonElement>('button')).filter((el) => !el.disabled);
}

export function LogoutBlockedSheet() {
  const { t } = useDeskLexicon();
  const [block, setBlock] = useState(getLogoutBlock());
  const [confirming, setConfirming] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const visible = block !== null;

  useEffect(() => subscribeLogoutBlock(() => { setBlock(getLogoutBlock()); setConfirming(false); }), []);

  useEffect(() => {
    if (!visible) return;
    returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    stayRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        clearLogoutBlock();
        return;
      }
      const panel = panelRef.current;
      if (e.key !== 'Tab' || !panel) return;
      const items = focusablesIn(panel);
      if (items.length === 0) return;
      const first = items[0]; const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && panel.contains(active);
      if (e.shiftKey && (!inside || active === first)) { e.preventDefault(); e.stopPropagation(); last.focus(); }
      else if (!e.shiftKey && (!inside || active === last)) { e.preventDefault(); e.stopPropagation(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      const back = returnTo.current;
      returnTo.current = null;
      if (back && document.contains(back)) back.focus();
    };
  }, [visible]);

  if (!block) return null;
  const words = logoutWords(block.count, t);
  const rejected = rejectedLine(block.rejectedTitles, t);

  return (
    <div className="wz-logout-sheet" role="alertdialog" aria-modal="true" aria-labelledby="wz-logout-sheet-body">
      <div className="wz-logout-sheet-panel" ref={panelRef}>
        <p id="wz-logout-sheet-body" className="wz-logout-sheet-body">{words.body}</p>
        {rejected && <p className="wz-logout-sheet-rejected">{rejected}</p>}
        <button type="button" className="wz-btn wz-primary" ref={stayRef} onClick={() => clearLogoutBlock()}>
          {t('logoutStay')}
        </button>
        {!confirming ? (
          <button type="button" className="wz-link wz-logout-anyway" onClick={() => setConfirming(true)}>{words.anyway}</button>
        ) : (
          <>
            <button type="button" className="wz-link wz-logout-confirm" onClick={() => { clearLogoutBlock(); requestLogout(true); }}>{words.confirm}</button>
            <button type="button" className="wz-link" onClick={() => setConfirming(false)}>{t('logoutAnywayBack')}</button>
          </>
        )}
      </div>
    </div>
  );
}
