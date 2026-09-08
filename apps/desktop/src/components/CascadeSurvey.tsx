import { Fragment, useState, type ReactNode } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';

// PW1 S3 — the drag half's dataTransfer type. Named here, beside the only
// producer, and imported by the only consumer (BoardEditor's canvas) so the
// two can never drift to two different strings.
export const SURVEY_DRAG_TYPE = 'text/wrizo-survey-item';

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
  // PW1 S2 — TWO SECTIONS (Nick, Q4): a board's own Cards, then the Pages
  // linked to it. Carried on the ITEM rather than as a separate `sections`
  // prop so every existing caller stays byte-identical (all undefined → one
  // ungrouped grid, exactly as before) and so ordering stays `buildSurvey`'s
  // single responsibility. A heading renders whenever this value CHANGES from
  // the previous item's, which means the builder's order IS the sectioning.
  sectionTitle?: string;
  // PW1 S3 — the row's own state line ("member · shown on the board"). Display
  // state is a FACT ON THE ROW, never inferred from the wall. Distinct from
  // `excerpt` (which is content) because this is provenance, and a harness
  // asserting the no-count law over second lines must be able to tell them
  // apart.
  note?: string;
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
  // AB4 S1 — the CD2 erratum comes true: picking a board in the Plan survey
  // swaps this SAME column to that board's cards, one layer deeper. `onBack`
  // (present only on that nested view) renders a quiet affordance back to
  // the board list — distinct from `onDismiss` (which closes/docks the
  // whole survey), since this walks back one step within it instead.
  onBack?: () => void;
  // PW1 S3 — the drag half of the two display acts (Nick, Q4): drag a row onto
  // the canvas and it lands WHERE DROPPED. The BUILDER supplies the payload
  // (it alone knows which board and which box a row stands for), and a row that
  // returns null is simply not draggable — a card, or a row with no lawful
  // drop. Optional because the drag needs a canvas and so exists only on a
  // board; the MENU act is the one that must be complete everywhere, and it is
  // (`renderMenu`).
  dragPayload?: (item: SurveyItem) => string | null;
}

export function CascadeSurvey({ title, items, onTravel, docked, onDismiss, renderMenu, onBack, dragPayload }: SurveyProps) {
  const { t } = useDeskLexicon();
  return (
    <div className="wz-cascade-survey" data-open="true" data-docked={docked ? 'true' : 'false'}>
      <div className="wz-cascade-survey-head">
        <span className="wz-cascade-survey-head-lead">
          {onBack && (
            <button type="button" className="wz-cascade-dock-btn wz-cascade-survey-back" aria-label={t('cascadeSurveyBack')} title={t('cascadeSurveyBack')} onClick={onBack}>‹</button>
          )}
          <span className="wz-cascade-survey-title">{title}</span>
        </span>
        {docked && (
          <button type="button" className="wz-cascade-dock-btn" aria-label="Close" onClick={onDismiss}>×</button>
        )}
      </div>
      <div className="wz-cascade-survey-grid">
        {items.length === 0 && <div className="wz-cascade-empty">{t('cascadeSurveyEmpty')}</div>}
        {items.map((item, i) => (
          <Fragment key={item.id}>
            {/* PW1 S2 — a section heading whenever the builder's order crosses
                into a new one. Never rendered for an absent sectionTitle, so
                an ungrouped survey (Journal's, and every pre-PW1 caller) emits
                no headings at all. */}
            {item.sectionTitle && item.sectionTitle !== items[i - 1]?.sectionTitle && (
              <div className="wz-cascade-survey-section">{item.sectionTitle}</div>
            )}
            <SurveyThumb item={item} onTravel={onTravel} renderMenu={renderMenu} dragPayload={dragPayload} />
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function SurveyThumb({ item, onTravel, renderMenu, dragPayload }: { item: SurveyItem; onTravel: (id: string) => void; renderMenu?: (item: SurveyItem) => ReactNode; dragPayload?: (item: SurveyItem) => string | null }) {
  const { t } = useDeskLexicon();
  const [menuOpen, setMenuOpen] = useState(false);
  const payload = dragPayload ? dragPayload(item) : null;
  return (
    <div className={`wz-cascade-thumb${item.current ? ' current' : ''}`}
      // PW1 S3 — right-click is the SECOND display act (Nick, Q4), and it is
      // deliberately not a second menu: it opens the one the row already
      // carries. Every act stays reachable by the keyboard and the unfamiliar
      // hand through that same `⋯`, which is the whole point of the twin law
      // (PW22) — a gesture may be a shortcut, never the only path.
      onContextMenu={renderMenu ? (e) => { e.preventDefault(); setMenuOpen(true); } : undefined}
      draggable={payload ? true : undefined}
      onDragStart={payload ? (e) => { e.dataTransfer.setData(SURVEY_DRAG_TYPE, payload); e.dataTransfer.effectAllowed = 'move'; } : undefined}
    >
      <button type="button" className="wz-cascade-thumb-title" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }}
        onClick={() => onTravel(item.id)} aria-current={item.current ? 'true' : undefined}>
        {item.title}
      </button>
      {/* S4's own reserved half: a card's image where a card IS an image,
          instead of the title+excerpt read. AB4 (the Wall) lights the
          rendering path here; it does not itself generate new card images
          (out of scope per the brief's own non-goals — "card images beyond
          what boxes already carry"), so `item.image` stays unset today and
          this branch is exercised by a future ticket without a rewrite. */}
      {item.image && <img className="wz-cascade-thumb-image" src={item.image} alt="" />}
      {item.excerpt && <div className="wz-cascade-thumb-excerpt">{item.excerpt}</div>}
      {/* PW1 S3 — the state line: "member · shown on the board". Its own class,
          never the excerpt's, so what is CONTENT and what is PROVENANCE stay
          distinguishable to a reader and to a harness alike. */}
      {item.note && <div className="wz-cascade-thumb-note">{item.note}</div>}
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
