// PHASE 1 - THE SHARED SIDE-DRAWER SYSTEM (docs/plans/phase1-drawers.md). Browserless: it reads the code that cannot run here and exercises
// the pure parts for real. The browser half (rects, measured motion, reduced motion, brass marks) is drawers-p1-live.mjs, a box turn.
//
// S1 claims (the motion + the shared shell pieces):
//   - the arrow on a drawer's fixed tab is ONE function, mirrored between the sides; only the glyph changes;
//   - a closed drawer is `inert` (not merely transparent);
//   - SLIDE + FADE TOGETHER (Nick, Oct 9): the panel (clip + scroller) keeps the fade and the dissolve on --fade-dur, which the vanish
//     engine writes; the SLIDING LAYER inside it carries the look and the slide on dedicated tokens, NEVER --fade-dur;
//   - REDUCED MOTION: fade only, short - no slide, and the old 'transition:none' opt-outs are gone;
//   - the typing path is untouched (PageEditor.tsx is byte-identical to main) and the Templates block is unchanged (H1, H3).
//
// Run: node scripts/harness/drawers-p1.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const ts = require('typescript');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const read = (rel) => noCR(fs.readFileSync(path.join(SRC, rel), 'utf8'));
const squash = (t) => t.replace(/\s+/g, ' ').trim();

// ---- the real drawerShell.ts, transpiled and imported ------------------------------------------------------------------
async function loadShell(text) {
  const js = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64') + '#' + Math.random());
}
const shellText = read('store/drawerShell.ts');

// =============================================================================
// PART A - the arrow and the inert helper, run for real.
// =============================================================================
async function partA(text = shellText) {
  const m = await loadShell(text);
  const fakeEl = () => { const attrs = new Map(); return { hasAttribute: (k) => attrs.has(k), setAttribute: (k, v) => attrs.set(k, v), removeAttribute: (k) => attrs.delete(k), attrs }; };
  const e = fakeEl();
  m.setDrawerInert(e, true);  const afterClose = e.hasAttribute('inert');
  m.setDrawerInert(e, true);  const idempotent = e.attrs.size === 1;
  m.setDrawerInert(e, false); const afterOpen = e.hasAttribute('inert');
  let nullSafe = true; try { m.setDrawerInert(null, true); } catch { nullSafe = false; }
  return {
    L: [m.drawerArrow('left', true), m.drawerArrow('left', false)],
    R: [m.drawerArrow('right', true), m.drawerArrow('right', false)],
    afterClose, idempotent, afterOpen, nullSafe,
  };
}
{
  const a = await partA();
  ok('(A1) the arrow: left open ›, left closed ‹; right open ‹, right closed › - the two hands are mirrors, and these are the literals each file wrote by hand before',
    JSON.stringify(a.L) === JSON.stringify(['›', '‹']) && JSON.stringify(a.R) === JSON.stringify(['‹', '›']), JSON.stringify(a));
  ok('(A2) a closed drawer is made inert, an open one is not, repeats change nothing, and a missing element is harmless', a.afterClose === true && a.idempotent === true && a.afterOpen === false && a.nullSafe === true, JSON.stringify(a));
}

// =============================================================================
// PART B - the CSS (index.css), by source.
// =============================================================================
const css = read('index.css');
const ruleBody = (text, selectorStart) => {
  // A RULE starts at the beginning of a line. The first textual occurrence of ".wz-sliver-panel{" is inside a comment and of
  // ".wz-tutor-panel{" inside the reduced-motion rule, so a bare indexOf read the wrong body (B4 went red on it).
  const at = text.indexOf('\n' + selectorStart);
  const i = at < 0 ? -1 : at + 1;
  if (i < 0) return null;
  const open = text.indexOf('{', i);
  const close = text.indexOf('}', open);
  return text.slice(open + 1, close);
};
function partB(c = css) {
  const root = c.slice(c.indexOf(':root {'), c.indexOf('}', c.indexOf(':root {')) + 1);
  const slide = ruleBody(c, '.wz-drawer-slide{');
  const slideLeft = ruleBody(c, '.wz-drawer-slide--left{');
  const slideRight = ruleBody(c, '.wz-drawer-slide--right{');
  const openRule = ruleBody(c, "[data-open='true'] > .wz-drawer-slide{");
  const sliverPanel = ruleBody(c, '.wz-sliver-panel{');
  const tutorPanel = ruleBody(c, '.wz-tutor-panel{');
  const sliverOpen = ruleBody(c, ".wz-sliver-panel[data-open='true']{");
  const tutorOpen = ruleBody(c, ".wz-tutor-panel[data-open='true']{");
  const reduce = c.slice(c.indexOf('PHASE 1 - THE SLIDING LAYER'), c.indexOf('.wz-sliver-body{'));
  const reduceBlock = reduce.slice(reduce.indexOf('@media (prefers-reduced-motion:reduce){'));
  return { root, slide, slideLeft, slideRight, openRule, sliverPanel, tutorPanel, sliverOpen, tutorOpen, reduceBlock };
}
{
  const b = partB();
  ok('(B1) the dedicated tokens exist: --drawer-dur .2s, --drawer-ease ease, --drawer-dur-reduced .12s',
    /--drawer-dur:\s*\.2s;/.test(b.root) && /--drawer-ease:\s*ease;/.test(b.root) && /--drawer-dur-reduced:\s*\.12s;/.test(b.root), b.root.slice(0, 200));
  ok('(B2) the sliding layer slides on transform with the dedicated tokens, from behind the tab: left starts at +100%, right at -100%, open is `none`',
    !!b.slide && /transition:\s*transform var\(--drawer-dur\) var\(--drawer-ease\)/.test(b.slide)
      && /translateX\(100%\)/.test(b.slideLeft ?? '') && /translateX\(-100%\)/.test(b.slideRight ?? '') && /transform:\s*none/.test(b.openRule ?? ''), JSON.stringify({ slide: b.slide, l: b.slideLeft, r: b.slideRight, o: b.openRule }));
  ok('(B3) the slide NEVER rides --fade-dur (the vanish engine writes that at runtime, up to minutes): no --fade-dur anywhere in the sliding layer\'s rules',
    !/--fade-dur/.test((b.slide ?? '') + (b.slideLeft ?? '') + (b.slideRight ?? '') + (b.openRule ?? '')), '');
  ok('(B4) the panels (clip + scroller) keep the FADE and the dissolve exactly as before: opacity on --fade-dur with the .2s fallback, closed 0 / open 1, pointer-events none / auto',
    [b.sliverPanel, b.tutorPanel].every((p) => !!p && /opacity:0; pointer-events:none;/.test(p) && /transition:opacity var\(--fade-dur,\.2s\) ease;/.test(p))
      && [b.sliverOpen, b.tutorOpen].every((p) => !!p && /opacity:1; pointer-events:auto;/.test(p)), JSON.stringify({ s: b.sliverPanel, t: b.tutorPanel }));
  ok('(B5) the old 6px settle is gone from both panels, and neither panel still draws the box (background and border moved to the sliding layer)',
    [b.sliverPanel, b.tutorPanel, b.sliverOpen, b.tutorOpen].every((p) => !/transform/.test(p ?? ''))
      && [b.sliverPanel, b.tutorPanel].every((p) => !/background:/.test(p ?? '') && !/border:/.test(p ?? ''))
      && /background:var\(--desk-ground\)/.test(b.slide ?? '') && /border:1px solid var\(--ink-border\)/.test(b.slide ?? ''), '');
  ok('(B6) REDUCED MOTION is fade-only and short: the panels keep an opacity transition on --drawer-dur-reduced, the sliding layer has no transform and no transition, and the two old `transition:none` opt-outs are gone',
    /\.wz-sliver-panel, \.wz-tutor-panel\{ transition:opacity var\(--drawer-dur-reduced\) linear;/.test(b.reduceBlock)
      && /\.wz-drawer-slide, \.wz-drawer-slide--left, \.wz-drawer-slide--right\{ transform:none; transition:none; \}/.test(b.reduceBlock)
      && !/\.wz-sliver-panel\{ transition:none; \}/.test(css) && !/\.wz-tutor-panel\{ transition:none; \}/.test(css), b.reduceBlock);
  // Nick's reduced-motion ruling survives the app's global floor (0.01ms !important on everything): the panels carry their own !important
  // duration on the short token, and that token is a real, short time.
  const reduceTok = /--drawer-dur-reduced:\s*([\d.]+)(ms|s);/.exec(b.root);
  const reduceMs = reduceTok ? parseFloat(reduceTok[1]) * (reduceTok[2] === 's' ? 1000 : 1) : NaN;
  ok('(B6b) the short reduced-motion FADE survives the global floor: both panels carry `transition-duration: var(--drawer-dur-reduced) !important`, and that token is > 0 and <= 150 ms',
    /\.wz-sliver-panel, \.wz-tutor-panel\{[^}]*transition-duration:\s*var\(--drawer-dur-reduced\)\s*!important;/.test(b.reduceBlock) && reduceMs > 0 && reduceMs <= 150,
    JSON.stringify({ reduceMs, block: b.reduceBlock.slice(0, 200) }));
  ok('(B7) the dissolve classes stay ON the panel (one element carries open/close fade AND dissolve, as today - the popout-hold law needs it)',
    /className="wz-sliver-panel chrome-fade desk-dissolve"/.test(read('components/Sliver.tsx')), '');
}

// =============================================================================
// PART C - the JSX (Sliver.tsx, Tutor.tsx), by source.
// =============================================================================
const sliverSrc = read('components/Sliver.tsx');
const tutorSrc = read('components/Tutor.tsx');
function partC(sliver = sliverSrc, tutor = tutorSrc) {
  return {
    sliverArrow: /drawerArrow\('left', open\)/.test(sliver), tutorArrow: /drawerArrow\('right', open\)/.test(tutor),
    sliverHandWritten: /\{open \? '›' : '‹'\}/.test(sliver), tutorHandWritten: /\{open \? '‹' : '›'\}/.test(tutor),
    sliverInert: /className="wz-sliver-panel chrome-fade desk-dissolve" ref=\{\(el\) => setDrawerInert\(el, !open\)\}/.test(sliver),
    tutorInert: /className="wz-tutor-panel" ref=\{\(el\) => setDrawerInert\(el, !open\)\}/.test(tutor),
    sliverLayer: /<div className="wz-drawer-slide wz-drawer-slide--left">/.test(sliver), tutorLayer: /<div className="wz-drawer-slide wz-drawer-slide--right">/.test(tutor),
  };
}
{
  const c = partC();
  ok('(C1) both tabs get their glyph from drawerArrow (left / right) and neither keeps a hand-written literal', c.sliverArrow && c.tutorArrow && !c.sliverHandWritten && !c.tutorHandWritten, JSON.stringify(c));
  ok('(C2) both closed panels are inert (setDrawerInert on the panel element, the current open state)', c.sliverInert && c.tutorInert, JSON.stringify(c));
  // SUPERSEDED (S2: both hands render through <SideDrawer>) - by (H1) below. Parked, not deleted: it pinned the S1 hand-written sliding-layer wrapper.
  // Kept verbatim; `if (false)` keeps it out of the verdict.
  if (false) ok('(C3) both panels wrap their contents in the sliding layer, left and right', c.sliverLayer && c.tutorLayer, JSON.stringify(c));
  const balance = (t, a) => (t.match(/<div className="wz-drawer-slide/g) || []).length === 1 && a;
  // SUPERSEDED (S2: both hands render through <SideDrawer>) - by (H1) below. Parked, not deleted: it pinned the S1 hand-written sliding-layer wrapper.
  // Kept verbatim; `if (false)` keeps it out of the verdict.
  if (false) ok('(C4) the Tutor\'s sliding layer encloses the whole panel body (opens before the reply announcement, closes before the panel\'s own close) - the disclosure dialog stays outside it',
    tutorSrc.indexOf('wz-drawer-slide wz-drawer-slide--right') < tutorSrc.indexOf('className="wz-sr-only" role="status"')
      && tutorSrc.indexOf(')}\n          </div>\n        </div>\n      </div>\n\n      {showDisclosure && (') > 0 && balance(tutorSrc, true), '');
}

// =============================================================================
// PART D - the hard limits (H1: the typing path; H3: Templates), against main.
// =============================================================================
function sh(cmd) { try { return execSync(cmd, { cwd: DESKTOP, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } }
// The declared hunk, as a predicate on a unified diff (-U0): every changed line is an ADDITION, and every addition is one of the allowed
// lines. Pure, so a mutant can show it fails on a diff that touches anything else.
const ALLOWED_PE_ADDITIONS = [
  /^\s*\/\/ PHASE 1 - the drawer's TEXT \| INK tab row chooses the same instrument/,
  /^\s*\/\/ band's menu retires in S2b\)\. Display wiring only: nothing here touches the typing path\./,
  /^\s*instrument: \{ value: instrument, onChange: setInstrument \},\s*$/,
  /^import \{ buildPageActions \} from '\.\.\/store\/pageActions';\s*$/,
  /^\s*\/\/ PHASE 1 - the Actions section: Tags, Copy, Delete, Header\/Footer, wired from this page's own handlers/,
  /^\s*actions: unborn \? undefined : buildPageActions\(\{ entry, copy: \(\) => \{ void doCopy\('words'\); \}, addTag, removeTag, patchPageSettings, navigate \}\),\s*$/,
];
function diffConfined(diffText) {
  const lines = noCR(diffText).split('\n');
  let added = 0;
  for (const l of lines) {
    if (l.startsWith('+++') || l.startsWith('---') || l.startsWith('@@') || l.startsWith('diff ') || l.startsWith('index ') || l === '') continue;
    if (l.startsWith('-')) return false;
    if (l.startsWith('+')) { added += 1; if (!ALLOWED_PE_ADDITIONS.some((re) => re.test(l.slice(1)))) return false; }
  }
  return added > 0 && added <= 8;
}
const baseRef = sh('git merge-base origin/main HEAD')?.trim() || sh('git rev-parse origin/main')?.trim() || null;
{
  const fo = baseRef ? sh(`git diff --stat ${baseRef} -- src/components/ForwardOnlyEditor.tsx`) : null;
  ok('(D1a) H1: ForwardOnlyEditor.tsx (the typing surface) is byte-identical to main', fo !== null && fo.trim() === '', String(fo));
  const peDiff = baseRef ? sh(`git diff -U0 ${baseRef} -- src/pages/PageEditor.tsx`) : null;
  ok('(D1b) H1: PageEditor.tsx differs from main ONLY by the declared hunks - pure additions: the Free Write drawer\'s instrument wiring and the Draft drawer\'s Actions wiring (one import, a comment, one object member); no line removed or changed',
    peDiff !== null && diffConfined(peDiff), String(peDiff).slice(0, 300));
  const templatesBlock = (text) => {
    const a = text.indexOf('railTemplates');
    if (a < 0) return null;
    const start = text.lastIndexOf('<div className="wz-sliver-section wz-sliver-templates"', a);
    const end = text.indexOf('page-kind', a);
    return start < 0 || end < 0 ? null : squash(text.slice(start, end));
  };
  const mainSliver = baseRef ? sh(`git show ${baseRef}:apps/desktop/src/components/Sliver.tsx`) : null;
  const now = templatesBlock(sliverSrc), was = mainSliver ? templatesBlock(noCR(mainSliver)) : null;
  ok('(D2) H3: the Templates block in Sliver.tsx is unchanged from main (whitespace aside)', !!now && now === was, `${now ? now.length : 0} vs ${was ? was.length : 0}`);
}

// =============================================================================
// PART E (S2) - THE TABLE: what the left drawer shows, run for real (store/drawerSet.ts is pure).
// =============================================================================
const setText = read('store/drawerSet.ts');
async function loadSet(text = setText) {
  const js = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64') + '#' + Math.random());
}
async function partE(text = setText) {
  const m = await loadSet(text);
  const S = (k, t) => [...m.sectionsFor(k, t)];
  return {
    tabsFW: m.leftTabsFor('freewrite', true), tabsFWNo: m.leftTabsFor('freewrite', false),
    tabsOthers: ['draft', 'revise', 'board', 'empty'].map((k) => m.leftTabsFor(k, true).length),
    fwText: S('freewrite', 'text'), fwInk: S('freewrite', 'ink'), draft: S('draft', 'text'), revise: S('revise', 'text'), board: S('board', 'text'),
    fwFormat: m.sectionAllowed('freewrite', 'text', 'format') || m.sectionAllowed('freewrite', 'ink', 'format'),
    fwTemplates: m.sectionAllowed('freewrite', 'text', 'templates'), draftInk: m.sectionAllowed('draft', 'text', 'ink'),
    reviseExtras: ['format', 'actions', 'templates', 'pageKind', 'forwardLock'].some((s) => m.sectionAllowed('revise', 'text', s)),
  };
}
{
  const e = await partE();
  ok('(E1) only Free Write has a tab row, and only with an instrument: TEXT then INK; no instrument, or Draft/Revise/Board/empty: none (never a lone tab)',
    JSON.stringify(e.tabsFW) === JSON.stringify(['text', 'ink']) && e.tabsFWNo.length === 0 && e.tabsOthers.every((n) => n === 0), JSON.stringify(e));
  ok('(E2) Free Write TEXT = Typeface, Forward Lock, Capture; INK = the ink zone, Forward Lock, Capture - and NEVER Format or Templates (Nick Q1: B/I/U wait for the typing-path work)',
    JSON.stringify(e.fwText) === JSON.stringify(['typeface', 'forwardLock', 'capture']) && JSON.stringify(e.fwInk) === JSON.stringify(['ink', 'forwardLock', 'capture']) && e.fwFormat === false && e.fwTemplates === false, JSON.stringify(e));
  ok('(E3) Draft = Typeface, Format, ACTIONS, Templates, Page kind - in Nick\'s order, and no ink zone; Revise = Typeface only (no Actions); Board = its tools',
    JSON.stringify(e.draft) === JSON.stringify(['typeface', 'format', 'actions', 'templates', 'pageKind']) && e.draftInk === false && JSON.stringify(e.revise) === JSON.stringify(['typeface']) && e.reviseExtras === false && JSON.stringify(e.board) === JSON.stringify(['boardTools']), JSON.stringify(e));
}

// =============================================================================
// PART F (S2) - the tab row: the key logic run for real, the semantics and the dress by source.
// =============================================================================
const tabsSrc = read('components/DrawerTabs.tsx');
async function partF(text = tabsSrc) {
  const a = text.indexOf('export function nextTab');
  const b = text.indexOf('\ninterface Props', a);
  const js = ts.transpileModule(text.slice(a, b), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64') + '#' + Math.random());
  const ids = ['text', 'ink'];
  return { right: m.nextTab(ids, 'text', 'ArrowRight'), wrapR: m.nextTab(ids, 'ink', 'ArrowRight'), left: m.nextTab(ids, 'ink', 'ArrowLeft'), wrapL: m.nextTab(ids, 'text', 'ArrowLeft'),
    home: m.nextTab(ids, 'ink', 'Home'), end: m.nextTab(ids, 'text', 'End'), other: m.nextTab(ids, 'text', 'x'), none: m.nextTab([], 'text', 'ArrowRight') };
}
function partG(tabs = tabsSrc, c = css) {
  const rule = ruleBody(c, ".wz-drawer-tab[data-on='true']{");
  const arrowOpen = ruleBody(c, ".wz-sliver[data-open='true'] .wz-sliver-grip{");
  return {
    roles: /role="tablist"/.test(tabs) && /role="tab"/.test(tabs) && /aria-selected=\{value === it\.id\}/.test(tabs) && /tabIndex=\{value === it\.id \? 0 : -1\}/.test(tabs),
    brassOutline: !!rule && /color:var\(--brass\)/.test(rule) && /border-color:var\(--brass\)/.test(rule) && /background:none/.test(rule) && !/color-mix/.test(rule),
    arrowStaysOlive: !!arrowOpen && /var\(--accent-rest\)/.test(arrowOpen) && !/brass/.test(arrowOpen),
  };
}
{
  const f = await partF();
  ok('(F1) the tab row\'s keys: Right/Down next, Left/Up previous (both wrap), Home first, End last, anything else nothing, no tabs nothing',
    f.right === 'ink' && f.wrapR === 'text' && f.left === 'text' && f.wrapL === 'ink' && f.home === 'text' && f.end === 'ink' && f.other === null && f.none === null, JSON.stringify(f));
  const g = partG();
  ok('(F2) the row is a real tablist: tab roles, aria-selected, and a roving tabindex (only the chosen tab is in the Tab order)', g.roles, JSON.stringify(g));
  ok('(F3) the chosen tab is a BRASS OUTLINE and nothing else (no fill, no color-mix) - and the drawer\'s own arrow tab stays olive (Nick: the open tab is not a choice)', g.brassOutline && g.arrowStaysOlive, JSON.stringify(g));
}

// =============================================================================
// PART H (S2) - the shell is shared: both hands use <SideDrawer>, the Sliver asks the table before every section.
// =============================================================================
function partH(sliver = sliverSrc, tutor = tutorSrc) {
  const gated = ['ink', 'typeface', 'forwardLock', 'format', 'actions', 'templates', 'pageKind', 'capture', 'boardTools'];
  return {
    sliverShell: /<SideDrawer side="left" idPrefix="wz-sliver" tabs=\{sideTabs\}/.test(sliver) && /<\/SideDrawer>/.test(sliver),
    tutorShell: /<SideDrawer side="right" idPrefix="wz-tutor" tabs=\{rightTabs\}>/.test(tutor) && /<\/SideDrawer>/.test(tutor),
    noHandWrapper: !/<div className="wz-drawer-slide wz-drawer-slide--(left|right)">/.test(sliver + tutor),
    ungated: gated.filter((s) => !sliver.includes("allowed('" + s + "')")),
    tabLabels: /t\('inkModeText'\)/.test(sliver) && /t\('inkModeInk'\)/.test(sliver) && /label: t\('inkInstrument'\)/.test(sliver),
  };
}
{
  const h = partH();
  ok('(H1) both hands render through <SideDrawer> (left carries the TEXT|INK config and the foot; right carries the TUTOR|links config) - the S1 hand-written wrappers are gone', h.sliverShell && h.tutorShell && h.noHandWrapper, JSON.stringify(h));
  ok('(H2) EVERY Sliver section asks the table first (ink, typeface, forwardLock, format, templates, pageKind, capture, boardTools) - the table is not decorative', h.ungated.length === 0, JSON.stringify(h.ungated));
  ok('(H3) the tab words are the theme\'s own lexicon terms (Text / Ink and the row\'s name), not literals', h.tabLabels, JSON.stringify(h));
}

// =============================================================================
// PART I (S2b) - THE ACTIONS (Tags, Copy, Delete, Header/Footer) and the instrument mark on the arrow tab.
// =============================================================================
const actionsSrc = read('components/DrawerActions.tsx');
const pageActionsSrc = read('store/pageActions.ts');
async function partI(text = pageActionsSrc) {
  const a = text.indexOf('/** Headers and footers read as ONE switch');
  const b = text.indexOf('interface BuildArgs');
  const slice = "const PAGE_SETTINGS_FALLBACK = { headers: { on: false, text: '' }, footers: { on: false, text: '' } };\n" + text.slice(a, b);
  const js = ts.transpileModule(slice, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64') + '#' + Math.random());
  const both = { headers: { on: true, text: 'H' }, footers: { on: true, text: 'F' } };
  const onlyHeader = { headers: { on: true, text: 'H' }, footers: { on: false, text: 'F' } };
  return {
    bothOn: m.headerFooterOn(both), onlyHeaderOn: m.headerFooterOn(onlyHeader), unset: m.headerFooterOn(undefined),
    turnOn: m.headerFooterPatch(onlyHeader, true), turnOff: m.headerFooterPatch(both, false),
  };
}
function partJ(act = actionsSrc, pa = pageActionsSrc, sliver = sliverSrc, c = css) {
  const order = [...act.matchAll(/data-action="([a-z-]+)"/g)].map((m) => m[1]);
  const sendBtn = act.slice(act.indexOf('data-confirm="delete"'), act.indexOf('data-confirm="delete"') + 160);
  const deleteBtn = act.slice(act.indexOf('data-action="delete"'), act.indexOf('data-action="header-footer"'));
  const tableOrder = sliver.indexOf("allowed('actions')") > sliver.indexOf("allowed('format')") && sliver.indexOf("allowed('actions')") < sliver.indexOf("allowed('templates')");
  const pressed = ruleBody(c, ".wz-action-btn[aria-pressed='true']{");
  const mark = ruleBody(c, '.wz-sliver-grip-mark{');
  const grip = ruleBody(c, '.wz-sliver-grip{');
  const del = pa.slice(pa.indexOf('onDelete: () => {'), pa.indexOf('},\n  };', pa.indexOf('onDelete: () => {')));
  return {
    order,
    asksFirst: /onClick=\{\(\) => toggle\('delete'\)\}/.test(deleteBtn) && !/actions\.onDelete/.test(deleteBtn) && (act.match(/actions\.onDelete\(\)/g) || []).length === 1 && /actions\.onDelete\(\)/.test(sendBtn.length ? act.slice(act.indexOf('data-confirm="delete"')) : ''),
    escCancels: /e\.key === 'Escape' && open\) \{ e\.stopPropagation\(\); setOpen\(null\);/.test(act),
    focusKeep: /open === 'delete'\) keepRef\.current\?\.focus\(\)/.test(act),
    confirmWords: /t\('actionDeleteConfirm'\)/.test(act) && /t\('actionDeleteYes'\)/.test(act) && /t\('actionDeleteKeep'\)/.test(act),
    softOnly: /softDeleteEntry\(entry\.id\)/.test(del) && /flushNow\(\)/.test(del) && /navigate\(getResumeTarget\(\)\?\.route \?\? '\/', \{ replace: true \}\)/.test(del) && !/hardDelete|removeEntry|deleteEntry\(/.test(pa),
    sliverBetween: tableOrder && /content\.kind === 'draft' && content\.actions && allowed\('actions'\)/.test(sliver),
    pressedOutline: !!pressed && /color:var\(--brass\)/.test(pressed) && /border-color:var\(--brass\)/.test(pressed) && /background:none/.test(pressed) && !/color-mix/.test(pressed),
    markInk: /content\.kind === 'freewrite' && content\.instrument\?\.value === 'ink'/.test(sliver) && /data-instrument="ink"/.test(sliver) && /TIP_ICONS\.pen/.test(sliver),
    markQuiet: !!mark && !/brass/.test(mark) && /width:10px; height:10px/.test(mark),
    tabBoxSame: !!grip && /width:16px; height:34px/.test(grip),
  };
}
{
  const i = await partI();
  ok('(I1) Header/Footer is ONE switch: on only when both are; either alone off reads off; unset reads the default (off); and toggling keeps each one\'s own text',
    i.bothOn === true && i.onlyHeaderOn === false && i.unset === false
      && i.turnOn.headers.on === true && i.turnOn.footers.on === true && i.turnOn.headers.text === 'H' && i.turnOn.footers.text === 'F'
      && i.turnOff.headers.on === false && i.turnOff.footers.on === false && i.turnOff.headers.text === 'H', JSON.stringify(i));
  const j = partJ();
  ok('(I2) the four actions are Tags, Copy, Delete, Header/Footer - in that order', JSON.stringify(j.order) === JSON.stringify(['tags', 'copy', 'delete', 'header-footer']), JSON.stringify(j.order));
  ok('(I3) DELETE ASKS FIRST, in the page: the Delete button only opens the confirm; the one place that runs onDelete is the "Send to Trash" button; Esc and Keep cancel; focus lands on Keep',
    j.asksFirst && j.escCancels && j.focusKeep && j.confirmWords, JSON.stringify(j));
  ok('(I4) DELETE IS SOFT: softDeleteEntry (to the Trash) then flush, then the writer goes to their resume target or the front door - and no hard-delete call exists in the module', j.softOnly, JSON.stringify(j));
  ok('(I5) the Actions section sits between Format and Templates in the Sliver and is gated by both the data and the table', j.sliverBetween, JSON.stringify(j));
  ok('(I6) a pressed/open action is a BRASS OUTLINE and nothing else (no fill)', j.pressedOutline, JSON.stringify(j));
  ok('(I7) THE INSTRUMENT MARK: a tiny pen on the arrow tab only in INK; it is quiet (no brass, 10px) and the tab keeps its 16 x 34 box', j.markInk && j.markQuiet && j.tabBoxSame, JSON.stringify(j));
}

// =============================================================================
// PART K (S3) - THE RIGHT DRAWER: TUTOR | the theme's links word, and the "?" note. The words come from the lexicon; the checks read it.
// =============================================================================
const lexSrc = read('store/deskLexicon.ts');
const noteSrc = read('components/DrawerNote.tsx');
const NICK_NOTE = 'Grafts join pages, cards and boards so your ideas can grow together. Use + to graft something here.';
function partK(lex = lexSrc) {
  const canonStart = lex.indexOf('const CANONICAL: Record<DeskTermId, string> = {');
  const overStart = lex.indexOf('const OVERRIDES: Partial<Record<ThemeId');
  const canon = lex.slice(canonStart, overStart);
  const over = lex.slice(overStart, lex.indexOf('function resolveTheme'));
  const fluxBlock = over.slice(over.indexOf('flux: {'));
  const val = (block, key) => { const m = new RegExp('\\b' + key + ":\\s*'((?:[^'\\\\]|\\\\.)*)'").exec(block); return m ? m[1] : null; };
  return {
    arborWord: val(canon, 'drawerLinks'), fluxWord: val(fluxBlock, 'drawerLinks'),
    arborNote: val(canon, 'drawerLinksNote'), fluxNote: val(fluxBlock, 'drawerLinksNote'),
    arborNoteLabel: val(canon, 'drawerLinksNoteLabel'), fluxNoteLabel: val(fluxBlock, 'drawerLinksNoteLabel'),
    arborEmpty: val(canon, 'drawerLinksEmpty'), fluxEmpty: val(fluxBlock, 'drawerLinksEmpty'),
    inUnion: /'tutorTabTutor' \| 'drawerLinks' \| 'drawerLinksEmpty' \| 'drawerLinksNote' \| 'drawerLinksNoteLabel' \| 'drawerRightTabsLabel'/.test(lex),
  };
}
async function partL(text = setText) {
  const m = await loadSet(text);
  return { tabs: [...m.RIGHT_TABS] };
}
function partM(tutor = tutorSrc, tabs = tabsSrc, note = noteSrc, c = css) {
  const noteBtn = ruleBody(c, ".wz-drawer-note-btn[aria-expanded='true']{");
  const pop = ruleBody(c, '.wz-drawer-note-pop{');
  const overlay = ruleBody(c, '.wz-drawer-tabnotes{');
  return {
    defaultTutor: /useState<RightTab>\('tutor'\)/.test(tutor),
    bodyOnTutorTab: /\{rightTab === 'tutor' && \(\n\s*<div className="wz-tutor-body">/.test(tutor) && /\{rightTab === 'links' && <ConnectionsDrawerPanel \/>\}/.test(tutor),
    noteOnlyWhenWords: /notes: linksNote \? \{ links: <DrawerNote label=\{t\('drawerLinksNoteLabel'\)\}>\{linksNote\}<\/DrawerNote> \} : undefined/.test(tutor),
    tabWords: /label: t\('tutorTabTutor'\)/.test(tutor) && /label: t\('drawerLinks'\)/.test(tutor) && /label: t\('drawerRightTabsLabel'\)/.test(tutor),
    escCloses: /e\.key === 'Escape' && open\) \{ e\.stopPropagation\(\); setOpen\(false\); \}/.test(note),
    outsideCloses: /addEventListener\('pointerdown', onDown, true\)/.test(note) && /!wrap\.current\?\.contains\(e\.target as Node\)\) setOpen\(false\)/.test(note),
    blurCloses: /onBlur=\{e => \{ if \(open && !wrap\.current\?\.contains\(e\.relatedTarget/.test(note),
    pressable: /<button\s+type="button"/.test(note) && /aria-expanded=\{open\}/.test(note) && /aria-controls=\{id\}/.test(note) && /role="note"/.test(note) && !/onMouseEnter|onMouseOver|onPointerEnter/.test(note),
    outsideTablist: /\)\)\}\n    <\/div>\n    \{hasNotes && notes && \(/.test(tabs),
    overlayInert: !!overlay && /pointer-events:none/.test(overlay) && /\.wz-drawer-note\{ pointer-events:auto; \}/.test(c),
    popOverlay: !!pop && /position:absolute/.test(pop),
    noteOpenOutline: !!noteBtn && /color:var\(--brass\)/.test(noteBtn) && /background:none/.test(noteBtn) && !/color-mix/.test(noteBtn),
  };
}
{
  const k = partK();
  ok('(K1) the right drawer\'s second tab word is the THEME\'S, from the lexicon: Grafts in Arbor (the canonical theme), Links in Flux',
    k.arborWord === 'Grafts' && k.fluxWord === 'Links' && k.inUnion, JSON.stringify(k));
  ok('(K2) the "?" note: Nick\'s draft copy for Arbor, in one place; Flux has NO explainer (an empty term, so no "?") and no label',
    k.arborNote === NICK_NOTE && k.fluxNote === '' && !!k.arborNoteLabel && k.fluxNoteLabel === '', JSON.stringify(k));
  ok('(K3) the empty pane\'s line follows the theme too (grafted / linked)', k.arborEmpty === 'Nothing grafted yet.' && k.fluxEmpty === 'Nothing linked yet.', JSON.stringify(k));
  const l = await partL();
  ok('(K4) the right drawer\'s tabs are TUTOR then the links tab, from one constant', JSON.stringify(l.tabs) === JSON.stringify(['tutor', 'links']), JSON.stringify(l));
  const m = partM();
  ok('(K5) the Tutor opens on the TUTOR tab; its body renders ONLY there and the empty links pane only on the other; the tab words are lexicon terms', m.defaultTutor && m.bodyOnTutorTab && m.tabWords, JSON.stringify(m));
  ok('(K6) the "?" exists ONLY where the theme\'s term has words (an empty term gives none)', m.noteOnlyWhenWords, JSON.stringify(m));
  ok('(K7) the note is PRESSABLE, not a hover tooltip: a real button with aria-expanded/aria-controls and a role=note panel, no hover handlers; Escape, a press outside, or focus leaving closes it',
    m.pressable && m.escCloses && m.outsideCloses && m.blurCloses, JSON.stringify(m));
  ok('(K8) it displaces nothing and is not part of the tab: the notes overlay sits OUTSIDE the tablist, ignores the pointer except on the "?", and the open note is an absolutely positioned overlay; open is a brass outline, no fill',
    m.outsideTablist && m.overlayInert && m.popOverlay && m.noteOpenOutline, JSON.stringify(m));
}

// =============================================================================
// MUTATIONS - each claim's protection removed in turn; each asserts it LANDED before the red is believed.
// =============================================================================
function mutate(text, from, to) { if (!text.includes(from)) throw new Error('mutation anchor missing: ' + from.slice(0, 60)); return text.replace(from, () => to); }
async function mutant(name, run, expectRed) {
  let res; let landed = true;
  try { res = await run(); } catch (e) { if (/mutation anchor missing/.test(String(e))) landed = false; else res = { error: String(e) }; }
  if (!landed) { ok(`(M) ${name}: THE MUTATION LANDED`, false, 'anchor missing'); return; }
  ok(`(M) ${name}: the proof goes RED`, expectRed(res) === true, JSON.stringify(res).slice(0, 160));
}
await mutant('the left arrow is not mirrored from the right', async () => partA(mutate(shellText, "return open ? '\\u203A' : '\\u2039';   // › open, ‹ closed", "return open ? '\\u2039' : '\\u203A';")),
  (r) => JSON.stringify(r.L) !== JSON.stringify(['›', '‹']));
await mutant('a closed drawer is not made inert', async () => partA(mutate(shellText, "if (!el.hasAttribute('inert')) el.setAttribute('inert', '');", '')), (r) => r.afterClose === false);
await mutant('the slide rides --fade-dur', async () => partB(mutate(css, 'transition:transform var(--drawer-dur) var(--drawer-ease); }\n.wz-drawer-slide--left', 'transition:transform var(--fade-dur,.2s) var(--drawer-ease); }\n.wz-drawer-slide--left')),
  (b) => /--fade-dur/.test(b.slide ?? '') );
await mutant('the 6px settle comes back on the sliver panel', async () => partB(mutate(css, 'opacity:0; pointer-events:none; transition:opacity var(--fade-dur,.2s) ease;\n  /* The bar sits', 'opacity:0; pointer-events:none; transform:translateX(6px); transition:opacity var(--fade-dur,.2s) ease;\n  /* The bar sits')),
  (b) => /transform/.test(b.sliverPanel ?? ''));
await mutant('reduced motion goes back to no transition at all', async () => partB(mutate(css, '.wz-sliver-panel, .wz-tutor-panel{ transition:opacity var(--drawer-dur-reduced) linear; transition-duration: var(--drawer-dur-reduced) !important; }', '.wz-sliver-panel, .wz-tutor-panel{ transition:none; }')),
  (b) => !/--drawer-dur-reduced\) linear/.test(b.reduceBlock));
await mutant('the global floor wins again (the panels lose their !important duration)', async () => partB(mutate(css, ' transition-duration: var(--drawer-dur-reduced) !important; }', ' }')),
  (b) => !/transition-duration:s*var(--drawer-dur-reduced)s*!important/.test(b.reduceBlock));
await mutant('the reduced-motion fade is no longer short (.3s)', async () => partB(mutate(css, '--drawer-dur-reduced: .12s;', '--drawer-dur-reduced: .3s;')),
  (b) => { const t = /--drawer-dur-reduced:s*([d.]+)(ms|s);/.exec(b.root); const ms = t ? parseFloat(t[1]) * (t[2] === 's' ? 1000 : 1) : NaN; return !(ms > 0 && ms <= 150); });
await mutant('reduced motion keeps the slide', async () => partB(mutate(css, '.wz-drawer-slide, .wz-drawer-slide--left, .wz-drawer-slide--right{ transform:none; transition:none; }', '.wz-drawer-slide{ transition:none; }')),
  (b) => !/transform:none; transition:none/.test(b.reduceBlock));
await mutant('the Tutor panel loses its inert ref', async () => partC(sliverSrc, mutate(tutorSrc, 'ref={(el) => setDrawerInert(el, !open)} aria-hidden={!open}', 'aria-hidden={!open}')), (c) => c.tutorInert === false);
await mutant('the Sliver keeps a hand-written arrow', async () => partC(mutate(sliverSrc, "{drawerArrow('left', open)}", "{open ? '›' : '‹'}"), tutorSrc), (c) => c.sliverHandWritten === true && c.sliverArrow === false);

await mutant('Free Write grows a Format group', async () => partE(mutate(setText, "text: ['typeface', 'forwardLock', 'capture']", "text: ['typeface', 'format', 'forwardLock', 'capture']")), (e) => e.fwFormat === true);
await mutant('INK loses its ink zone', async () => partE(mutate(setText, "ink: ['ink', 'forwardLock', 'capture'] }", "ink: ['forwardLock', 'capture'] }")), (e) => !e.fwInk.includes('ink'));
await mutant('Draft gets a tab row', async () => partE(mutate(setText, "return kind === 'freewrite' && hasInstrument ? ['text', 'ink'] : [];", "return hasInstrument ? ['text', 'ink'] : [];")), (e) => e.tabsOthers.some((n) => n !== 0));
await mutant('Revise grows Templates', async () => partE(mutate(setText, "revise: { text: ['typeface'], ink: [] }", "revise: { text: ['typeface', 'templates'], ink: [] }")), (e) => e.reviseExtras === true || JSON.stringify(e.revise) !== JSON.stringify(['typeface']));
await mutant('the tab row does not wrap', async () => partF(mutate(tabsSrc, "return ids[(at + 1) % ids.length];", "return ids[Math.min(at + 1, ids.length - 1)];")), (f) => f.wrapR !== 'text');
await mutant('the chosen tab gets a fill', async () => partG(tabsSrc, mutate(css, ".wz-drawer-tab[data-on='true']{ color:var(--brass); border-color:var(--brass); background:none; }", ".wz-drawer-tab[data-on='true']{ color:var(--brass); border-color:var(--brass); background:color-mix(in srgb,var(--brass) 14%,transparent); }")), (g) => g.brassOutline === false);
await mutant('the arrow tab turns brass when open', async () => partG(tabsSrc, mutate(css, ".wz-sliver[data-open='true'] .wz-sliver-grip{ color:var(--accent-rest); border-color:var(--accent-rest); }", ".wz-sliver[data-open='true'] .wz-sliver-grip{ color:var(--brass); border-color:var(--brass); }")), (g) => g.arrowStaysOlive === false);
await mutant('the Sliver stops asking the table for the Typeface', async () => partH(mutate(sliverSrc, "content.type && allowed('typeface') && (", "content.type && ("), tutorSrc), (h) => h.ungated.includes('typeface'));
await mutant('the Tutor goes back to a hand-written wrapper', async () => partH(sliverSrc, mutate(tutorSrc, '<SideDrawer side="right" idPrefix="wz-tutor" tabs={rightTabs}>', '<div className="wz-drawer-slide wz-drawer-slide--right">')), (h) => h.noHandWrapper === false || h.tutorShell === false);
await mutant('PageEditor.tsx is changed outside the declared hunk', async () => ({ ok: diffConfined('@@ -10,0 +11 @@\n+  instrument: { value: instrument, onChange: setInstrument },\n@@ -500,0 +502 @@\n+  onChange(e);\n') }), (r) => r.ok === false);
await mutant('PageEditor.tsx loses a line outside the declared hunk', async () => ({ ok: diffConfined('@@ -10 +10 @@\n-  const x = 1;\n+  instrument: { value: instrument, onChange: setInstrument },\n') }), (r) => r.ok === false);

await mutant('Revise grows Actions', async () => partE(mutate(setText, "revise: { text: ['typeface'], ink: [] }", "revise: { text: ['typeface', 'actions'], ink: [] }")), (e) => e.reviseExtras === true);
await mutant('Actions slips ahead of Format in the table', async () => partE(mutate(setText, "text: ['typeface', 'format', 'actions', 'templates', 'pageKind']", "text: ['typeface', 'actions', 'format', 'templates', 'pageKind']")), (e) => JSON.stringify(e.draft) !== JSON.stringify(['typeface', 'format', 'actions', 'templates', 'pageKind']));
await mutant('Header/Footer turns only the header', async () => partI(mutate(pageActionsSrc, "return { headers: { ...s.headers, on }, footers: { ...s.footers, on } };", "return { headers: { ...s.headers, on }, footers: { ...s.footers } };")), (i) => i.turnOn.footers.on !== true);
await mutant('Header/Footer reads on when EITHER is on', async () => partI(mutate(pageActionsSrc, "return !!s.headers?.on && !!s.footers?.on;", "return !!s.headers?.on || !!s.footers?.on;")), (i) => i.onlyHeaderOn === true);
await mutant('the Delete button deletes at once (no confirm)', async () => partJ(mutate(actionsSrc, "title={t('actionDelete')} aria-label={t('actionDelete')} onClick={() => toggle('delete')}", "title={t('actionDelete')} aria-label={t('actionDelete')} onClick={() => actions.onDelete()}")), (j) => j.asksFirst === false);
await mutant('Esc no longer cancels the confirm', async () => partJ(mutate(actionsSrc, "if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(null); }", "")), (j) => j.escCancels === false);
await mutant('Delete hard-deletes', async () => partJ(actionsSrc, mutate(pageActionsSrc, 'softDeleteEntry(entry.id);', 'hardDelete(entry.id);')), (j) => j.softOnly === false);
await mutant('Delete forgets to flush before leaving', async () => partJ(actionsSrc, mutate(pageActionsSrc, '      flushNow();\n      navigate(getResumeTarget()', '      navigate(getResumeTarget()')), (j) => j.softOnly === false);
await mutant('the pressed action gets a fill', async () => partJ(actionsSrc, pageActionsSrc, sliverSrc, mutate(css, ".wz-action-btn[aria-pressed='true']{ color:var(--brass); border-color:var(--brass); background:none; }", ".wz-action-btn[aria-pressed='true']{ color:var(--brass); border-color:var(--brass); background:color-mix(in srgb,var(--brass) 14%,transparent); }")), (j) => j.pressedOutline === false);
await mutant('the instrument mark shows in TEXT too', async () => partJ(actionsSrc, pageActionsSrc, mutate(sliverSrc, "content.instrument?.value === 'ink' && (", "content.instrument && ("), css), (j) => j.markInk === false);
await mutant('the instrument mark turns brass', async () => partJ(actionsSrc, pageActionsSrc, sliverSrc, mutate(css, '.wz-sliver-grip-mark{ display:flex; width:10px; height:10px; opacity:.9; }', '.wz-sliver-grip-mark{ display:flex; width:10px; height:10px; opacity:.9; color:var(--brass); }')), (j) => j.markQuiet === false);
await mutant('the Sliver renders Actions without asking the table', async () => partJ(actionsSrc, pageActionsSrc, mutate(sliverSrc, "content.actions && allowed('actions')", "content.actions"), css), (j) => j.sliverBetween === false);

await mutant('Flux gets the explainer too', async () => partK(mutate(lexSrc, "    drawerLinksNote: '',\n", "    drawerLinksNote: 'x',\n")), (k) => k.fluxNote !== '');
await mutant('Arbor\'s word changes', async () => partK(mutate(lexSrc, "  drawerLinks: 'Grafts',", "  drawerLinks: 'Connections',")), (k) => k.arborWord !== 'Grafts');
await mutant('the note\'s copy is edited', async () => partK(mutate(lexSrc, 'so your ideas can grow together.', 'so ideas grow.')), (k) => k.arborNote !== NICK_NOTE);
await mutant('the right drawer gains a third tab', async () => partL(mutate(setText, "['tutor', 'links'] as const", "['tutor', 'links', 'more'] as const")), (l) => l.tabs.length !== 2);
await mutant('the Tutor opens on the links tab', async () => partM(mutate(tutorSrc, "useState<RightTab>('tutor')", "useState<RightTab>('links')")), (m) => m.defaultTutor === false);
await mutant('the Tutor body shows on both tabs', async () => partM(mutate(tutorSrc, "{rightTab === 'tutor' && (\n            <div className=\"wz-tutor-body\">", "{(\n            <div className=\"wz-tutor-body\">")), (m) => m.bodyOnTutorTab === false);
await mutant('the "?" shows even when the theme has no explainer', async () => partM(mutate(tutorSrc, "notes: linksNote ? { links:", "notes: true ? { links:")), (m) => m.noteOnlyWhenWords === false);
await mutant('Escape no longer closes the note', async () => partM(tutorSrc, tabsSrc, mutate(noteSrc, "if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); }", "")), (m) => m.escCloses === false);
await mutant('a press outside no longer closes the note', async () => partM(tutorSrc, tabsSrc, mutate(noteSrc, "document.addEventListener('pointerdown', onDown, true);", "")), (m) => m.outsideCloses === false);
await mutant('the note opens on hover', async () => partM(tutorSrc, tabsSrc, mutate(noteSrc, 'className="wz-drawer-note"', 'className="wz-drawer-note" onMouseEnter={() => setOpen(true)}')), (m) => m.pressable === false);
await mutant('the notes move inside the tablist', async () => partM(tutorSrc, mutate(tabsSrc, "    </div>\n    {hasNotes && notes && (", "    {hasNotes && notes && ("), noteSrc), (m) => m.outsideTablist === false);
await mutant('the open note takes room (static, not an overlay)', async () => partM(tutorSrc, tabsSrc, noteSrc, mutate(css, '.wz-drawer-note-pop{ position:absolute;', '.wz-drawer-note-pop{ position:static;')), (m) => m.popOverlay === false);
await mutant('the open "?" gets a fill', async () => partM(tutorSrc, tabsSrc, noteSrc, mutate(css, ".wz-drawer-note-btn[aria-expanded='true']{ color:var(--brass); border-color:var(--brass); background:none; }", ".wz-drawer-note-btn[aria-expanded='true']{ color:var(--brass); border-color:var(--brass); background:color-mix(in srgb,var(--brass) 14%,transparent); }")), (m) => m.noteOpenOutline === false);

let failed = 0;
for (const c of checks) {
  if (!c.pass) failed += 1;
  console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + (c.pass ? '' : ' | ' + String(c.detail).slice(0, 300)));
}
console.log(failed === 0 ? `\nDRAWERS-P1 VERIFY: PASS (${checks.length} checks)` : `\nDRAWERS-P1 VERIFY: FAIL — ${failed}/${checks.length}`);
process.exit(failed === 0 ? 0 : 1);
