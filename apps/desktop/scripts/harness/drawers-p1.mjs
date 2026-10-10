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
  const i = text.indexOf(selectorStart);
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
    /\.wz-sliver-panel, \.wz-tutor-panel\{ transition:opacity var\(--drawer-dur-reduced\) linear; \}/.test(b.reduceBlock)
      && /\.wz-drawer-slide, \.wz-drawer-slide--left, \.wz-drawer-slide--right\{ transform:none; transition:none; \}/.test(b.reduceBlock)
      && !/\.wz-sliver-panel\{ transition:none; \}/.test(css) && !/\.wz-tutor-panel\{ transition:none; \}/.test(css), b.reduceBlock);
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
  ok('(C3) both panels wrap their contents in the sliding layer, left and right', c.sliverLayer && c.tutorLayer, JSON.stringify(c));
  const balance = (t, a) => (t.match(/<div className="wz-drawer-slide/g) || []).length === 1 && a;
  ok('(C4) the Tutor\'s sliding layer encloses the whole panel body (opens before the reply announcement, closes before the panel\'s own close) - the disclosure dialog stays outside it',
    tutorSrc.indexOf('wz-drawer-slide wz-drawer-slide--right') < tutorSrc.indexOf('className="wz-sr-only" role="status"')
      && tutorSrc.indexOf(')}\n          </div>\n        </div>\n      </div>\n\n      {showDisclosure && (') > 0 && balance(tutorSrc, true), '');
}

// =============================================================================
// PART D - the hard limits (H1: the typing path; H3: Templates), against main.
// =============================================================================
function sh(cmd) { try { return execSync(cmd, { cwd: DESKTOP, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } }
const baseRef = sh('git merge-base origin/main HEAD')?.trim() || sh('git rev-parse origin/main')?.trim() || null;
{
  const pe = baseRef ? sh(`git diff --stat ${baseRef} -- src/pages/PageEditor.tsx src/components/ForwardOnlyEditor.tsx`) : null;
  ok('(D1) H1: PageEditor.tsx and ForwardOnlyEditor.tsx are byte-identical to main (S1 touches no typing path)', pe !== null && pe.trim() === '', String(pe));
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
await mutant('reduced motion goes back to no transition at all', async () => partB(mutate(css, '.wz-sliver-panel, .wz-tutor-panel{ transition:opacity var(--drawer-dur-reduced) linear; }', '.wz-sliver-panel, .wz-tutor-panel{ transition:none; }')),
  (b) => !/--drawer-dur-reduced\) linear/.test(b.reduceBlock));
await mutant('reduced motion keeps the slide', async () => partB(mutate(css, '.wz-drawer-slide, .wz-drawer-slide--left, .wz-drawer-slide--right{ transform:none; transition:none; }', '.wz-drawer-slide{ transition:none; }')),
  (b) => !/transform:none; transition:none/.test(b.reduceBlock));
await mutant('the Tutor panel loses its inert ref', async () => partC(sliverSrc, mutate(tutorSrc, 'ref={(el) => setDrawerInert(el, !open)} aria-hidden={!open}', 'aria-hidden={!open}')), (c) => c.tutorInert === false);
await mutant('the Sliver keeps a hand-written arrow', async () => partC(mutate(sliverSrc, "{drawerArrow('left', open)}", "{open ? '›' : '‹'}"), tutorSrc), (c) => c.sliverHandWritten === true && c.sliverArrow === false);

let failed = 0;
for (const c of checks) {
  if (!c.pass) failed += 1;
  console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + (c.pass ? '' : ' | ' + String(c.detail).slice(0, 300)));
}
console.log(failed === 0 ? `\nDRAWERS-P1 VERIFY: PASS (${checks.length} checks)` : `\nDRAWERS-P1 VERIFY: FAIL — ${failed}/${checks.length}`);
process.exit(failed === 0 ? 0 : 1);
