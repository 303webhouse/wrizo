// SESSION 7 (writing audit; Fable, Nov 11): the SCREENPLAY EDITOR and the TUTOR'S BOX. FINDS AND REPORTS; FIXES NOTHING.
//   SCREENPLAY  (ScriptEditor.tsx) a block editor: one element per line, only the ACTIVE element is a live contenteditable (`.script-el-active`); Enter makes the next element, Tab cycles its type, autosave is 2 s (AUTOSAVE_MS).
//               Checked after every key: the elements' texts are what was typed, the active element and the caret in it are where they should be, the caret is DRAWN in the active element at the end of its text (the painted caret,
//               against the geometry of the active element), focus stays; and at the end: reload at once keeps every word (the 2 s autosave must not lose the last lines).
//   TUTOR'S BOX (Tutor.tsx `.wz-tutor-convo-input`, a single-line <input>) the same input checks as the titles (value, selection, painted caret against the box's own font, focus), and opening the Tutor must not move the page (law 1).
// Knobs (env): WA_THEME WA_FLAG WA_TONE WA_W WA_H WA_ONLY WA_OUT WA_STRICT
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './driver.mjs';
import { Model, stepLabel } from './model.mjs';
import { verify } from './verify.mjs';
import { READ, caretByDifference } from './titles.mjs';

export async function main({ title }) {
  const env = process.env;
  const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
  if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
  const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
  const only = env.WA_ONLY ? new Set(env.WA_ONLY.split(',').map((s) => s.trim())) : null;
  if (cfg.out) fs.mkdirSync(cfg.out, { recursive: true });
  const out = (s) => console.log(s);
  const results = [];

  await withHarness(async (app) => {
    const d = makeDriver(app, cfg);
    out(`WRITING AUDIT ${title} [${TAG}] (${new Date().toISOString()})`);
    await d.boot();
    const ev = d.ev;
    const record = (id, name, fails, notes = []) => { results.push({ id, name, pass: !fails.length, fails, notes }); out(`${fails.length ? 'FAIL' : 'PASS'}  ${id} ${name} [${TAG}]${fails.length ? ': ' + fails.join(' || ').slice(0, 1200) : ''}${notes.length ? '  notes: ' + notes.join('; ').slice(0, 500) : ''}`); };
    const run = async (id, name, fn) => { if (only && !only.has(id)) return; const e0 = d.errors.length; const fails = [], notes = []; try { await fn(fails, notes); } catch (e) { fails.push('harness: ' + String((e && e.stack) || e).split('\n').slice(0, 2).join(' | ').slice(0, 300)); } if (d.errors.length > e0) fails.push('console: ' + d.errors.slice(e0, e0 + 2).join(' | ').slice(0, 200)); if (fails.length) await d.shot(`${TAG.replace(/\//g, '-')}-${id}`); record(id, name, fails, notes); };

    // ====================== SCREENPLAY ======================
    const openScript = async () => {
      const id = `wa-script-${Date.now().toString(36)}`;
      await ev(`location.hash = '#/'`); await sleep(150);
      await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: '', pageType: 'script', createdAt: new Date().toISOString(), origin: 'journal', source: 'page' })})`);
      await ev(`location.hash = '#/page/${id}'`);
      await app.waitFor("!!document.querySelector('.script-el-active')", { timeout: 20000, label: 'the screenplay editor' });
      await sleep(700);
      await d.surface('.script-el-active', true);
      await ev("document.querySelector('.script-el-active').focus()");
      d.errors.length = 0;
      return id;
    };
    const els = () => ev("[...document.querySelectorAll('.script-el')].map((e) => ({ t: e.textContent.replace(/\\u200b/g, ''), active: e.classList.contains('script-el-active') }))");
    const storedScript = (id) => ev(`(() => { try { const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const r = rows.find((x) => x.id === ${JSON.stringify(id)}); return r ? r.text : null; } catch (e) { return 'ERR ' + e.message; } })()`);
    // one step: do it, settle, then judge the elements, the active one, the caret in it, where it is painted
    const scriptCase = async (id, name, steps, tail) => run(id, name, async (fails, notes) => {
      const pid = await openScript();
      const want = [''];            // the elements' texts, as typed
      let active = 0;
      let m = new Model('', 0, 0, 'linux');
      let first = true;
      for (let i = 0; i < steps.length; i++) {
        const st = steps[i];
        const before = await d.read(); const e0 = d.errors.length;
        if (st.k === 'type') { m.type(st.s); want[active] = m.text; await d.type(st.s); }
        else if (st.k === 'enter') { want.splice(active + 1, 0, ''); active += 1; m = new Model('', 0, 0, 'linux'); await d.key('Enter'); }
        else if (st.k === 'key') { m.key(st); want[active] = m.text; await d.key(st.key, st); }
        else if (st.k === 'tab') { await d.key('Tab'); }
        await d.frames(); await sleep(450);
        let late = await d.read();
        if (late.collapsed && late.focused && !(late.theme === 'flux' && late.fluxCaret)) { const px = await d.pixelCaret(6); late.px = px; late.pxTries = px ? px.tries : 6; }
        const list = await els();
        const texts = list.map((x) => x.t); const act = list.findIndex((x) => x.active);
        const bad = [];
        if (JSON.stringify(texts) !== JSON.stringify(want)) bad.push(`the elements read ${JSON.stringify(texts)}, want ${JSON.stringify(want)}`);
        if (act !== active) bad.push(`the active element is #${act}, want #${active}`);
        const box = m.collapsed ? await d.box(m.f) : null;
        const v = verify({ exp: { text: m.text, a: m.a, f: m.f }, box, before, early: late, late, errors: d.errors.slice(e0), expect: { noPage: true } });
        for (const f of v.fails) if (f.check !== 'page') bad.push(`${f.check} - ${f.detail}`);
        if (bad.length) { fails.push(`step ${i + 1} ${st.k === 'type' ? 'type ' + JSON.stringify(st.s) : st.k === 'key' ? stepLabel(st) : st.k}: ${bad.join(' | ').slice(0, 520)}`); await d.shot(`${TAG.replace(/\//g, '-')}-${id}-step${i + 1}`); if (fails.length >= 3) break; }
        first = false;
      }
      if (tail) await tail({ pid, want, fails, notes });
    });
    const T = (s) => ({ k: 'type', s }), E = () => ({ k: 'enter' }), K = (key, o = {}) => ({ k: 'key', key, ...o });
    await scriptCase('SC1', 'type a scene heading, Enter, action, Enter, a name, Enter, a line', [T('INT. KITCHEN'), E(), T('She enters.'), E(), T('ANNA'), E(), T('Hello.')]);
    await scriptCase('SC2', 'Enter, Enter, then Backspace on the empty element', [T('One'), E(), E(), K('Backspace')]);
    await scriptCase('SC3', 'type, Backspace twice, type on', [T('Hello'), K('Backspace'), K('Backspace'), T('p')]);
    await scriptCase('SC4', 'type, Home, End, Left, Right inside one element', [T('Hello world'), K('Home'), K('End'), K('ArrowLeft'), K('ArrowRight')]);
    await run('SC5', 'Tab cycles the element type and the text stays', async (fails) => {
      const pid = await openScript(); await d.type('Hello'); await sleep(300);
      const typeOf = () => ev("(() => { const a = document.querySelector('.script-el-active'); return a ? (a.getAttribute('data-t') || a.className) : null; })()");
      const t0 = await typeOf(); await d.key('Tab'); await sleep(400); const t1 = await typeOf(); const e1 = (await els()).map((x) => x.t);
      if (t0 === t1) fails.push(`Tab did not change the element's type (${JSON.stringify(t0)})`);
      if (JSON.stringify(e1) !== JSON.stringify(['Hello'])) fails.push(`after Tab the elements read ${JSON.stringify(e1)}`);
    });
    await run('SC6', 'type two lines and reload AT ONCE (autosave is 2 s): every word survives', async (fails, notes) => {
      const pid = await openScript(); await d.type('INT. ROOM'); await d.key('Enter'); await d.type('Last words typed.');
      await app.reload(); await app.waitFor("!!document.querySelector('.script-el')", { timeout: 20000, label: 'the screenplay after reload' }); await sleep(900);
      const after = (await els()).map((x) => x.t); const st = await storedScript(pid);
      notes.push(`after the reload the elements read ${JSON.stringify(after)}; stored text ${JSON.stringify(st)}`);
      if (!JSON.stringify(after).includes('Last words typed.') || !JSON.stringify(after).includes('INT. ROOM')) fails.push(`WORDS LOST: after typing and reloading at once the screenplay reads ${JSON.stringify(after)}`);
    });
    await run('SC7', 'type two lines, wait 3 s, reload: the lines are there', async (fails) => {
      const pid = await openScript(); await d.type('INT. ROOM'); await d.key('Enter'); await d.type('Saved line.'); await sleep(3200);
      await app.reload(); await app.waitFor("!!document.querySelector('.script-el')", { timeout: 20000, label: 'the screenplay after reload' }); await sleep(900);
      const after = (await els()).map((x) => x.t);
      if (!JSON.stringify(after).includes('Saved line.')) fails.push(`after waiting 3 s and reloading the screenplay reads ${JSON.stringify(after)}`);
    });

    // ====================== THE TUTOR'S BOX ======================
    await run('TU', "the Tutor's question box: open it (the page must not move), type, edit, select, Enter", async (fails, notes) => {
      await d.surface('.forward-only-editor', false);
      await app.evalJs("fetch('/api/_tutor_mode', { method: 'POST', body: JSON.stringify({ configured: true, reply: 'A stubbed reply.' }) })").catch(() => {});
      await ev("localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
      await d.openPage('Hello world', 'drafting', { typewriter: 'off' }); await d.place(11); await sleep(300); await d.still();
      const before = await d.read();
      const grip = await ev("!!document.querySelector('.wz-tutor-grip')");
      if (!grip) { notes.push('no .wz-tutor-grip on the page: the Tutor cannot be opened here'); fails.push('the Tutor opener is not on the page'); return; }
      await ev("document.querySelector('.wz-tutor-grip').click()"); await sleep(600);
      const opened = await ev("!!document.querySelector('.wz-tutor-convo-input')");
      const mid = await d.read();
      const same = before.page && mid.page && ['x', 'y', 'w', 'h'].every((k) => Math.abs(before.page[k] - mid.page[k]) <= 0.6);
      if (!same) fails.push(`opening the Tutor moved or resized the page: ${JSON.stringify(before.page)} -> ${JSON.stringify(mid.page)} (law 1)`);
      if (!opened) { fails.push('the Tutor opened without its question box (.wz-tutor-convo-input)'); return; }
      const SEL = '.wz-tutor-convo-input';
      await ev(`(() => { const i = document.querySelector('${SEL}'); i.focus(); i.setSelectionRange(0, 0); })()`);
      await d.ev('window.__wa.arm()');
      let m = new Model('', 0, 0, 'linux');
      const steps = [{ k: 'type', s: 'What is my theme?' }, { k: 'key', key: 'Home' }, { k: 'type', s: 'So: ' }, { k: 'key', key: 'End' }, { k: 'key', key: 'Backspace' }, { k: 'key', key: 'a', ctrl: true }, { k: 'type', s: 'Why?' }];
      for (let i = 0; i < steps.length; i++) {
        const st = steps[i]; const e0 = d.errors.length;
        m.apply(st); await d.perform(st); await d.frames(); await sleep(250);
        const late = await ev(READ(SEL)); const bad = [];
        if (!late) { bad.push('the question box is gone'); }
        else {
          if (late.value !== m.text) bad.push(`value ${JSON.stringify(late.value)} want ${JSON.stringify(m.text)}`);
          if (late.s !== m.start || late.e !== m.end) bad.push(`selection ${late.s}..${late.e} want ${m.start}..${m.end}`);
          if (!late.focused) bad.push('focus left the box');
          if (m.collapsed && late.focused) {
            const px = await caretByDifference(d, app, SEL);
            if (!px) bad.push('no caret is painted'); else { const dx = px.x - late.expectX; if (Math.abs(dx) > 3.5) bad.push(`caret painted at x ${px.x} but the text puts it at ${late.expectX.toFixed(1)} (off by ${dx.toFixed(1)})`); }
          }
        }
        const errs = d.errors.slice(e0); if (errs.length) bad.push('console: ' + errs[0].slice(0, 120));
        if (bad.length) { fails.push(`step ${i + 1} ${stepLabel(st)}: ${bad.join(' | ')}`); break; }
      }
      const pageText = (await d.read()).text;
      if (pageText !== 'Hello world') fails.push(`typing in the Tutor's box changed the page: ${JSON.stringify(pageText)}`);
      // Enter sends: the box empties and keeps focus (the writer asks again), the page text is untouched
      await ev(`(() => { const i = document.querySelector('${SEL}'); i.focus(); })()`); await d.key('Enter'); await sleep(1200);
      const after = await ev(READ(SEL));
      notes.push(`after Enter the box holds ${after ? JSON.stringify(after.value) : 'nothing (gone)'} focused=${after ? after.focused : 'n/a'}`);
      if (after && after.value !== '') fails.push(`after Enter (send) the box still holds ${JSON.stringify(after.value)}`);
      if (after && !after.focused) fails.push('after Enter (send) focus left the question box');
    });
  });
  const bad = results.filter((r) => !r.pass);
  if (cfg.out) fs.writeFileSync(path.join(cfg.out, `findings-${title}-${TAG.replace(/\//g, '-')}.json`), JSON.stringify({ tag: TAG, cfg, results }, null, 1));
  out(`\nFINDINGS [${TAG}]: ${bad.length} of ${results.length} cases failed${bad.length ? ': ' + bad.map((r) => r.id).join(' ') : ''}`);
  process.exit(env.WA_STRICT === '1' && bad.length ? 1 : 0);
}
