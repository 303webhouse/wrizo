import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createBinder, createBinderPage, createScriptPage, createBoardPage, saveBoardBoxes } from '../store/persistence';
import { KIND_META, PICKER_GROUPS } from '../store/kindLabels';
import { useDeskLexicon } from '../store/deskLexicon';
import { DeckWizard } from '../components/DeckWizard';
import { DECKS } from '../decks/library';
import { materializeDeck } from '../decks/engine';
import type { DeckDefinition, DeckAnswers, DeckRoom } from '../decks/types';
import { armStartHere } from '../store/deckHint';
// Review fix (independent re-verification of B2.1 S6) — a genuine gap the
// build's own harness never exercised: DrawersTree.tsx's own in-drawer
// "New Binder" row (deliberately NOT "New Drawer" there, to avoid
// colliding with that tree's own top-level "+ New Drawer" action — see
// deskLexicon.ts's header comment) navigates HERE, to `/project/new?drawer=
// <id>` — and this screen, unconditionally, always read "NEW DRAWER"
// regardless. A writer clicking "New Binder" landed on a screen headlined
// "NEW DRAWER" one click later: the exact same-word collision Q2 was
// meant to avoid, just deferred one hop. `drawerId` (below) is the SAME
// signal DrawersTree.tsx's own button already uses to construct this
// exact navigation, so keying off it here is precise, not a new guess.
import { useLexicon } from '../store/themeLexicon';
import type { BinderKind } from '../types';

// F4 — "What are you writing?" Domain enters at CREATE time, on the binder, never
// as an app mode (the mirror principle). Three quiet domain groups of honest
// per-domain forms over ONE shared machinery + label map (store/kindLabels.ts), so
// the picker and the mirror card can never drift. Title is optional (name it after
// you've written); every picked form lands straight on ink — binder, first page,
// Free write, caret waiting. "Something else" opens the project overview to shape
// as you go.
//
// B3 S3 — door 1: "Start from a deck…" sits BENEATH this entire picker
// (Blank stays first-class, first-listed, byte-for-byte unchanged as the
// default path — nothing above this comment changed one byte for this
// ticket). A judgment call, recorded in the build report: which project
// `type`/`kind` a deck-born project gets, since the deck path never runs
// through KIND_META/PICKER_GROUPS at all — one reasonable per-room mapping,
// used only to keep the mirror card's own domain chrome honest afterward.
const ROOM_PROJECT_META: Record<DeckRoom, { type: 'creative' | 'academic' | 'professional'; kind: BinderKind }> = {
  fiction: { type: 'creative', kind: 'book' },
  speculative: { type: 'creative', kind: 'book' },
  screen: { type: 'creative', kind: 'screenplay' },
  academy: { type: 'academic', kind: 'thesis' },
  business: { type: 'professional', kind: 'proposal' },
  newsroom: { type: 'professional', kind: 'article' },
};

export function CreateProject() {
  const navigate = useNavigate();
  const { t } = useDeskLexicon();
  const { t: lex } = useLexicon();
  const [params] = useSearchParams();
  const drawerId = params.get('drawer') || undefined;
  // Reached from inside an existing, named Drawer container (DrawersTree's
  // own "New Binder" row) — this screen's chrome must say what that row
  // said, or the click contradicts its own destination.
  const inDrawer = !!drawerId;
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<BinderKind | null>(null);
  // B3 S3 — door 1's own opt-in state: opens ONLY on the writer's own click
  // on "Start from a deck…" below (never ambiently — the anti-solicitation
  // law S1 binds).
  const [deckWizardOpen, setDeckWizardOpen] = useState(false);

  const start = () => {
    if (!selected) return;
    const { domain } = KIND_META[selected];
    const project = createBinder(title.trim(), selected, drawerId, domain);
    // 'Something else' opens the project overview (shape it as you go). Every real
    // form is born as binder + first page and lands on the ink — the typed
    // pointer (domain + form + pageType) is set from birth, so the mirror card
    // speaks this project's language from day one. S1 — Screenplay is the one
    // kind whose first page isn't a manuscript chapter: it's a script page,
    // caret waiting in the scene-heading ghost (still no title demanded).
    if (selected === 'other') {
      navigate(`/project/${project.id}`);
    } else if (selected === 'screenplay') {
      const page = createScriptPage(project.id);
      navigate(`/page/${page.id}`);
    } else {
      const page = createBinderPage(project.id, 'manuscript');
      navigate(`/page/${page.id}`);
    }
  };

  // B3 S3 — door 1's own last act: "a project born as a seeded board" (this
  // ticket's own namesake). Creates the project (the SAME createBinder call
  // the blank path already uses, given this deck's own room), a fresh
  // empty Board page (createBoardPage, titled with the deck's own name),
  // deals onto it (materializeDeck, pure — decks/engine.ts), persists via
  // saveBoardBoxes (the SAME boxes-array path any other card creation
  // already uses — this board has no live mounted component yet to race,
  // unlike door 2's own onDeckDealt in BoardEditor.tsx, whose header
  // comment explains why THAT door can't do this), arms Start Here, and
  // lands the writer on the dealt board — "ends on the dealt board."
  const onDeckDealt = (deck: DeckDefinition, answers: DeckAnswers) => {
    const meta = ROOM_PROJECT_META[deck.room];
    const project = createBinder(title.trim(), meta.kind, drawerId, meta.type);
    const board = createBoardPage(project.id, t(deck.nameTerm));
    const result = materializeDeck(deck, answers, []);
    saveBoardBoxes(board.id, result.boxes);
    armStartHere(board.id, result.firstCardId, result.dealtIds);
    navigate(`/page/${board.id}`);
  };

  const note = !selected
    ? 'Pick a form to begin — no title required.'
    : selected === 'other'
      // NOT context-aware, unlike the eyebrow/title-label below: this
      // specific note previews the 'other' path's own real destination,
      // ProjectHome.tsx (see `start()` above) — which always reads
      // "Drawer" (its own domain eyebrow is untouched by this review fix,
      // for the same "match the majority of inbound links" reasoning
      // QuickSprint.tsx's own updated comment explains). Varying this
      // note by inDrawer would just relocate the same contradiction one
      // line down instead of closing it.
      ? t('createDrawerOpensNote')
      : `${KIND_META[selected].label} starts on its first page, in Free write, with the caret waiting.`;

  return (
    <>
    {/* B3 S3 — door 1's own blur wrapper (DeckWizard.tsx's own header
        comment has the full "why a fresh class pair, not the board's own"
        reasoning). Purely additive: `.deck-wizard-blur-wrap` carries only
        `transition:filter/opacity`, so with the wizard closed this wrapper
        is layout-inert — every element inside it renders byte-identically
        to before this ticket. */}
    <div className={`deck-wizard-blur-wrap${deckWizardOpen ? ' deck-wizard-blurred' : ''}`}>
    <div className="create-picker">
      <button type="button" className="cp-back" onClick={() => navigate('/')}>&larr; Home</button>
      <div className="cp-eyebrow">{inDrawer ? `NEW ${lex('binder').toUpperCase()}` : t('createDrawerEyebrow')}</div>
      <h1 className="cp-title">What are you writing?</h1>
      <p className="cp-sub">Books, essays, scripts — same desk underneath. The form sets your page names, and later its format conventions and support pages.</p>

      {PICKER_GROUPS.map(group => (
        <div className="cp-group" key={group.domain}>
          <div className="cp-ghead">
            <span className="cp-gname">{group.name}</span>
            <span className="cp-rule" />
          </div>
          <div className="cp-cards">
            {group.kinds.map(kind => (
              <button
                key={kind}
                type="button"
                className={`cp-kind${selected === kind ? ' sel' : ''}`}
                data-kind={kind}
                aria-pressed={selected === kind}
                onClick={() => setSelected(kind)}
              >
                <span className="cp-k">{KIND_META[kind].label}</span>
                <span className="cp-d">{KIND_META[kind].desc}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        className={`cp-else${selected === 'other' ? ' sel' : ''}`}
        aria-pressed={selected === 'other'}
        onClick={() => setSelected('other')}
      >
        Something else — start blank and shape it as you go
      </button>

      {/* B3 S3 — door 1: "Start from a deck…", beneath Blank (this whole
          picker above, unconditionally first-listed and untouched). Opens
          the deck library as a pop-out (DeckWizard.tsx) grouped by room. */}
      <button
        type="button"
        className="cp-start-from-deck"
        onClick={() => setDeckWizardOpen(true)}
      >
        {t('deckWizardStartFromDeck')}
      </button>

      <div className="cp-titlerow">
        <input
          className="cp-title-input"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && selected) { e.preventDefault(); start(); } }}
          placeholder="Untitled — you can name it after you’ve written"
          aria-label={inDrawer ? `${lex('binder')} title (optional)` : t('createDrawerTitleLabel')}
        />
        <button type="button" className="cp-go" disabled={!selected} onClick={start}>Start writing</button>
      </div>
      <div className="cp-micro">{note}</div>

      <p className="cp-footnote">Support pages adapt to the domain later: character &amp; worldbuilding sheets for Creative, sources &amp; citations for Academic, interviews &amp; research for Professional. One machinery, honest names.</p>
    </div>
    </div>
    {deckWizardOpen && (
      <DeckWizard decks={DECKS} onDeal={onDeckDealt} onClose={() => setDeckWizardOpen(false)} />
    )}
    </>
  );
}
