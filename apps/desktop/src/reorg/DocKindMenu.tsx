import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { JournalEntry, StyleGuide } from '../types';
import { useDeskLexicon } from '../store/deskLexicon';
import { flushNow, subscribe } from '../store/persistence';
import { applyPreset, applyStyleGuide, addSpecialPart } from './docKindActs';
import { PRESETS, STYLES, specialName, type DocStyle, type PresetGroup, type SpecialKind } from './docKinds';
import { PRESET_NOTES } from './presetNotes';
import { PresetNoteButton } from './PresetNote';
import { styleGuideOf } from './docSettings';
import { PageSetupZone } from '../components/cascade/PagePanel';

// THE DOC'S KIND AT THE HEAD OF THE PARTS TAB (the Team B restyle, slice 2; Nick, Nov 20, 1A: "the head of the Front menu's PARTS tab shows the
// Doc's kind ... the head is a toggle menu"; Decision 1: Research is a Standard Doc with a preset, so the kinds today are Standard and Screenplay;
// the stage menus, draft 3: "At the head in BUILD and EDIT: the Doc's kind. It opens Style Guide (MLA · APA · Chicago · AP), Presets, Page Setup
// and Special Parts"; Fable's cut: "its menu holds what exists today"). Every act is one that exists: the style guide is the page's own setting
// through the host's act (the Front menu's); Page Setup is today's zone; a Special Part is INK's newPart with today's template, in its place (a
// Title Page first, a Bibliography last); Presets are today's templates for the Part she is on. The menu drops down inside the drawer: the page
// never moves.
// THE ACTS ARE INK'S (Fable, Nov 20, 4:15 pm; the approved draft claude/wrizors/kind-menu-presets-draft.md): Style Guide is the DOC's own (None, MLA, APA, Chicago, AP: saved in its record, its Page Setup set on every Part, the sources
// Part named by the style); Special Parts are six, each in its right place; Presets are the draft's 18 (the Parts, empty and named, in an empty Doc or after hers). Every act is reorg/docKindActs.ts; this file is the shell and the words. Escape closes it and gives the focus back; a press outside closes it.

/** What the page's host used to lend the menu (today's per-page style guide and templates). Kept so the host's call stays as it is; the acts are the Doc's own now (docKindActs.ts) and read none of it. */
export interface DocMenuHost {
  styleGuide?: StyleGuide;
  onPickStyleGuide?: (next: StyleGuide) => void;
  templates?: { key: string; label: string; selected?: boolean; onApply: () => void }[];
}
type Item = 'style' | 'setup' | 'special' | 'presets';
const GUIDE_WORD = { none: 'reorgDocStyleNone', mla: 'styleGuideMla', apa: 'styleGuideApa', chicago: 'styleGuideChicago', ap: 'styleGuideAp' } as const;
const SPECIALS: readonly SpecialKind[] = ['title', 'abstract', 'toc', 'ack', 'sources', 'appendix'];
const GROUPS: readonly PresetGroup[] = ['academic', 'business', 'web', 'creative', 'screenplay'];
const GROUP_WORD = { academic: 'reorgPresetGroupAcademic', business: 'reorgPresetGroupBusiness', web: 'reorgPresetGroupWeb', creative: 'reorgPresetGroupCreative', screenplay: 'reorgPresetGroupScreenplay' } as const;

export function DocKindMenu({ entry, beforeWrite }: { entry: JournalEntry; docId: string | null; host?: DocMenuHost; beforeWrite: () => void }) {
  const { t } = useDeskLexicon();
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<Item | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const screenplay = entry.pageType === 'script' || entry.pageSettings?.kind === 'screenplay';
  const kindWord = t(screenplay ? 'reorgDocKindScreenplay' : 'reorgDocKindStandard');
  const close = (focus: boolean) => { setOpen(false); setSub(null); if (focus) toggle.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    const press = (e: PointerEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) { setOpen(false); setSub(null); } };
    document.addEventListener('pointerdown', press, true);
    return () => document.removeEventListener('pointerdown', press, true);
  }, [open]);

  const items: Item[] = [
    ...(!screenplay ? ['style' as const] : []),
    'setup',
    ...(!screenplay ? ['special' as const] : []),
    'presets',
  ];
  const WORD: Record<Item, Parameters<typeof t>[0]> = { style: 'reorgDocStyleGuide', setup: 'reorgDocPageSetup', special: 'reorgDocSpecialParts', presets: 'reorgDocPresets' };
  // the Doc's own style guide (its record, else the page's own), followed live: choosing one writes the Doc, and the check mark moves
  const guide: DocStyle = useSyncExternalStore(subscribe, () => styleGuideOf(entry.id) ?? 'none');
  const act = (run: () => void) => { beforeWrite(); run(); flushNow(); close(true); };

  const onKey = (e: ReactKeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); } };
  return (
    <div className="reorg-dockind" ref={wrap} onKeyDown={onKey}>
      <button type="button" ref={toggle} className="reorg-dockind-btn" data-doc-kind="" aria-haspopup="true" aria-expanded={open ? 'true' : 'false'}
        aria-label={t('reorgDocKindAria').replace('{kind}', kindWord)} onClick={() => { setOpen((o) => !o); setSub(null); }}>
        <span>{kindWord}</span><span className="reorg-dockind-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="reorg-dockind-menu" data-doc-menu="" role="group" aria-label={kindWord}>
          {items.map((it, i) => (
            <div key={it} className="reorg-dockind-item">
              <button type="button" data-doc-menu-item={it} aria-expanded={sub === it ? 'true' : 'false'} autoFocus={i === 0}
                onClick={() => setSub((s) => (s === it ? null : it))}>
                <span>{t(WORD[it])}</span><span className="reorg-dockind-fold" aria-hidden="true">▸</span>
              </button>
              {sub === it && it === 'style' && (
                <div className="reorg-dockind-sub" data-doc-sub="style" role="radiogroup" aria-label={t('reorgDocStyleGuide')}>
                  {STYLES.map((g) => (
                    <button key={g} type="button" role="radio" data-style-pick={g} aria-checked={guide === g ? 'true' : 'false'}
                      onClick={() => act(() => { applyStyleGuide(entry.id, g); })}>{t(GUIDE_WORD[g])}</button>
                  ))}
                </div>
              )}
              {sub === it && it === 'setup' && (
                <div className="reorg-dockind-sub reorg-dockind-setup" data-doc-sub="setup"><PageSetupZone entry={entry} /></div>
              )}
              {sub === it && it === 'special' && (
                <div className="reorg-dockind-sub" data-doc-sub="special">
                  {SPECIALS.filter((k) => specialName(k, guide) !== null).map((k) => (
                    <button key={k} type="button" data-special-pick={k} onClick={() => act(() => { addSpecialPart(entry.id, k); })}>{specialName(k, guide)}</button>
                  ))}
                </div>
              )}
              {sub === it && it === 'presets' && (
                <div className="reorg-dockind-sub" data-doc-sub="presets">
                  {GROUPS.filter((g) => PRESETS.some((p) => p.group === g && (p.kind === 'screenplay') === screenplay)).map((g) => (
                    <div key={g} className="reorg-dockind-group" data-preset-group={g} role="group" aria-label={t(GROUP_WORD[g])}>
                      <div className="reorg-dockind-grouphead">{t(GROUP_WORD[g])}</div>
                      {PRESETS.filter((p) => p.group === g).map((p) => {
                        const pick = <button key={p.id} type="button" data-preset-pick={p.id} onClick={() => act(() => { applyPreset(entry.id, p.id); })}>{p.label}</button>;
                        // the new presets carry a "?" (presetNotes.ts); the live ones stay as they were, a lone button
                        const note = PRESET_NOTES[p.id];
                        return note ? <span key={p.id} className="reorg-dockind-prow" data-preset-row={p.id}>{pick}<PresetNoteButton id={p.id} name={p.label} note={note} /></span> : pick;
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
