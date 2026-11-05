import type { DeskTermId } from '../terms';

export const CANONICAL_SETTINGS = {
  // M2 S1 — the Progress-style setting.
  progressStyleLabel: 'Progress style',
  progressStyleBar: 'Bar',
  progressStyleRhizome: 'Rhizome',

  // the Recede-depth explanation lives here, behind the shared "?"; the Settings panel carries no standing text [deskLexicon §57]
  recedeHint: 'Type and the menus fade; pause, reach an edge, or press Esc to bring them back.',
  fadeDepthLabel: 'Recede depth',
  fadeDepthPartial: 'Partial',
  fadeDepthFull: 'Full',
  timerLabel: 'Timer',

  // one plain sentence per themed word, Arbor's forms; Flux's are in OVERRIDES [deskLexicon §58]
  helpGrafts: 'Grafts join pages, cards and boards.',
  helpTemplates: 'Ready-made page layouts.',
  helpFreeWrite: 'Write forward only. No going back to edit.',
  helpPublish: 'Share a page as a link or a file.',
  helpOutline: 'Numbered levels. Tab indents.',
  helpTitlePage: 'A standard manuscript title page.',
  // Arbor's picker never renames these rows, so no "?" shows; only renamed rows carry an explainer [deskLexicon §59]
  helpTemplateBlank: 'A blank page. Nothing written yet.',
  helpTemplateScreenplay: 'Sluglines, dialogue, action — the screenplay format.',
  helpTemplateBibliography: 'A sources and citations page.',

  // E1 S2 — Publish's copy path.
  // ITEM word-diet.
  publishCopyWordsConfirm: 'Copied',
  publishCopyFormattedConfirm: 'Copied — with formatting intact.',
  publishCopyFailed: 'Copy failed. Try again, or use Download.',

  // E1 S3 — Download.
  publishDownloadTitle: 'Download',
  publishDownloadPageMd: 'Current Pages (.md)',
  publishDownloadPageTxt: 'Current Pages (.txt)',
  publishDownloadBinder: 'This Binder',
  publishDownloadEverything: 'Everything',
  publishDownloadConfirm: 'Downloading — check your downloads.',
  publishDownloadFailed: 'Download failed. Nothing lost; try again.',
  publishComingSoon: 'More publishing options coming soon.',

  // ITEM 224 — the invite-code field.
  authInviteCodePlaceholder: 'invite code',
  authSignupByInvitation: 'By invitation, for now.',

  // ITEM splash-hold, ROUND 3 — Arbor's own voice, a tree/garden register
  // matching the rest of this theme's own vocabulary (Graft, Rhizome).
  splashLoading1: 'Gathering your pages…',
  splashLoading2: 'Turning the soil…',
  splashLoading3: 'Watering the roots…',
  splashLoading4: 'Opening the notebook…',
} satisfies Partial<Record<DeskTermId, string>>;
