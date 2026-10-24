import { useEffect, useState } from 'react';
import { useTheme, type ThemeId } from './theme';

// TH1 Slice 1 — lexicon projection (canon §5). Display projection ONLY: data,
// schema, routes, sync, and search keep the canonical nouns below forever — a
// search for "drawer" must still work under any theme. This module maps a
// canonical term ID to the CURRENT theme's display string, falling through to
// the canonical noun when the active theme has no override (an unknown theme
// id, or a theme that hasn't claimed this term yet).
export type TermId =
  | 'page' | 'shelf' | 'drawer' | 'binder' | 'box' | 'board' | 'notebook'
  | 'journal' | 'plan' | 'milestone' | 'freewrite' | 'home' | 'voicewall'
  | 'publish' | 'script';

// Fable's R1 (post-TH1 review) — English pluralization isn't algorithmic from
// a single canonical string (Drawer/Drawers is fine with +s, but a theme's
// own noun might not be), so every term carries two number forms rather than
// one string a caller mechanically pluralizes. A theme overriding a term may
// supply either form independently; the other falls through per-field.
export interface TermForms { one: string; many: string }

// The canonical noun IS Plateau's display string — Plateau is the default
// theme, so its lexicon entry is the identity map (canon §5's "Canonical"
// column). NOTE 'freewrite'.one reads "Free write" (no hyphen) to match the
// one live call site (JournalEntry's mode tab) byte-for-byte — the canon
// doc's "Free-write" is the concept name, not a pinned literal; flagged in
// the ship report, not "fixed" on either side. 'publish'.many mirrors .one
// ("Publish") — it's an action label, not a count noun.
const CANONICAL: Record<TermId, TermForms> = {
  // ITEM word-diet (Nick, Oct 13, review fix) — "Page" is always
  // grammatically plural (pages-rename bucket (a)); Flux's own override
  // below (Doc/Docs) is untouched.
  page: { one: 'Pages', many: 'Pages' },
  shelf: { one: 'Shelf', many: 'Shelves' },
  drawer: { one: 'Drawer', many: 'Drawers' },
  binder: { one: 'Binder', many: 'Binders' },
  box: { one: 'Box', many: 'Boxes' },
  board: { one: 'Board', many: 'Boards' },
  notebook: { one: 'Notebook', many: 'Notebooks' },
  journal: { one: 'Journal', many: 'Journals' },
  plan: { one: 'Plan', many: 'Plans' },
  milestone: { one: 'Milestone', many: 'Milestones' },
  freewrite: { one: 'Free write', many: 'Free writes' },
  home: { one: 'Home', many: 'Homes' },
  voicewall: { one: 'Voice Wall', many: 'Voice Walls' },
  publish: { one: 'Publish', many: 'Publish' },
  script: { one: 'Script', many: 'Scripts' },
};

// Themes register overrides here — a Partial of a Partial, so a theme may
// override just .one, just .many, or neither, and fall through per-field to
// canonical. Flux (canon §5 / flux-foundations.md §3.4): 'page' and 'box'
// keep the canonical's own plural-shaped-noun pattern ('Docs'/'Nodes' as the
// natural .many, an English-singularized .one for symmetry — the canon
// table doesn't pin a singular form for these, so 'Doc'/'Node' are this
// module's own construction); 'script' is intentionally absent (unchanged,
// "already dual-natured" per the canon).
const OVERRIDES: Partial<Record<ThemeId, Partial<Record<TermId, Partial<TermForms>>>>> = {
  flux: {
    page: { one: 'Doc', many: 'Docs' },
    drawer: { one: 'Rack', many: 'Racks' },
    binder: { one: 'Cartridge', many: 'Cartridges' },
    box: { one: 'Node', many: 'Nodes' },
    board: { one: 'Circuit', many: 'Circuits' },
    notebook: { one: 'Deck', many: 'Decks' },
    journal: { one: 'Log', many: 'Logs' },
    plan: { one: 'Circuit', many: 'Circuits' },   // FLUX V2: the mode strip's door reads CIRCUITS (was Schematic)
    milestone: { one: 'Checkpoint', many: 'Checkpoints' },
    // theme-leftovers (Nick approved Oct 16) — "Overclock" retired for
    // "Wire In" (plural "Wire-ins"), Fable's own exact forms.
    freewrite: { one: 'Wire In', many: 'Wire-ins' },
    home: { one: 'Safehouse', many: 'Safehouses' },
    voicewall: { one: 'Firewall', many: 'Firewalls' },
    // ITEM arbor-quiet-brass — renamed from "Connect" (Fable's proposal, pending Nick's
    // word): the board-connection family (deskLexicon.ts) just took "Link" for Flux, and
    // this unrelated feature (Publish-to-web) collided with it under the same English
    // word. "Uplink" keeps Flux's own circuit register without the collision.
    publish: { one: 'Uplink', many: 'Uplink' }, // a verb/label, mirrors Plateau's own .many=.one shape
  },
  // MACHINA (Nick's words pass, Oct 21; docs/plans/machina-build.md §1c) - the corporate register. The locked map: Drawer -> Project, Set -> Folder, Pages -> Files,
  // Boards -> Plans, Box/card -> Block, Journal -> Notebook, Milestone -> Deliverable, Home -> HQ, Voice Wall -> Compliance, Publish -> Finalize, Free Write -> Sprint.
  // NOT overridden, on purpose: 'plan' (canonical "Plan"/"Plans" already IS Machina's word), 'script' (dual-natured, as for Flux), and 'notebook' - Machina's Notebook is the
  // JOURNAL word, so the canonical `notebook` term (a different concept) would read identically to `journal` under this theme; it keeps its canonical form until Nick names
  // a word for it (a hand-up item in the build report, not a guess). 'home' has no locked plural: HQ both ways (like Publish).
  machina: {
    page: { one: 'File', many: 'Files' },
    drawer: { one: 'Project', many: 'Projects' },
    binder: { one: 'Folder', many: 'Folders' },
    box: { one: 'Block', many: 'Blocks' },
    board: { one: 'Plan', many: 'Plans' },
    journal: { one: 'Notebook', many: 'Notebooks' },
    milestone: { one: 'Deliverable', many: 'Deliverables' },
    freewrite: { one: 'Sprint', many: 'Sprints' },
    home: { one: 'HQ', many: 'HQ' },
    voicewall: { one: 'Compliance', many: 'Compliance' },
    publish: { one: 'Finalize', many: 'Finalize' },
  },
};

function resolveTheme(theme: ThemeId | undefined): ThemeId {
  if (theme) return theme;
  if (typeof document === 'undefined') return 'plateau';
  return (document.documentElement.getAttribute('data-theme') as ThemeId | null) ?? 'plateau';
}

export function formsFor(theme: ThemeId, term: TermId): TermForms {
  const override = OVERRIDES[theme]?.[term];
  return {
    one: override?.one ?? CANONICAL[term].one,
    many: override?.many ?? CANONICAL[term].many,
  };
}

export function t(term: TermId, theme?: ThemeId): string {
  return formsFor(resolveTheme(theme), term).one;
}

export function tMany(term: TermId, theme?: ThemeId): string {
  return formsFor(resolveTheme(theme), term).many;
}

// Reactive accessors — re-render on a theme switch (TH2 wires the pref UI).
export function useLexicon(): { t: (term: TermId) => string; tMany: (term: TermId) => string } {
  const theme = useTheme();
  const [, setTick] = useState(0);
  useEffect(() => { setTick(n => n + 1); }, [theme]);
  return {
    t: (term: TermId) => formsFor(theme, term).one,
    tMany: (term: TermId) => formsFor(theme, term).many,
  };
}

// Test/inspection seam (the resumeVocab.ts / wrizoVocab pattern) — the
// harness reads term->string projections directly rather than scraping DOM
// text for every surface.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoLexicon?: unknown }).wrizoLexicon = { t, tMany, CANONICAL_TERMS: Object.keys(CANONICAL) };
}
