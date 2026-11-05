import { useEffect, useRef, useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import type { PageActions } from '../store/pageActions';
import { requestDelete } from '../store/deleteGate';
import { CopyIcon, DeleteIcon, HeaderFooterIcon, TagsIcon } from './DrawerIcons';

// the drawer's ACTIONS: Tags, Copy, Delete, Header/Footer, wired by store/pageActions.ts; Delete goes through the one "Send to Trash?" dialog every delete uses [DrawerActions §1]

type Open = 'tags' | null;

export function DrawerActions({ actions }: { actions: PageActions }) {
  const { t } = useDeskLexicon();
  const [open, setOpen] = useState<Open>(null);
  const [tagDraft, setTagDraft] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open === 'tags') tagInputRef.current?.focus(); }, [open]);

  const toggle = (which: Exclude<Open, null>) => setOpen(o => (o === which ? null : which));
  const commitTag = () => {
    const tag = tagDraft.trim();
    if (!tag) return;
    actions.tags.onAdd(tag);
    setTagDraft('');
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(null); }
  };

  return (
    <div className="wz-actions" onKeyDown={onKeyDown}>
      <div className="wz-actions-row" role="group" aria-label={t('railActions')}>
        <button type="button" className="wz-action-btn" data-action="tags" aria-expanded={open === 'tags'} aria-pressed={open === 'tags'}
          title={t('actionTags')} aria-label={t('actionTags')} onClick={() => toggle('tags')}><TagsIcon /></button>
        <button type="button" className="wz-action-btn" data-action="copy"
          title={t('actionCopy')} aria-label={t('actionCopy')} onClick={actions.onCopy}><CopyIcon /></button>
        <button type="button" className="wz-action-btn" data-action="delete"
          title={t('actionDelete')} aria-label={t('actionDelete')} onClick={() => requestDelete(() => actions.onDelete())}><DeleteIcon /></button>
        <button type="button" className="wz-action-btn" data-action="header-footer" aria-pressed={actions.headerFooter.on}
          title={t('actionHeaderFooter')} aria-label={t('actionHeaderFooter')} onClick={actions.headerFooter.onToggle}><HeaderFooterIcon /></button>
      </div>

      {open === 'tags' && (
        <div className="wz-actions-tags" data-actions-area="tags">
          {actions.tags.list.map(tag => (
            <span key={tag} className="wz-actions-tag" data-tag={tag}>
              {tag}
              <button type="button" className="wz-actions-tag-remove" aria-label={`${t('actionTagRemove')} ${tag}`} onClick={() => actions.tags.onRemove(tag)}>×</button>
            </span>
          ))}
          <input
            ref={tagInputRef}
            className="wz-actions-tag-input"
            value={tagDraft}
            onChange={e => setTagDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitTag(); } }}
            placeholder={t('pageFaceAddTag')}
            aria-label={t('actionTags')}
          />
        </div>
      )}
    </div>
  );
}
