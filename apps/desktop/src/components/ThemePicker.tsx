import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme, setTheme, type ThemeId } from '../store/theme';
import { useThemePrefs, setThemePrefs } from '../store/themePrefs';
import { useThemeUnlockStatus, isThemeOpen, wordsToUnlock } from '../store/themeUnlock';
import { subscribeSyncStatus } from '../store/sync';
import { useAmbianceDial, prefersReducedMotion } from '../store/ambianceDial';
import { createFluxCardGlitchController, FLUX_CARD_GLITCH_MS } from '../store/fluxCardGlitch';
import { ensureThemeFonts } from '../store/themeFonts';
import { deskTerm } from '../store/deskLexicon';
import { useCast } from '../store/themeCast';
import { arborTileTone, machinaTileTone, tileRhizome, type TileTone } from '../store/themeTiles';
import { Seg } from './ModeStage';
import { PageToneRow } from './settings/rows';
import { isArbor2 } from '../arbor2/flag';
import { ArborThemeRoomRow } from '../arbor2/themeRoom';
import { isMachina2 } from '../machina2/flag';
import { MachinaThemeRoomRow } from '../machina2/themeRoom';

// the theme picker's body (flourish-spec.md §3): five tiles, two across, in narrative order - the three built themes, each in its own current look whatever theme is in use, then Nomad and Volant, grey and shut [ThemePicker §1]
interface ThemeCardDef {
  id: ThemeId;
  name: string;
  cardClass: string;      // the CARD's OWN theme, independent of the ambient active theme
  wordmarkClass: string;  // the wordmark's own type face (per theme-rules.md B.4)
}

// Arbor: a few strokes at rest (the plate), and on hover/focus the full rhizome, drawn over the word with a knot at each tip [ThemePicker §2]
function ArborPlate() {
  return (
    <svg className="wz-theme-plate-rhizome" viewBox="0 0 280 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
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
  );
}

function ArborGrow() {
  const { shoots, knots } = useMemo(() => tileRhizome(), []);
  return (
    <svg className="wz-theme-plate-grow" viewBox="0 0 130 180" preserveAspectRatio="none" aria-hidden="true">
      {shoots.map((s, i) => <path key={i} d={s.d} pathLength={1} style={{ ['--d' as string]: s.depth } as React.CSSProperties} />)}
      {knots.map(([x, y], i) => <circle key={`k${i}`} cx={x} cy={y} r={1.9} />)}
    </svg>
  );
}

// Machina - the run. Twenty units like the theme's own Run strip, six done at rest, the brass notch on the first unfinished one; on hover/focus the strip RUNS to its close once (the units fill, the notch travels to the end, the strip turns brass, "RUN CLOSED"). Not a flash - no budget; the still frame holds the closed Run.
const MACHINA_PLATE_UNITS = 20;
const MACHINA_PLATE_DONE = 6;
function MachinaPlate() {
  return (
    <>
      <div className="wz-theme-plate-run" aria-hidden="true">
        {Array.from({ length: MACHINA_PLATE_UNITS }, (_, i) => (
          <i key={i} className={i < MACHINA_PLATE_DONE ? 'on' : undefined} style={{ ['--i' as string]: i } as React.CSSProperties} />
        ))}
        <b className="wz-theme-plate-notch" />
      </div>
      <div className="wz-theme-plate-closed" aria-hidden="true">{deskTerm('themeRunClosed', 'machina')}</div>
    </>
  );
}

// Flux - CHECKPOINT fills one letter at a time; the newest letter glitches to code with a 2 px colour split, then resolves; at the end every unit turns orange. A glitch is a flash: it asks the global budget (store/fluxCardGlitch.ts), and a refused one is skipped.
const FLUX_TILE_STEP_MS = 400;   // two and a half letters a second, under the flash law's three
const FLUX_CODE = '01#%&$@/\\<>=+*';
function useCheckpoint(length: number, still: boolean) {
  const [playing, setPlaying] = useState(false);
  const [filled, setFilled] = useState(0);
  const [done, setDone] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const budget = useRef(createFluxCardGlitchController());
  useEffect(() => {
    if (!playing || still) return undefined;
    let n = 0, clear = 0;
    const timer = window.setInterval(() => {
      if (n >= length) { window.clearInterval(timer); setDone(true); return; }
      n += 1;
      setFilled(n);
      window.clearTimeout(clear);
      const glitch = budget.current.requestPulse();
      setCode(glitch ? FLUX_CODE[Math.floor(Math.random() * FLUX_CODE.length)] : null);
      if (glitch) clear = window.setTimeout(() => setCode(null), FLUX_CARD_GLITCH_MS);
    }, FLUX_TILE_STEP_MS);
    return () => { window.clearInterval(timer); window.clearTimeout(clear); setFilled(0); setDone(false); setCode(null); };
  }, [playing, still, length]);
  return {
    filled: still ? length : filled, done: still || done, code: still ? null : code,
    play: () => setPlaying(true), stop: () => setPlaying(false),
  };
}

function FluxPlate({ word, run }: { word: string; run: ReturnType<typeof useCheckpoint> }) {
  return (
    <>
      <span className="wz-theme-plate-bracket wz-theme-plate-bracket-tl" aria-hidden="true" />
      <span className="wz-theme-plate-bracket wz-theme-plate-bracket-br" aria-hidden="true" />
      <div className="wz-theme-plate-check" data-done={run.done ? 'true' : 'false'} aria-hidden="true">
        {[...word].map((ch, i) => {
          const glitch = run.code != null && i === run.filled - 1;
          return <i key={i} data-on={i < run.filled ? 'true' : 'false'} data-glitch={glitch ? 'true' : undefined}>{i < run.filled ? (glitch ? run.code : ch) : ''}</i>;
        })}
      </div>
    </>
  );
}

// Nomad's picture: night, the red horizon, a braid and glyphs drawn in the sand. The glyphs are invented marks, from no real script.
function braid(phase: number): string {
  let d = '';
  for (let x = 14; x <= 116; x += 3) d += `${d ? 'L' : 'M'}${x} ${(142 + 6.5 * Math.sin(x / 8 + phase)).toFixed(1)}`;
  return d;
}
function NomadPlate() {
  return (
    <svg className="wz-theme-plate-art" viewBox="0 0 130 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d="M0 103 H130" stroke="#E0503A" strokeWidth="1.6" />
      <path d="M0 112 Q34 104 68 113 T130 110" fill="none" stroke="#6A4430" strokeWidth="1" />
      <g fill="none" stroke="#D49A63" strokeWidth="1.3" strokeLinecap="round">
        <path d={braid(0)} />
        <path d={braid(2.1)} />
        <path d={braid(4.2)} />
        <path d="M24 125 a6 6 0 1 1 9 4" />
        <path d="M88 122 h14 M91 122 v6 M99 122 v-6" />
        <path d="M30 164 c0 -9 13 -9 11 0 c-1 6 -10 5 -8 -1" />
        <path d="M62 166 q7 -11 14 0 q-7 5 -5 -4" />
      </g>
      <g fill="#D49A63">
        <circle cx="28.5" cy="124" r="1.4" />
        <circle cx="95" cy="131" r="1.4" />
        <circle cx="102" cy="158" r="1.5" />
        <circle cx="108" cy="166" r="1.5" />
        <circle cx="96" cy="166" r="1.5" />
      </g>
    </svg>
  );
}

// Volant's picture: the nearly white plane, straight strokes, the orb.
function VolantPlate() {
  return (
    <svg className="wz-theme-plate-art" viewBox="0 0 130 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g stroke="#AEB8C2" strokeWidth="1" fill="none">
        <path d="M-5 142 L135 106" />
        <path d="M-5 160 L135 144" />
        <path d="M12 185 L70 118" />
        <path d="M62 -5 L135 96" />
        <path d="M-5 38 L52 -5" />
      </g>
      <circle cx="94" cy="42" r="15" fill="#D5E0EB" stroke="#93A6BA" strokeWidth="1" />
      <circle cx="89" cy="37" r="4.5" fill="#FFFFFF" />
    </svg>
  );
}

// order follows the theme arc's narrative progression (Arbor -> Machina -> Flux), not launch order [ThemePicker §3]
const THEME_CARDS: ThemeCardDef[] = [
  { id: 'plateau', name: 'Arbor', cardClass: 'wz-theme-card-arbor', wordmarkClass: 'wz-theme-wm-arbor' },
  { id: 'machina', name: 'Machina', cardClass: 'wz-theme-card-machina', wordmarkClass: 'wz-theme-wm-machina' },
  { id: 'flux', name: 'Flux', cardClass: 'wz-theme-card-flux', wordmarkClass: 'wz-theme-wm-flux' },
];

// the room and the page tone move while the picker is open; the tiles that follow them re-read <html> when they do
function useTileTones(current: ThemeId): { arbor: TileTone; machina: TileTone } {
  const prefs = useThemePrefs();
  const [, tick] = useState(0);
  useEffect(() => {
    const mo = new MutationObserver(() => tick((x) => x + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-room', 'data-arbor2-room', 'data-machina2-room'] });
    tick((x) => x + 1);
    return () => mo.disconnect();
  }, []);
  const root = document.documentElement;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const roomAttr = root.getAttribute('data-room');
  return {
    arbor: arborTileTone({ inForce: current === 'plateau' ? root.getAttribute('data-arbor2-room') : null, roomAttr, minutes, reduced: prefersReducedMotion() }),
    machina: machinaTileTone({ inForce: current === 'machina' ? root.getAttribute('data-machina2-room') : null, roomAttr, minutes, page: prefs.page }),
  };
}

export function ThemePicker() {
  const current = useTheme();
  const prefs = useThemePrefs();
  const status = useThemeUnlockStatus(subscribeSyncStatus);
  const ambianceDial = useAmbianceDial();
  const cast = useCast();
  const tones = useTileTones(current);
  // note (d): the still frame applies to reduced motion AND Ambiance 0 — the first is an OS/CSS
  // fact the existing @media rule already sees; Ambiance is pure JS state, so it needs this
  // data attribute (same combination GlitchMeter.tsx:60 already uses: `prefersReducedMotion() ||
  // getAmbianceDial() === 0`).
  const stillFrame = ambianceDial === 0 || prefersReducedMotion();
  const checkpoint = deskTerm('flux3Checkpoint', 'flux').toUpperCase();
  const flux = useCheckpoint([...checkpoint].length, stillFrame);

  // Machina's faces load WITH the theme (store/themeFonts.ts), never at boot - so the card asks for them on the first sign of intent (hover / focus), and shows its fallback stack until they land.
  const loadMachinaFaces = () => ensureThemeFonts('machina');

  return (
    <div className="wz-cascade-panel-body wz-theme-picker" data-still={stillFrame ? 'true' : 'false'}>
      <div className="wz-theme-picker-field">
        <PageToneRow page={prefs.page} />
        {/* ARBOR v2 MOCKUP r17 (Fable, Nov 2): the room's control right beside Page - Nick couldn't find "light mode" */}
        {isArbor2() && current === 'plateau' && <ArborThemeRoomRow />}
        {/* MACHINA'S LOOK (r8, Fable Nov 2; ships Nov 19): the room's control right beside Page - Nick couldn't find "light mode" */}
        {isMachina2() && current === 'machina' && <MachinaThemeRoomRow />}
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
              data-tone={card.id === 'plateau' ? tones.arbor : isMachina ? tones.machina : 'dark'}
              data-cast={isMachina ? cast : undefined}
              disabled={!open}
              aria-pressed={open && current === card.id}
              onClick={() => setTheme(card.id)}
              onMouseEnter={isFlux ? flux.play : isMachina ? loadMachinaFaces : undefined}
              onFocus={isFlux ? flux.play : isMachina ? loadMachinaFaces : undefined}
              onMouseLeave={isFlux ? flux.stop : undefined}
              onBlur={isFlux ? flux.stop : undefined}
            >
              <div className="wz-theme-plate" aria-hidden="true">{card.id === 'plateau' ? <ArborPlate /> : isMachina ? <MachinaPlate /> : <FluxPlate word={checkpoint} run={flux} />}</div>
              <div className="wz-theme-nameblock">
                <div className={`wz-theme-wm ${card.wordmarkClass}`}>{card.name}</div>
              </div>
              {card.id === 'plateau' && <ArborGrow />}
              {/* note (a): readouts state only true things — a null `remaining` (no fetch yet,
                  a failed fetch, or no threshold entry at all) renders NO number, never "0" or
                  a guess. */}
              {!open && remaining != null && (
                <div className="wz-theme-note">{remaining.toLocaleString('en-US')} more words to open {card.name}</div>
              )}
            </button>
          );
        })}
        {/* Nomad and Volant are not built: always grey, never opened, no hover animation */}
        <button type="button" className="wz-theme-card wz-theme-card-nomad locked" disabled aria-pressed={false} aria-label={deskTerm('themeNomadNotYet')}>
          <div className="wz-theme-plate" aria-hidden="true"><NomadPlate /></div>
          <div className="wz-theme-nameblock"><div className="wz-theme-wm wz-theme-wm-nomad">Nomad</div></div>
          <div className="wz-theme-band">{deskTerm('themeNotYet')}</div>
        </button>
        <button type="button" className="wz-theme-card wz-theme-card-volant locked" disabled aria-pressed={false} aria-label={deskTerm('themeVolantNotYet')}>
          <div className="wz-theme-plate" aria-hidden="true"><VolantPlate /></div>
          <div className="wz-theme-nameblock">
            <div className="wz-theme-wm wz-theme-wm-volant">
              <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><path d="M8 29 L28 8 M20 33 L33 19" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" /></svg>
              <span className="wz-theme-hidden">Volant</span>
            </div>
          </div>
          <div className="wz-theme-band">{deskTerm('themeNotYet')}</div>
        </button>
      </div>
    </div>
  );
}
