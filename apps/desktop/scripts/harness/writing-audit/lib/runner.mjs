// THE SESSION-2 RUNNER (writing audit): s1-caret.mjs's reader proof and per-step verdict, generalised for the new step kinds (cases2.mjs): the layout-aware oracle for Up/Down/Home/End, properties for PageUp/PageDown,
// the mouse, the Typewriter engaged, and cases that carry on after a failure (`cont`). FINDS AND REPORTS; FIXES NOTHING. The thin wrappers (s2-typewriter.mjs, s2-motion.mjs, s2-mouse.mjs) set their defaults and call main().
// Knobs (env): WA_THEME WA_FLAG WA_TONE WA_W WA_H (as s1-caret.mjs) WA_TYPEWRITER=on|off|default WA_GROUPS WA_ONLY WA_OUT WA_STRICT
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './driver.mjs';
import { Model, stepLabel } from './model.mjs';
import { verify } from './verify.mjs';
import { visualLines, lineOf, vertical, homeEnd, hit } from './geom.mjs';

const label2 = (st) => {
  if (st.k === 'click') return `${st.count === 2 ? 'double-' : st.count === 3 ? 'triple-' : ''}click ${st.q !== undefined ? 'at offset ' + st.q : st.eol ? 'right of line ' + st.line : st.below ? 'below the last line' : 'in the left margin of line ' + st.line}`;
  if (st.k === 'drag') return `drag ${st.from} to ${st.to}`;
  return stepLabel(st) + (st.geo ? ' [layout oracle]' : st.prop ? ' [property]' : '');
};

export async function main({ groupsDef, order, title }) {
  const env = process.env;
  const cfg = {
    theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light',
    width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null, typewriter: env.WA_TYPEWRITER || 'default',
  };
  if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
  const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}/tw-${cfg.typewriter}`;
  const groups = (env.WA_GROUPS || order.join(',')).split(',').map((s) => s.trim()).filter(Boolean);
  const only = env.WA_ONLY ? new Set(env.WA_ONLY.split(',').map((s) => s.trim())) : null;
  if (cfg.out) fs.mkdirSync(cfg.out, { recursive: true });
  const lines = [];
  const out = (s) => { lines.push(s); console.log(s); };
  const proof = [], cases = [], findings = [];
  const OPEN = { typewriter: cfg.typewriter };

  async function attachPixels(d, r) {
    if (r.theme === 'flux' || !r.editor || !r.collapsed || !r.focused) return;
    const px = await d.pixelCaret();
    r.px = px; r.pxTries = px ? px.tries : 12; r.pxVia = px ? px.via : null;
  }
  async function settleRead(d) {
    await d.frames(); const early = await d.read();
    await sleep(350);
    let late = await d.read();
    if (late.tw) { await d.still(); late = await d.read(); }
    await attachPixels(d, late);
    return { early, late };
  }

  // ---- READER PROOF: the same mutants as session 1, under this run's Typewriter setting -----------------------------------------------------------------------------------------------------
  async function readerProof(d) {
    const TEXT = 'Hello world\nSecond line\n\nLast';
    const ctl = async (name, p, mutate, expectCheck, { early: useEarly = false } = {}) => {
      await d.openPage(TEXT, 'drafting', OPEN);
      const placed = await d.place(p);
      const m = new Model(TEXT, p, p, 'linux');
      const read = async () => { const before = await d.read(); await d.frames(); const early = await d.read(); await sleep(120); const late = await d.read(); await attachPixels(d, late); return { before, early, late }; };
      const r0 = await read();
      const box = await d.box(p);
      const v0 = verify({ exp: m.snapshot(), box, before: r0.before, early: r0.early, late: r0.late, errors: [] });
      proof.push({ name: `R-control ${name}: nothing injected, the reader passes (placed=${placed})`, pass: placed && v0.fails.length === 0, detail: v0.fails.map((f) => `${f.check}: ${f.detail}`).join(' | ') || 'clean' });
      const before = await d.read();
      const e0 = d.errors.length;
      await d.frames();
      const early = useEarly ? await d.read() : null;
      await d.ev(mutate);
      await d.frames(); await sleep(120);
      const late = await d.read();
      await attachPixels(d, late);
      const v1 = verify({ exp: m.snapshot(), box, before, early: early || await d.read(), late, errors: d.errors.slice(e0) });
      proof.push({ name: `R-mutant ${name}: the reader names "${expectCheck}"`, pass: v1.fails.some((f) => f.check === expectCheck), detail: v1.fails.map((f) => `${f.check}: ${f.detail}`).join(' | ') || 'NOTHING FLAGGED' });
    };
    await ctl('caret elsewhere in the text', 3, 'window.__wa.place(9)', 'caret');
    await ctl('text changed behind the editor', 3, "(() => { const w = document.createTreeWalker(document.querySelector('.forward-only-editor'), NodeFilter.SHOW_TEXT); const n = w.nextNode(); n.data = n.data + 'Z'; })()", 'text');
    await ctl('focus lost', 3, "document.querySelector('.forward-only-editor').blur()", 'focus');
    await ctl('page shifted by 7px', 3, "(() => { document.querySelector('.mode-page').style.transform = 'translateX(7px)'; })()", 'page');
    await ctl('an error in the console', 3, "console.error('wa-reader-mutant')", 'console');
    await ctl('caret moved after the keystroke', 3, 'window.__wa.place(9)', 'settled', { early: true });
    if (cfg.theme === 'flux') await ctl('Flux block caret at the page corner', 3, "(() => { const c = document.querySelector('.flux-block-caret'); if (c) { c.style.left = '0px'; c.style.top = '0px'; } })()", 'drawn');
    else await ctl('painted caret at the first row, text says the third', 15, 'window.__wa.place(0)', 'drawn');
  }

  // ---- ONE CASE ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  async function runCase(d, cs) {
    const rec = { id: cs.id, name: cs.name, tag: TAG, steps: [], fail: null, fails: [], notes: [], tw: null };
    await d.openPage(cs.text, 'drafting', OPEN);
    const placed = await d.place(cs.a, cs.f);
    let m = new Model(cs.text, cs.a, cs.f, 'linux');
    const r0 = await d.read();
    m.platform = r0.platform; rec.tw = r0.tw;
    if (!placed || r0.anchor !== cs.a || r0.focus !== cs.f) {
      rec.fail = { step: 0, label: 'setup', fails: [{ check: 'setup', detail: `could not stage the start: placed=${placed} selection ${r0.anchor}..${r0.focus} want ${cs.a}..${cs.f}` }], dom: await d.dom() };
      rec.fails.push(rec.fail); return rec;
    }
    let goalX = null, lastVertical = false;
    for (let i = 0; i < cs.steps.length; i++) {
      const st = cs.steps[i];
      const before = await d.read();
      const needStops = st.geo || st.k === 'click' || st.k === 'drag';
      const stops = needStops ? await d.stops() : null;
      const lns = stops ? visualLines(stops) : null;
      const exp = m.clone();
      let act, anyF = null, anyPairs = null, prop = null;
      const n = m.text.length;
      if (st.geo === 'up' || st.geo === 'down') {
        if (!lastVertical || goalX === null) goalX = stops[before.focus] && stops[before.focus].x;
        anyF = vertical(lns, before.focus, goalX, st.geo, n);
        act = () => d.key(st.key, st);
      } else if (st.geo === 'home' || st.geo === 'end') {
        anyF = homeEnd(lns, before.focus, st.key, m.text);
        act = () => d.key(st.key, st);
      } else if (st.prop) {
        prop = st.prop; act = () => d.key(st.key, st);
      } else if (st.k === 'click') {
        const ed = before.editorRect;
        let x, y, li;
        if (st.q !== undefined) { const s = stops[st.q]; li = lineOf(lns, st.q); x = s.x + 0.6; y = s.top + (s.height || 18) / 2; }
        else if (st.eol) { li = st.line; const L = lns[li]; x = ed.x + ed.w - 8; y = L.top + (L.height || 18) / 2; }
        else if (st.below) { li = lns.length - 1; const L = lns[li]; x = ed.x + ed.w / 2; y = L.top + (L.height || 18) + 30; }
        else { li = st.line; const L = lns[li]; x = ed.x - 20; y = L.top + (L.height || 18) / 2; }
        const count = st.count || 1;
        if (count === 1) anyF = st.below ? [n] : st.margin ? [lns[li].ps[0]] : hit(lns, li, x);
        else if (count === 2) { let ws = st.q, we = st.q; while (ws > 0 && /[\p{L}\p{N}_]/u.test(m.text[ws - 1])) ws--; while (we < n && /[\p{L}\p{N}_]/u.test(m.text[we])) we++; anyPairs = [[ws, we], [ws, we + 1]]; }
        else { const ls = m.text.lastIndexOf('\n', st.q - 1) + 1; let le = m.text.indexOf('\n', st.q); if (le < 0) le = n; anyPairs = [[ls, le], [ls, le + 1]]; }
        act = () => d.click(x, y, count);
      } else if (st.k === 'drag') {
        const a = stops[st.from], b = stops[st.to];
        exp.a = st.from; exp.f = st.to;
        act = () => d.drag(a.x + 0.6, a.top + (a.height || 18) / 2, b.x + 0.6, b.top + (b.height || 18) / 2);
      } else { exp.apply(st); act = () => d.perform(st); }
      const e0 = d.errors.length;
      await act();
      const { early, late } = await settleRead(d);
      // fix the expectation to the acceptable answer the page gave (or the first acceptable one, which then fails with the list named)
      if (anyF) { const pick = anyF.includes(late.focus) ? late.focus : anyF[0]; exp.f = pick; exp.a = st.shift ? m.a : pick; }
      if (anyPairs) { const pr = anyPairs.find((q) => q[0] === late.anchor && q[1] === late.focus) || anyPairs[0]; exp.a = pr[0]; exp.f = pr[1]; }
      if (prop) { exp.a = exp.f = late.focus; }
      const box = exp.collapsed ? await d.box(exp.f) : null;
      const v = verify({ exp: exp.snapshot(), box, before, early, late, errors: d.errors.slice(e0) });
      if (prop) {
        const down = prop === 'down';
        if (down ? !(late.focus > before.focus || before.focus === n) : !(late.focus < before.focus || before.focus === 0)) v.fails.push({ check: 'caret', detail: `${st.key} moved the caret from ${before.focus} to ${late.focus} (it must go ${down ? 'forward' : 'back'}, or stay at the document's end)` });
      }
      for (const f of v.fails) {
        if (f.check === 'caret' && anyF) f.detail += ` (acceptable: ${anyF.join(' or ')})`;
        if (f.check === 'caret' && anyPairs) f.detail += ` (acceptable: ${anyPairs.map((q) => q.join('..')).join(' or ')})`;
      }
      rec.steps.push(label2(st));
      if (v.notes.length) rec.notes.push(...v.notes);
      if (v.fails.length) {
        const fail = { step: i + 1, label: label2(st), fails: v.fails, expected: exp.snapshot(), got: { text: late.text, anchor: late.anchor, focus: late.focus, px: late.px, fluxCaret: late.fluxCaret, page: late.page, selPoint: late.selPoint, tw: late.tw }, box, dom: await d.dom(700) };
        rec.fails.push(fail);
        if (!rec.fail) { rec.fail = fail; rec.shot = await d.shot(`${TAG.replace(/\//g, '-')}-${cs.id}-step${i + 1}`); }
        if (!cs.cont) return rec;
      }
      rec.finalText = late.text;
      m = exp;
      lastVertical = (st.geo === 'up' || st.geo === 'down') && late.focus !== 0 && late.focus !== n;   // a jump to the document's start or end starts a new goal column
    }
    return rec;
  }

  try {
    await withHarness(async (app) => {
      const d = makeDriver(app, cfg);
      out(`WRITING AUDIT ${title} [${TAG}] (${new Date().toISOString()})`);
      await d.boot();
      await d.openPage('probe', 'drafting', OPEN);
      const first = await d.read();
      out(`PREMISE  the room: theme=${first.theme} tone=${first.tone} editor=${first.editor} view=${first.view && first.view.w}x${first.view && first.view.h} platform=${first.platform} typewriter=${first.tw} (asked: ${cfg.typewriter}) page=${JSON.stringify(first.page)}`);
      if (cfg.typewriter === 'on' && !first.tw) out('FAIL  PREMISE the Typewriter was asked for and is not engaged on this page');
      await readerProof(d);
      for (const p of proof) out(`${p.pass ? 'PASS' : 'FAIL'}  ${p.name}  [${p.detail}]`);
      for (const g of groups) {
        for (const cs of groupsDef[g] || []) {
          if (only && !only.has(cs.id)) continue;
          let rec;
          try { rec = await runCase(d, cs); } catch (e) { rec = { id: cs.id, name: cs.name, tag: TAG, steps: [], fails: [], notes: [], fail: { step: -1, label: 'harness', fails: [{ check: 'harness', detail: String((e && e.stack) || e).split('\n').slice(0, 3).join(' | ') }] } }; rec.fails = [rec.fail]; }
          cases.push(rec);
          if (rec.fail) {
            findings.push(rec);
            for (const f of rec.fails) {
              out(`FAIL  ${cs.id} ${cs.name} [${TAG}] (typewriter ${rec.tw ?? 'off'}): step ${f.step} (${f.label}): ${f.fails.map((x) => `${x.check} - ${x.detail}`).join(' || ')}`);
              if (f.dom && f === rec.fail) out(`      dom: ${String(f.dom).replace(/\s+/g, ' ').slice(0, 420)}`);
            }
            if (cs.cont) out(`      after the last step the page holds ${JSON.stringify(rec.finalText)}`);
          } else out(`PASS  ${cs.id} ${cs.name} [${TAG}] (typewriter ${rec.tw ?? 'off'}) (${rec.steps.join(' > ')})${rec.notes.length ? '  notes: ' + [...new Set(rec.notes)].join('; ') : ''}`);
        }
      }
    });
  } catch (err) {
    out(`FAIL  the run reached its end  [${String((err && err.stack) || err).split('\n').slice(0, 4).join(' | ')}]`);
    proof.push({ name: 'the run reached its end', pass: false, detail: String(err && err.message) });
  }
  const proofBad = proof.filter((p) => !p.pass);
  if (cfg.out) fs.writeFileSync(path.join(cfg.out, `findings-${title}-${TAG.replace(/\//g, '-')}.json`), JSON.stringify({ tag: TAG, cfg, proof, cases: cases.map((c) => ({ id: c.id, name: c.name, pass: !c.fail, steps: c.steps, notes: c.notes, tw: c.tw })), findings }, null, 1));
  out(`\nREADER PROOF [${TAG}]: ${proofBad.length ? `FAIL - ${proofBad.length}/${proof.length}` : `PASS (${proof.length} checks)`}`);
  out(`FINDINGS [${TAG}]: ${findings.length} of ${cases.length} cases failed${findings.length ? ': ' + findings.map((f) => f.id).join(' ') : ''}`);
  process.exit(proofBad.length || (env.WA_STRICT === '1' && findings.length) ? 1 : 0);
}
