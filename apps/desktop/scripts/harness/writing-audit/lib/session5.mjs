// SESSION 5 (writing audit; Fable, Nov 11): UNDO AND REDO, THE CLIPBOARD, FORMATTING, SAVE AND RELOAD on the Draft page. FINDS AND REPORTS; FIXES NOTHING.
// These are not per-step model checks like the caret passes: each case states a PROPERTY a writer relies on and reads the page against it.
//   UNDO/REDO  every state an undo chain visits was a state the page really had (a prefix of what was typed, for typing); the chain reaches the empty page; redo retraces it exactly and ends on the original text, caret at the end;
//              undo of a single Enter / Backspace / overtype / format returns the text before it, and redo returns the text after it; after each, the caret is DRAWN where the selection says (the painted caret)
//   CLIPBOARD  copy, cut, paste with Wrizo's own words (own ink passes the voice wall); several paragraphs; over a selection; a FOREIGN paste is recorded as observed (whether it enters or is blocked), not judged
//   FORMAT     Ctrl+B / Ctrl+I / Ctrl+U wrap the selection in the page's own markers (`**`, `*`, `__`), toggling again unwraps; a mark on a collapsed caret holds the next typed text; undo returns the plain text
//   SAVE       type, wait, reload: the text is there; type and reload AT ONCE (the debounced save must not lose the last words); a trailing Enter survives the reload
// Knobs (env): WA_THEME WA_FLAG WA_TONE WA_W WA_H WA_ONLY WA_OUT WA_STRICT
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './driver.mjs';
import { verify } from './verify.mjs';

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
    const ctrl = (k, o = {}) => d.key(k, { ctrl: true, ...o });
    const undo = () => ctrl('z'), redo = () => ctrl('z', { shift: true });
    const open = async (text = '', at = null) => { await d.surface('.forward-only-editor', false); const id = await d.openPage(text, 'drafting', { typewriter: 'off' }); await d.place(at === null ? text.length : at); await sleep(200); return id; };
    const settle = async () => { await d.frames(); await sleep(300); const r = await d.read(); return r; };
    const withCaretDrawn = async (label) => {
      // the page after the step, judged for focus, page rect, console and where the caret is PAINTED against where the selection is
      const late = await settle();
      if (late.collapsed && late.focused && !(late.theme === 'flux' && late.fluxCaret)) { const px = await d.pixelCaret(6); late.px = px; late.pxTries = px ? px.tries : 6; }
      const box = late.collapsed ? await d.box(late.focus) : null;
      const v = verify({ exp: { text: late.text, a: late.anchor, f: late.focus }, box, before: late, early: late, late, errors: [] });
      return { late, drawn: v.fails.filter((f) => f.check === 'drawn' || f.check === 'focus').map((f) => `${label}: ${f.check} - ${f.detail}`) };
    };
    const record = (id, name, fails, notes = []) => { results.push({ id, name, pass: !fails.length, fails, notes }); out(`${fails.length ? 'FAIL' : 'PASS'}  ${id} ${name} [${TAG}]${fails.length ? ': ' + fails.join(' || ').slice(0, 900) : ''}${notes.length ? '  notes: ' + notes.join('; ').slice(0, 300) : ''}`); };
    const run = async (id, name, fn) => { if (only && !only.has(id)) return; const e0 = d.errors.length; const fails = [], notes = []; try { await fn(fails, notes); } catch (e) { fails.push('harness: ' + String((e && e.message) || e).slice(0, 200)); } if (d.errors.length > e0) fails.push('console: ' + d.errors.slice(e0, e0 + 2).join(' | ').slice(0, 200)); if (fails.length) await d.shot(`${TAG.replace(/\//g, '-')}-${id}`); record(id, name, fails, notes); };

    // ---------------- UNDO / REDO ----------------
    const chain = async (press, limit = 40) => { const seen = []; let same = 0; let last = (await d.read()).text; for (let i = 0; i < limit && same < 3; i++) { await press(); await sleep(120); const t = (await d.read()).text; if (t === last) same++; else { same = 0; seen.push(t); last = t; } } return seen; };
    await run('U1', 'undo walks back through a typed sentence to the empty page; redo retraces it exactly', async (fails) => {
      await open('', 0); await d.type('one two three'); const full = (await settle()).text;
      if (full !== 'one two three') fails.push(`staging: the page holds ${JSON.stringify(full)}`);
      const down = await chain(undo);
      if (down[down.length - 1] !== '') fails.push(`undo cannot reach the empty page: it stops at ${JSON.stringify(down[down.length - 1] ?? full)} after ${down.length} step(s)`);
      const alien = down.filter((t) => !full.startsWith(t)); if (alien.length) fails.push(`undo showed text the page never held: ${JSON.stringify(alien[0])}`);
      const up = await chain(redo); const last = (await d.read());
      if (last.text !== full) fails.push(`redo ends on ${JSON.stringify(last.text)}, not the original ${JSON.stringify(full)}`);
      const want = [...down.slice(0, -1)].reverse().concat([full]);
      if (JSON.stringify(up) !== JSON.stringify(want)) fails.push(`redo does not retrace undo: undo visited ${JSON.stringify(down)}, redo visited ${JSON.stringify(up)}`);
      if (last.focus !== full.length) fails.push(`after redo the caret is at ${last.focus}, not the end (${full.length})`);
    });
    await run('U2', 'undo of one Enter returns the text before it; redo returns it', async (fails) => {
      await open('', 0); await d.type('Hello'); await settle(); await d.key('Enter'); const a = await settle();
      await undo(); const b = await withCaretDrawn('after undo'); await redo(); const c = await withCaretDrawn('after redo');
      if (a.text !== 'Hello\n') fails.push(`staging: ${JSON.stringify(a.text)}`);
      if (b.late.text !== 'Hello') fails.push(`undo of Enter gives ${JSON.stringify(b.late.text)}, want "Hello"`);
      if (c.late.text !== 'Hello\n') fails.push(`redo gives ${JSON.stringify(c.late.text)}, want "Hello\\n"`);
      if (b.late.focus !== 5) fails.push(`after undo the caret is at ${b.late.focus}, want 5`);
      fails.push(...b.drawn, ...c.drawn);
    });
    await run('U3', 'undo of Backspace returns the deleted letter; redo deletes it again', async (fails) => {
      await open('Hello world'); await d.key('Backspace'); const a = await settle(); await undo(); const b = await withCaretDrawn('after undo'); await redo(); const c = await withCaretDrawn('after redo');
      if (a.text !== 'Hello worl') fails.push(`staging: ${JSON.stringify(a.text)}`);
      if (b.late.text !== 'Hello world') fails.push(`undo gives ${JSON.stringify(b.late.text)}`);
      if (c.late.text !== 'Hello worl') fails.push(`redo gives ${JSON.stringify(c.late.text)}`);
      fails.push(...b.drawn, ...c.drawn);
    });
    await run('U4', 'undo of typing over a selection restores the selected words', async (fails) => {
      await open('Hello world', 0); await d.place(0, 5); await d.type('Bye'); const a = await settle(); await undo(); const b = await withCaretDrawn('after undo'); await redo(); const c = await withCaretDrawn('after redo');
      if (a.text !== 'Bye world') fails.push(`staging: ${JSON.stringify(a.text)}`);
      if (b.late.text !== 'Hello world') fails.push(`undo gives ${JSON.stringify(b.late.text)}`);
      if (c.late.text !== 'Bye world') fails.push(`redo gives ${JSON.stringify(c.late.text)}`);
      fails.push(...b.drawn, ...c.drawn);
    });
    await run('U5', 'undo of an Enter in the middle of a line rejoins it, caret where it was', async (fails) => {
      await open('Hello world', 5); await d.key('Enter'); const a = await settle(); await undo(); const b = await withCaretDrawn('after undo'); await redo(); const c = await withCaretDrawn('after redo');
      if (a.text !== 'Hello\n world') fails.push(`staging: ${JSON.stringify(a.text)}`);
      if (b.late.text !== 'Hello world') fails.push(`undo gives ${JSON.stringify(b.late.text)}`);
      if (b.late.focus !== 5) fails.push(`after undo the caret is at ${b.late.focus}, want 5`);
      if (c.late.text !== 'Hello\n world') fails.push(`redo gives ${JSON.stringify(c.late.text)}`);
      fails.push(...b.drawn, ...c.drawn);
    });
    await run('U6', 'undo of a format returns the plain text', async (fails) => {
      await open('Hello big world', 0); await d.place(6, 9); await ctrl('b'); const a = await settle(); await undo(); const b = await withCaretDrawn('after undo'); await redo(); const c = await withCaretDrawn('after redo');
      if (a.text !== 'Hello **big** world') fails.push(`staging: bold gave ${JSON.stringify(a.text)}`);
      if (b.late.text !== 'Hello big world') fails.push(`undo gives ${JSON.stringify(b.late.text)}`);
      if (c.late.text !== 'Hello **big** world') fails.push(`redo gives ${JSON.stringify(c.late.text)}`);
      fails.push(...b.drawn, ...c.drawn);
    });

    // ---------------- CLIPBOARD ----------------
    await app.cdp('Browser.grantPermissions', { permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] }).catch(() => {});
    await run('C1', 'copy everything, paste at the end: the words appear twice', async (fails) => {
      await open('hello'); await ctrl('a'); await ctrl('c'); await ctrl('End'.length ? 'End' : 'End'); await sleep(80); await ctrl('v'); const a = await withCaretDrawn('after paste');
      if (a.late.text !== 'hellohello') fails.push(`the page holds ${JSON.stringify(a.late.text)}, want "hellohello"`);
      if (a.late.focus !== 10) fails.push(`the caret is at ${a.late.focus}, want 10`);
      fails.push(...a.drawn);
    });
    await run('C2', 'cut everything, then paste it back', async (fails) => {
      await open('hello world'); await ctrl('a'); await ctrl('x'); const a = await settle(); await ctrl('v'); const b = await withCaretDrawn('after paste');
      if (a.text !== '') fails.push(`after the cut the page holds ${JSON.stringify(a.text)}, want ""`);
      if (b.late.text !== 'hello world') fails.push(`after the paste the page holds ${JSON.stringify(b.late.text)}, want "hello world"`);
      fails.push(...b.drawn);
    });
    await run('C3', 'copy two paragraphs and paste them at the end', async (fails) => {
      await open('a\nb'); await ctrl('a'); await ctrl('c'); await ctrl('End'); await ctrl('v'); const a = await withCaretDrawn('after paste');
      if (a.late.text !== 'a\nba\nb') fails.push(`the page holds ${JSON.stringify(a.late.text)}, want "a\\nba\\nb"`);
      if (a.late.focus !== 5) fails.push(`the caret is at ${a.late.focus}, want 5`);
      fails.push(...a.drawn);
    });
    await run('C4', 'paste over a selection replaces it', async (fails) => {
      await open('Hello world', 0); await d.place(6, 11); await ctrl('c'); await d.place(0, 5); await ctrl('v'); const a = await withCaretDrawn('after paste');
      if (a.late.text !== 'world world') fails.push(`the page holds ${JSON.stringify(a.late.text)}, want "world world"`);
      fails.push(...a.drawn);
    });
    await run('C5', 'a paste from OUTSIDE the app (observed, not judged)', async (fails, notes) => {
      await open('Own words. ', 11); await app.evalJs("navigator.clipboard.writeText('foreign words from elsewhere')").catch(() => notes.push('the clipboard could not be filled'));
      await sleep(150); await ctrl('v'); const a = await settle();
      notes.push(`after a foreign paste the page holds ${JSON.stringify(a.text)} (${a.text.includes('foreign') ? 'it entered' : 'it was blocked'})`);
      if (a.text.length < 'Own words. '.length) fails.push(`text was lost by the paste: ${JSON.stringify(a.text)}`);
    });

    // ---------------- FORMAT ----------------
    for (const [id, key, mark, name] of [['F1', 'b', '**', 'bold'], ['F2', 'i', '*', 'italic'], ['F3', 'u', '__', 'underline']]) {
      await run(id, `${name} wraps the selection in ${mark} and a second press unwraps it`, async (fails) => {
        await open('Hello big world', 0); await d.place(6, 9); await ctrl(key); const a = await withCaretDrawn('after wrap'); await ctrl(key); const b = await withCaretDrawn('after unwrap');
        if (a.late.text !== `Hello ${mark}big${mark} world`) fails.push(`wrapping gives ${JSON.stringify(a.late.text)}`);
        if (b.late.text !== 'Hello big world') fails.push(`the second press gives ${JSON.stringify(b.late.text)}, want the plain text back`);
        fails.push(...a.drawn, ...b.drawn);
      });
    }
    await run('F4', 'a bold mark on an empty caret holds the next typed text', async (fails) => {
      await open('Hi ', 3); await ctrl('b'); await d.type('x'); const a = await withCaretDrawn('after typing');
      if (a.late.text !== 'Hi **x**') fails.push(`the page holds ${JSON.stringify(a.late.text)}, want "Hi **x**"`);
      fails.push(...a.drawn);
    });
    await run('F5', 'bold a word, move to the end, Enter, type: the new line is plain', async (fails) => {
      await open('Hello big world', 0); await d.place(6, 9); await ctrl('b'); await ctrl('End'); await d.key('Enter'); await d.type('y'); const a = await withCaretDrawn('after typing');
      if (a.late.text !== 'Hello **big** world\ny') fails.push(`the page holds ${JSON.stringify(a.late.text)}, want "Hello **big** world\\ny"`);
      fails.push(...a.drawn);
    });

    // ---------------- SAVE AND RELOAD ----------------
    const reloadRead = async () => { await app.reload(); await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 20000, label: 'the editor after the reload' }); await sleep(900); await d.surface('.forward-only-editor', false); return d.read(); };
    await run('S1', 'type, wait for the save, reload: the text is there', async (fails) => {
      await open('', 0); await d.type('Saved text'); await sleep(1800); const r = await reloadRead();
      if (r.text !== 'Saved text') fails.push(`after the reload the page holds ${JSON.stringify(r.text)}`);
    });
    await run('S2', 'type and reload AT ONCE: the last words are not lost', async (fails) => {
      await open('', 0); await d.type('Reload at once'); const r = await reloadRead();
      if (r.text !== 'Reload at once') fails.push(`after typing and reloading at once the page holds ${JSON.stringify(r.text)}`);
    });
    await run('S3', 'two lines and reload at once: both lines survive', async (fails) => {
      await open('', 0); await d.type('line one'); await d.key('Enter'); await d.type('line two'); const r = await reloadRead();
      if (r.text !== 'line one\nline two') fails.push(`after the reload the page holds ${JSON.stringify(r.text)}`);
    });
    await run('S4', 'a trailing Enter survives a reload', async (fails) => {
      await open('', 0); await d.type('abc'); await d.key('Enter'); await sleep(1500); const r = await reloadRead();
      if (r.text !== 'abc\n') fails.push(`after the reload the page holds ${JSON.stringify(r.text)}, want "abc\\n"`);
    });
    await run('S5', 'edit a saved page, reload at once: the edit is kept', async (fails) => {
      await open('Existing page text', 18); await d.type(' plus more'); const r = await reloadRead();
      if (r.text !== 'Existing page text plus more') fails.push(`after the reload the page holds ${JSON.stringify(r.text)}`);
    });
  });
  const bad = results.filter((r) => !r.pass);
  if (cfg.out) fs.writeFileSync(path.join(cfg.out, `findings-${title}-${TAG.replace(/\//g, '-')}.json`), JSON.stringify({ tag: TAG, cfg, results }, null, 1));
  out(`\nFINDINGS [${TAG}]: ${bad.length} of ${results.length} cases failed${bad.length ? ': ' + bad.map((r) => r.id).join(' ') : ''}`);
  process.exit(env.WA_STRICT === '1' && bad.length ? 1 : 0);
}
