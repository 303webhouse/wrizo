import { useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { firstLine } from '../store/entryText';
import type { JournalEntry } from '../types';

// AB3 S2 — the Page face: everything about a page in one place (title, star,
// tags, where it lives, the sending verbs), read from `subject` — canon
// amendment A1: the face describes the thing under the writer's ATTENTION,
// not a hardcoded "current page." This ticket only ever constructs
// `{ kind: 'page', ... }`; AB4 adds a 'wall-item' | 'wall' subject without
// touching this component's own rendering (it only ever reads `subject`).
export interface PageFaceSubject {
  kind: 'page';
  entry: JournalEntry;
  // "Where it lives" — told truthfully (S5: a filed journal-origin page
  // tells BOTH truths). `homeLabel` is the primary line; `memberships` are
  // any additional truthful lines (e.g. "Also in the Journal.").
  homeLabel: string;
  memberships: string[];
  // The saved-silently line — its ONLY appearance anywhere once this ships.
  // Undefined when it doesn't apply (a filed page has its own save story).
  footer?: string;
  onToggleStar: () => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onOpenMoveCopy: () => void;
  onOpenPortToBoard: () => void;
  // AB4 S2 — Pin, the fourth sending verb: membership, not capture. Joins
  // Move/Copy/Port in the same row, riding the same Add-to grammar (a board
  // picker) — see PinToBoardSheet.tsx.
  onOpenPin: () => void;
}

export function PageFace({ subject }: { subject: PageFaceSubject }) {
  const { t } = useDeskLexicon();
  const [tagDraft, setTagDraft] = useState('');
  const { entry } = subject;
  const hasInk = (entry.strokes?.length ?? 0) > 0;
  const textEmpty = !entry.text.trim();
  // Title — derived from the page's own first line, matching every existing
  // title display verbatim (JournalEntry's <h1>, PageEditor's crumb). There
  // is no stored title field to rename (J10's model never grew one, and S0
  // permits exactly one schema addition this ticket — `origin` — so a real
  // rename pipe is out of scope here; this is a deliberate, flagged gap, not
  // an oversight — see the AB3 build report).
  const title = textEmpty ? (hasInk ? 'A sketch' : 'Untitled') : firstLine(entry.text).slice(0, 100);

  const commitTag = () => {
    const v = tagDraft.trim();
    if (!v) return;
    subject.onAddTag(v);
    setTagDraft('');
  };

  return (
    <div className="wz-pageface">
      <div className="wz-pageface-title">{title}</div>

      <button
        type="button"
        className="wz-pageface-star"
        data-starred={entry.starred ? 'true' : 'false'}
        aria-pressed={!!entry.starred}
        onClick={subject.onToggleStar}
      >
        {entry.starred ? `★ ${t('pageFaceStarred')}` : `☆ ${t('pageFaceStar')}`}
      </button>

      <div className="wz-pageface-home">
        <div className="wz-pageface-home-label">{subject.homeLabel}</div>
        {subject.memberships.map(m => (
          <div key={m} className="wz-pageface-membership">{m}</div>
        ))}
      </div>

      <div className="wz-pageface-tags">
        {(entry.tags ?? []).map(tag => (
          <span key={tag} className="wz-pageface-tag" data-tag={tag}>
            {tag}
            <button type="button" className="wz-pageface-tag-remove" aria-label={`Remove ${tag}`} onClick={() => subject.onRemoveTag(tag)}>×</button>
          </span>
        ))}
        <input
          className="wz-pageface-tag-input"
          value={tagDraft}
          onChange={e => setTagDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitTag(); } }}
          placeholder={t('pageFaceAddTag')}
        />
        <button type="button" className="wz-pageface-tag-add" onClick={commitTag}>{t('pageFaceAdd')}</button>
      </div>

      <div className="wz-pageface-verbs">
        <button type="button" className="wz-pageface-verb wz-pageface-verb-movecopy" onClick={subject.onOpenMoveCopy}>
          {t('pageFaceMoveCopy')}
        </button>
        <button type="button" className="wz-pageface-verb wz-pageface-verb-port" onClick={subject.onOpenPortToBoard}>
          {t('pageFacePortToBoard')}
        </button>
        <button type="button" className="wz-pageface-verb wz-pageface-verb-pin" onClick={subject.onOpenPin}>
          {t('pageFacePin')}
        </button>
      </div>

      {subject.footer && <div className="wz-pageface-footer">{subject.footer}</div>}
    </div>
  );
}
