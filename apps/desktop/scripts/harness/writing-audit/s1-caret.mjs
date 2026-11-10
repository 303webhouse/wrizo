// WRITING AUDIT, SESSION 1 (bug #59; brief §6, §7 pass A's first slice): the reference model and the caret reader, proved on the Page editor in Draft, Enter first.
// FINDS AND REPORTS; FIXES NOTHING; no product file is touched. A FAIL line here is a finding (a writer-visible bug), written so it goes green when the bug is fixed (the writing batch's red-first).
//
//   READER PROOF (R*)  first: the reader must catch what it claims to. Each mutant is injected into the live page (the caret moved, the text changed, focus lost, the page shifted, an error logged, the caret
//                      moved after the keystroke) and the verdict must name that check; the control (nothing injected) must pass. A reader that cannot fail proves nothing.
//   CASES (E/T/D/M/S)  each: a starting text and caret, then the steps a writer takes. After EVERY step the page is compared with the model: text, the caret's place in the text, where the caret is DRAWN
//                      (the browser's rectangle; Flux's own block caret), focus, the page's rect, the view, the console, and that none of it moves 350 ms later.
// Run: node scripts/harness/writing-audit/s1-caret.mjs   (from apps/desktop; on Actions via .github/workflows/writing-audit.yml - NEVER the box)
// Knobs (env): WA_THEME=plateau|flux|machina (default plateau = Arbor) WA_FLAG=off|on (that theme's redesign flag) WA_TONE=light|dark WA_W/WA_H (1366x768) WA_GROUPS=enter,type,del,move,select
//              WA_ONLY=E01,E02 (case ids) WA_OUT=<dir> (shots + findings json) WA_STRICT=1 (exit 1 on any finding; default: findings are reported, the exit says only whether the READER PROOF held)
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';
import { Model, stepLabel } from './lib/model.mjs';
import { verify } from './lib/verify.mjs';
import { GROUPS, ORDER } from './lib/cases.mjs';

const env = process.env;
const cfg = {
  theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light',
  width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null,
};
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
const groups = (env.WA_GROUPS || ORDER.join(',')).split(',').map((s) => s.trim()).filter(Boolean);
const only = env.WA_ONLY ? new Set(env.WA_ONLY.split(',').map((s) => s.trim())) : null;
if (cfg.out) fs.mkdirSync(cfg.out, { recursive: true });

const lines = [];
const out = (s) => { lines.push(s); console.log(s); };
const proof = [], cases = [], findings = [];

async function settleRead(d) {
  await d.frames(); const early = await d.read();
  await sleep(350); const late = await d.read();
  return { early, late };
}

// ---- READER PROOF ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function readerProof(d) {
  const TEXT = 'Hello world\nSecond line\n\nLast';
  const want = (check) => (r) => r.fails.some((f) => f.check === check);
  const ctl = async (name, p, mutate, expectCheck, { early: useEarly = false } = {}) => {
    await d.openPage(TEXT);
    const placed = await d.place(p);
    const m = new Model(TEXT, p, p, 'linux');
    const read = async () => { const before = await d.read(); await d.frames(); const early = await d.read(); await sleep(120); const late = await d.read(); return { before, early, late }; };
    // control: nothing injected, the verdict is clean
    const r0 = await read();
    const box = await d.box(p);
    const v0 = verify({ exp: m.snapshot(), box, before: r0.before, early: r0.early, late: r0.late, errors: [] });
    proof.push({ name: `R-control ${name}: nothing injected, the reader passes (placed=${placed})`, pass: placed && v0.fails.length === 0, detail: v0.fails.map((f) => `${f.check}: ${f.detail}`).join(' | ') || 'clean' });
    // mutant
    const before = await d.read();
    const e0 = d.errors.length;
    await d.frames();
    const early = useEarly ? await d.read() : null;
    await d.ev(mutate);
    await d.frames(); await sleep(120);
    const late = await d.read();
    const v1 = verify({ exp: m.snapshot(), box, before, early: early || await d.read(), late, errors: d.errors.slice(e0) });
    proof.push({ name: `R-mutant ${name}: the reader names "${expectCheck}"`, pass: want(expectCheck)(v1), detail: v1.fails.map((f) => `${f.check}: ${f.detail}`).join(' | ') || 'NOTHING FLAGGED' });
  };
  // a mutation runs in the page; for the "moved after the keystroke" mutant the early read is taken BEFORE it, the late one after
  await ctl('caret elsewhere in the text', 3, "window.__wa.place(9)", 'caret');
  await ctl('text changed behind the editor', 3, "(() => { const w = document.createTreeWalker(document.querySelector('.forward-only-editor'), NodeFilter.SHOW_TEXT); const n = w.nextNode(); n.data = n.data + 'Z'; })()", 'text');
  await ctl('focus lost', 3, "document.querySelector('.forward-only-editor').blur()", 'focus');
  await ctl('page shifted by 7px', 3, "(() => { document.querySelector('.mode-page').style.transform = 'translateX(7px)'; })()", 'page');
  await ctl('an error in the console', 3, "console.error('wa-reader-mutant')", 'console');
  await ctl('caret moved after the keystroke', 3, "window.__wa.place(9)", 'settled', { early: true });
  if (cfg.theme === 'flux') {
    await ctl('Flux block caret at the page corner', 3, "(() => { const c = document.querySelector('.flux-block-caret'); if (c) { c.style.left = '0px'; c.style.top = '0px'; } })()", 'drawn');
  } else {
    // the native caret cannot be moved from script: put the selection on the first row while the model expects it in the third (the rectangle the browser would paint is then far from the text's place)
    await ctl('selection rectangle at the first row, text says the third', 15, "window.__wa.place(0)", 'drawn');
  }
}

// ---- THE CASES --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function runCase(d, cs) {
  const rec = { id: cs.id, name: cs.name, tag: TAG, steps: [], fail: null, notes: [] };
  await d.openPage(cs.text);
  const placed = await d.place(cs.a, cs.f);
  let m = new Model(cs.text, cs.a, cs.f, 'linux');
  let r = await d.read();
  m.platform = r.platform;
  if (!placed || r.anchor !== cs.a || r.focus !== cs.f) {
    rec.fail = { step: 0, label: 'setup', fails: [{ check: 'setup', detail: `could not stage the start: placed=${placed} selection ${r.anchor}..${r.focus} want ${cs.a}..${cs.f}` }], dom: await d.dom() };
    return rec;
  }
  for (let i = 0; i < cs.steps.length; i++) {
    const st = cs.steps[i];
    const before = await d.read();
    const exp = m.clone().apply(st);
    const e0 = d.errors.length;
    await d.perform(st);
    const { early, late } = await settleRead(d);
    const box = exp.collapsed ? await d.box(exp.f) : null;
    const v = verify({ exp: exp.snapshot(), box, before, early, late, errors: d.errors.slice(e0) });
    rec.steps.push(stepLabel(st));
    if (v.notes.length) rec.notes.push(...v.notes);
    if (v.fails.length) {
      rec.fail = { step: i + 1, label: stepLabel(st), fails: v.fails, expected: exp.snapshot(), got: { text: late.text, anchor: late.anchor, focus: late.focus, caret: late.caret, fluxCaret: late.fluxCaret, page: late.page }, box, dom: await d.dom(700) };
      rec.shot = await d.shot(`${TAG.replace(/\//g, '-')}-${cs.id}-step${i + 1}`);
      return rec;
    }
    m = exp;
  }
  return rec;
}

try {
  await withHarness(async (app) => {
    const d = makeDriver(app, cfg);
    out(`WRITING AUDIT S1 [${TAG}] (${new Date().toISOString()})`);
    await d.boot();
    await d.openPage('probe');
    const first = await d.read();
    out(`PREMISE  the room: theme=${first.theme} tone=${first.tone} editor=${first.editor} view=${first.view && first.view.w}x${first.view && first.view.h} platform=${first.platform} rows=${first.rows} page=${JSON.stringify(first.page)}`);
    const premiseOk = first.editor && first.theme === (cfg.theme === 'plateau' ? first.theme : cfg.theme) && first.tone === cfg.tone;
    if (!premiseOk) out(`FAIL  PREMISE the page is not the room this run asked for (want ${TAG})`);

    await readerProof(d);
    for (const p of proof) out(`${p.pass ? 'PASS' : 'FAIL'}  ${p.name}  [${p.detail}]`);

    for (const g of groups) {
      for (const cs of GROUPS[g] || []) {
        if (only && !only.has(cs.id)) continue;
        let rec;
        try { rec = await runCase(d, cs); } catch (e) { rec = { id: cs.id, name: cs.name, tag: TAG, steps: [], fail: { step: -1, label: 'harness', fails: [{ check: 'harness', detail: String((e && e.stack) || e).split('\n').slice(0, 3).join(' | ') }] } }; }
        cases.push(rec);
        if (rec.fail) {
          findings.push(rec);
          const f = rec.fail;
          out(`FAIL  ${cs.id} ${cs.name} [${TAG}]: step ${f.step} (${f.label}): ${f.fails.map((x) => `${x.check} - ${x.detail}`).join(' || ')}`);
          if (f.dom) out(`      dom: ${String(f.dom).replace(/\s+/g, ' ').slice(0, 420)}`);
        } else out(`PASS  ${cs.id} ${cs.name} [${TAG}] (${rec.steps.join(' > ')})${rec.notes.length ? '  notes: ' + [...new Set(rec.notes)].join('; ') : ''}`);
      }
    }
  });
} catch (err) {
  out(`FAIL  the run reached its end  [${String((err && err.stack) || err).split('\n').slice(0, 4).join(' | ')}]`);
  proof.push({ name: 'the run reached its end', pass: false, detail: String(err && err.message) });
}

const proofBad = proof.filter((p) => !p.pass);
const summary = { tag: TAG, cfg, platformNote: 'verdicts from Linux Chrome 156 on Actions; word-movement rules follow the browser platform (model.mjs)', proof, cases: cases.map((c) => ({ id: c.id, name: c.name, pass: !c.fail, steps: c.steps, notes: c.notes })), findings };
if (cfg.out) fs.writeFileSync(path.join(cfg.out, `findings-${TAG.replace(/\//g, '-')}.json`), JSON.stringify(summary, null, 1));
out(`\nREADER PROOF [${TAG}]: ${proofBad.length ? `FAIL - ${proofBad.length}/${proof.length}` : `PASS (${proof.length} checks)`}`);
out(`FINDINGS [${TAG}]: ${findings.length} of ${cases.length} cases failed${findings.length ? ': ' + findings.map((f) => f.id).join(' ') : ''}`);
process.exit(proofBad.length || (env.WA_STRICT === '1' && findings.length) ? 1 : 0);
