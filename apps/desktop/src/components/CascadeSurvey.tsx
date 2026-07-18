import { useState, type ReactNode } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';

// CD2 S4 — the survey (layer 3), one generic component every category's
// "Open…"/"All ___ →"/"choosing a container" doorway feeds. Large
// thumbnails: title + a two-line excerpt (or a card's own image where a
// card IS an image — no category in THIS ticket surveys image cards, so
// that half of S4 has no live exercise yet; the `image` field below exists
// so a future ticket — AB4's own board-card survey, built ON this system
// per the canon's A8/T2 re-scoping — can light it without a rewrite).
// Current item olive (never brass); click = travel; no counts, no badges,
// nothing begs (S4's own words).
export interface SurveyItem {
  id: string;
  title: string;
  excerpt?: string;
  image?: string;
  current?: boolean;
}

export interface SurveyProps {
  title: string;
  items: SurveyItem[];
  onTravel: (id: string) => void;
  docked: boolean;
  // The panel's own close affordance already docks/closes this survey (S2);
  // this is the SEPARATE explicit-close the canon's T5 rider names for a
  // DOCKED survey specifically ("dismissed only by explicit close, category
  // switch, or Escape") — undocking-by-reclicking-the-strip is a different
  // act from dismissing outright, so a docked survey carries its own quiet
  // close too.
  onDismiss: () => void;
  // Per-item quiet disclosure (S3: "Move and Delete behind a quiet
  // disclosure — never first position") — a render prop so this component
  // stays category-agnostic; only Plan's board rows use it this ticket.
  renderMenu?: (item: SurveyItem) => ReactNode;
  // S4's one-order-surface principle: drag-to-reorder only where an order
  // surface lawfully exists (a board's own cards). No category this ticket
  // supplies one (see this file's own header comment + the CD2 build
  // report) — the prop exists so a future ticket can wire it without
  // reshaping this component.
  onReorder?: (fromId: string, toId: string) => void;
}

export function CascadeSurvey({ title, items, onTravel, docked, onDismiss, renderMenu }: SurveyProps) {
  const { t } = useDeskLexicon();
  return (
    <div className="wz-cascade-survey" data-open="true" data-docked={docked ? 'true' : 'false'}>
      <div className="wz-cascade-survey-head">
        <span className="wz-cascade-survey-title">{title}</span>
        {docked && (
          <button type="button" className="wz-cascade-dock-btn" aria-label="Close" onClick={onDismiss}>×</button>
        )}
      </div>
      <div className="wz-cascade-survey-grid">
        {items.length === 0 && <div className="wz-cascade-empty">{t('cascadeSurveyEmpty')}</div>}
        {items.map((item) => (
          <SurveyThumb key={item.id} item={item} onTravel={onTravel} renderMenu={renderMenu} />
        ))}
      </div>
    </div>
  );
}

function SurveyThumb({ item, onTravel, renderMenu }: { item: SurveyItem; onTravel: (id: string) => void; renderMenu?: (item: SurveyItem) => ReactNode }) {
  const { t } = useDeskLexicon();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={`wz-cascade-thumb${item.current ? ' current' : ''}`}>
      <button type="button" className="wz-cascade-thumb-title" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }}
        onClick={() => onTravel(item.id)} aria-current={item.current ? 'true' : undefined}>
        {item.title}
      </button>
      {item.excerpt && <div className="wz-cascade-thumb-excerpt">{item.excerpt}</div>}
      {item.current && <div className="wz-cascade-thumb-row"><span style={{ fontSize: 10, letterSpacing: 1, color: 'var(--accent-rest)' }}>{t('cascadeSurveyCurrent')}</span></div>}
      {renderMenu && (
        <>
          <button type="button" className="wz-cascade-thumb-menu-btn" aria-label="More" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>⋯</button>
          {menuOpen && <div className="wz-cascade-thumb-menu">{renderMenu(item)}</div>}
        </>
      )}
    </div>
  );
}
