// THE FREE WRITE PASS (writing audit, session 4; Fable's order, Nov 10): Free Write is the Page in forward-only mode (ForwardOnlyEditor.tsx, mode `journal`): text can only be APPENDED at the end; Backspace strikes (struck
// letters stay visible, line-through) and nothing is erased; paste and cut are blocked. So its model is not the Draft model:
//   type / Enter (Shift+Enter too)   the text grows by exactly what was typed ('\\n' for Enter); the caret is at the END and is drawn at the end
//   arrows, Home, End, a click       the text does not change; where the caret goes is the browser's, unjudged; the NEXT typed text must still land at the END (the forward-only law) and the caret return there
//   Backspace                        a PROPERTY: it may strike (the text stays visible) or erase the word being typed; it may never lose more than the current word, and the text before it stays a prefix
// Every step is verified with the same reader and verdict as the Draft passes (text, caret, drawn, focus, page rect, view, console). FINDS AND REPORTS; FIXES NOTHING.
// Knobs (env): WA_THEME WA_FLAG WA_TONE WA_W WA_H WA_GROUPS WA_ONLY WA_OUT WA_STRICT
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './driver.mjs';
import { verify } from './verify.mjs';
import { visualLines, lineOf } from './geom.mjs';

const K = (key, o = {}) => ({ k: 'key', key, ...o });
const T = (s) => ({ k: 'type', s });
const N = (key, o = {}) => ({ k: 'nav', key, ...o });
const c = (id, name, text, steps) => ({ id, name, text, steps });
const PARA3 = 'One\nTwo\nThree';

export const FREEWRITE = [
  c('FW01', 'Enter on an empty Free Write page', '', [K('Enter')]),
  c('FW02', 'Type, then Enter', '', [T('Hello'), K('Enter')]),
  c('FW03', 'Enter twice at the end of a line', 'Hello', [K('Enter'), K('Enter')]),
  c('FW04', 'Three paragraphs: type, Enter, type, Enter, type', '', [T('One'), K('Enter'), T('Two'), K('Enter'), T('Three')]),
  c('FW05', 'Shift+Enter at the end of a line', 'Hello', [K('Enter', { shift: true })]),
  c('FW06', 'Left three times, then Enter, then type (forward-only appends at the end)', 'Hello world', [N('ArrowLeft'), N('ArrowLeft'), N('ArrowLeft'), K('Enter'), T('x')]),
  c('FW07', 'Enter, then Backspace', 'Hello', [K('Enter'), K('Backspace')]),
  c('FW08', 'Click in the middle of the text, then type', 'Hello world\nSecond line', [{ k: 'click', q: 3 }, T('X')]),
  c('FW09', 'Enter at the end of a seeded three-paragraph page, then type', PARA3, [K('Enter'), T('x')]),
  c('FW10', 'Ctrl+Home, then type', PARA3, [N('Home', { ctrl: true }), T('x')]),
  c('FW11', 'Enter three times, then type', '', [T('a b c'), K('Enter'), K('Enter'), K('Enter'), T('d')]),
  c('FW12', "Nick's first page: type, Enter, type, Enter, Enter, type", '', [T('Hello'), K('Enter'), T('World'), K('Enter'), K('Enter'), T('x')]),
  c('FW13', 'Backspace twice inside the word being typed', '', [T('Hello'), K('Backspace'), K('Backspace')]),
  c('FW14', 'Backspace five times across a space', '', [T('one two'), K('Backspace'), K('Backspace'), K('Backspace'), K('Backspace'), K('Backspace')]),
  c('FW15', 'Home, End, Up, Down, then type', PARA3, [N('Home'), N('End'), N('ArrowUp'), N('ArrowDown'), T('x')]),
];

const lastWordLen = (s) => { const m = /[^\s]*$/.exec(s); return m ? m[0].length : 0; };

export async function main({ title }) {
  const env = process.env;
  const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
  if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
  const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}/free-write`;
  const only = env.WA_ONLY ? new Set(env.WA_ONLY.split(',').map((s) => s.trim())) : null;
  if (cfg.out) fs.mkdirSync(cfg.out, { recursive: true });
  const out = (s) => console.log(s);
  const proof = [], cases = [], findings = [];

  async function attachPixels(d, r) {
    if ((r.theme === 'flux' && r.fluxCaret) || !r.editor || !r.collapsed || !r.focused) return;
    const px = await d.pixelCaret(); r.px = px; r.pxTries = px ? px.tries : 12;
  }
  async function settleRead(d) {
    await d.frames(); const early = await d.read();
    await sleep(350);
    let late = await d.read();
    if (late.tw) { await d.still(); late = await d.read(); }
    await attachPixels(d, late);
    return { early, late };
  }

  async function readerProof(d) {
    const TEXT = 'Hello world\nSecond line';
    const ctl = async (name, mutate, expectCheck) => {
      await d.openFreeWrite(TEXT);
      const n = TEXT.length;
      await d.place(n);
      const exp = { text: TEXT, a: n, f: n };
      const read = async () => { const before = await d.read(); await d.frames(); const early = await d.read(); await sleep(120); const late = await d.read(); await attachPixels(d, late); return { before, early, late }; };
      const r0 = await read();
      const box = await d.box(n);
      const v0 = verify({ exp, box, before: r0.before, early: r0.early, late: r0.late, errors: [] });
      proof.push({ name: `R-control ${name}: nothing injected, the reader passes`, pass: v0.fails.length === 0, detail: v0.fails.map((f) => `${f.check}: ${f.detail}`).join(' | ') || 'clean' });
      const before = await d.read(); const e0 = d.errors.length;
      await d.ev(mutate); await d.frames(); await sleep(120);
      const late = await d.read(); await attachPixels(d, late);
      const v1 = verify({ exp, box, before, early: late, late, errors: d.errors.slice(e0) });
      proof.push({ name: `R-mutant ${name}: the reader names "${expectCheck}"`, pass: v1.fails.some((f) => f.check === expectCheck), detail: v1.fails.map((f) => `${f.check}: ${f.detail}`).join(' | ') || 'NOTHING FLAGGED' });
    };
    await ctl('caret elsewhere in the text', 'window.__wa.place(3)', 'caret');
    await ctl('text changed behind the editor', "(() => { const w = document.createTreeWalker(document.querySelector('.forward-only-editor'), NodeFilter.SHOW_TEXT); const n = w.nextNode(); n.data = n.data + 'Z'; })()", 'text');
    await ctl('focus lost', "document.querySelector('.forward-only-editor').blur()", 'focus');
  }

  async function runCase(d, cs) {
    const rec = { id: cs.id, name: cs.name, tag: TAG, steps: [], fail: null, fails: [], notes: [] };
    await d.openFreeWrite(cs.text);
    let text = cs.text;
    const placed = await d.place(text.length);
    const r0 = await d.read(); rec.tw = r0.tw;
    if (!placed || r0.anchor !== text.length) {
      rec.fail = { step: 0, label: 'setup', fails: [{ check: 'setup', detail: `could not stage the end: placed=${placed} selection ${r0.anchor}..${r0.focus} want ${text.length}` }], dom: await d.dom() };
      rec.fails.push(rec.fail); return rec;
    }
    for (let i = 0; i < cs.steps.length; i++) {
      const st = cs.steps[i];
      const before = await d.read();
      let kind = 'append', act, expText = text;
      if (st.k === 'type') { expText = text + st.s; act = () => d.type(st.s); }
      else if (st.k === 'key' && st.key === 'Enter') { expText = text + '\n'; act = () => d.key('Enter', st); }
      else if (st.k === 'key' && st.key === 'Backspace') { kind = 'back'; act = () => d.key('Backspace', st); }
      else if (st.k === 'nav') { kind = 'nav'; act = () => d.key(st.key, st); }
      else if (st.k === 'click') {
        kind = 'nav';
        const stops = await d.stops(); const s = stops[Math.min(st.q, stops.length - 1)];
        act = () => d.click(s.x + 0.6, s.top + (s.height || 18) / 2, 1);
      } else throw new Error('freewrite: unknown step ' + JSON.stringify(st));
      const e0 = d.errors.length;
      await act();
      const { early, late } = await settleRead(d);
      const extra = [];
      let exp;
      if (kind === 'append') exp = { text: expText, a: expText.length, f: expText.length };
      else if (kind === 'nav') exp = { text, a: late.anchor ?? 0, f: late.focus ?? 0 };
      else {
        // Backspace: a property. The text before must be a prefix of what is there now or the reverse (struck letters stay), and no more than the word being typed may be lost.
        const after = late.text;
        const lost = text.length - after.length;
        const okPrefix = text.startsWith(after) || after.startsWith(text);
        if (!okPrefix) extra.push({ check: 'text', detail: `Backspace changed the text other than by striking/erasing the end: ${JSON.stringify(text.slice(-30))} -> ${JSON.stringify(after.slice(-30))}` });
        else if (lost > lastWordLen(text) + 1) extra.push({ check: 'text', detail: `Backspace lost ${lost} characters (more than the word being typed, ${lastWordLen(text)}): ${JSON.stringify(text.slice(-30))} -> ${JSON.stringify(after.slice(-30))}` });
        expText = after;
        exp = { text: after, a: late.anchor ?? after.length, f: late.focus ?? after.length };
      }
      const wantDrawn = kind === 'append';
      const box = wantDrawn ? await d.box(exp.f) : null;
      const v = verify({ exp, box, before, early, late, errors: d.errors.slice(e0), expect: { noDrawn: !wantDrawn } });
      v.fails.push(...extra);
      rec.steps.push(st.k === 'type' ? `type ${JSON.stringify(st.s)}` : st.k === 'click' ? `click at offset ${st.q}` : `${st.ctrl ? 'Ctrl+' : ''}${st.shift ? 'Shift+' : ''}${st.key}`);
      if (v.notes.length) rec.notes.push(...v.notes);
      if (v.fails.length) {
        const fail = { step: i + 1, label: rec.steps[rec.steps.length - 1], fails: v.fails, got: { text: late.text, anchor: late.anchor, focus: late.focus, px: late.px, fluxCaret: late.fluxCaret, selPoint: late.selPoint }, box, dom: await d.dom(700) };
        rec.fails.push(fail);
        if (!rec.fail) { rec.fail = fail; rec.shot = await d.shot(`${TAG.replace(/\//g, '-')}-${cs.id}-step${i + 1}`); }
        return rec;
      }
      text = expText;
    }
    return rec;
  }

  try {
    await withHarness(async (app) => {
      const d = makeDriver(app, cfg);
      out(`WRITING AUDIT ${title} [${TAG}] (${new Date().toISOString()})`);
      await d.boot();
      await d.openFreeWrite('probe');
      const first = await d.read();
      out(`PREMISE  Free Write: theme=${first.theme} tone=${first.tone} editor=${first.editor} view=${first.view && first.view.w}x${first.view && first.view.h} typewriter=${first.tw} text=${JSON.stringify(first.text)} page=${JSON.stringify(first.page)}`);
      await readerProof(d);
      for (const p of proof) out(`${p.pass ? 'PASS' : 'FAIL'}  ${p.name}  [${p.detail}]`);
      for (const cs of FREEWRITE) {
        if (only && !only.has(cs.id)) continue;
        let rec;
        try { rec = await runCase(d, cs); } catch (e) { rec = { id: cs.id, name: cs.name, tag: TAG, steps: [], fails: [], notes: [], fail: { step: -1, label: 'harness', fails: [{ check: 'harness', detail: String((e && e.stack) || e).split('\n').slice(0, 3).join(' | ') }] } }; rec.fails = [rec.fail]; }
        cases.push(rec);
        if (rec.fail) {
          findings.push(rec);
          const f = rec.fail;
          out(`FAIL  ${cs.id} ${cs.name} [${TAG}] (typewriter ${rec.tw ?? 'off'}): step ${f.step} (${f.label}): ${f.fails.map((x) => `${x.check} - ${x.detail}`).join(' || ')}`);
          if (f.dom) out(`      dom: ${String(f.dom).replace(/\s+/g, ' ').slice(0, 420)}`);
        } else out(`PASS  ${cs.id} ${cs.name} [${TAG}] (typewriter ${rec.tw ?? 'off'}) (${rec.steps.join(' > ')})${rec.notes.length ? '  notes: ' + [...new Set(rec.notes)].join('; ') : ''}`);
      }
    });
  } catch (err) {
    out(`FAIL  the run reached its end  [${String((err && err.stack) || err).split('\n').slice(0, 4).join(' | ')}]`);
    proof.push({ name: 'the run reached its end', pass: false, detail: String(err && err.message) });
  }
  const proofBad = proof.filter((p) => !p.pass);
  if (cfg.out) fs.writeFileSync(path.join(cfg.out, `findings-${title}-${TAG.replace(/\//g, '-')}.json`), JSON.stringify({ tag: TAG, cfg, proof, cases: cases.map((x) => ({ id: x.id, name: x.name, pass: !x.fail, steps: x.steps })), findings }, null, 1));
  out(`\nREADER PROOF [${TAG}]: ${proofBad.length ? `FAIL - ${proofBad.length}/${proof.length}` : `PASS (${proof.length} checks)`}`);
  out(`FINDINGS [${TAG}]: ${findings.length} of ${cases.length} cases failed${findings.length ? ': ' + findings.map((f) => f.id).join(' ') : ''}`);
  process.exit(proofBad.length || (env.WA_STRICT === '1' && findings.length) ? 1 : 0);
}
