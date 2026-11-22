import { useMemo, useSyncExternalStore } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { subscribe } from '../store/persistence';
import { attachables } from './publishing';
import { setDocSetting } from './docSettings';
import { attachedNow, toggleAttach, useAttached, usePublishing } from './publishPick';

// ATTACH ASSETS TO WHAT GOES OUT (reorg-plan-v2, INK queue item 5b; the stage menus, A4; Nick: "Assets can be attached to the exported Doc, but only if she chooses, never by default. It sits here, in the Back menu").
// A list at the head of the Back menu's Assets tab that exists only while the publishing sheet is open on this page: one tick for each of the Doc's own assets (POLISH's docSettings `assets`, listed below as "This Doc").
// NONE is ticked until she ticks one (never by default); the ticks are REMEMBERED per Doc (Fable, Nov 21: docSettings export.attach, beside the Plan's tick), so the sheet opens as she left it. A tick changes nothing she
// can see on the sheet or the page; it decides what the files and the clipboard carry (after the Parts, under one heading, publishingText.ts), and it adds nothing to the page's own rect (a list in the Back menu, a tool beside the page).

const fill = (s: string, vals: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vals ? String(vals[k]) : m));

export function ExportAttach({ pageId }: { pageId: string }) {
  const { t } = useDeskLexicon();
  const publishing = usePublishing(pageId);
  const picked = useAttached(pageId);
  // re-read when the store changes (an asset added or removed while the sheet is open), as a string so the snapshot is stable
  const sig = useSyncExternalStore(subscribe, () => (publishing ? attachables(pageId, '').map((a) => a.key + '\u0001' + a.title).join('\u0002') : ''));
  const list = useMemo(() => (publishing ? attachables(pageId, t('reorgUntitled')) : []), [publishing, pageId, sig]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (!publishing || list.length === 0) return null;
  return (
    <section className="reorg-attach" data-attach-list="" aria-label={t('reorgAttachHead')}>
      <div className="wz-graft-gh reorg-attach-head">{t('reorgAttachHead')}</div>
      {list.map((a) => (
        <label key={a.key} className="reorg-attach-row" data-attach={a.key}>
          <input type="checkbox" checked={picked.has(a.key)} onChange={() => { toggleAttach(pageId, a.key); const now = attachedNow(pageId); setDocSetting(pageId, { export: { attach: list.map((x) => x.key).filter((k) => now.has(k)) } }); }} aria-label={fill(t('reorgAttachTick'), { title: a.title })} />
          <span>{a.title}</span>
        </label>
      ))}
    </section>
  );
}
