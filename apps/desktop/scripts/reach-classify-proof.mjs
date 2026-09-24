// ITEM 194 — BROWSERLESS PROOF of the report-only mode. Run: node scripts/reach-classify-proof.mjs
//
// Three things are proved without a browser, so the ONE short box use only has to prove what
// genuinely needs a browser (that `elementFromPoint` answers as a real page would):
//
//   A. THE REFACTOR CHANGED NOTHING. `__click` was split into `__clickTarget` + the same
//      `el.click()`. The page helpers are extracted from BOTH the pre-change source (git,
//      origin/main) and the current file, run against the same fake document, and compared:
//      same return value, same element clicked, same thrown message for an absent label,
//      and the same exact-then-substring resolution. (A proof that re-typed the old code
//      would test the typo; the old code is read from git.)
//   B. THE SAMPLER, on synthetic geometry — a fake document whose `elementFromPoint` is a
//      function of the point: a clear control, a control covered wholly, a control covered
//      on its left half only, one off-screen, one zero-size, one disabled. The sampler must
//      read without scrolling, focusing or writing anything (the fake records every call).
//   C. THE CLASSIFIER (pure), case by case — and then FALSIFIED: each of its decisions is
//      mutated in turn, the mutation is asserted to have LANDED, and at least one case must
//      go red. A green mutant means a decision the cases never exercise.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

// ---------------------------------------------------------------------------
// A · the refactor is behaviour-preserving
// ---------------------------------------------------------------------------
const helpersOf = (src) => {
  const a = src.indexOf('const PAGE_HELPERS = `');
  const b = src.indexOf('`;', a);
  if (a < 0 || b < 0) throw new Error('could not locate PAGE_HELPERS');
  return src.slice(a + 'const PAGE_HELPERS = `'.length, b);
};
const BASE = process.env.REACH_PROOF_BASE || 'origin/main';
const oldSrc = execFileSync('git', ['show', `${BASE}:apps/desktop/scripts/runtime-verify.mjs`], { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const newSrc = readFileSync(join(here, 'runtime-verify.mjs'), 'utf8');

function world(labels, { disabledLabels = [] } = {}) {
  const clicked = [];
  const els = labels.map((label, i) => ({ textContent: `  ${label}  `, id: i, disabled: disabledLabels.includes(label), click() { clicked.push(label); } }));
  const document = { querySelectorAll: () => els, elementFromPoint: () => null, body: { innerText: '' } };
  const window = { innerWidth: 1000, innerHeight: 800 };
  return { els, clicked, document, window };
}
function loadHelpers(src, w) {
  // PAGE_HELPERS has no escape sequences of its own, so its raw text IS the script the page runs. In a page,
  // `window` is the global object, so bare names (`__clickTarget`) resolve on it: `with (window)` reproduces that.
  const text = helpersOf(src);
  new Function('window', 'document', 'location', 'getComputedStyle', 'innerWidth', 'innerHeight', 'with (window) {' + text + '\n} return window;')(w.window, w.document, { href: '' }, () => ({}), 1000, 800);
  return w.window;
}
for (const [what, labels, ask] of [
  ['an exact label', ['Save', 'Save all', 'Cancel'], 'Save'],
  ['a substring-only label (exact is tried first, then substring)', ['Save all', 'Cancel'], 'Save'],
  ['a label that is absent', ['Save', 'Cancel'], 'Nope'],
]) {
  const runOne = (src) => {
    const w = world(labels);
    const win = loadHelpers(src, w);
    let ret, err = null;
    try { ret = win.__click(ask); } catch (e) { err = e.message; }
    return { ret, err, clicked: w.clicked };
  };
  const before = runOne(oldSrc);
  const after = runOne(newSrc);
  ok(`A: __click on ${what} behaves identically before and after the refactor (return, element pressed, thrown message)`,
    JSON.stringify(before) === JSON.stringify(after), JSON.stringify({ before, after }));
}

// ---------------------------------------------------------------------------
// B · the sampler on synthetic geometry (read-only)
// ---------------------------------------------------------------------------
function samplerWorld({ rect, covered, disabled = false, pe = 'auto', display = 'block', visibility = 'visible', vw = 1000, vh = 800 }) {
  const calls = [];
  const el = {
    tagName: 'BUTTON', className: 'wz-strip-item x', textContent: 'Press me', disabled,
    getBoundingClientRect: () => ({ left: rect.l, top: rect.t, right: rect.l + rect.w, bottom: rect.t + rect.h, width: rect.w, height: rect.h }),
    getAttribute: () => null, contains: (n) => n === el,
  };
  const cover = { tagName: 'DIV', className: 'covering-layer y', contains: () => false };
  const document = {
    querySelectorAll: () => [el],
    elementFromPoint: (x, y) => { calls.push(['elementFromPoint', x, y]); return covered(x, y) ? cover : el; },
    body: { innerText: '' },
    __calls: calls,
  };
  const window = {};
  const getComputedStyle = () => ({ display, visibility, pointerEvents: pe });
  new Function('window', 'document', 'location', 'getComputedStyle', 'innerWidth', 'innerHeight', 'with (window) {' + helpersOf(newSrc) + '\n} return window;')(window, document, { href: '' }, getComputedStyle, vw, vh);
  return { window, el, calls };
}
const { classifyReach, couldNotHaveBeenPressed } = await import(pathToFileURL(join(here, 'reach-classify.mjs')).href);
const sampleAndClassify = (o, label = 'Press me') => {
  const w = samplerWorld(o);
  const s = w.window.__reachFor(label);
  return { s, c: classifyReach(s), calls: w.calls };
};
{
  const clear = sampleAndClassify({ rect: { l: 100, t: 100, w: 120, h: 40 }, covered: () => false });
  ok('B: a clear control samples 25/25 and classifies reachable', clear.s.hits === 25 && clear.s.total === 25 && clear.c.verdict === 'reachable', JSON.stringify(clear.c));
  const cov = sampleAndClassify({ rect: { l: 100, t: 100, w: 120, h: 40 }, covered: () => true });
  ok('B: a control covered EVERYWHERE samples 0/25 and classifies covered, naming what covers it (item 130\'s defect)',
    cov.c.verdict === 'covered' && cov.c.hits === 0 && cov.c.by === 'DIV.covering-layer', JSON.stringify(cov.c));
  const half = sampleAndClassify({ rect: { l: 100, t: 100, w: 100, h: 40 }, covered: (x) => x < 150 });
  ok('B: a control covered on its LEFT half only is partial, and the dead centre (x=150) is NOT covered — so a person aiming at the centre reaches it',
    half.c.verdict === 'partial' && half.c.centerHit === true && !couldNotHaveBeenPressed(half.c), JSON.stringify(half.c));
  const halfBad = sampleAndClassify({ rect: { l: 100, t: 100, w: 100, h: 40 }, covered: (x) => x < 151 });
  ok('B: covered up to and including the centre is partial with centerHit=false, and COULD NOT HAVE BEEN PRESSED',
    halfBad.c.verdict === 'partial' && halfBad.c.centerHit === false && couldNotHaveBeenPressed(halfBad.c), JSON.stringify(halfBad.c));
  const off = sampleAndClassify({ rect: { l: 100, t: 2000, w: 120, h: 40 }, covered: () => false });
  ok('B: a control wholly below the viewport takes NO samples and classifies offscreen (a person would scroll first)', off.c.verdict === 'offscreen' && off.calls.length === 0, JSON.stringify(off.c));
  const clipped = sampleAndClassify({ rect: { l: 100, t: 780, w: 120, h: 40 }, covered: () => false });
  ok('B: a control half below the fold is sampled only over its VISIBLE part, reachable, and flagged clipped', clipped.c.verdict === 'reachable' && clipped.c.clipped === true, JSON.stringify(clipped.c));
  const zero = sampleAndClassify({ rect: { l: 100, t: 100, w: 0, h: 40 }, covered: () => false });
  ok('B: a zero-width control classifies not-rendered', zero.c.verdict === 'not-rendered', JSON.stringify(zero.c));
  const hidden = sampleAndClassify({ rect: { l: 100, t: 100, w: 120, h: 40 }, covered: () => false, visibility: 'hidden' });
  ok('B: visibility:hidden classifies not-rendered', hidden.c.verdict === 'not-rendered');
  const dis = sampleAndClassify({ rect: { l: 100, t: 100, w: 120, h: 40 }, covered: () => false, disabled: true });
  ok('B: a disabled control classifies disabled — a real press does nothing', dis.c.verdict === 'disabled');
  const pen = sampleAndClassify({ rect: { l: 100, t: 100, w: 120, h: 40 }, covered: () => true, pe: 'none' });
  ok('B: pointer-events:none is FLAGGED (the sample only sees what is beneath it)', pen.c.pointerEventsNone === true && pen.c.verdict === 'covered');
  ok('B: the sampler is READ-ONLY — its only calls on the document are elementFromPoint (no scroll, focus or write)',
    clear.calls.every((c) => c[0] === 'elementFromPoint') && clear.calls.length === 25, `${clear.calls.length} calls`);
}

// ---------------------------------------------------------------------------
// C · the classifier, falsified
// ---------------------------------------------------------------------------
const CASES = [
  ['disabled first', { disabled: true, rect: { l: 0, t: 0, w: 5, h: 5 }, vw: 100, vh: 100, total: 25, hits: 25 }, 'disabled'],
  ['display none', { display: 'none', rect: { l: 0, t: 0, w: 5, h: 5 }, vw: 100, vh: 100, total: 25, hits: 25 }, 'not-rendered'],
  ['visibility hidden', { visibility: 'hidden', rect: { l: 0, t: 0, w: 5, h: 5 }, vw: 100, vh: 100, total: 25, hits: 25 }, 'not-rendered'],
  ['zero height', { rect: { l: 0, t: 0, w: 5, h: 0 }, vw: 100, vh: 100, total: 25, hits: 25 }, 'not-rendered'],
  ['no samples -> offscreen', { rect: { l: 0, t: 500, w: 5, h: 5 }, vw: 100, vh: 100, total: 0, hits: 0 }, 'offscreen'],
  ['no hits -> covered', { rect: { l: 0, t: 0, w: 5, h: 5 }, vw: 100, vh: 100, total: 25, hits: 0, by: { 'DIV.a': 25 } }, 'covered'],
  ['all hits -> reachable', { rect: { l: 0, t: 0, w: 5, h: 5 }, vw: 100, vh: 100, total: 25, hits: 25 }, 'reachable'],
  ['ONE lone hit is partial, not covered', { rect: { l: 0, t: 0, w: 5, h: 5 }, vw: 100, vh: 100, total: 25, hits: 1, centerHit: false }, 'partial'],
  ['some hits -> partial', { rect: { l: 0, t: 0, w: 5, h: 5 }, vw: 100, vh: 100, total: 25, hits: 13, centerHit: true }, 'partial'],
];
const runCases = (mod) => CASES.filter(([, s, want]) => mod.classifyReach(s).verdict !== want).map(([n]) => n);
ok('C: every classifier case gives its expected verdict', runCases({ classifyReach }).length === 0, JSON.stringify(runCases({ classifyReach })));
{
  const src = readFileSync(join(here, 'reach-classify.mjs'), 'utf8');
  const tmp = join(tmpdir(), 'wrizo-reach-proof');
  mkdirSync(tmp, { recursive: true });
  const MUTANTS = [
    ['disabled check removed', "if (s.disabled) verdict = 'disabled';\n  else if", 'if (false) verdict = \'disabled\';\n  else if'],
    ['hidden not checked', "s.display === 'none' || s.visibility === 'hidden' || ", ''],
    ['zero-size not checked', ' || !s.rect || s.rect.w <= 0 || s.rect.h <= 0', ''],
    ['offscreen check removed (no samples then reads as covered)', "else if (!s.total) verdict = 'offscreen';", "else if (false) verdict = 'offscreen';"],
    ['covered threshold moved (hits<=1 is covered)', 'else if (s.hits === 0) verdict', 'else if (s.hits <= 1) verdict'],
    ['reachable needs only a majority', 'else if (s.hits === s.total) verdict', 'else if (s.hits * 2 > s.total) verdict'],
  ];
  for (const [i, [name, from, to]] of MUTANTS.entries()) {
    const mutated = src.replace(from, to);
    if (mutated === src) { ok(`C FALSIFICATION "${name}": the mutation LANDED`, false, 'source unchanged — nothing below is evidence'); continue; }
    const f = join(tmp, `mut-${i}.mjs`);
    writeFileSync(f, mutated);
    const mod = await import(pathToFileURL(f).href);
    const red = runCases(mod);
    ok(`C FALSIFICATION "${name}" — must go RED`, red.length > 0, red.length ? `red: ${red[0]}` : 'GREEN — a decision the cases never exercise');
  }
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail && !c.pass ? `  [${c.detail}]` : ''}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nREACH CLASSIFY PROOF: PASS (${checks.length} checks)` : `\nREACH CLASSIFY PROOF: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);
