import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createBinder, createBinderPage, createScriptPage } from '../store/persistence';
import { KIND_META, PICKER_GROUPS } from '../store/kindLabels';
import { useDeskLexicon } from '../store/deskLexicon';
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
  );
}
