import { useRef, useState } from 'react';
import { useTheme, setTheme, type ThemeId } from '../store/theme';
import { useThemePrefs, setThemePrefs } from '../store/themePrefs';
import { useThemeUnlockStatus, isThemeOpen, wordsToUnlock } from '../store/themeUnlock';
import { useAmbianceDial, prefersReducedMotion } from '../store/ambianceDial';
import { createFluxCardGlitchController, FLUX_CARD_GLITCH_MS } from '../store/fluxCardGlitch';
import { ensureThemeFonts } from '../store/themeFonts';
import { Seg } from './ModeStage';

// THEME PICKER (step 2 of the Oct 21 build queue; theme-menu-brief.md / theme-rules.md §C,
// cursor/theme-picker-mockup @ 1a057bea). Replaces CascadePanels.tsx's own button-list
// CascadeThemePanel (THEME_OPTS) — this component owns only the panel BODY (the cards + the
// Dark/Light toggle); the panel's own head (title + close) is Cascade.tsx's, unchanged, and
// already reads the per-theme "Mood"/"Skin" word (deskLexicon's own cascadeThemeTitle).
//
// ABSENT, NOT GRAYED: THEME_CARDS below lists one entry per BUILT theme — today exactly
// `ThemeId`'s own three members (Machina joined with its build). Nomad/Volant do not appear at all
// until each gains its own ThemeId and its own entry here; this list is never hand-filtered at render time.
//
// EACH CARD IS BRAND ART, NOT A THEME-SCOPED COMPONENT: unlike every other per-theme override
// in this codebase (a `[data-theme="x"]` CSS block), a card must show FLUX'S look while the
// writer is sitting IN Arbor — the picker's whole job is letting you see where you'd be going.
// So card art is keyed by the CARD's own theme (a plain class), never by the ambient active
// theme; only the picker's own CHROME (the panel itself) follows the ambient theme, via the
// existing wz-cascade-panel-body it already renders inside.
interface ThemeCardDef {
  id: ThemeId;
  name: string;
  cardClass: string;      // the CARD's OWN theme, independent of the ambient active theme
  wordmarkClass: string;  // the wordmark's own type face (per theme-rules.md B.4)
}

// Arbor — the rhizome. Base strokes always visible; the "grow" layer reveals on hover/focus
// (stroke-dashoffset, CSS below), over the word "Arbor" (Nick's own correction: fuller/messier
// than the existing rhizome mark, ported from the approved mockup's own path data).
function ArborPlate() {
  return (
    <>
      <svg className="wz-theme-plate-rhizome" viewBox="0 0 280 220" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round">
          <path d="M148 86 C132 70 118 74 96 58" />
          <path d="M118 66 C104 52 92 58 70 44" />
          <path d="M148 86 C160 62 168 48 154 28" />
          <path d="M162 52 C178 40 196 46 214 32" />
          <path d="M148 86 C176 78 198 88 228 74" />
          <path d="M198 82 C210 96 206 112 220 124" />
          <path d="M148 86 C124 102 108 96 82 112" />
          <path d="M108 100 C92 114 98 132 78 146" />
          <path d="M148 86 C156 108 142 124 158 142" />
          <path d="M152 118 C170 128 166 146 184 152" />
          <path d="M96 58 C84 48 78 36 88 26" />
          <path d="M82 112 C64 104 52 112 40 100" />
        </g>
      </svg>
      <svg className="wz-theme-plate-grow" viewBox="0 0 280 220" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round">
          <path d="M158 142 C150 160 132 168 118 186" />
          <path d="M118 186 C104 198 96 206 78 208" />
          <path d="M158 142 C176 164 168 182 188 198" />
          <path d="M184 152 C200 170 192 188 210 200" />
          <path d="M148 86 C140 120 120 150 132 188" />
          <path d="M132 188 C124 200 140 210 156 206" />
        </g>
      </svg>
    </>
  );
}

// Flux — the glitch. A terminal prompt plus two scanlines that tick sideways on hover/focus.
// `glitching` plays exactly ONE animation iteration (never `infinite`) — the rate-limited pulse
// a FluxCardGlitchController grants, note (e) below.
function FluxPlate({ glitching }: { glitching: boolean }) {
  return (
    <>
      <div className="wz-theme-plate-prompt" aria-hidden="true">&gt;_</div>
      <div className={`wz-theme-plate-tick wz-theme-plate-tick-cyan${glitching ? ' wz-theme-glitching' : ''}`} aria-hidden="true" />
      <div className={`wz-theme-plate-tick wz-theme-plate-tick-lime${glitching ? ' wz-theme-glitching' : ''}`} aria-hidden="true" />
    </>
  );
}

// Machina - the run. Twenty units like the theme's own Run strip: a few gray (finished), the orange notch on the first unfinished one; on hover/focus the strip RUNS (the units fill, the notch travels
// to the end) once. Not a flash - no budget; the still frame (reduced motion / Ambiance 0) holds the strip part-filled.
const MACHINA_PLATE_UNITS = 20;
const MACHINA_PLATE_DONE = 8;
function MachinaPlate() {
  return (
    <div className="wz-theme-plate-run" aria-hidden="true">
      {Array.from({ length: MACHINA_PLATE_UNITS }, (_, i) => (
        <i key={i} className={i < MACHINA_PLATE_DONE ? 'on' : undefined} style={{ ['--i' as string]: i } as React.CSSProperties} />
      ))}
      <b className="wz-theme-plate-notch" />
    </div>
  );
}

// ORDER follows theme-arc.md's narrative progression (Arbor -> Machina -> Flux; Fable's A3 ruling on TH2) - not launch order.
const THEME_CARDS: ThemeCardDef[] = [
  { id: 'plateau', name: 'Arbor', cardClass: 'wz-theme-card-arbor', wordmarkClass: 'wz-theme-wm-arbor' },
  { id: 'machina', name: 'Machina', cardClass: 'wz-theme-card-machina', wordmarkClass: 'wz-theme-wm-machina' },
  { id: 'flux', name: 'Flux', cardClass: 'wz-theme-card-flux', wordmarkClass: 'wz-theme-wm-flux' },
];

export function ThemePicker() {
  const current = useTheme();
  const prefs = useThemePrefs();
  const status = useThemeUnlockStatus();
  const ambianceDial = useAmbianceDial();
  // note (d): the still frame applies to reduced motion AND Ambiance 0 — the first is an OS/CSS
  // fact the existing @media rule already sees; Ambiance is pure JS state, so it needs this
  // data attribute (same combination GlitchMeter.tsx:60 already uses: `prefersReducedMotion() ||
  // getAmbianceDial() === 0`).
  const stillFrame = ambianceDial === 0 || prefersReducedMotion();

  // note (e): one controller for the Flux card's own hover/focus glitch, gated by the shared
  // global flash budget (store/flashBudget.ts) plus its own mid-pulse refusal, so a quick hover
  // in/out can't stack pulses. Never triggers while still.
  const glitchController = useRef(createFluxCardGlitchController());
  const [fluxGlitching, setFluxGlitching] = useState(false);
  const triggerFluxGlitch = () => {
    if (stillFrame) return;
    if (!glitchController.current.requestPulse()) return;
    setFluxGlitching(true);
    setTimeout(() => setFluxGlitching(false), FLUX_CARD_GLITCH_MS);
  };

  // Machina's faces load WITH the theme (store/themeFonts.ts), never at boot - so the card asks for them on the first sign of intent (hover / focus), and shows its fallback stack until they land.
  const loadMachinaFaces = () => ensureThemeFonts('machina');

  return (
    <div className="wz-cascade-panel-body wz-theme-picker" data-still={stillFrame ? 'true' : 'false'}>
      <div className="wz-theme-picker-field">
        <Seg label="Page" value={prefs.page} opts={[['light', 'Light'], ['dark', 'Dark']]} onPick={(v) => setThemePrefs({ page: v as 'dark' | 'light' })} />
      </div>
      <div className="wz-theme-cards">
        {THEME_CARDS.map((card) => {
          const open = isThemeOpen(card.id, status, current);
          const remaining = wordsToUnlock(card.id, status);
          const isFlux = card.id === 'flux';
          const isMachina = card.id === 'machina';
          return (
            <button
              key={card.id}
              type="button"
              className={`wz-theme-card ${card.cardClass}${open ? '' : ' locked'}`}
              disabled={!open}
              aria-pressed={open && current === card.id}
              onClick={() => setTheme(card.id)}
              onMouseEnter={isFlux ? triggerFluxGlitch : isMachina ? loadMachinaFaces : undefined}
              onFocus={isFlux ? triggerFluxGlitch : isMachina ? loadMachinaFaces : undefined}
            >
              <div className="wz-theme-plate" aria-hidden="true">{card.id === 'plateau' ? <ArborPlate /> : isMachina ? <MachinaPlate /> : <FluxPlate glitching={fluxGlitching} />}</div>
              <div className="wz-theme-nameblock">
                <div className={`wz-theme-wm ${card.wordmarkClass}`}>{card.name}</div>
                {/* note (a): readouts state only true things — a null `remaining` (no fetch yet,
                    a failed fetch, or no threshold entry at all) renders NO number, never "0" or
                    a guess. */}
                {!open && remaining != null && (
                  <div className="wz-theme-note">{remaining.toLocaleString('en-US')} more words to open {card.name}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
