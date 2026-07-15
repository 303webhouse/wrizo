import { useDeskLexicon } from '../store/deskLexicon';
import { useWritingSettings, setWritingSettings } from '../store/writingSettings';
import { TypewriterToggle } from './WritingIncentives';
import type { FormatAction, StructureKind } from '../store/draftFormat';

// AB2 S1/S2/S3/S4 — the tool rail. Mounts into DeskFrame's reserved
// tool-rail track (AB1 built the track; this fills it). A per-mode registry:
// the rail renders EXACTLY the active mode's tools, nothing else — the
// relevance law (the-desk-design.md Part 1): "does it directly serve
// getting the words you want onto the page?" Deliberately presentational —
// every callback is already bound by the host (PageEditor.tsx /
// ScriptEditor.tsx / JournalEntry.tsx), which is the one that owns the
// actual editor state; ToolRail itself holds no editing logic. Empty modes
// (Revise, Workshop — not live EditorModes today) render as desk ground,
// exactly as AB1 shipped the track: pass `{ kind: 'empty' }` or omit the
// prop's content entirely.
//
// S2's capture items (Spark deck / Fragments / Send → Drawer) move here from
// AB1's interim corkboard tab — their ruled final home. Still a stub (no
// functionality added or removed, only relocated) — DeskFrame.tsx's own
// AB1 comment on CorkboardJournalTab said the same thing about its home;
// this is that promise kept.
export const CAPTURE_ITEMS = ['Spark deck', 'Fragments', 'Send → Drawer'] as const;

export type ToolRailContent =
  | { kind: 'empty' }
  | {
      kind: 'freewrite';
      // Ink swatches — omitted entirely on surfaces with no typed-text pen
      // color to control (JournalEntry's own ink is a single fixed drawing
      // color, not a typed-text palette; see ToolRail's own header comment
      // in pages/JournalEntry.tsx for why its rail passes showInk:false).
      ink?: {
        penColor: string;
        inks: readonly string[];
        onChoosePen: (ink: string) => void;
      };
      forwardLock?: {
        on: boolean;
        onToggle: (next: boolean) => void;
      };
      captureItems: readonly string[];
    }
  | {
      kind: 'draft';
      structure: StructureKind;
      onSwitchStructure: (next: StructureKind) => void;
      // Present only on the prose surface — the markdown convention tools
      // (S3). Absent on the screenplay surface: the element engine (S1) is
      // its own format, not a rich-text toolbar layered on top of it.
      format?: { onFormat: (action: FormatAction) => void };
    };

export function ToolRail({ content }: { content: ToolRailContent }) {
  const { t } = useDeskLexicon();
  const settings = useWritingSettings();

  if (content.kind === 'empty') return null;

  return (
    <div className="desk-toolrail-body">
      {content.kind === 'freewrite' && content.ink && (
        <div className="desk-toolrail-section">
          <div className="desk-toolrail-h">{t('railInk')}</div>
          <div className="desk-toolrail-inks">
            {content.ink.inks.map(ink => (
              <button
                key={ink}
                type="button"
                className={`mode-swatch${content.ink!.penColor === ink ? ' active' : ''}`}
                style={{ background: ink }}
                aria-label={`Ink ${ink}`}
                aria-pressed={content.ink!.penColor === ink}
                onClick={() => content.ink!.onChoosePen(ink)}
              />
            ))}
            <button type="button" className="mode-nib desk-toolrail-nib" title="Nib styles — coming soon">nib · fine ▾</button>
          </div>
        </div>
      )}

      {content.kind === 'freewrite' && content.forwardLock && (
        <div className="desk-toolrail-section">
          <div className="desk-toolrail-h">{t('railControls')}</div>
          <RailToggle
            label={t('railForwardLock')}
            on={content.forwardLock.on}
            onToggle={() => content.forwardLock!.onToggle(!content.forwardLock!.on)}
            className="desk-toolrail-forwardlock"
          />
        </div>
      )}

      {/* Typewriter — Free Write and Draft both engage it (ModeStage.tsx's
          own typewriterOn gate: mode 'journal' or 'drafting'), including the
          script surface's Draft posture (its hold-band respects the script
          scroll-cap — see ScriptEditor.tsx). Reads/writes the SAME shared,
          persisted store ModeStage/JournalEntry already use, so no prop
          threading is needed here — clicking this affects whichever surface
          is mounted, immediately. */}
      <div className="desk-toolrail-section">
        <div className="desk-toolrail-h">{t('railReading')}</div>
        <div className="desk-toolrail-typewriter">
          <TypewriterToggle on={settings.typewriter} onToggle={() => setWritingSettings({ typewriter: !settings.typewriter })} />
          <span className="desk-toolrail-typewriter-label">{t('railTypewriter')}</span>
        </div>
      </div>

      {content.kind === 'draft' && content.format && (
        <div className="desk-toolrail-section">
          <div className="desk-toolrail-h">{t('railFormat')}</div>
          {/* onMouseDown preventDefault — a rail button is OUTSIDE the
              contenteditable, so a normal click's mousedown would blur it
              and collapse whatever text was selected before the onClick
              handler ever runs (the standard rich-text-toolbar footgun).
              Bold/Italic operate on the SELECTION (S3's own spec), so the
              selection has to survive the click. */}
          <div className="desk-toolrail-format" onMouseDown={e => e.preventDefault()}>
            <button type="button" className="mode-tbtn" title="Bold" onClick={() => content.format!.onFormat('bold')}><b>B</b></button>
            <button type="button" className="mode-tbtn" title="Italic" onClick={() => content.format!.onFormat('italic')}><i>I</i></button>
            <button type="button" className="mode-tbtn" title="Heading" onClick={() => content.format!.onFormat('heading')}>H</button>
            <button type="button" className="mode-tbtn" title="Spacing" onClick={() => content.format!.onFormat('spacing')}>&para;</button>
          </div>
        </div>
      )}

      {content.kind === 'draft' && (
        <div className="desk-toolrail-section">
          <div className="desk-toolrail-h">{t('railStructure')}</div>
          <div className="desk-toolrail-structure" role="tablist" aria-label={t('railStructure')}>
            <button
              type="button"
              role="tab"
              aria-selected={content.structure === 'prose'}
              className={`desk-toolrail-structure-btn${content.structure === 'prose' ? ' active' : ''}`}
              onClick={() => content.onSwitchStructure('prose')}
            >
              {t('railStructureProse')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={content.structure === 'screenplay'}
              className={`desk-toolrail-structure-btn${content.structure === 'screenplay' ? ' active' : ''}`}
              onClick={() => content.onSwitchStructure('screenplay')}
            >
              {t('railStructureScreenplay')}
            </button>
          </div>
        </div>
      )}

      {content.kind === 'freewrite' && (
        <div className="desk-toolrail-section">
          <div className="desk-toolrail-h">{t('corkboardJournalTab')}</div>
          {content.captureItems.map(it => <div key={it} className="desk-toolrail-item">{it}</div>)}
        </div>
      )}
    </div>
  );
}

function RailToggle({ label, on, onToggle, className }: { label: string; on: boolean; onToggle: () => void; className?: string }) {
  return (
    <button
      type="button"
      className={`desk-toolrail-toggle${className ? ` ${className}` : ''}`}
      data-on={on ? 'true' : 'false'}
      aria-pressed={on}
      onClick={onToggle}
    >
      <span className="desk-toolrail-toggle-label">{label}</span>
      <span className="desk-toolrail-toggle-switch" aria-hidden="true" />
    </button>
  );
}
