// PUB1 — the Press shell. A door you pass through, never a home (R1): the
// route, the return chip, the read-only running order, and E1's downloads/
// copy housed under "More formats"/"Copy". Lazy-loaded (App.tsx), so a
// writer who never opens it never pays for it.
//
// WHAT THIS ROUND DOES NOT DO: the door handler — capturing the way back and
// navigating here with a real scope — is FIX's grant, after r3 (§7's own
// PUB1 row). Until that lands, this page reads its scope from router
// navigation state (`{ scope: PressScope; parentProjectId?: string }`) and
// degrades honestly to `pressEmpty` when none is present (a direct reload or
// deep link — the same shape W2's own return chip already degrades by).
// Assemble/Dress/Render (the real PressDoc, marks through markRuns.ts,
// Editions) are not built either — "More formats" and "Copy" call E1's own
// existing pure builders directly (exportPageFiles/exportBinderDocument/
// exportEverythingDocument, store/pageExport.ts) for the scopes they already
// support (page, binder, everything); every other scope says so honestly
// rather than inventing an edition that doesn't exist yet.
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import { getWayBack } from '../store/wayBack';
import { flushNow, getJournalEntry, getProject } from '../store/persistence';
import { exportPageFiles, exportBinderDocument, exportEverythingDocument } from '../store/pageExport';
import { triggerDownload } from '../store/download';
import { copyText } from '../store/clipboard';
import { stripMarkdownConventions } from '../store/draftFormat';
import { useActionToast } from '../components/ActionToast';
import { runningOrderForBinder } from '../press/select/runningOrder';
import type { PressScope } from '../press/select/scope';

interface PressLocationState {
  scope?: PressScope;
  /** Present only when a collapsed scope (card/selection/page) has a binder
   *  home to fold back out to — §3's "← whole binder". Not part of
   *  PressScope itself (model.ts stays the pure decision shape; this is the
   *  shell's own extra context for one specific affordance). */
  parentProjectId?: string;
}

function wayBackPreviewLabel(entryId: string): string | null {
  const entry = getJournalEntry(entryId);
  if (!entry) return null;
  const firstLine = (entry.text ?? '').split('\n').map((l) => l.trim()).find(Boolean);
  return firstLine || null;
}

export function Press() {
  const { t } = useDeskLexicon();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useActionToast();
  const state = (location.state ?? null) as PressLocationState | null;
  const [scope, setScope] = useState<PressScope | null>(state?.scope ?? null);
  const parentProjectId = state?.parentProjectId;

  const wayBack = useMemo(() => getWayBack(), []); // one read per mount, W2's own contract: the most recent departure

  const runningOrder = useMemo(
    () => (scope?.kind === 'binder' ? runningOrderForBinder(scope.projectId) : null),
    [scope],
  );

  const collapseToPage = (entryId: string) => setScope({ kind: 'page', entryId });
  const expandToBinder = () => {
    if (!parentProjectId) return;
    setScope({ kind: 'binder', projectId: parentProjectId, highlightEntryId: scope && 'entryId' in scope ? scope.entryId : undefined });
  };

  const doDownloadPage = (entryId: string, format: 'md' | 'txt') => {
    flushNow();
    const entry = getJournalEntry(entryId);
    if (!entry) { toast.show(t('publishDownloadFailed')); return; }
    const files = exportPageFiles(entry);
    const ok = triggerDownload(`${files.base}.${format}`, format === 'md' ? files.md : files.txt, format === 'md' ? 'text/markdown' : 'text/plain');
    toast.show(ok ? t('publishDownloadConfirm') : t('publishDownloadFailed'));
  };
  const doDownloadBinder = (projectId: string) => {
    flushNow();
    const project = getProject(projectId);
    if (!project) { toast.show(t('publishDownloadFailed')); return; }
    const { filename, content } = exportBinderDocument(project);
    const ok = triggerDownload(filename, content, 'text/markdown');
    toast.show(ok ? t('publishDownloadConfirm') : t('publishDownloadFailed'));
  };
  const doDownloadEverything = () => {
    flushNow();
    const { filename, content } = exportEverythingDocument();
    const ok = triggerDownload(filename, content, 'text/markdown');
    toast.show(ok ? t('publishDownloadConfirm') : t('publishDownloadFailed'));
  };
  const doCopy = async (text: string, which: 'words' | 'formatted') => {
    const payload = which === 'words' ? stripMarkdownConventions(text) : text;
    const ok = await copyText(payload);
    toast.show(ok ? t(which === 'words' ? 'publishCopyWordsConfirm' : 'publishCopyFormattedConfirm') : t('publishCopyFailed'));
  };

  // The source text for Copy — 'page' reads the persisted entry (flushed
  // first, the same discipline downloadThisPage uses); 'selection' already
  // carries its own text and needs no read at all.
  const copyText_ = scope?.kind === 'page' ? (() => { flushNow(); return getJournalEntry(scope.entryId)?.text ?? null; })()
    : scope?.kind === 'selection' ? scope.text
    : null;

  return (
    <div className="press-shell wz-press">
      <header className="press-header">
        <h1 className="press-title">{t('pressTitle')}</h1>
        {wayBack && (
          <button type="button" className="press-return-chip" onClick={() => navigate(wayBack.route)}>
            <span aria-hidden="true">↩</span>{' '}
            {t('pressReturn')}{(() => { const label = wayBackPreviewLabel(wayBack.entryId); return label ? `: ${label}` : ''; })()}
          </button>
        )}
      </header>

      {!scope ? (
        <p className="press-empty">{t('pressEmpty')}</p>
      ) : (
        <>
          {parentProjectId && scope.kind !== 'binder' && (
            <button type="button" className="press-whole-binder" onClick={expandToBinder}>{t('pressWholeBinder')}</button>
          )}

          {runningOrder && (
            <section className="press-running-order" aria-label={t('pressRunningOrder')}>
              <h2>{t('pressRunningOrder')}</h2>
              <ol>
                {runningOrder.map((row) => {
                  const highlighted = scope.kind === 'binder' && scope.highlightEntryId === row.id;
                  return (
                    <li key={row.id} data-highlighted={highlighted ? 'true' : 'false'}>
                      {row.navTitle}
                      {highlighted && (
                        <button type="button" className="press-just-this" onClick={() => collapseToPage(row.id)}>{t('pressJustThis')}</button>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          <section className="press-more-formats" aria-label={t('pressMoreFormats')}>
            <h2>{t('pressMoreFormats')}</h2>
            {scope.kind === 'page' && (
              <>
                <button type="button" onClick={() => doDownloadPage(scope.entryId, 'md')}>{t('publishDownloadPageMd')}</button>
                <button type="button" onClick={() => doDownloadPage(scope.entryId, 'txt')}>{t('publishDownloadPageTxt')}</button>
              </>
            )}
            {scope.kind === 'binder' && (
              <button type="button" onClick={() => doDownloadBinder(scope.projectId)}>{t('publishDownloadBinder')}</button>
            )}
            {scope.kind === 'everything' && (
              <button type="button" onClick={doDownloadEverything}>{t('publishDownloadEverything')}</button>
            )}
            {scope.kind !== 'page' && scope.kind !== 'binder' && scope.kind !== 'everything' && (
              <p className="press-scope-unbuilt">{t('pressEmpty')}</p>
            )}
          </section>

          {copyText_ != null && (
            <section className="press-copy" aria-label={t('pressCopy')}>
              <h2>{t('pressCopy')}</h2>
              <button type="button" onClick={() => doCopy(copyText_, 'words')}>{t('publishCopyWords')}</button>
              <button type="button" onClick={() => doCopy(copyText_, 'formatted')}>{t('publishCopyFormatted')}</button>
            </section>
          )}
        </>
      )}
      {toast.node}
    </div>
  );
}

export default Press;
