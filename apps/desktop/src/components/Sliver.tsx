import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';
import { useTheme, type ThemeId } from '../store/theme';
import { TypeControl, type TypeControlProps } from './TypeControl';
import { requestOpen, noteClosed, registerDrawer } from '../store/menusDrawers';
import { useWritingSettings, setWritingSettings, setTypewriterExplicit, typewriterForPage } from '../store/writingSettings';
import type { ProgressMetric, FadeDepth, ProgressStyle } from '../store/writingSettings';
import { useWritingGoal, setWritingGoal, goalCount, goalFraction, DEFAULT_GOAL_LINES, type WritingGoal, type GoalUnit } from '../store/writingGoal';
// FX3 S5 — the writing-settings gear leaves the paper entirely and moves to
// the sliver's own foot (below); rather than duplicate SettingsPanel/
// ThemePanel/Seg/GearIcon's JSX here, they're exported from ModeStage.tsx
// (their original home — gear/theme selection stays exactly the same
// mechanism, just reached from a new place) and reused verbatim, with a
// scoped CSS override (index.css's `.wz-sliver-instruments .mode-settings`)
// repositioning their popover to sit inline in the sliver's own scrolling
// panel instead of ModeStage's absolute stage-corner placement.
import { Seg } from './ModeStage';
import { HelpButton } from './HelpButton';
import { BEGINNING_GLYPH } from './BeginningsRow';
import { TemplateSketch, type TemplateKey } from './TemplateSketch';
import { useForwardLock, setForwardLock } from '../store/forwardLock';
import type { FormatAction, StructureKind } from '../store/draftFormat';
import type { PageKindSetting, StyleGuide } from '../types';
import type { InkPen } from './InkStratum';
import { INKS, NIBS, TIPS } from '../store/ink';
import { drawerArrow, setDrawerInert } from '../store/drawerShell';
import { leftTabsFor, sectionAllowed, type DrawerKind, type LeftTab } from '../store/drawerSet';
import { SideDrawer, type DrawerTabsConfig } from './SideDrawer';
import { isArbor2 } from '../arbor2/flag';
import { arborToolTabs, arborSectionAllowed, type ArborToolTab } from '../arbor2/drawerTabs';
import { DrawerActions } from './DrawerActions';
import { TypewriterModeIcon, ProgressModeIcon } from './DrawerIcons';
import type { PageActions } from '../store/pageActions';
import type { StrokeInk, StrokeNib, StrokeTip } from '../types';
import { wordCount } from '../store/wordCount';

// the rosters and their lexicon keys in one place each, in order: Normal (preselected), Screenplay, Research; MLA (default), APA, Chicago, AP [Sliver §1]
const PAGE_KINDS: readonly PageKindSetting[] = ['normal', 'screenplay', 'research'];
const STYLE_GUIDES: readonly StyleGuide[] = ['mla', 'apa', 'chicago', 'ap'];
const KIND_LABEL = { normal: 'kindNormal', screenplay: 'kindScreenplay', research: 'kindResearch' } as const;
const STYLE_GUIDE_LABEL = { mla: 'styleGuideMla', apa: 'styleGuideApa', chicago: 'styleGuideChicago', ap: 'styleGuideAp' } as const;

// CD1 S2/S7 — the sliver. A slim grip riding the paper's left edge on every
// framed writing surface (prose AND script — S7 mirrors the wiring exactly).
// Supersedes AB2's ToolRail (retired whole, S7): its per-mode hand-tool
// content moves here VERBATIM (same JSX, same behavior, renamed classes
// only — `.desk-toolrail-*` -> `.wz-sliver-*`), and grows a NEW foot (S6):
// the goal block (timer numeral, the progress hairline, one inline edit).
//
// Geometry (S2's hard invariant): the sliver is mounted by DeskFrame.tsx as
// an ABSOLUTELY POSITIONED overlay anchored to the paper's own canonical
// width, inside `.desk-frame-stage` — never a grid/flex track of its own,
// so it structurally CANNOT move the paper's rect regardless of open/
// closed/dissolved state (see index.css's `.desk-frame-sliver-anchor`).
//
// Dissolve (S2: "the one vanishing engine — no second implementation"): the
// PANEL carries the same `chrome-fade desk-dissolve` classes every other
// DeskFrame track already carries, so it rides the SAME ambient
// `.desk-frame[data-writing='true'] .desk-dissolve` rule every other zone
// obeys — no useChromeDissolve call lives in this file. The GRIP never
// carries those classes, so it persists through a dissolve untouched,
// exactly like ChromeHandle's own "always-discoverable" dot elsewhere.
//
// Open/closed is this component's own local, uncontrolled state (nothing
// else needs to read or drive it) — toggled by clicking the grip or the
// keyboard shortcut documented beside deskLexicon.ts (Ctrl/Cmd+/ — an
// unclaimed modifier chord: 'n' is DeskRail's bare-key Catch shortcut,
// arrow keys are the Journal's notebook paging, Ctrl/Cmd+1-8 are the
// Screenplay Room's element retype chord; Ctrl//Cmd+/ collides with none of
// them and is a common "toggle panel" mnemonic elsewhere).
export const SLIVER_SHORTCUT_LABEL = 'Ctrl/Cmd+/';

export const CAPTURE_ITEMS = ['Spark deck', 'Fragments', 'Send → Drawer'] as const;

// ITEM 207 - the Type control's props as a sliver member. OPTIONAL on every arm that can carry it, and the absence is the
// whole of "absent, never greyed": a host that passes none renders nothing (a screenplay page passes none - its face is
// the format's). `form` is the arm's own call: Free Write is the smallest form (no number); Draft and Revise are the full.
export type SliverType = TypeControlProps;

export type SliverContent =
  | { kind: 'empty' }
  // ITEM 207 - Revise's drawer has been an empty drawer since 112-A ("112-C fills it with 83's Type section"); this arm is
  // that tenant and nothing else. It replaces `{ kind: 'empty' }` for Revise so the drawer can carry the Type control.
  | { kind: 'revise'; type?: SliverType }
  | {
      kind: 'freewrite';
      // PHASE 1 - the TEXT | INK choice, shown as the drawer's tab row. Present only where the host has an instrument (PageEditor's Free
      // Write); a Journal capture page passes none and its drawer has no tab row. The VALUE is the host's: the paper, the caret and
      // the drawer all read the same one.
      instrument?: { value: LeftTab; onChange: (next: LeftTab) => void };
      forwardLock?: {
        on: boolean;
        onToggle: (next: boolean) => void;
      };
      type?: SliverType;
      // ITEM 121 I4 — THE INK OPTIONS. Present ONLY when the page is in INK:
      // PageEditor passes this member in INK and omits it in TEXT, so in TEXT
      // the zone is ABSENT FROM THE DOM ENTIRELY — not hidden, not greyed. The
      // analog law is the reason and G3 is the precedent: a typewriter has no
      // nibs, and a greyed control for a capability the surface does not have
      // right now is a locked door wearing paint.
      inkOptions?: {
        pen: InkPen;
        // One handler for all three groups: a partial pen, merged by the host.
        // Three separate callbacks would let tip, nib and ink drift into three
        // independently-shaped seams for one object the writer thinks of as
        // "the pen I am holding."
        onPick: (next: Partial<InkPen>) => void;
        eraserArmed: boolean;
        onToggleEraser: () => void;
      };
      captureItems: readonly string[];
    }
  | {
      kind: 'draft';
      // this page's own id and emptiness, so formatLocked and the foot's toggle ask typewriterForPage, never the shared mirror [Sliver §2]
      pageId: string;
      pageEmpty: boolean;
      // PHASE 1 - the Actions section (Tags, Copy, Delete, Header/Footer). Present only on a born prose page; a screenplay host and an
      // unborn page pass none, and then the section is absent from the DOM, never greyed.
      actions?: PageActions;
      structure: StructureKind;
      onSwitchStructure: (next: StructureKind) => void;
      // ITEM 122 — the Draft rail gains an active state it never had. Optional,
      // so a caller that does not track a caret simply renders unlit buttons
      // exactly as before.
      format?: {
        onFormat: (action: FormatAction) => void;
        boldOn?: boolean; italicOn?: boolean; underlineOn?: boolean; strikeOn?: boolean;
        // the caret line's heading level (1-6), or null: H lights on a heading line [Sliver §3]
        headingLevel?: number | null;
      };
      // the page's declared kind and, under Research, its style guide; optional: the screenplay surface passes none, since a script page has already declared what it is [Sliver §4]
      type?: SliverType;
      pageKind?: PageKindSetting;
      onPickKind?: (next: PageKindSetting) => void;
      styleGuide?: StyleGuide;
      onPickStyleGuide?: (next: StyleGuide) => void;
      // the Templates picker's rows: the host decides what a press does (empty page: in place; a page with words: a new page); `selected` draws the current template chosen [Sliver §5]
      templates?: { key: TemplateKey; label: string; selected?: boolean; onApply: () => void }[];
    }
  // AB4 S5 — the Board's own hand tool(s). FX4 S6 — the Connect toggle
  // RETIRES (replaced by BoardEditor.tsx's own handle-drag thread gesture:
  // double-click the selected card's resize handle, drag, release inside a
  // target card); the sliver carries Add card alone now. Everything else
  // in the sliver (the goal foot, the instruments row) is shared furniture
  // every framed surface already carries — this union member only ever
  // governs SliverToolsBody's own per-mode section, same as
  // 'freewrite'/'draft' above.
  | {
      kind: 'board';
      // B1 S3 — both optional now: on a system Board, BoardEditor.tsx
      // passes neither at all — "the sliver's Add action must be absent on
      // system boards," an absence in the DOM, not merely an inert click
      // (Delete on a derived card gets that inert-click treatment instead;
      // Add gets this one). Undefined, never a no-op function, is the
      // signal SliverToolsBody below reads to skip rendering each button.
      onAddCard?: () => void;
      // New page card: a real page, created and pinned to this board in one act (BoardEditor's onAddPageCard) [Sliver §6]
      onAddPageCard?: () => void;
      // B2 S5 — "Existing page…": beside FX6's New page card, a quiet
      // picker that PINS a chosen EXISTING page onto this board (membership,
      // never filing — see ExistingPagePicker.tsx's own header comment).
      // Same absent-not-disabled law as the two Add controls above: on a
      // system Board, BoardEditor.tsx passes none of the three at all.
      onAddExistingPage?: () => void;
      // B3 S3 — door 2: "From a deck…", beside the Board's own existing Add
      // options. Same absent-not-disabled law: BoardEditor.tsx passes this
      // only on an ordinary (non-system) Board.
      onAddFromDeck?: () => void;
    };

export interface SliverProps {
  content: SliverContent;
  // The page's current raw text, for the goal block's line-equivalents
  // progress (store/lineEquivalents.ts) — viewport-independent, computed
  // fresh on every render (cheap: a handful of string splits).
  goalText: string;
  // FX3 S5 — threaded through from the host (PageEditor.tsx has its own
  // `milestones` already; ScriptEditor.tsx has no milestones concept at all
  // and simply never passes this) so the relocated gear's Progress:Project
  // option can apply the SAME "no greyed states" silent-degrade rule
  // ModeStage.tsx's own gear always has (M1, canon Q3) — absent/false reads
  // as "no plan to project," exactly like a plan-less project already did.
  hasMilestones?: boolean;
}

export function Sliver({ content, goalText, hasMilestones }: SliverProps) {
  const { t } = useDeskLexicon();
  const settings = useWritingSettings();
  const target = useWritingGoal();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // ARBOR v2 MOCKUP (?arbor2=1, Arbor only): the Tools drawer's cloth tabs (src/arbor2/drawerTabs.ts). In-session state; off the flag
  // or on another theme this is unused and the drawer is byte-for-byte today's.
  const sliverTheme = useTheme();
  const arbor2 = isArbor2() && sliverTheme === 'plateau';
  const [arborPick, setArborPick] = useState<ArborToolTab>('format');

  // the open/close announcement is a layout effect keyed on `open`: a setState updater stays pure, every path that changes `open` announces, and the one-drawer hand-over lands before paint [Sliver §7]
  useLayoutEffect(() => {
    if (open) requestOpen('tools');
    else noteClosed('tools');
  }, [open]);

  const toggleOpen = () => setOpen(o => !o);

  // Register this drawer's own close path, so an exclusion handoff shuts it
  // exactly the way the writer's own click would.
  useEffect(() => registerDrawer('tools', () => setOpen(false)), []);

  // Esc closes the open drawer unless a control inside handled it; focus returns to the tab when it was in the drawer, and stays on the page otherwise [Sliver §8]
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const root = rootRef.current;
      const inDrawer = !!root && !!document.activeElement && root.contains(document.activeElement);
      setOpen(false);
      if (inDrawer) root?.querySelector<HTMLElement>('.wz-sliver-grip')?.focus();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      toggleOpen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Review fix (post-CD1) — mirrors ModeStage's own pre-existing "opt-in
  // session timer" semantic (`firstWriteRef`: elapsed since the FIRST
  // KEYSTROKE, not since the surface mounted). The sliver had no keystroke
  // signal threaded to it, so the original cut anchored the clock to the
  // sliver's own mount instead — meaning it started counting the moment the
  // page loaded, even before the writer typed a single character (idle
  // reading time silently counted as "writing time"). goalText already
  // updates live on every keystroke (every host's own input handler feeds
  // it), so the first time it changes from its as-mounted value IS the
  // first-keystroke signal, with no new prop threading needed from the
  // three hosts. Captured once per Sliver mount (a fresh page = a fresh
  // clock), same as the pre-existing pattern.
  const initialGoalTextRef = useRef(goalText);
  const [firstWriteAt, setFirstWriteAt] = useState<number | null>(null);
  useEffect(() => {
    if (firstWriteAt === null && goalText !== initialGoalTextRef.current) {
      setFirstWriteAt(Date.now());
    }
  }, [goalText, firstWriteAt]);

  const done = target != null ? goalCount(goalText, target) : 0;
  const fraction = goalFraction(goalText, target);

  // the foot's gate reports up to the panel that carries the fade classes; the setter is stable, safe as an effect dependency [Sliver §9]
  const [popoutHold, setPopoutHold] = useState(false);

  // PHASE 1 - the left drawer's tab row (TEXT | INK). Only Free Write with an instrument has one; every other surface passes undefined and
  // shows no row. The labels are the theme's own words (the same lexicon terms the band's switch uses).
  const leftTabs = leftTabsFor(content.kind as DrawerKind, content.kind === 'freewrite' && !!content.instrument);
  const sideTabs = leftTabs.length > 1 && content.kind === 'freewrite' && content.instrument
    ? {
        items: [{ id: 'text' as const, label: t('inkModeText') }, { id: 'ink' as const, label: t('inkModeInk') }],
        value: content.instrument.value,
        onChange: content.instrument.onChange,
        label: t('inkInstrument'),
      }
    : undefined;
  // ARBOR v2 MOCKUP - Format · Presets · Ink (r5, spec §9c: the r4 Font tab folds into Format, the main tab). The ink tab IS the instrument (picking it, or leaving it, calls the host's own
  // instrument switch exactly as TEXT | INK does), so the page's mode and the tab can never disagree.
  const arborKind = content.kind as DrawerKind;
  const arborInstrument = content.kind === 'freewrite' ? content.instrument : undefined;
  const arborList = arbor2 ? arborToolTabs(arborKind, !!arborInstrument) : [];
  const arborTab: ArborToolTab | undefined = !arbor2 ? undefined
    : arborInstrument?.value === 'ink' ? 'ink'
    : arborList.includes(arborPick) && arborPick !== 'ink' ? arborPick : (arborList.find((x) => x !== 'ink') ?? 'format');
  const ARBOR_WORD: Record<ArborToolTab, DeskTermId> = { format: 'railFormat', presets: 'sectionsPresets', ink: 'inkModeInk' };
  const arborTabs: DrawerTabsConfig<ArborToolTab> | undefined = arbor2 && arborList.length > 1 && arborTab
    ? {
        items: arborList.map((id) => ({ id, label: t(ARBOR_WORD[id]) })),
        value: arborTab,
        onChange: (v: ArborToolTab) => {
          setArborPick(v);
          if (arborInstrument) arborInstrument.onChange(v === 'ink' ? 'ink' : 'text');
        },
        label: t('inkInstrument'),
      }
    : undefined;

  return (
    // data-menus-dock / data-menus-handle are behaviour-free contract markers the menus probe binds to, so it keeps testing the invariant if class names change [Sliver §10]
    <div className="wz-sliver" ref={rootRef} data-open={open ? 'true' : 'false'} data-menus-dock="">
      <button
        type="button"
        data-menus-handle=""
        className="wz-sliver-grip"
        aria-expanded={open}
        aria-label={open ? t('sliverClose') : t('sliverOpen')}
        title={`${open ? t('sliverClose') : t('sliverOpen')} (${SLIVER_SHORTCUT_LABEL})`}
        onClick={toggleOpen}
      >
        <span className="wz-sliver-grip-glyph" aria-hidden="true">{drawerArrow('left', open)}</span>
        {/* with the drawer shut, the arrow tab carries a tiny pen while the page is in INK: a state in the tab's olive, never brass; absent in TEXT [Sliver §11] */}
        {content.kind === 'freewrite' && content.instrument?.value === 'ink' && (
          <span className="wz-sliver-grip-mark" data-instrument="ink" aria-hidden="true">{TIP_ICONS.pen}</span>
        )}
      </button>

      {/* data-popout-hold rides the PANEL, not the tray: a faded ancestor caps every child's opacity, and the tray may not leave the drawer; with no pop-out open it reads 'false' and nothing changes [Sliver §12] */}
      <div className="wz-sliver-panel chrome-fade desk-dissolve" ref={(el) => setDrawerInert(el, !open)} aria-hidden={!open} data-open={open ? 'true' : 'false'} data-popout-hold={popoutHold ? 'true' : 'false'}>
        {/* PHASE 1 - the sliding layer: the panel above is the clip and the scroller; <SideDrawer> is what slides in from behind the tab,
            with the TEXT | INK tab row when this surface has an instrument. The goal foot and the instruments row ride every tab. */}
        <SideDrawer side="left" idPrefix="wz-sliver" tabs={(arborTabs ?? sideTabs) as DrawerTabsConfig<string> | undefined} foot={(<>
        <SliverGoalFoot target={target} done={done} fraction={fraction} timerOn={settings.timer} firstWriteAt={firstWriteAt} />
        {/* FX3 S5 — the foot's new instruments row, beneath the goal block.
            Nested inside THIS panel (which already carries chrome-fade
            desk-dissolve) so its own open gear/instruments popovers dissolve
            on a keystroke through the exact same ambient mechanism, with no
            separate close-on-keystroke logic of its own (S6's "one
            vanishing engine" requirement — see the panel's own header
            comment on the dissolve law). */}
        {/* the foot is universal on page-writing surfaces (prose and screenplay): its menu mounts and its settings persist here; never on card or board tools [Sliver §14] */}
        <SliverInstrumentRow
          hasMilestones={hasMilestones}
          pageId={content.kind === 'draft' ? content.pageId : undefined}
          pageEmpty={content.kind === 'draft' ? content.pageEmpty : undefined}
          target={target}
          typewriterAvailable
          goalText={goalText}
          onPopoutHold={setPopoutHold}
        />
        </>)}>
        <SliverToolsBody content={content} arborTab={arborTab} />
        </SideDrawer>
      </div>
    </div>
  );
}

// ITEM 121 I4 — THE TIPS, as inline SVG (R8: the desk's glyphs are drawn, not
// typed — an emoji or a font glyph would wear whatever the OS decided today).
// 16x16, currentColor, stroke-only so they inherit the zone's own rest/chosen
// colours exactly like every other control here.
const TIP_ICONS: Record<StrokeTip, React.ReactNode> = {
  // A nib pen: barrel to a point, with the nib's slit.
  pen: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M11.5 2.2 4.3 9.4 3 13l3.6-1.3 7.2-7.2z" strokeLinejoin="round" />
      <path d="M4.3 9.4 6.6 11.7" />
    </svg>
  ),
  // A pencil: the same barrel, but with the sharpened collar a pencil has.
  pencil: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M11.2 2.5 3.9 9.8 2.7 13.3l3.5-1.2 7.3-7.3z" strokeLinejoin="round" />
      <path d="M9.6 4.1 11.9 6.4" />
      <path d="M2.7 13.3 5 11" />
    </svg>
  ),
  // A marker: a fat barrel with a chisel wedge — the shape the square cap makes.
  marker: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M12.6 2.6 7.4 7.8l-2.6 1 -1 2.6 2.6-1 1-2.6 5.2-5.2z" strokeLinejoin="round" />
      <path d="M2.6 13.4 4.8 11.2" strokeLinecap="round" />
    </svg>
  ),
};

// ITEM 121 I4 — THE INK OPTIONS ZONE. One zone, three groups and the eraser,
// rendered only when the host passes `inkOptions` — which it does only in INK.
//
// EVERY GROUP IS A RADIOGROUP OF STOPS. Nib especially: "Fine · Regular ·
// Broad" is three buttons and NOT a slider, because a slider is a digital
// control and a nib is chosen, not dialled (ink pass §0.4). Ink is four
// swatches and NOT a picker, because a journal has the inks that are on the
// desk (§0.5). The swatches read the theme's own tokens, so what the writer
// picks is a NAME (walnut, iron, oxblood, sea) and a theme change re-colours
// every stroke ever drawn — see store/ink.ts.
function SliverInkZone({ opts }: { opts: NonNullable<Extract<SliverContent, { kind: 'freewrite' }>['inkOptions']> }) {
  const { t } = useDeskLexicon();
  const nibLabel: Record<StrokeNib, string> = { fine: t('inkNibFine'), regular: t('inkNibRegular'), broad: t('inkNibBroad') };
  const tipLabel: Record<StrokeTip, string> = { pen: t('inkTipPen'), pencil: t('inkTipPencil'), marker: t('inkTipMarker') };
  const inkLabel: Record<StrokeInk, string> = { walnut: t('inkWalnut'), iron: t('inkIron'), oxblood: t('inkOxblood'), sea: t('inkSea') };
  return (
    <>
      <div className="wz-sliver-section">
        <div className="wz-sliver-h">{t('inkTip')}</div>
        <div className="wz-sliver-format wz-ink-tips" role="radiogroup" aria-label={t('inkTip')}>
          {TIPS.map(tip => (
            <button
              key={tip}
              type="button"
              role="radio"
              className="mode-tbtn wz-ink-tip"
              aria-checked={opts.pen.tip === tip}
              data-on={opts.pen.tip === tip ? 'true' : 'false'}
              title={tipLabel[tip]}
              aria-label={tipLabel[tip]}
              onClick={() => opts.onPick({ tip })}
            >
              {TIP_ICONS[tip]}
            </button>
          ))}
        </div>
      </div>

      <div className="wz-sliver-section">
        <div className="wz-sliver-h">{t('inkNib')}</div>
        {/* STOPS, NOT A SLIDER — see this component's own comment. */}
        <div className="wz-sliver-format wz-ink-nibs" role="radiogroup" aria-label={t('inkNib')}>
          {NIBS.map(nib => (
            <button
              key={nib}
              type="button"
              role="radio"
              className="mode-tbtn wz-ink-nib"
              aria-checked={opts.pen.nib === nib}
              data-on={opts.pen.nib === nib ? 'true' : 'false'}
              onClick={() => opts.onPick({ nib })}
            >
              {nibLabel[nib]}
            </button>
          ))}
        </div>
      </div>

      <div className="wz-sliver-section">
        <div className="wz-sliver-h">{t('railInk')}</div>
        <div className="wz-sliver-inks" role="radiogroup" aria-label={t('railInk')}>
          {INKS.map(ink => (
            <button
              key={ink}
              type="button"
              role="radio"
              /* The swatch paints from the THEME TOKEN, never a literal — the
                 same var() the renderer resolves, so the chip and the stroke
                 can never disagree about what "oxblood" means. */
              className={`mode-swatch wz-ink-swatch${opts.pen.ink === ink ? ' active' : ''}`}
              style={{ background: `var(--ink-${ink})` }}
              aria-checked={opts.pen.ink === ink}
              aria-label={inkLabel[ink]}
              title={inkLabel[ink]}
              onClick={() => opts.onPick({ ink })}
            />
          ))}
          {/* the eraser is a real two-state toggle and tip-agnostic: it erases whatever tip laid the ink [Sliver §15] */}
          <button
            type="button"
            className="mode-tbtn wz-ink-eraser"
            aria-pressed={opts.eraserArmed}
            data-on={opts.eraserArmed ? 'true' : 'false'}
            aria-label={t('inkEraser')}
            title={t('inkEraser')}
            onClick={opts.onToggleEraser}
          >
            <span aria-hidden="true">&#9107;</span>
          </button>
        </div>
      </div>
    </>
  );
}

/** Line icons for the Draft strip. Alignment is a stack of lines. Indent is
 *  those lines with an arrow, so it does not read as Back or as a tab key. */
function FormatMark({ kind }: { kind: 'outdent' | 'indent' | 'left' | 'center' | 'right' }) {
  const svg = {
    width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': true as const,
    fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    className: 'wz-format-mark',
  };
  if (kind === 'left' || kind === 'center' || kind === 'right') {
    const lengths = [12, 8, 11, 6];
    const ys = [2.5, 6, 9.5, 13];
    const span = 12;
    const origin = 2;
    return (
      <svg {...svg}>
        {lengths.map((len, i) => {
          const x = kind === 'left' ? origin : kind === 'right' ? origin + span - len : origin + (span - len) / 2;
          return <path key={ys[i]} d={`M${x} ${ys[i]}h${len}`} />;
        })}
      </svg>
    );
  }
  const arrow = kind === 'indent' ? 'M1.5 3.2H9.2M7.2 1.3 9.8 3.2 7.2 5.1' : 'M14.5 3.2H6.8M8.8 1.3 6.2 3.2 8.8 5.1';
  return (
    <svg {...svg}>
      <path d={arrow} />
      <path d="M4 8h10M4 11h10M4 14h7" />
    </svg>
  );
}

/** A list, not a lone dot. The mark at the left of the lines is the style. */
function BulletMark({ kind }: { kind: 'disc' | 'circle' | 'square' }) {
  const ys = [3, 8, 13];
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="wz-format-mark">
      {ys.map((y) => kind === 'square'
        ? <rect key={y} x="1.2" y={y - 1.15} width="2.3" height="2.3" fill="currentColor" />
        : <circle key={y} cx="2.35" cy={y} r="1.15" fill={kind === 'disc' ? 'currentColor' : 'none'} stroke={kind === 'circle' ? 'currentColor' : 'none'} strokeWidth="1.3" />)}
      <path d="M6 3h8M6 8h8M6 13h6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const BULLET_STYLES: readonly { action: FormatAction; kind: 'disc' | 'circle' | 'square'; term: DeskTermId }[] = [
  { action: 'bullet', kind: 'disc', term: 'draftBullet' },
  { action: 'bullet-circle', kind: 'circle', term: 'draftBulletCircle' },
  { action: 'bullet-square', kind: 'square', term: 'draftBulletSquare' },
];

function BulletControl({ onFormat, t }: { onFormat: (action: FormatAction) => void; t: (term: DeskTermId) => string }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState(BULLET_STYLES[0]);
  return (
    <div className="wz-bullet-control">
      <button type="button" className="mode-tbtn" data-format-glyph={style.action} title={t(style.term)} aria-label={t(style.term)} onClick={() => onFormat(style.action)}>
        <BulletMark kind={style.kind} />
      </button>
      <button type="button" className="mode-tbtn wz-bullet-toggle" aria-expanded={open} aria-label={t('draftBulletStyles')} title={t('draftBulletStyles')} onClick={() => setOpen(v => !v)}>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="wz-bullet-menu" role="menu">
          {BULLET_STYLES.map(s => (
            <button key={s.action} type="button" role="menuitem" className="mode-tbtn" data-format-glyph={s.action} title={t(s.term)} aria-label={t(s.term)} onClick={() => { setStyle(s); setOpen(false); onFormat(s.action); }}>
              <BulletMark kind={s.kind} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// only a template row a theme renamed away from the canonical word gets a "?"; the set is named here because the lexicon's OVERRIDES is not exported [Sliver §16]
const THEME_UNIQUE_TEMPLATES: Record<ThemeId, ReadonlySet<TemplateKey>> = {
  plateau: new Set(),
  flux: new Set(['blank', 'screenplay', 'outline', 'title', 'bibliography']),
  // Machina's forms do not map 1:1 onto the five template rows, so its rows keep the canonical words and get no "?" [Sliver §17]
  machina: new Set(),
};
const TEMPLATE_HELP_KEYS: Record<TemplateKey, DeskTermId> = {
  blank: 'helpTemplateBlank',
  screenplay: 'helpTemplateScreenplay',
  outline: 'helpOutline',
  title: 'helpTitlePage',
  bibliography: 'helpTemplateBibliography',
};

function SliverToolsBody({ content, arborTab }: { content: SliverContent; arborTab?: ArborToolTab }) {
  const { t } = useDeskLexicon();
  const theme = useTheme();
  // while Typewriter is on the whole Format group is greyed; the hook is called above the early return (hook order), and its result is only the fallback to this page's own typewriterForPage [Sliver §18]
  const settings = useWritingSettings();

  if (content.kind === 'empty') return null;
  const formatLocked = content.kind === 'draft' ? typewriterForPage(content.pageId, content.pageEmpty) : settings.typewriter;
  // PHASE 1 - store/drawerSet.ts is the one statement of what each surface and tab may show. The host still decides whether a section
  // has data (a screenplay passes no type member); this decides whether it may appear here at all.
  const tab: LeftTab = content.kind === 'freewrite' && content.instrument ? content.instrument.value : 'text';
  const allowed = (section: Parameters<typeof sectionAllowed>[2]): boolean => (arborTab ? arborSectionAllowed(content.kind as DrawerKind, arborTab, section) : sectionAllowed(content.kind as DrawerKind, tab, section));

  return (
    <div className="wz-sliver-body">
      {/* the ink zone is real ink (the stratum's tips and colours), not text colour; absent in TEXT, never greyed [Sliver §19] */}
      {content.kind === 'freewrite' && content.inkOptions && allowed('ink') && <SliverInkZone opts={content.inkOptions} />}

      {/* Free Write offers no styling: B/I/U are absent, not disabled (the typewriter does not decorate); Draft's roster below is untouched and shares the styling keys [Sliver §20] */}

      {/* ITEM 207 - THE TYPE CONTROL, one component in three mountings (Free Write: small; Draft and Revise: full). It leads
          the drawer's tenants. The control itself stays caption-free (his minimal-interface law); the section above it is
          headed "Typeface" like every other drawer zone. Absent, never greyed, wherever the host passes no `type` (a
          screenplay page). */}
      {(content.kind === 'freewrite' || content.kind === 'draft' || content.kind === 'revise') && content.type && allowed('typeface') && (
        <div className="wz-sliver-section wz-sliver-type"><div className="wz-sliver-h">{t('railTypeface')}</div><TypeControl {...content.type} /></div>
      )}

      {content.kind === 'freewrite' && content.forwardLock && allowed('forwardLock') && (
        <div className="wz-sliver-section">
          <div className="wz-sliver-h">{t('railControls')}</div>
          <SliverToggle
            label={t('railForwardLock')}
            on={content.forwardLock.on}
            onToggle={() => content.forwardLock!.onToggle(!content.forwardLock!.on)}
            className="wz-sliver-forwardlock"
          />
        </div>
      )}

      {/* FX3 S5 — the typewriter toggle (formerly here, with the READING
          label + "Typewriter" text) moved DOWN to the foot's new
          instruments row (SliverInstrumentRow, below SliverGoalFoot) as an
          icon-only control — not duplicated, moved: this section is gone,
          not merely relabeled. aria-label keeps the word for assistive tech
          (TypewriterToggle's own aria-label, WritingIncentives.tsx,
          unchanged) even though no visible text remains anywhere. */}

      {content.kind === 'draft' && content.format && allowed('format') && (
        <div className="wz-sliver-section">
          <div className="wz-sliver-h">{t('railFormat')}</div>
          {/* PHASE 1 (S4) - a native disabled fieldset: every button inside (the bullet menu's too) is unusable and announced as unavailable, with
              no per-button wiring to forget. The typing shortcuts are blocked at the same moment by PageEditor's applyRailFormat. */}
          <fieldset className="wz-sliver-fieldset" disabled={formatLocked} data-locked={formatLocked ? 'true' : 'false'} title={formatLocked ? t('formatLockedByTypewriter') : undefined}>
          {formatLocked && <legend className="wz-sr-only">{t('formatLockedByTypewriter')}</legend>}
          {/* onMouseDown preventDefault — a sliver button is OUTSIDE the
              contenteditable, so a normal click's mousedown would blur it
              and collapse whatever text was selected (moved verbatim). */}
          {/* ITEM 83 M5 (R1) — STYLING's B·I·U leads Draft too, so the two
              prose modes read as one hand with different reach. */}
          <div className="wz-sliver-format wz-sliver-format--letters" onMouseDown={e => e.preventDefault()}>
            <button type="button" className="mode-tbtn" data-on={content.format.boldOn ? 'true' : 'false'} aria-pressed={!!content.format.boldOn} title={t('stylingBold')} onClick={() => content.format!.onFormat('bold')}><b>B</b></button>
            <button type="button" className="mode-tbtn" data-on={content.format.italicOn ? 'true' : 'false'} aria-pressed={!!content.format.italicOn} title={t('stylingItalic')} onClick={() => content.format!.onFormat('italic')}><i>I</i></button>
            <button type="button" className="mode-tbtn" data-on={content.format.underlineOn ? 'true' : 'false'} aria-pressed={!!content.format.underlineOn} title={t('stylingUnderline')} onClick={() => content.format!.onFormat('underline')}><u>U</u></button>
            {/* ITEM 122 — strikethrough joins the styling row AFTER underline, so
                the row reads B I U S: the three the writer already knows, then the
                new one, rather than the new one displacing a position their hand
                has learned. The glyph wears its own mark (<s>) exactly as B/I/U
                wear theirs — the control demonstrates itself. */}
            <button type="button" className="mode-tbtn" data-on={content.format.strikeOn ? 'true' : 'false'} aria-pressed={!!content.format.strikeOn} title={t('stylingStrike')} onClick={() => content.format!.onFormat('strike')}><s>S</s></button>
            {/* H lights on a heading line and toggles it; + and - step between the six levels; they show only on a heading line [Sliver §21] */}
            <button type="button" className="mode-tbtn" data-on={content.format.headingLevel ? 'true' : 'false'} aria-pressed={!!content.format.headingLevel} title={t('draftHeading')} onClick={() => content.format!.onFormat('heading')}>H</button>
            {content.format.headingLevel ? (<>
              <button type="button" className="mode-tbtn" title={t('draftHeadingUp')} aria-label={t('draftHeadingUp')} onClick={() => content.format!.onFormat('heading-up')}>+</button>
              <button type="button" className="mode-tbtn" title={t('draftHeadingDown')} aria-label={t('draftHeadingDown')} onClick={() => content.format!.onFormat('heading-down')}>&minus;</button>
            </>) : null}
          </div>
          {/* lists and quotes ride the existing `- ` and `> ` conventions; indent and alignment are line-prefix directives (store/draftFormat.ts documents why they are not metadata) [Sliver §22] */}
          <div className="wz-sliver-format" onMouseDown={e => e.preventDefault()}>
            <BulletControl onFormat={content.format!.onFormat} t={t} />
            <button type="button" className="mode-tbtn" title={t('draftQuote')} onClick={() => content.format!.onFormat('quote')}>&ldquo;</button>
            {/* outdent, the exact decrement of Indent (floored at zero, counted in leading tabs, one shared helper); outdent before indent so the pair reads left to right [Sliver §23] */}
            <button type="button" className="mode-tbtn" data-format-glyph="outdent" title={t('draftOutdent')} aria-label={t('draftOutdent')} onClick={() => content.format!.onFormat('outdent')}><FormatMark kind="outdent" /></button>
            <button type="button" className="mode-tbtn" data-format-glyph="indent" title={t('draftIndent')} aria-label={t('draftIndent')} onClick={() => content.format!.onFormat('indent')}><FormatMark kind="indent" /></button>
            <button type="button" className="mode-tbtn" title={t('draftSpacing')} onClick={() => content.format!.onFormat('spacing')}>&para;</button>
          </div>
          <div className="wz-sliver-format" role="group" aria-label={t('draftAlignment')} onMouseDown={e => e.preventDefault()}>
            <button type="button" className="mode-tbtn" data-format-glyph="align-left" title={t('draftAlignLeft')} aria-label={t('draftAlignLeft')} onClick={() => content.format!.onFormat('align-left')}><FormatMark kind="left" /></button>
            <button type="button" className="mode-tbtn" data-format-glyph="align-center" title={t('draftAlignCenter')} aria-label={t('draftAlignCenter')} onClick={() => content.format!.onFormat('align-center')}><FormatMark kind="center" /></button>
            <button type="button" className="mode-tbtn" data-format-glyph="align-right" title={t('draftAlignRight')} aria-label={t('draftAlignRight')} onClick={() => content.format!.onFormat('align-right')}><FormatMark kind="right" /></button>
          </div>
          </fieldset>
        </div>
      )}

      {/* Structure is the tab's last zone before the foot; the `-zone` suffix is load-bearing: `wz-sliver-structure` is the retired tablist's class, whose absence a harness reads [Sliver §24] */}
      {/* ACTIONS sits between Format and Templates [Sliver §25] */}
      {content.kind === 'draft' && content.actions && allowed('actions') && (
        <div className="wz-sliver-section wz-sliver-actions"><div className="wz-sliver-h">{t('railActions')}</div><DrawerActions actions={content.actions} /></div>
      )}

      {content.kind === 'draft' && allowed('templates') && (
        <div className="wz-sliver-section wz-sliver-templates">
          <div className="wz-sliver-h">{t('railTemplates')} <HelpButton helpKey="helpTemplates" subjectLabel={t('railTemplates')} /></div>
          <div className="wz-template-list" onMouseDown={e => e.preventDefault()}>
            {content.templates?.map(tpl => (
              <div key={tpl.key} className="wz-template-row-wrap">
                <button type="button" className="wz-template-row wz-template-live" data-template={tpl.key} aria-pressed={!!tpl.selected} title={tpl.label} aria-label={tpl.label} onClick={tpl.onApply}>
                  <TemplateSketch kind={tpl.key} />
                  <span className="wz-template-word">{tpl.label}</span>
                </button>
                {THEME_UNIQUE_TEMPLATES[theme].has(tpl.key) && (
                  <HelpButton helpKey={TEMPLATE_HELP_KEYS[tpl.key]} subjectLabel={tpl.label} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ITEM 114's page kind and style guide, the only door to them. A kind is
          a reversible per-page setting that touches none of the writer's text;
          converting the page itself is not offered here. The style guides
          disclose beneath Research only, and MLA reads as the default without
          writing anything until the writer picks. */}
      {content.kind === 'draft' && content.pageKind && content.onPickKind && allowed('pageKind') && (
        <div className="wz-sliver-section wz-sliver-page-kind">
          <div className="wz-sliver-h" id="wz-page-kind-label">{t('railPageKind')}</div>
          <div className="wz-page-setup-seg" role="radiogroup" aria-labelledby="wz-page-kind-label">
            {PAGE_KINDS.map(k => (
              <button
                key={k}
                type="button"
                role="radio"
                className="wz-page-setup-chip"
                data-page-kind={k}
                aria-checked={content.pageKind === k}
                onClick={() => content.onPickKind!(k)}
              >
                {t(KIND_LABEL[k])}
              </button>
            ))}
          </div>
          {content.pageKind === 'research' && content.onPickStyleGuide && (
            <>
              <div className="wz-sliver-sub" id="wz-page-guide-label">{t('structureStyleGuideLabel')}</div>
              <div className="wz-page-setup-seg wz-page-setup-seg--wrap" role="radiogroup" aria-labelledby="wz-page-guide-label">
                {STYLE_GUIDES.map(g => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    className="wz-page-setup-chip"
                    data-style-guide={g}
                    aria-checked={content.styleGuide === g}
                    onClick={() => content.onPickStyleGuide!(g)}
                  >
                    {t(STYLE_GUIDE_LABEL[g])}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {content.kind === 'freewrite' && allowed('capture') && (
        <div className="wz-sliver-section">
          <div className="wz-sliver-h">{t('corkboardJournalTab')}</div>
          {content.captureItems.map(it => <div key={it} className="wz-sliver-item">{it}</div>)}
        </div>
      )}

      {/* AB4 S5 / FX4 S6 — the board's own hand tool: Add card alone now
          (the Connect toggle retired — see this file's own SliverContent
          comment).
          B1 S3 — on a system Board, BoardEditor.tsx passes neither
          onAddCard nor onAddPageCard at all: both buttons below are
          genuinely absent from the DOM there, not merely disabled. */}
      {content.kind === 'board' && allowed('boardTools') && (
        <div className="wz-sliver-section">
          <div className="wz-sliver-h">{t('railBoard')}</div>
          {content.onAddCard && (
            <button type="button" className="wz-sliver-item wz-sliver-item-btn" onClick={content.onAddCard}>
              {t('boardAddCard')}
            </button>
          )}
          {/* FX6 S2b — the board-side New Page door: a real page, created
              AND pinned to this board in one act. */}
          {content.onAddPageCard && (
            <button type="button" className="wz-sliver-item wz-sliver-item-btn" onClick={content.onAddPageCard}>
              {t('boardNewPageCard')}
            </button>
          )}
          {/* B2 S5 — "Existing page…", beside New page card. */}
          {content.onAddExistingPage && (
            <button type="button" className="wz-sliver-item wz-sliver-item-btn" onClick={content.onAddExistingPage}>
              {t('boardAddExistingPage')}
            </button>
          )}
          {/* B3 S3 — door 2: "From a deck…", opening the deck library as a
              pop-out over this board (DeckWizard.tsx). */}
          {content.onAddFromDeck && (
            <button type="button" className="wz-sliver-item wz-sliver-item-btn" onClick={content.onAddFromDeck}>
              {t('deckWizardFromDeck')}
            </button>
          )}
          {/* CONNECTOR-A: the "Show grafts" toggle is RETIRED - a card's connection footers are simply on. */}
        </div>
      )}
    </div>
  );
}

function SliverToggle({ label, on, onToggle, className }: { label: string; on: boolean; onToggle: () => void; className?: string }) {
  return (
    <button
      type="button"
      className={`wz-sliver-toggle${className ? ` ${className}` : ''}`}
      data-on={on ? 'true' : 'false'}
      aria-pressed={on}
      onClick={onToggle}
    >
      <span className="wz-sliver-toggle-label">{label}</span>
      <span className="wz-sliver-toggle-switch" aria-hidden="true" />
    </button>
  );
}

// CD1 S6 — the goal block, the sliver's foot. Timer (opt-in, the existing
// persisted `settings.timer` — a quiet numeral, `--text-mid`, mirroring the
// pre-existing session clock's own styling); the progress hairline (2px,
// present only when a target exists and instruments are on). The goal
// NUMBER is edited under Progress Tracking, not here. No numbers are
// announced on the hairline — it never labels itself with a fraction or
// percent, and nothing here fires an event or shows a toast on arrival.
//
// Review fix (post-CD1) — `firstWriteAt` (Sliver's own state, lifted so it
// survives this component's re-renders) anchors the clock to the first
// actual keystroke, not this component's mount: matches ModeStage's own
// pre-existing "elapsed since first keystroke" session-timer semantic
// exactly (the numeral still shows, reading 0:00, before the writer's
// first keystroke — same as that pattern always has — it just doesn't
// start ADVANCING until they do).
function SliverGoalFoot({ target, done, fraction, timerOn, firstWriteAt }: { target: WritingGoal | null; done: number; fraction: number; timerOn: boolean; firstWriteAt: number | null }) {
  // The goal NUMBER is set under Progress Tracking. This foot only shows the
  // hairline and, when the timer is on, the clock. Full screen is not here:
  // the app already offers it outside this drawer.
  const settings = useWritingSettings();
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!timerOn || firstWriteAt == null) { setElapsedMs(0); return; }
    setElapsedMs(Date.now() - firstWriteAt);
    const i = setInterval(() => setElapsedMs(Date.now() - firstWriteAt), 1000);
    return () => clearInterval(i);
  }, [timerOn, firstWriteAt]);

  const s = Math.floor(elapsedMs / 1000);
  const clock = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="wz-sliver-goal" data-target={target?.n ?? ''} data-unit={target?.unit ?? ''} data-done={done}>
      {timerOn && <div className="wz-sliver-goal-timer">{clock}</div>}

      {target != null && settings.instrumentsOn && (
        <div className="wz-sliver-goal-hairline" aria-hidden="true">
          <div className="wz-sliver-goal-hairline-fill" style={{ width: `${(fraction * 100).toFixed(1)}%` }} />
        </div>
      )}
    </div>
  );
}

// pop-outs fade on written words, never on a clock: a foot pop-out receives its fade only after POPOUT_FADE_WORDS words or a new period since it opened; idle never fades it [Sliver §26]
const POPOUT_FADE_WORDS = 15;

// The house word count, the same shape PageEditor/JournalEntry/ScriptEditor/
// QuickSprint/HomeFlow/FirstRunGate each keep privately (six copies already —
// this reads like its neighbours rather than inventing a seventh home for it).

// a period is one the document did not have when the tray opened - counted, not watched, so it works on both prose surfaces [Sliver §27]
function countPeriods(text: string): number {
  let n = 0;
  for (const ch of text) if (ch === '.') n++;
  return n;
}

function SliverInstrumentRow({ hasMilestones, target, typewriterAvailable = true, pageId, pageEmpty, goalText, onPopoutHold }: { hasMilestones?: boolean; target: WritingGoal | null; typewriterAvailable?: boolean; pageId?: string; pageEmpty?: boolean; goalText: string; onPopoutHold: (hold: boolean) => void }) {
  const { t } = useDeskLexicon();
  const settings = useWritingSettings();
  const theme = useTheme();
  // a Draft or Screenplay page asks typewriterForPage; Free Write (no pageId) reads the shared field [Sliver §28]
  const typewriterOn = pageId != null ? typewriterForPage(pageId, pageEmpty ?? false) : settings.typewriter;

  // the foot is one three-dot menu: Typewriter, Progress and the remaining preferences open together under their headings; one instrument open at a time [Sliver §29]
  const [open, setOpen] = useState(false);

  // `held` is true from a tray's opening until POPOUT_FADE_WORDS words or a period since then [Sliver §30]
  const [held, setHeld] = useState(false);
  const openMark = useRef<{ words: number; periods: number } | null>(null);

  // THE MARK IS TAKEN AT THE OPEN, AND ONLY AT THE OPEN. `goalText` is
  // deliberately absent from this dependency list: re-marking on every keystroke
  // would reset the count as fast as the writer raised it, and the gate would be
  // unreachable — a control that can never fire, which is worse than the timer
  // it replaces. Every path that changes `open` re-marks (both foot buttons, and
  // any path added later), the same "announce from an effect so no silent path
  // is writable" discipline this file's own two-drawer announcement keeps.
  useEffect(() => {
    if (!open) { openMark.current = null; setHeld(false); return; }
    openMark.current = { words: wordCount(goalText), periods: countPeriods(goalText) };
    setHeld(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // the release runs on text change only; there is no timer, so a writer who sits thinking keeps the tray [Sliver §31]
  useEffect(() => {
    const mark = openMark.current;
    if (!held || !mark) return;
    const written = wordCount(goalText) - mark.words;
    const periodEntered = countPeriods(goalText) > mark.periods;
    if (written >= POPOUT_FADE_WORDS || periodEntered) setHeld(false);
  }, [goalText, held]);

  useEffect(() => { onPopoutHold(held); }, [held, onPopoutHold]);

  return (
    <div className="wz-sliver-instruments">
      <div className="wz-sliver-instruments-head">
      <div className="wz-sliver-instruments-row">
        <button type="button" className="wz-sliver-instruments-btn"
          aria-label={t('footSettings')} title={t('footSettings')}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}>
          <MoreGlyph />
        </button>
      </div>
      {/* PHASE 1 (S4) - TYPEWRITER MODE and PROGRESS TRACKING, icon-only, right beside the "...". They flip the very values the two rows they replaced
          flipped (typewriter through setTypewriterExplicit, so the session's "the writer chose" flag still arms; instrumentsOn), so nothing stored changes.
          ON is a brass icon with no fill, OFF is quiet; the state is aria-pressed, the name never changes. Their own class, NOT the row's: the row stays
          the "..." button alone. */}
      <div className="wz-sliver-instruments-modes">
        {typewriterAvailable && (
          <button type="button" className="wz-sliver-mode-btn" data-mode-toggle="typewriter"
            aria-label={t('modeToggleTypewriter')} title={t('modeToggleTypewriter')}
            aria-pressed={typewriterOn}
            onClick={() => setTypewriterExplicit(!typewriterOn)}>
            <TypewriterModeIcon />
          </button>
        )}
        <button type="button" className="wz-sliver-mode-btn" data-mode-toggle="progress"
          aria-label={t('modeToggleProgress')} title={t('modeToggleProgress')}
          aria-pressed={settings.instrumentsOn}
          onClick={() => setWritingSettings({ instrumentsOn: !settings.instrumentsOn })}>
          <ProgressModeIcon />
        </button>
      </div>
      </div>
      {open && (
        <div className="mode-settings wz-sliver-instruments-panel" role="menu" data-menus-popout="settings">
          {typewriterAvailable && (
            <section className="wz-foot-settings-block">
              <h4>{t('footMenuTypewriter')}</h4>
              <TypewriterFields pageId={pageId} pageEmpty={pageEmpty} />
            </section>
          )}
          {/* the Flicker switch is Flux's only: a switch with nothing to switch would teach the writer it does something [Sliver §32] */}
          {theme === 'flux' && (
            <section className="wz-foot-settings-block">
              <h4>{t('footMenuFlicker')}</h4>
              <Seg label={t('footMenuFlicker')} value={settings.flicker ? 'on' : 'off'}
                opts={[['on', t('pageSetupOn')], ['off', t('pageSetupOff')]]}
                onPick={v => setWritingSettings({ flicker: v === 'on' })} />
            </section>
          )}
          <section className="wz-foot-settings-block">
            <h4>{t('footMenuProgress')}</h4>
            <ProgressFields target={target} hasMilestones={hasMilestones} />
          </section>
        </div>
      )}
    </div>
  );
}

// the Typewriter menu: one pop-out, each behaviour with its toggle and adjustments disclosed in place, so the depth never grows [Sliver §34]
function TypewriterFields({ pageId, pageEmpty }: { pageId?: string; pageEmpty?: boolean }) {
  const { t } = useDeskLexicon();
  const settings = useWritingSettings();
  const forwardLock = useForwardLock();

  // the on/off row is the icon toggle beside the "..."; while it is off these rows are greyed (values kept); same pageId fallback as the toggle [Sliver §35]
  const off = !(pageId != null ? typewriterForPage(pageId, pageEmpty ?? false) : settings.typewriter);
  return (
    <>

      {/* ITEM 83 S3 — TRUTH-FIX. The ON/OFF toggles below STAY, because each
          drives a real engine today: Forward Lock writes store/forwardLock.ts
          (the live forward-only boundary), Line Fade and Page Scroll write
          writingSettings, which useTypewriterFade already reads.
          THE ADJUSTMENT ROWS ARE UNMOUNTED — Forward Lock's window unit and
          count, Line Fade's line count, and the writing-line position. They
          PERSISTED but drove nothing: no engine reads forwardLockUnit,
          forwardLockCount, lineFadeLines or writingLine. A control that
          remembers your choice and then ignores it is worse than an absent
          one, because it teaches a writer the feature works.
          NOT grayed, ABSENT (G3) — a disabled control for an unbuilt
          capability is a locked door wearing paint. The settings themselves
          stay in the store, defaulted to today's behaviour, so the rows
          return the moment the engine brief connects them; nothing about
          this is a retreat from R3, only from claiming it early. That brief
          is R12's own flagged engine-touching work. */}
      <Seg label={t('twForwardLock')} value={forwardLock ? 'on' : 'off'} disabled={off}
        opts={[['on', t('pageSetupOn')], ['off', t('pageSetupOff')]]}
        onPick={v => setForwardLock(v === 'on')} />

      {/* O-FW2 resolved by merger: the gear's old "Fade depth" lives here now,
          as Line Fade's own on/off. No second fade home. */}
      <Seg label={t('twLineFade')} value={settings.lineFadeOn ? 'on' : 'off'} disabled={off}
        opts={[['on', t('pageSetupOn')], ['off', t('pageSetupOff')]]}
        onPick={v => setWritingSettings({ lineFadeOn: v === 'on' })} />

      <Seg label={t('twPageScroll')} value={settings.pageScroll ? 'on' : 'off'} disabled={off}
        opts={[['on', t('pageSetupOn')], ['off', t('pageSetupOff')]]}
        onPick={v => setWritingSettings({ pageScroll: v === 'on' })} />
    </>
  );
}

// ITEM 83 M4 (R5) — PROGRESS absorbs the gear's Progress/Timer rows AND the
// whole Instruments panel (Show · Unit · Target · Style). One surface onto the
// one goal, where there were two.
// The unit is part of the goal: choosing one re-sets the goal in it. Time stays a stand-in until real writing
// minutes are recorded (the sliver's clock is an opt-in timer, not a measure of writing).
function ProgressFields({ target, hasMilestones }: { target: WritingGoal | null; hasMilestones?: boolean }) {
  const { t } = useDeskLexicon();
  const theme = useTheme();
  const settings = useWritingSettings();
  const [unit, setUnit] = useState<GoalUnit>(() => target?.unit ?? 'lines');
  const [draft, setDraft] = useState(() => String(target?.n ?? DEFAULT_GOAL_LINES));
  const commit = (u: GoalUnit = unit) => {
    const n = Number(draft);
    setWritingGoal(Number.isFinite(n) && n > 0 ? { n: Math.round(n), unit: u } : null);
  };
  const pickUnit = (u: GoalUnit) => {
    setUnit(u);
    if (target != null) commit(u);
  };
  const progressOpts: [string, string][] = [['words', 'Words'], ['time', 'Time'], ['off', 'Off']];
  if (hasMilestones) progressOpts.splice(2, 0, ['project', 'Drawer']);
  // PHASE 1 (S4) - the Show row LEFT this menu for the icon toggle beside the "...". Every row that stays is greyed and unusable while Progress
  // Tracking is off; the stored goal, unit and choices are untouched.
  const off = !settings.instrumentsOn;

  return (
    <>
      <Seg label={t('sliverInstrumentsUnit')} value={unit} disabled={off}
        opts={[['lines', 'Lines'], ['words', 'Words'], ['time', 'Time']]}
        soon={['time']} soonTitle={t('comingSoon')}
        onPick={v => pickUnit(v as GoalUnit)} />
      <label className="wz-tw-number" data-disabled={off ? 'true' : undefined}>
        <span>{t('goalLabel')}</span>
        <input type="number" min={1} value={draft} aria-label={t('goalLabel')} disabled={off}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => commit()}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }} />
        <span className="wz-tw-unit">{unit === 'words' ? t('goalUnitWords') : t('goalUnitLines')}</span>
      </label>
      <Seg label="Progress" value={settings.progress} disabled={off} opts={progressOpts} onPick={v => setWritingSettings({ progress: v as ProgressMetric })} />
      {settings.progress === 'words' && theme !== 'machina' && (
        <Seg label={t('progressStyleLabel')} value={settings.progressStyle} disabled={off}
          opts={[['bar', t('progressStyleBar')], ['rhizome', t('progressStyleRhizome')]]}
          onPick={v => setWritingSettings({ progressStyle: v as ProgressStyle })} />
      )}
      <Seg label={t('timerLabel')} value={settings.timer ? 'on' : 'off'} disabled={off} opts={[['on', 'On'], ['off', 'Off']]} onPick={v => setWritingSettings({ timer: v === 'on' })} />
    </>
  );
}

// A quiet stroke typewriter glyph, matching this file's own icon style
// (viewBox 0 0 24 24, stroke=currentColor) — the foot's instruments are
// glyphs, not words, at this width.
function MoreGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

