// The sheet's dimension: what a page IS as paper, as opposed to its face+size, which is its VOICE. One shape serves both the per-page value and the per-user default, because "set as my default" is a copy of the open page's settings; two shapes would drift. Below it, the page's declared kind and the style guide, as PLACEHOLDERS: they render and persist per page, and nothing downstream is wired yet; what isn't built doesn't render. NOT named `PageKind`: `DeskFrame.pageKind` already means which SURFACE renders ('prose' | 'screenplay' | 'board'); this is what the writer DECLARES the page to be. Zero schema: both keys ride `journal_entries.page_settings` jsonb as optional, absent-never-null members of PageSettings, so an untouched page is byte-identical and reads `undefined` -> the defaults here. No column, no migration, no backfill. [index §1]
export type PageKindSetting = 'normal' | 'screenplay' | 'research';
export type StyleGuide = 'mla' | 'apa' | 'chicago' | 'ap';

// preselected: Normal is the page's kind until the writer says otherwise, and MLA is the style guide on Research's FIRST reveal. Read through `?? PAGE_KIND_DEFAULT`, never written at birth: writing them would dirty every page that never asked. [index §2]
export const PAGE_KIND_DEFAULT: PageKindSetting = 'normal';
export const STYLE_GUIDE_DEFAULT: StyleGuide = 'mla';

// ITEM 207 — a page's own typeface and size. `face` is how a face reaches the page: 'bundled' ships with the app,
// 'named' is installed-first with a bundled metric-compatible fallback (Times New Roman -> Tinos, Arial -> Arimo),
// 'device' and 'file' are the writer's own additions (207b/207c - the shape is reserved, nothing writes them yet).
export type FaceGeneric = 'serif' | 'sans-serif' | 'monospace';
export type FaceSource = 'bundled' | 'named' | 'device' | 'file';
export interface StoredFace {
  name: string;
  generic: FaceGeneric;
  source: FaceSource;
  fallback?: string;
}

// Proofing: the writer's dictionary, dialect and ignore blob. One nullable jsonb column, `users.proofing`, on `users.page_defaults`' recipe: per WRITER, not per page, so it is neither `pageSettings` nor a second tenant of `page_defaults` (that column is the starting DRESS; proofing is a different concept). [index §3]

/**
 * harper's five, and only these five — the design's §3, read from the document
 * rather than remembered. (A first draft of the shape report wrote `en-NZ` from
 * memory; the fifth is INDIAN.)
 */
export type ProofingDialect = 'en-US' | 'en-GB' | 'en-AU' | 'en-CA' | 'en-IN';

// the default, changeable and never prompted for [index §4]
export const PROOFING_DEFAULT_DIALECT: ProofingDialect = 'en-US';

// A removed word's tombstone expires after this many days (compaction, not a cap). Named rather than inlined because the consequence is a behaviour a reader should be able to find: a device offline longer than this can bring a removed word back. [index §5]
export const PROOFING_TOMBSTONE_DAYS = 180;

/**
 * One word in the personal dictionary. `display` keeps the writer's own casing
 * while the MAP KEY is lower-cased for matching — two facts, so two fields.
 * `removedAt` is a TOMBSTONE, never a delete: a bare list cannot converge across
 * devices, and dropping the entry outright would let the other device's older
 * add win and resurrect it.
 */
export interface ProofingWord {
  display: string;
  addedAt: string;
  removedAt?: string;
}

export interface ProofingRecord {
  dialect: ProofingDialect;
  /**
   * ⚠ AN AMENDMENT TO THE APPROVED SHAPE, and it exists because the round-trip
   * proof caught a real defect. The approved record had no stamp on its scalars,
   * so the merge could only say "the incoming value wins when non-empty" — which
   * means THE SERVER'S EXISTING DIALECT ALWAYS BEAT A LOCAL CHANGE, and a writer
   * could never save one. K4 of item204-proofing-roundtrip-proof.mjs is that bug.
   *
   * A scalar cannot converge without a clock, exactly as `words` cannot. So the
   * dialect carries its own stamp and merges LATER-WINS, the same rule the word
   * set already uses. Optional, so a record written before this reads unchanged
   * (an absent stamp loses to a present one, which is the right way round: the
   * device that stamped it is the one that chose).
   */
  dialectAt?: string;
  /** Keyed LOWER-CASED. An LWW-element-set: merged per key by the later stamp. */
  words: Record<string, ProofingWord>;
  /** harper's own exported ignore list, OPAQUE. Never merged per key. */
  ignored: string;
  /** The engine version that wrote `ignored`, so a future engine can drop it. */
  engine: string;
  /** Same clock, same reason, for the ignore blob. */
  ignoredAt?: string;
}

export interface PageSettings {
  margins: 'normal' | 'narrow' | 'wide';
  lineSpacing: number;
  pageNumbers: { on: boolean; placement: 'bottom-center' | 'bottom-right' | 'top-right' };
  headers: { on: boolean; text: string };
  footers: { on: boolean; text: string };
  // optional and ABSENT (never null) on every page that never chose, which keeps an older row byte-identical. Not in PAGE_SETTINGS_FALLBACK below: the fallback is the app's DRESS floor, and a page's kind is not its dress; readers default through PAGE_KIND_DEFAULT / STYLE_GUIDE_DEFAULT. [index §6]
  kind?: PageKindSetting;
  styleGuide?: StyleGuide;
  // ITEM 207 — absent, never null, on every page that never chose (read through the defaults: the theme's face, 11 pt).
  // NOT added to PAGE_SETTINGS_FALLBACK, for the reason kind and styleGuide are not. `size` is the number of POINTS.
  face?: StoredFace;
  size?: number;
  // PAGE TEMPLATES (docs/plans/page-templates.md) - which lens draws this page's text: an Outline, a Bibliography or a Title Page.
  // Absent, never null, on every page that never chose (Blank takes no setting; a Screenplay is `pageType: 'script'`). The TEXT is the
  // truth and the template only a lens, so losing this key leaves a readable Draft page. NOT dress: like `kind` it is a fact about THIS
  // page, so store/pageDefaults.ts strips it from the per-user default.
  template?: PageTemplate;
  // BIG PROJECTS STEP 3 (3c) - the plan-board cards this page HIDES from its Grafts list (box ids on its plan board; the cards stay on the
  // board). A type only: the existing whole-blob page_settings jsonb carries it (schema change: none). A fact about THIS page, never dress:
  // store/pageDefaults.ts strips it from the per-user default. Stale ids are pruned on read (store/grafts.ts), never written back.
  hiddenPlanCards?: string[];
}

export type PageTemplate = 'outline' | 'title' | 'bibliography';

// The app's own floor, used wherever a page carries no settings and no user
// default exists. Deliberately the values the app already renders today, so
// M2 changes nothing visually until a writer opens PAGE SETUP and chooses.
export const PAGE_SETTINGS_FALLBACK: PageSettings = {
  margins: 'normal',
  lineSpacing: 1.6,
  pageNumbers: { on: false, placement: 'bottom-center' },
  headers: { on: false, text: '' },
  footers: { on: false, text: '' },
};
