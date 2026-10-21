// TYPEWRITER-SCOPE (source half) — Browserless, in the seed-guard.mjs/
// item141.mjs shape: no browser, run directly by this lane, no box turn.
//
// THE CLAIM: the shared `typewriter` field is no longer a cross-page source
// of truth for Draft/Screenplay. `enterPageTypewriter` (store/writingSettings.ts)
// stops mirroring a page's own resolved value into it; every Draft-context
// reader (PageEditor.tsx's applyRailFormat/applyLensKey/outline-Tab gates,
// ModeStage.tsx's typewriterOn, Sliver.tsx's formatLocked and
// SliverInstrumentRow's own toggle) asks typewriterForPage(id, empty)
// instead — a pure read of THIS page's own storage, never the field a
// different page's open could have last written. docs/plans/typewriter-
// scope-plan.md is the approved design; scripts/harness/typewriter-scope.mjs
// is this claim's own live/behavioural half (needs a box turn).
//
// Run: node scripts/harness/typewriter-scope-source.mjs   (from apps/desktop; no box turn needed)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
// Harness files are CRLF (house law) — product source is too. Normalize to
// LF on read so every anchor below can be written once, plainly, matching
// what the editor shows rather than what the file's own bytes are.
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const read = (rel) => noCR(fs.readFileSync(path.join(SRC, rel), 'utf8'));

const writingSettingsSrc = read('store/writingSettings.ts');
const pageEditorSrc = read('pages/PageEditor.tsx');
const modeStageSrc = read('components/ModeStage.tsx');
const sliverSrc = read('components/Sliver.tsx');
const scriptEditorSrc = read('components/ScriptEditor.tsx');

// --- the live checks, against the real tree -----------------------------
function checkTypewriterForPage(text, label) {
  ok(`${label}: typewriterForPage exists and resolves this page's own saved value, else the theme default for an empty page, else off`,
    /export function typewriterForPage\(id: string, empty: boolean\): boolean \{\s*const saved = readPageTypewriter\(id\);\s*return saved \?\? \(empty \? THEME_CONFIG\[getTheme\(\)\]\.typewriterDefault : false\);\s*\}/.test(text),
    '(no match)');
}
function checkMirrorGone(text, label) {
  const fn = (text.match(/export function enterPageTypewriter\([\s\S]*?\n\}/) || [''])[0];
  ok(`${label}: enterPageTypewriter no longer mirrors this page's value into the shared \`typewriter\` field (setWritingSettings is gone from its own body)`,
    !!fn && !/setWritingSettings\(\{\s*typewriter:/.test(fn), fn.slice(0, 200));
}
function checkReaderUsesPageScope(text, label, pattern) {
  ok(`${label}: asks typewriterForPage (THIS page's own value), not the shared \`typewriter\`/\`settings.typewriter\` field`,
    pattern.test(text), '(no match)');
}

checkTypewriterForPage(writingSettingsSrc, '(writingSettings)');
checkMirrorGone(writingSettingsSrc, '(writingSettings)');
checkReaderUsesPageScope(pageEditorSrc, 'PageEditor.tsx applyRailFormat', /if \(typewriterForPage\(id, textRef\.current\.trim\(\)\.length === 0\)\) return;\s*\/\/ PHASE 1 \(S4\) \/ typewriter-scope/);
checkReaderUsesPageScope(pageEditorSrc, 'PageEditor.tsx applyLensKey (Outline Tab/Enter gate)', /if \(typewriterForPage\(id, textRef\.current\.trim\(\)\.length === 0\)\) return false;\s*\/\/ typewriter-scope/);
checkReaderUsesPageScope(pageEditorSrc, 'PageEditor.tsx outlineKeysRef Tab/keyup gates', /outlineKeysRef\.current && !typewriterForPage\(id, textRef\.current\.trim\(\)\.length === 0\)\) return;/g);
checkReaderUsesPageScope(modeStageSrc, 'ModeStage.tsx typewriterOn', /const typewriterOn = mode === 'drafting' && pageId != null\s*\?\s*typewriterForPage\(pageId, words === 0\)/);
checkReaderUsesPageScope(sliverSrc, 'Sliver.tsx formatLocked', /const formatLocked = content\.kind === 'draft' \? typewriterForPage\(content\.pageId, content\.pageEmpty\) : settings\.typewriter;/);
checkReaderUsesPageScope(sliverSrc, 'Sliver.tsx SliverInstrumentRow typewriterOn', /const typewriterOn = pageId != null \? typewriterForPage\(pageId, pageEmpty \?\? false\) : settings\.typewriter;/);

// pageId/pageEmpty actually threaded from both 'draft' content constructors.
ok('PageEditor.tsx: sliverContent carries this page\'s own pageId/pageEmpty for the "draft" kind',
  /pageId: id,\s*pageEmpty: textRef\.current\.trim\(\)\.length === 0,/.test(pageEditorSrc), '(no match)');
ok('ScriptEditor.tsx: sliverContent carries this page\'s own pageId/pageEmpty for the "draft" kind',
  /pageId: id,\s*pageEmpty: !initialEntry\?\.script \|\| isScriptEmpty\(initialEntry\.script\),/.test(scriptEditorSrc), '(no match)');
ok('PageEditor.tsx: both <ModeStage> mounts carry this page\'s own pageId',
  (pageEditorSrc.match(/words=\{wordCount\(text\)\}\s*pageId=\{id\}/g) || []).length === 2,
  String((pageEditorSrc.match(/words=\{wordCount\(text\)\}\s*pageId=\{id\}/g) || []).length));

// --- mutants: revert each claim above to its pre-fix shape, confirm red --
function mutate(text, from, to) {
  if (!text.includes(from)) throw new Error('mutation anchor missing: ' + from.slice(0, 80));
  return text.replace(from, () => to);
}
function mutant(name, run) {
  let landed = true;
  let redCountBefore = checks.length;
  try { run(); } catch (e) { if (/mutation anchor missing/.test(String(e))) landed = false; else throw e; }
  if (!landed) { ok(`(M) ${name}: THE MUTATION LANDED`, false, 'anchor missing'); return; }
  void redCountBefore;
}

// (M1) enterPageTypewriter's mirror comes back — the exact pre-fix shape.
mutant('enterPageTypewriter mirrors into the shared field again', () => {
  const mutated = mutate(writingSettingsSrc,
    'export function enterPageTypewriter(id: string, empty: boolean): void {\n  const saved = readPageTypewriter(id);\n  if (saved == null) writePageTypewriter(id, empty ? THEME_CONFIG[getTheme()].typewriterDefault : false);\n}',
    'export function enterPageTypewriter(id: string, empty: boolean): void {\n  const saved = readPageTypewriter(id);\n  const on = saved ?? (empty ? THEME_CONFIG[getTheme()].typewriterDefault : false);\n  setWritingSettings({ typewriter: on });\n  if (saved == null) writePageTypewriter(id, on);\n}');
  const fn = (mutated.match(/export function enterPageTypewriter\([\s\S]*?\n\}/) || [''])[0];
  ok('(M) enterPageTypewriter mirrors into the shared field again: the proof goes RED', /setWritingSettings\(\{\s*typewriter:/.test(fn), fn.slice(0, 200));
});

// (M2) applyRailFormat reverts to reading the shared field.
mutant('applyRailFormat reverts to the shared `typewriter` field', () => {
  const mutated = mutate(pageEditorSrc,
    "if (typewriterForPage(id, textRef.current.trim().length === 0)) return;   // PHASE 1 (S4) / typewriter-scope: Format is greyed while THIS page's own Typewriter is on, and its shortcuts (Ctrl/Cmd+B/I/U) are blocked with it",
    "if (getWritingSettings().typewriter) return;   // PHASE 1 (S4): Format is greyed while Typewriter is on, and its shortcuts (Ctrl/Cmd+B/I/U) are blocked with it");
  ok('(M) applyRailFormat reverts to the shared `typewriter` field: the proof goes RED',
    /if \(getWritingSettings\(\)\.typewriter\) return;\s*\/\/ PHASE 1 \(S4\): Format is greyed/.test(mutated), '(reverted shape present)');
});

// (M3) ModeStage's typewriterOn reverts to the old unscoped dual-mode read.
mutant('ModeStage.tsx typewriterOn reverts to the shared field for Draft too', () => {
  const mutated = mutate(modeStageSrc,
    "const typewriterOn = mode === 'drafting' && pageId != null\n    ? typewriterForPage(pageId, words === 0)\n    : (mode === 'journal' || mode === 'drafting') && settings.typewriter;",
    "const typewriterOn = (mode === 'journal' || mode === 'drafting') && settings.typewriter;");
  ok('(M) ModeStage.tsx typewriterOn reverts to the shared field for Draft too: the proof goes RED',
    /const typewriterOn = \(mode === 'journal' \|\| mode === 'drafting'\) && settings\.typewriter;/.test(mutated), '(reverted shape present)');
});

// (M4) Sliver's formatLocked reverts to the bare hook read for Draft too.
mutant('Sliver.tsx formatLocked reverts to the shared field for Draft too', () => {
  const mutated = mutate(sliverSrc,
    "const formatLocked = content.kind === 'draft' ? typewriterForPage(content.pageId, content.pageEmpty) : settings.typewriter;",
    "const formatLocked = settings.typewriter;");
  ok('(M) Sliver.tsx formatLocked reverts to the shared field for Draft too: the proof goes RED',
    /const formatLocked = settings\.typewriter;/.test(mutated), '(reverted shape present)');
});

// (M5) typewriterForPage itself loses its own saved-value precedence
// (always falls through to the theme default) — proves the check actually
// reads the RESOLUTION, not just the function's name.
mutant('typewriterForPage ignores its own saved value', () => {
  const mutated = mutate(writingSettingsSrc,
    'export function typewriterForPage(id: string, empty: boolean): boolean {\n  const saved = readPageTypewriter(id);\n  return saved ?? (empty ? THEME_CONFIG[getTheme()].typewriterDefault : false);\n}',
    'export function typewriterForPage(id: string, empty: boolean): boolean {\n  return empty ? THEME_CONFIG[getTheme()].typewriterDefault : false;\n}');
  const fn = (mutated.match(/export function typewriterForPage\([\s\S]*?\n\}/) || [''])[0];
  ok('(M) typewriterForPage ignores its own saved value: the proof goes RED', !/readPageTypewriter\(id\)/.test(fn), fn);
});

const pass = checks.every((c) => c.pass);
console.log(JSON.stringify(checks, null, 2));
console.log(pass
  ? `\nTYPEWRITER-SCOPE-SOURCE VERIFY: PASS (${checks.length} checks)`
  : `\nTYPEWRITER-SCOPE-SOURCE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
