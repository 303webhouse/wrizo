// THE TITLES PASS (writing audit, session 4; Fable's order, Nov 10): the text boxes a writer types a NAME into. A page's title is not one (it is the first line of the page: PageEditor `pageTitle = firstLine(text)`), so the
// surfaces are the BOARD's title (the breadcrumb's rename input, BoardEditor.tsx, `.crumb-rename`) and a DRAWER's name (DrawersTree.tsx, `.dz-rename`). Both are plain <input>s: Enter or blur commits, Escape reverts, an empty name reverts.
// Model: the same Model as the Page (model.mjs), one line, the selection as selectionStart/End. After EVERY step: value, selection, focus, console, and where the caret is DRAWN (the painted caret from pixels, against x computed
// from the input's own font by canvas measureText - not from the app). A commit step also checks the displayed name, and after a reload that the stored name is the committed one. FINDS AND REPORTS; FIXES NOTHING.
// Knobs (env): WA_THEME WA_FLAG WA_TONE WA_W WA_H WA_ONLY WA_OUT WA_STRICT
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './driver.mjs';
import { Model, stepLabel } from './model.mjs';

const K = (key, o = {}) => ({ k: 'key', key, ...o });
const T = (s) => ({ k: 'type', s });
const C = (via) => ({ k: 'commit', via });
const NAME = 'Audit title';
const c = (id, name, steps, extra = {}) => ({ id, name, steps, ...extra });

export const TITLE_CASES = [
  c('TT01', 'Type at the end, then Enter commits', [T(' two'), C('Enter')]),
  c('TT02', 'Backspace four times, then Enter', [K('Backspace'), K('Backspace'), K('Backspace'), K('Backspace'), C('Enter')]),
  c('TT03', 'Home, type at the start, then Enter', [K('Home'), T('My '), C('Enter')]),
  c('TT04', 'Shift+Left three times, type over the selection, Enter', [K('ArrowLeft', { shift: true }), K('ArrowLeft', { shift: true }), K('ArrowLeft', { shift: true }), T('XY'), C('Enter')]),
  c('TT05', 'Ctrl+A, type a new name, Enter', [K('a', { ctrl: true }), T('Fresh'), C('Enter')]),
  c('TT06', 'Type, then Escape reverts to the old name', [T(' zzz'), C('Escape')]),
  c('TT07', 'Clear the name, then Enter keeps the old one', [K('a', { ctrl: true }), K('Backspace'), C('EnterEmpty')]),
  c('TT08', 'Delete at the start, arrows, type in the middle', [K('Home'), K('Delete'), K('Delete'), K('ArrowRight'), K('ArrowRight'), K('ArrowLeft'), T('Q'), C('Enter')]),
  c('TT09', 'An accented letter and an emoji', [T('Café 😀'), K('ArrowLeft'), K('Backspace'), C('Enter')]),
  c('TT10', 'A long name scrolls the box (the caret must follow)', [T('x'.repeat(70)), K('Home'), K('End'), K('ArrowLeft'), K('ArrowLeft'), C('Enter')]),
  c('TT11', 'Enter in the middle of the name commits the whole name', [K('Home'), K('ArrowRight'), K('ArrowRight'), C('Enter')]),
  c('TT12', 'Commit, reload, the name is still there', [T(' v2'), C('Enter'), C('Reload')]),
  c('TT13', 'Blur (click away) commits', [T(' b'), C('Blur')]),
  c('TT14', 'A name over 60 characters: commit, then open the rename again - is the whole name still in the box?', [T('x'.repeat(70)), C('Enter'), C('Reopen')]),
];

const READ = (sel) => `(() => { const i = document.querySelector(${JSON.stringify(sel)}); if (!i) return null; const cs = getComputedStyle(i), r = i.getBoundingClientRect();
  const cv = document.createElement('canvas').getContext('2d'); cv.font = cs.font;
  const w = (n) => cv.measureText(i.value.slice(0, n)).width + (cs.letterSpacing && cs.letterSpacing !== 'normal' ? parseFloat(cs.letterSpacing) * n : 0);
  const x = r.left + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.paddingLeft) || 0) + w(i.selectionStart) - i.scrollLeft;
  return { value: i.value, s: i.selectionStart, e: i.selectionEnd, focused: document.activeElement === i, rect: { x: r.left, y: r.top, w: r.width, h: r.height }, expectX: x, scrollLeft: i.scrollLeft, view: { w: innerWidth, h: innerHeight } }; })()`;

// the caret of an <input> as painted: a frame with the caret, a frame with its colour made transparent (inline, !important), the difference between them
async function caretByDifference(d, app, sel, tries = 6) {
  for (let i = 0; i < tries; i++) {
    const A = await app.cdp('Page.captureScreenshot', { format: 'png' });
    await d.ev(`document.querySelector(${JSON.stringify(sel)}).style.setProperty('caret-color', 'transparent', 'important')`);
    await sleep(60);
    const B = await app.cdp('Page.captureScreenshot', { format: 'png' });
    await d.ev(`document.querySelector(${JSON.stringify(sel)}).style.removeProperty('caret-color')`);
    const r = await d.ev(`window.__wa.diff(${JSON.stringify(A.data)}, ${JSON.stringify(B.data)})`);
    if (r && r.width <= 8) return r;
    await sleep(110);
  }
  return null;
}

export async function main({ title }) {
  const env = process.env;
  const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
  if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
  const TAGB = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
  const only = env.WA_ONLY ? new Set(env.WA_ONLY.split(',').map((s) => s.trim())) : null;
  if (cfg.out) fs.mkdirSync(cfg.out, { recursive: true });
  const out = (s) => console.log(s);
  const cases = [], findings = [];

  try {
    await withHarness(async (app) => {
      const d = makeDriver(app, cfg);
      out(`WRITING AUDIT ${title} [${TAGB}] (${new Date().toISOString()})`);
      await d.boot();
      const ev = d.ev;
      const inputCaret = (sel) => caretByDifference(d, app, sel);
      const SURF = {
        board: {
          label: 'board title', sel: '.crumb-rename',
          async open() {
            const id = `wa-title-${Date.now().toString(36)}`;
            await ev(`location.hash = '#/'`); await sleep(150);
            await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: NAME, pageType: 'board', origin: 'loose', source: 'page', createdAt: new Date().toISOString(), boxes: [] })})`);
            await ev(`location.hash = '#/page/${id}'`);
            await d.waitForSel('.crumb-rename-btn', 15000);
            await sleep(500);
            await ev("document.querySelector('.crumb-rename-btn').click()");
            await d.waitForSel('.crumb-rename', 5000);
            return id;
          },
          shown: () => ev("(document.querySelector('.crumb-rename-btn') || {}).textContent || null"),
          async reopen() { await ev("document.querySelector('.crumb-rename-btn').click()"); await sleep(300); },
        },
        drawer: {
          label: 'drawer name', sel: '.dz-rename',
          async open() {
            await ev(`location.hash = '#/'`); await sleep(150);
            await ev(`window.wrizoCreateDrawer(${JSON.stringify(NAME)})`);
            await ev(`location.hash = '#/drawers'`);
            await d.waitForSel('.dz-menu-btn', 15000);
            await sleep(500);
            await ev("document.querySelector('.dz-menu-btn').click()");
            await sleep(150);
            await ev("[...document.querySelectorAll('.dz-menu-item')].find((b) => b.textContent.trim() === 'Rename').click()");
            await d.waitForSel('.dz-rename', 5000);
            return null;
          },
          shown: () => ev("(document.querySelector('.dz-name') || {}).textContent || null"),
          async reopen() { await ev("document.querySelector('.dz-menu-btn').click()"); await sleep(150); await ev("[...document.querySelectorAll('.dz-menu-item')].find((b) => b.textContent.trim() === 'Rename').click()"); await sleep(300); },
        },
      };
      d.waitForSel = (sel, t) => app.waitFor(`!!document.querySelector(${JSON.stringify(sel)})`, { timeout: t, label: sel });

      for (const [sk, S] of Object.entries(SURF)) {
        const TAG = `${TAGB}/${sk}`;
        for (const cs of TITLE_CASES) {
          if (only && !only.has(cs.id)) continue;
          const rec = { id: cs.id, name: cs.name, tag: TAG, steps: [], fail: null, fails: [] };
          try {
            await S.open();
            await d.ev('window.__wa.arm()');
            let r0 = await ev(READ(S.sel));
            if (!r0) throw new Error('the rename input did not open');
            // stage the start: the whole name, the caret at its end (the browser's own state on opening is read, not assumed)
            await ev(`(() => { const i = document.querySelector(${JSON.stringify(S.sel)}); i.focus(); i.setSelectionRange(i.value.length, i.value.length); })()`);
            let m = new Model(r0.value, r0.value.length, r0.value.length, 'linux');
            const oldName = r0.value;
            rec.start = r0.value;
            for (let i = 0; i < cs.steps.length; i++) {
              const st = cs.steps[i];
              const e0 = d.errors.length;
              const fails = [];
              if (st.k === 'type' || st.k === 'key') {
                m.apply(st);
                await d.perform(st);
                await d.frames(); const early = await ev(READ(S.sel)); await sleep(250);
                const late = await ev(READ(S.sel));
                if (!late) fails.push({ check: 'focus', detail: 'the rename input is gone' });
                else {
                  if (late.value !== m.text) fails.push({ check: 'text', detail: `value ${JSON.stringify(late.value)} want ${JSON.stringify(m.text)}` });
                  if (late.s !== m.start || late.e !== m.end) fails.push({ check: 'caret', detail: `selection ${late.s}..${late.e} want ${m.start}..${m.end}` });
                  if (!late.focused) fails.push({ check: 'focus', detail: 'focus left the input' });
                  if (early && (early.s !== late.s || early.e !== late.e || early.value !== late.value)) fails.push({ check: 'settled', detail: `after 2 frames ${early.s}..${early.e} ${JSON.stringify(early.value)}; settled ${late.s}..${late.e}` });
                  if (m.collapsed && late.focused) {
                    const px = await inputCaret(S.sel);
                    if (!px) fails.push({ check: 'drawn', detail: 'no caret is painted anywhere on screen' });
                    else {
                      const dx = px.x - late.expectX, cy = px.top + px.height / 2, inY = cy >= late.rect.y - 2 && cy <= late.rect.y + late.rect.h + 2;
                      if (Math.abs(dx) > 3.5 || !inY) fails.push({ check: 'drawn', detail: `caret painted at ${px.x},${px.top} but the text puts it at x ${late.expectX.toFixed(1)} inside the box (${Math.round(late.rect.x)},${Math.round(late.rect.y)} ${Math.round(late.rect.w)}x${Math.round(late.rect.h)}); off by ${dx.toFixed(1)}` });
                    }
                  }
                }
                rec.steps.push(stepLabel(st));
              } else if (st.k === 'commit') {
                rec.steps.push(`commit ${st.via}`);
                const want = st.via === 'Escape' || st.via === 'EnterEmpty' ? oldName : m.text.trim() === '' ? oldName : m.text.trim();
                if (st.via === 'Enter' || st.via === 'EnterEmpty') await d.key('Enter');
                else if (st.via === 'Escape') await d.key('Escape');
                else if (st.via === 'Blur') await d.click(40, d.cfg.height - 40, 1);
                if (st.via === 'Reopen') {
                  // the rename opens on the name AS DISPLAYED: if that is cut, committing it again silently shortens the stored name
                  await S.reopen();
                  const r1 = await ev(READ(S.sel));
                  const full = m.text;
                  if (!r1) fails.push({ check: 'focus', detail: 'the rename input did not open again' });
                  else if (r1.value !== full) fails.push({ check: 'text', detail: `the rename box opens on ${JSON.stringify(r1.value.slice(0, 80))} (${r1.value.length} characters) but the name that was committed has ${full.length}: committing it again would cut the stored name` });
                } else if (st.via !== 'Reload') {
                  await sleep(500);
                  const gone = !(await ev(READ(S.sel)));
                  const shown = (await S.shown()) || '';
                  if (!gone) fails.push({ check: 'focus', detail: `the rename input is still open after ${st.via}` });
                  const shownWant = (sk === 'board' && want.length > 60) ? want.slice(0, 60) : want;   // the DISPLAY is cut at 60 (boardName); what the rename box then holds is the Reopen check
                  if (shown.trim() !== shownWant) fails.push({ check: 'text', detail: `after ${st.via} the name shows ${JSON.stringify(shown.trim())} want ${JSON.stringify(want)}` });
                  m.text = want; oldName2 = want;
                } else {
                  await ev('window.wrizoFlushNow && window.wrizoFlushNow()');
                  await app.reload(); await sleep(1500);
                  await d.waitForSel(sk === 'board' ? '.crumb-rename-btn' : '.dz-name', 15000).catch(() => {});
                  const shown = ((await S.shown()) || '').trim();
                  if (shown !== m.text.trim()) fails.push({ check: 'text', detail: `after a reload the name shows ${JSON.stringify(shown)} want ${JSON.stringify(m.text.trim())}` });
                }
              }
              const errs = d.errors.slice(e0);
              if (errs.length) fails.push({ check: 'console', detail: errs.slice(0, 2).join(' | ').slice(0, 200) });
              if (fails.length) { rec.fail = { step: i + 1, label: rec.steps[rec.steps.length - 1], fails }; rec.fails.push(rec.fail); rec.shot = await d.shot(`${TAG.replace(/\//g, '-')}-${cs.id}-step${i + 1}`); break; }
            }
          } catch (e) { rec.fail = { step: -1, label: 'harness', fails: [{ check: 'harness', detail: String((e && e.stack) || e).split('\n').slice(0, 3).join(' | ') }] }; rec.fails.push(rec.fail); }
          cases.push(rec);
          if (rec.fail) { findings.push(rec); out(`FAIL  ${cs.id} ${cs.name} [${TAG}]: step ${rec.fail.step} (${rec.fail.label}): ${rec.fail.fails.map((x) => `${x.check} - ${x.detail}`).join(' || ')}`); }
          else out(`PASS  ${cs.id} ${cs.name} [${TAG}] (${rec.steps.join(' > ')})`);
        }
      }
    });
  } catch (err) { out(`FAIL  the run reached its end  [${String((err && err.stack) || err).split('\n').slice(0, 4).join(' | ')}]`); process.exitCode = 1; }
  if (cfg.out) fs.writeFileSync(path.join(cfg.out, `findings-${title}-${TAGB.replace(/\//g, '-')}.json`), JSON.stringify({ tag: TAGB, cfg, cases: cases.map((x) => ({ id: x.id, name: x.name, tag: x.tag, pass: !x.fail, steps: x.steps })), findings }, null, 1));
  out(`\nFINDINGS [${TAGB}]: ${findings.length} of ${cases.length} cases failed${findings.length ? ': ' + findings.map((f) => `${f.tag.split('/').pop()}:${f.id}`).join(' ') : ''}`);
  process.exit(process.exitCode || (env.WA_STRICT === '1' && findings.length ? 1 : 0));
}
let oldName2 = '';
