// SCRIPT, THE SCREENWRITING REVIEW (Fable's brief, Nov 22: claude/screenwriting-review-brief.md). One writer's session on the screenplay page and the reorg around it.
// FINDS AND REPORTS; FIXES NOTHING. No account, no secrets: the harness's own auth double and the app's seeding seams. Runs on GitHub Actions through writing-audit.yml.
//   gh workflow run writing-audit.yml --ref audit/writing-reorg -f ref=<full sha of review/screenwriting> -f script=sr-session.mjs -f configs=machina/off/light/1366,plateau/off/dark/1366,flux/off/light/1920
// Verdicts: OK (as a pro expects) / FAIL (a break, with what was expected and what happened) / MISSING (no such feature) / INFO (a reading) / NOTCOVERED (the harness could not reach it: never a finding).
// The expectations quote Final Draft 13's own User Guide where it states the rule (sections named in the report).
process.env.WS_REORG = '1';   // lift the harness's driver pin: this run reads the build's DEFAULT reorg state, with no ?reorg=1
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'machina', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
const TAG = `${THEMES[cfg.theme].label}/${cfg.tone}/${cfg.width}`;
const only = env.WA_ONLY ? new Set(env.WA_ONLY.split(',').map((s) => s.trim())) : null;
const R = [];
const out = (s) => console.log(s);
const rec = (id, title, expected, got, verdict) => {
  R.push({ id, title, expected, got, verdict });
  out(`${verdict === 'BREAK' ? 'FAIL' : verdict} ${id} ${title} :: expected ${JSON.stringify(expected)} :: got ${JSON.stringify(got).slice(0, 900)}`);
};
const judge = (id, title, expected, got, pass) => rec(id, title, expected, got, pass ? 'OK' : 'BREAK');

const NUM = { scene: 1, action: 2, character: 3, paren: 4, dialogue: 5, transition: 6, shot: 7, general: 8 };
const T = { s: 'scene', a: 'action', c: 'character', p: 'paren', d: 'dialogue', t: 'transition', h: 'shot', g: 'general' };

// the short the panel writes: original, three locations, a speech that crosses a page, two people talking over each other, a shot, transitions
const SPIN_CYCLE = [
  ['t', 'FADE IN:'],
  ['s', 'int. suds & duds laundromat - night'],
  ['a', 'Twenty washers, one working light. The dryers tick as they cool. Rain runs down a window lettered backwards from this side.'],
  ['a', 'MARA (58, reading glasses on a shoelace) feeds quarters into a coffee can, counting under her breath. She has done this every night for nineteen years and it shows in her thumbs.'],
  ['a', 'The door bangs. THEO (31, a good coat, wet) backs in dragging a black garbage bag. He looks at the machines as if one of them might explain itself.'],
  ['c', 'mara'],
  ['d', 'We close at eleven.'],
  ['c', 'theo'],
  ['d', 'It says twenty-four hours.'],
  ['c', 'mara'],
  ['p', 'not looking up'],
  ['d', 'It said a lot of things in 1994.'],
  ['a', 'Theo hauls the bag to the nearest washer and opens it. Shirts. Dozens, all white, all the same collar. He lifts one out and holds it a moment too long.'],
  ['c', 'theo'],
  ['d', 'How much soap do you use for, like, a lot of shirts?'],
  ['a', 'Mara finally looks. At the shirts, then at him. She takes off her glasses.'],
  ['c', 'mara'],
  ['d', 'Whose are they?'],
  ['c', 'theo'],
  ['d', 'Mine.'],
  ['c', 'mara'],
  ['d', 'You wear a sixteen neck like I wear a tiara.'],
  ['a', 'He almost laughs. It goes wrong halfway up. He sits down on the folding table, the shirt still in his hands.'],
  ['c', 'theo'],
  ['d', 'My dad. Tuesday. My sister wants them gone by the weekend, she has a guy coming for the furniture, and I said I would take care of the clothes because it was the one thing nobody was fighting about.'],
  ['c', 'mara'],
  ['d', 'So you are washing them.'],
  ['c', 'theo'],
  ['d', 'They smell like him. I thought if I gave them away smelling like him that would be strange for whoever got them.'],
  ['a', 'Mara comes around the counter. She takes the shirt, turns the collar out, and reads it with her thumb the way some people read a face.'],
  ['c', 'mara'],
  ['d', 'Starch. Every week, somebody starched these by hand. You do not see that.'],
  ['c', 'theo'],
  ['d', 'He did it himself. Sunday nights, with the game on. After my mom. He never said a word about it, he just learned how, and every Monday morning of my life that man walked out of the house looking like a bank.'],
  ['a', 'She lays the shirt flat on the table and smooths it. Neither of them says anything for a while. A dryer ticks.'],
  ['c', 'mara'],
  ['d', "I am going to tell you something and you are going to think it is about laundry. My husband drove a bread truck for thirty-one years. When he went I had every uniform he ever owned in the back of that closet, and I did exactly what you are doing. I brought them here, to my own place, at two in the morning, so nobody would see. I put them in number six because number six runs hot. And I stood right there with my hand on the lid and I could not close it. Forty minutes I stood there. Because the second that water comes in, that is the last of him that is in the room, and you do not get it back, and there is no one to complain to. So here is what nobody told me. You do not have to do them all. You pick one. You keep one that you never wash, you put it in a plastic bag, you put the bag in a drawer, and maybe once a year when it is bad you open it up. The rest of them are just shirts. The rest of them can go and keep some other man warm, and he will never know he is walking around in all that Sunday night. That is not you throwing your father away. That is the only way I ever found to carry it."],
  ['a', 'Theo does not move. Then he reaches into the bag, goes through the shirts one at a time, and draws out the oldest: the collar frayed, a small brown scorch by the placket.'],
  ['c', 'theo'],
  ['d', 'This one. He burned it the first time he tried.'],
  ['c', 'mara'],
  ['d', 'That is the one.'],
  ['h', 'angle on the coffee can'],
  ['a', 'She tips it toward him. He takes out four quarters. She closes his hand around them.'],
  ['c', 'mara'],
  ['d', 'Number six.'],
  ['t', 'dissolve to:'],
  ['s', 'int. suds & duds laundromat - later'],
  ['a', 'Number six churns, white on white. Theo and Mara sit side by side on the plastic chairs watching it the way people watch a fire. The one shirt lies folded on his knee, in a dry cleaning bag she found somewhere.'],
  ['c', 'theo'],
  ['d', 'Does it get better?'],
  ['c', 'mara'],
  ['d', 'No.'],
  ['a', 'He nods. She pats his knee twice, hard, like a horse.'],
  ['c', 'mara'],
  ['d', 'It gets folded.'],
  ['a', 'They both talk at once, the way people do when the worst of it is over:'],
  ['c', 'theo'],
  ['d', 'What do I owe you for the soap?'],
  ['c', 'mara'],
  ['d', 'You owe me for the soap.'],
  ['a', 'The washer shudders into its spin. The whole row of machines hums along with it, and for a moment the place sounds almost like a choir.'],
  ['t', 'cut to:'],
  ['s', 'ext. suds & duds laundromat - dawn'],
  ['a', 'The rain has quit. The sky over the parking lot is the color of dishwater. Theo comes out with the garbage bag over his shoulder, lighter now, full of clean shirts, and the one in its plastic tucked inside his good coat.'],
  ['a', 'At the curb there is a donation bin, dented, painted green. He stops in front of it. He looks back.'],
  ['a', 'Through the backwards letters on the window, Mara is already wiping down number six. She does not wave. She lifts the rag about an inch.'],
  ['a', 'Theo opens the bin and starts feeding the shirts in, one at a time, each one folded first.'],
  ['g', 'Note: hold on the bin until the last shirt.'],
  ['t', 'fade out.'],
];

let n = 0;
const toDoc = (els, id) => {
  const scenes = [];
  els.forEach(([t, x], i) => {
    const el = { id: `${id}-e${i}`, t, text: x };
    if (t === 'scene' || scenes.length === 0) {
      if (t === 'scene') scenes.push({ id: el.id, heading: el, body: [] });
      else { const hid = `${id}-h`; scenes.push({ id: hid, heading: { id: hid, t: 'scene', text: '' }, body: [el] }); }
    } else scenes[scenes.length - 1].body.push(el);
  });
  return { v: 1, scenes };
};
const UP = new Set(['scene', 'character', 'transition', 'shot']);
const ser = (doc) => {   // the same rendering as store/scriptText.ts serializeScriptDoc (the page's derived text)
  let o = '', prev = null;
  for (const s of doc.scenes) for (const el of [s.heading, ...s.body]) {
    const x = UP.has(el.t) ? el.text.toUpperCase() : el.text;
    const tight = prev && ['character', 'paren', 'dialogue'].includes(prev) && (el.t === 'paren' || el.t === 'dialogue');
    o += o === '' && prev === null ? x : (tight ? '\n' : '\n\n') + x;
    prev = el.t;
  }
  return o;
};
const E = (...pairs) => pairs.map(([k, x]) => [T[k] ?? k, x]);
const fill = (k, w = 6) => Array.from({ length: k }, (_, i) => ['action', `Filler action line ${i + 1} of the page.`.slice(0, 40 + w)]);
const words = (k) => Array.from({ length: k }, (_, i) => `word${i}`).join(' ');

await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  const ev = (js) => app.evalJs(js);
  const waitFor = (expr, label, timeout = 12000) => app.waitFor(expr, { label, timeout });
  const q = (s) => JSON.stringify(s);
  out(`SCREENWRITING REVIEW [${TAG}] (${new Date().toISOString()})`);
  await d.boot();
  await ev("history.replaceState(null, '', '/#/')");
  await app.reload();
  await waitFor("!!document.querySelector('.wz-arrival')", 'the Desk', 20000);
  await waitFor("!document.querySelector('.wz-splash')", 'splash gone', 20000).catch(() => {});

  const DOC = `(() => { const m = new Map(); for (const e of document.querySelectorAll('.script-el[data-doc-index]')) { const i = +e.dataset.docIndex; const c = m.get(i) || { i, t: e.dataset.type, x: '' }; c.x += e.textContent; m.set(i, c); } return [...m.values()].sort((a, b) => a.i - b.i).map((o) => ({ t: o.t, x: o.x })); })()`;
  const doc = () => ev(DOC);
  const SHEETS = `[...document.querySelectorAll('.script-sheet')].map((s) => { const r = s.getBoundingClientRect(); const em = parseFloat(getComputedStyle(s).fontSize); return { i: +s.dataset.pageIndex, num: s.querySelector('.script-page-number')?.textContent || null, hIn: +(r.height / em / 6).toFixed(2), overflow: getComputedStyle(s).overflowY, els: [...s.querySelectorAll('.script-el')].map((e) => { const b = e.getBoundingClientRect(); return { t: e.dataset.type, x: e.textContent.slice(0, 26), belowTextArea: +((b.bottom - (r.top + 60 * em)) / em).toFixed(1), belowSheet: +((b.bottom - r.bottom) / em).toFixed(1), cont: e.dataset.continues || null, from: e.dataset.continuedFrom || null }; }) }; })`;
  const sheets = () => ev(SHEETS);
  const stored = (id) => ev(`(() => { window.wrizoFlushNow(); const a = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const e = (Array.isArray(a) ? a : Object.values(a)).find((r) => r && r.id === ${q(id)}); if (!e) return null; return { text: e.text, pageType: e.pageType, script: e.script ? e.script.scenes.flatMap((s) => [s.heading, ...s.body]).map((x) => ({ t: x.t, x: x.text })) : null }; })()`);
  const SAVE_MS = 2500;   // ScriptEditor's autosave is 2 s, debounced
  const activeType = () => ev("document.querySelector('.script-el-active')?.dataset.type ?? null");
  const makeScript = async (els, o = {}) => {
    const id = `sr-${Date.now().toString(36)}-${++n}`;
    await ev("location.hash = '#/'"); await sleep(180);
    const dc = toDoc(els, id);
    const row = { id, text: ser(dc), createdAt: o.createdAt || new Date().toISOString(), pageType: 'script', origin: o.projectId ? 'project' : 'journal', source: 'page', projectId: o.projectId ?? null, ...(o.orderIndex != null ? { orderIndex: o.orderIndex } : {}) };
    await ev(`(() => { const W = window; W.wrizoCreateJournalPage(${q(row)}); W.wrizoPatchEntry(${q(id)}, ${q({ script: dc })}); W.wrizoFlushNow(); return true; })()`);
    return id;
  };
  const open = async (id) => {
    await ev("location.hash = '#/'"); await sleep(150);
    await ev(`location.hash = '#/page/${id}'`);
    await waitFor("!!document.querySelector('.script-sheet .script-el')", 'the script page', 15000);
    await waitFor("!document.querySelector('.wz-splash')", 'splash gone', 6000).catch(() => {});
    await sleep(420);
  };
  const clickEl = async (i) => {
    const p = await ev(`(() => { const e = document.querySelector('.script-el[data-doc-index="${i}"]'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + Math.min(r.width - 2, 24)), y: Math.round(r.top + Math.min(r.height / 2, 8)) }; })()`);
    if (!p) throw new Error('no element ' + i);
    await d.click(p.x, p.y); await sleep(220);
  };
  const ACTIVE = "document.querySelector('.script-el-active')";
  const caretEnd = () => ev(`(() => { const n = ${ACTIVE}; const s = getSelection(); const r = document.createRange(); r.selectNodeContents(n); r.collapse(false); s.removeAllRanges(); s.addRange(r); return true; })()`);
  const caretAt = (o) => ev(`(() => { const n = ${ACTIVE}; const t = n.firstChild; const s = getSelection(); const r = document.createRange(); if (t) r.setStart(t, Math.min(${o}, t.length)); else r.setStart(n, 0); r.collapse(true); s.removeAllRanges(); s.addRange(r); return true; })()`);
  const selRange = (a, b) => ev(`(() => { const n = ${ACTIVE}; const t = n.firstChild; const s = getSelection(); const r = document.createRange(); r.setStart(t, ${a}); r.setEnd(t, Math.min(${b}, t.length)); s.removeAllRanges(); s.addRange(r); return s.toString(); })()`);
  const micro = async (els, at, fn) => { const id = await makeScript(els); await open(id); if (at != null) { await clickEl(at); await caretEnd(); await sleep(60); } return fn(id); };
  const press = async (sel) => {
    const p = await ev(`(() => { const e = document.querySelector(${q(sel)}); if (!e) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), dis: !!e.disabled }; })()`);
    if (!p || p.dis) return false;
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, buttons: 0, pointerType: 'mouse' });
    let hit = false;
    for (let i = 0; i < 25 && !hit; i++) {
      hit = await ev(`(() => { const e = document.querySelector(${q(sel)}); const h = document.elementFromPoint(${p.x}, ${p.y}); return !!e && !!h && (h === e || e.contains(h)); })()`);
      if (!hit) { await sleep(100); await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x + (i % 2), y: p.y, buttons: 0, pointerType: 'mouse' }); }
    }
    if (!hit) return false;
    await d.click(p.x, p.y); await sleep(350);
    return true;
  };
  const has = (sel) => ev(`!!document.querySelector(${q(sel)})`);
  const frontOpen = async () => { if (!(await has('.wz-sliver'))) return false; if (!(await ev("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await press('.wz-sliver-grip'); await sleep(400); } return true; };
  const hook = () => ev(`(() => { if (window.__srHook) return; window.__srHook = 1; window.__srF = []; const real = URL.createObjectURL.bind(URL); let last = null; URL.createObjectURL = (b) => { last = b; return real(b); }; const click = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download && last) { const b = last, name = this.download; last = null; b.text().then((t) => window.__srF.push({ name, t })); return; } return click.call(this); }; })()`);
  const files = async () => { await sleep(250); return ev('window.__srF.splice(0)'); };
  const keep = (name, text) => { if (!cfg.out) return; const dir = path.join(cfg.out, 'exports'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, name.replace(/[^A-Za-z0-9._-]+/g, '_')), text); };
  const fresh = async () => { await ev("location.hash = '#/'"); await sleep(200); await app.reload(); await waitFor("!!document.querySelector('.wz-arrival')", 'the Desk', 20000); await waitFor("!document.querySelector('.wz-splash')", 'splash gone', 20000).catch(() => {}); await sleep(200); };   // a reload closes anything an earlier case left open (the search panel keeps the keyboard otherwise)
  const want = (c) => !only || only.has(c);
  const run = async (c, fn) => { if (!want(c)) return; try { await fn(); } catch (e) { rec(c, 'the harness could not finish this case', 'a reading', String((e && e.message) || e).slice(0, 240), 'NOTCOVERED'); } };

  out(`INFO lit: ${JSON.stringify(await ev("({ q: location.search, theme: document.documentElement.getAttribute('data-theme') })"))}`);

  // ------------------------------------------------------------------ G: the page itself
  await run('G', async () => {
    const id = await makeScript(E(['s', 'INT. ROOM - DAY'], ['a', 'Action line.'], ['c', 'MARA'], ['p', '(beat)'], ['d', 'Dialogue line.'], ['t', 'CUT TO:'], ['h', 'ANGLE ON'], ['g', 'General.']));
    await open(id); await clickEl(7); await sleep(200);
    const m = await ev(`(async () => { await document.fonts.ready; const s = document.querySelector('.script-sheet'); const r = s.getBoundingClientRect(); const em = parseFloat(getComputedStyle(s).fontSize); const inch = em * 6; const out = {}; for (const e of s.querySelectorAll('.script-el')) { const range = document.createRange(); range.selectNodeContents(e); const b = range.getBoundingClientRect(); out[e.dataset.type] = { leftIn: +((b.left - r.left) / inch).toFixed(2), rightIn: +((b.right - r.left) / inch).toFixed(2) }; } return { fontPx: em, scale: +(em / 16).toFixed(3), pageIn: [+(r.width / inch).toFixed(2), +(r.height / inch).toFixed(2)], family: getComputedStyle(s).fontFamily.slice(0, 40), courierPrimeLoaded: document.fonts.check('16px "Courier Prime"'), faces: [...document.fonts].filter((f) => /courier/i.test(f.family)).map((f) => f.family + ':' + f.weight + ':' + f.style + ':' + f.status), els: out }; })()`);
    judge('G1', 'US Letter, Courier 12 pt, standard indents', 'page 8.5x11; action 1.5in, dialogue 2.5in, paren ~3.1in, character ~3.7in', m, m.pageIn[0] === 8.5 && m.pageIn[1] === 11 && m.courierPrimeLoaded && Math.abs(m.els.action?.leftIn - 1.5) <= 0.02 && Math.abs(m.els.dialogue?.leftIn - 2.5) <= 0.02 && Math.abs(m.els.paren?.leftIn - 3.1) <= 0.02 && Math.abs(m.els.character?.leftIn - 3.7) <= 0.02);
    await d.shot('G1-elements');
  });

  // ------------------------------------------------------------------ K: the keys
  await run('K', async () => {
    await micro(E(['s', 'INT. A - DAY'], ['a', 'Mara folds a shirt.']), 1, async () => {
      await d.key('Tab'); await sleep(120); const g = await doc();
      judge('K1', 'Tab at the end of a written Action line (FD13 1.26.2: Tab ADDS a paragraph, Action to Character)', 'the action stays action; a new empty Character paragraph follows', g, g[1]?.t === 'action' && g[1]?.x === 'Mara folds a shirt.' && g[2]?.t === 'character');
      await d.shot('K1-tab-action');
    });
    await micro(E(['s', 'INT. A - DAY'], ['a', 'x'], ['c', 'MARA']), 2, async () => {
      await d.key('Tab'); await sleep(120); const g = await doc();
      judge('K2', 'Tab on a written Character cue (FD13 1.26.2: "Character to Transition (only when character is blank)")', 'the name stays a Character', g, g[2]?.t === 'character');
    });
    await micro(E(['s', 'INT. A - DAY'], ['c', 'MARA'], ['d', 'Hello there.']), 2, async () => {
      await d.key('Tab'); await sleep(120); const g = await doc();
      judge('K3', 'Tab at the end of a written Dialogue line (FD13 1.26.2: Tab adds a Parenthetical paragraph)', 'the speech stays dialogue; a new Parenthetical follows', g, g[2]?.t === 'dialogue' && g[3]?.t === 'paren');
    });
    await micro(E(['s', 'INT. A - DAY'], ['c', 'MARA'], ['d', '']), 2, async () => {
      await d.key('Tab'); await sleep(100); await d.type('beat', 5); await d.key('Enter'); await sleep(120); const g = await doc();
      judge('K4', 'A parenthetical gets its parentheses (FD13 1.16.1: "automatically enters both the left and right parentheses")', '(beat)', g[2], g[2]?.x === '(beat)');
    });
    await micro(E(['s', 'INT. A - DAY'], ['c', 'MARA'], ['d', 'One two. Three four.']), 2, async () => {
      await caretAt(9); await d.key('Enter'); await sleep(120); const g = await doc();
      rec('K5', 'Enter in the middle of a speech', 'both halves stay dialogue', g.slice(2), g[3]?.t === 'dialogue' ? 'OK' : 'BREAK');
    });
    await micro(E(['s', 'INT. A - DAY'], ['a', 'First line.'], ['a', 'Second line.']), 2, async () => {
      await selRange(0, 99); await d.key('Backspace'); await sleep(150); const g = await doc();
      judge('K6', 'Select a whole line, Backspace', 'the selected words are gone and First line. is untouched', g, !g.some((e) => e.x.includes('Second')) && g[1]?.x === 'First line.');
    });
    await micro(E(['s', 'INT. A - DAY'], ['a', 'Keep this. CUT THIS. Keep that.']), 1, async () => {
      await selRange(11, 21); await d.key('Enter'); await sleep(150); const g = await doc();
      judge('K7', 'Select words, press Enter', 'the selection is replaced by the line break', g, !g.some((e) => e.x.includes('CUT THIS')));
    });
    await micro(E(['s', 'INT. A - DAY'], ['a', 'Keep this. CUT THIS. Keep that.']), 1, async () => {
      await selRange(11, 21); await d.type('NEW ', 5); await sleep(150); const g = await doc();
      judge('K8', 'Select words, type over them', 'Keep this. NEW Keep that.', g[1], g[1]?.x === 'Keep this. NEW Keep that.');
    });
    await micro(E(['s', 'INT. A - DAY'], ['a', 'Alpha.'], ['a', 'Beta.']), 1, async () => {
      await d.key('Delete'); await sleep(150); const g = await doc();
      judge('K9', 'Delete at the end of a line joins the next one up', 'Alpha.Beta. in one element', g, g.length === 2 && g[1]?.x === 'Alpha.Beta.');
    });
    await micro(E(['s', 'INT. A - DAY'], ['a', 'Alpha beta.']), 1, async () => {
      await caretAt(6); await d.key('Enter'); await sleep(150); const a = await doc(); await d.key('z', { ctrl: true }); await sleep(200); const b = await doc();
      judge('K10', 'Ctrl+Z after Enter split a line', 'one line again: Alpha beta.', { afterEnter: a.slice(1), afterUndo: b.slice(1) }, b.length === 2 && b[1]?.x === 'Alpha beta.');
    });
    await micro(E(['s', 'INT. A - DAY'], ['a', 'Alpha.'], ['a', 'Beta.']), 2, async () => {
      await caretAt(0); await d.key('Backspace'); await sleep(150); const a = await doc(); await d.key('z', { ctrl: true }); await sleep(200); const b = await doc();
      judge('K11', 'Ctrl+Z after Backspace joined two lines', 'two lines again', { afterJoin: a.slice(1), afterUndo: b.slice(1) }, b.length === 3 && b[2]?.x === 'Beta.');
    });
    await micro(E(['s', 'INT. A - DAY'], ['a', 'Alpha.'], ['a', 'Beta.']), 1, async () => {
      await d.type(' Typed here.', 5); await sleep(120); await clickEl(2); await sleep(150); await d.key('z', { ctrl: true }); await sleep(200); const b = await doc();
      judge('K12', 'Type in one line, click into the next, Ctrl+Z', 'the typing is undone', b.slice(1), b[1]?.x === 'Alpha.');
    });
    await micro(E(['s', 'INT. A - DAY'], ['a', 'Alpha.'], ['c', 'MARA'], ['d', 'Beta.']), 1, async () => {
      await d.key('a', { ctrl: true }); await sleep(120);
      const sel = await ev('getSelection().toString().length'); const total = (await doc()).reduce((s, e) => s + e.x.length, 0);
      judge('K13', 'Ctrl+A selects the script (to copy it, or cut a scene)', `all ${total} characters`, { selected: sel, total }, sel >= total);
    });
    // the opening every screenwriter types: FADE IN: as the first line
    {
      const id = await makeScript([['scene', '']]); await open(id);
      await d.key('6', { ctrl: true }); await sleep(100); await d.type('fade in:', 5); await d.key('Enter'); await sleep(150); await d.type('int. room - day', 3);
      await sleep(SAVE_MS); await d.key('ArrowUp'); await sleep(100); const before = await doc();
      await sleep(SAVE_MS); await app.reload(); await waitFor("!!document.querySelector('.script-sheet .script-el')", 'the script page', 15000); await sleep(500);
      const after = await doc();
      judge('K14', 'FADE IN: as the first line, saved and reopened', 'the same lines, no blank heading above FADE IN:', { before, after }, after.length === before.length && after[0]?.t === before[0]?.t);
      await d.shot('K14-fade-in-reopened');
    }
    await micro(E(['s', 'INT. A - DAY'], ['a', '']), 1, async () => {
      await d.type('Est. 1962, says the sign.', 3); await sleep(150); const g = await doc();
      judge('K15', 'An action line that happens to begin "Est."', 'it stays action', g[1], g[1]?.t === 'action');
    });
    await micro(E(['s', 'INT. A - DAY'], ['a', 'One.'], ['a', 'Two.']), 2, async () => {
      await d.key('Home'); await sleep(60); await d.key('ArrowUp'); await sleep(120);
      rec('K16', 'Arrow up from the start of a line moves to the line above', 'the caret is in One.', await ev(`${ACTIVE}?.textContent`), (await ev(`${ACTIVE}?.textContent`)) === 'One.' ? 'OK' : 'BREAK');
    });
  });

  await run('K17', async () => {
    await micro(E(['s', 'INT. A - DAY'], ['a', 'Alpha.']), 1, async () => {
      await d.type(' Typed.', 30); await sleep(700); await d.key('z', { ctrl: true }); await sleep(250); const b = await doc();
      rec('K17', 'CONTROL: Ctrl+Z inside one line with nothing else pressed (proves the harness key reaches the editor, so K10-K12 are real)', 'the typing is undone', b[1], b[1]?.x !== 'Alpha. Typed.' ? 'OK' : 'BREAK');
    });
  });

  // ------------------------------------------------------------------ A: SmartType's job
  await run('A', async () => {
    const opts = () => ev("[...document.querySelectorAll('.script-autocomplete-opt')].map((o) => o.textContent)");
    await micro(E(['s', 'INT. LAUNDROMAT - NIGHT'], ['c', 'MARA'], ['d', 'x'], ['c', 'MARCUS'], ['d', 'y'], ['a', 'z'], ['c', '']), 6, async () => {
      await d.type('ma', 20); await sleep(120); const o = await opts(); await d.key('Enter'); await sleep(120);
      judge('A1', 'character names complete', 'MARA and MARCUS offered; Enter takes the first', { offered: o, took: (await doc())[6] }, o.includes('MARA') && o.includes('MARCUS'));
    });
    await micro(E(['s', 'INT. LAUNDROMAT - NIGHT'], ['a', 'x'], ['s', '']), 2, async () => {
      await d.type('int. la', 20); await sleep(120); const o = await opts(); await d.key('Enter'); await sleep(120); const o2 = await opts(); await d.key('Enter'); await sleep(120);
      judge('A2', 'locations and times of day complete', 'LAUNDROMAT, then a time list', { loc: o, tod: o2, took: await ev(`${ACTIVE}?.textContent`) }, o.includes('LAUNDROMAT') && o2.length > 0);
    });
    await micro(E(['s', 'INT. A - DAY'], ['c', '']), 1, async () => {
      await d.type('mara (', 20); await sleep(120); const o = await opts();
      judge('A3', 'character extensions complete', 'V.O. and O.S. offered', o, o.includes('V.O.') && o.includes('O.S.'));
    });
    await micro(E(['s', 'INT. A - DAY'], ['a', 'x'], ['s', '']), 2, async () => {
      await d.type('int. a - ', 20); await sleep(120); const o = await opts();
      rec('A4', 'the time-of-day list', 'includes DAWN, DUSK, SAME, MOMENTS LATER (common sluglines)', o, ['DAWN', 'DUSK', 'SAME'].every((w) => o.includes(w)) ? 'OK' : 'BREAK');
    });
  });

  // ------------------------------------------------------------------ C: (CONT'D)
  await run('C', async () => {
    await micro(E(['s', 'INT. A - DAY'], ['c', 'MARA'], ['d', 'One.'], ['a', 'She sits.'], ['c', '']), 4, async () => {
      await d.type('mara', 10); await d.key('Enter'); await sleep(150); const g = await doc();
      judge('C1', "the same speaker after action gets (CONT'D)", "MARA (CONT'D)", g[4], g[4]?.x === "MARA (CONT'D)");
    });
    await micro(E(['s', 'INT. A - DAY'], ['c', 'MARA'], ['d', 'One.'], ['s', 'EXT. B - NIGHT'], ['a', 'Rain.'], ['c', '']), 5, async () => {
      await d.type('mara', 10); await d.key('Enter'); await sleep(150); const g = await doc();
      judge('C2', `the same speaker in a NEW scene (FD13 1.10.1.4: "not inserted if a character's speech is continued from one scene to the next")`, 'MARA, with no (CONT\'D)', g[5], g[5]?.x === 'MARA');
      await d.shot('C2-contd-across-scene');
    });
    await micro(E(['s', 'INT. A - DAY'], ['c', 'MARA'], ['d', 'One.'], ['a', 'She sits.'], ['c', "MARA (CONT'D)"], ['d', 'Two.']), 4, async () => {
      await selRange(0, 99); await d.type('MARA', 10); await clickEl(5); await sleep(200); const g = await doc();
      judge('C3', "a writer deletes a (CONT'D) she does not want", 'it stays deleted', g[4], g[4]?.x === 'MARA');
    });
    await micro(E(['s', 'INT. A - DAY'], ['c', 'MARA'], ['d', 'One.'], ['g', 'A general line.'], ['c', '']), 4, async () => {
      await d.type('mara', 10); await d.key('Enter'); await sleep(150); const g = await doc();
      judge('C4', "interrupted by a General element (FD13 1.10.1.4: \"an Action or General element\")", "MARA (CONT'D)", g[4], g[4]?.x === "MARA (CONT'D)");
    });
  });

  // ------------------------------------------------------------------ P: pagination
  await run('P', async () => {
    const summary = (ss) => ss.map((s) => ({ page: s.i + 1, num: s.num, n: s.els.length, first: s.els[0]?.t, last: s.els[s.els.length - 1]?.t, lastText: s.els[s.els.length - 1]?.x }));
    {
      const id = await makeScript([['scene', 'INT. A - DAY'], ...fill(23), ['character', 'MARA'], ['dialogue', words(70)]]); await open(id);
      const ss = await sheets(); const all = ss.flatMap((s) => s.els.map((e) => e.x)).join(' ');
      judge('P1', "a speech that reaches the page's end splits, (MORE) below it and MARA (CONT'D) on the next page (FD13 1.10.1.4)", "(MORE) and (CONT'D) on the page", { pages: summary(ss), hasMore: /\(MORE\)/.test(all), hasContd: /CONT'D/.test(all) }, /\(MORE\)/.test(all) && /CONT'D/.test(all));
      await ev("document.querySelector('.script-sheet')?.scrollIntoView({ block: 'end' })"); await sleep(200); await d.shot('P1-page-one-bottom');
    }
    {
      const id = await makeScript([['scene', 'INT. A - DAY'], ['character', 'MARA'], ['dialogue', words(420)], ['action', 'She stops.']]); await open(id);
      await clickEl(3); await sleep(250);
      const ss = await sheets(); const over = Math.max(...ss.flatMap((s) => s.els.map((e) => e.belowTextArea)));
      const past = Math.max(...ss.flatMap((s) => s.els.map((e) => e.belowSheet)));
      judge('P2', 'a speech longer than a page stays inside the page', 'no text below the bottom margin', { pages: ss.length, linesBelowMargin: over, linesBelowSheet: past, sheetOverflowCss: ss[0]?.overflow, sheetHeightIn: ss[0]?.hIn }, over <= 0);
      { const at = ss.find((s) => s.els.some((e) => e.t === 'dialogue')); await ev(`document.querySelector('.script-sheet[data-page-index="${at ? at.i : 0}"]')?.scrollIntoView({ block: 'end' })`); await sleep(250); await d.shot('P2-long-speech-overflow'); }
      // the words past the sheet's foot: can the writer SEE them, or does the next sheet paint over them?
      const seen = await ev(`(async () => {
        const dlg = [...document.querySelectorAll('.script-el[data-type="dialogue"]')].sort((a, b) => b.textContent.length - a.textContent.length)[0];
        const t = dlg.firstChild; const probe = async (word) => {
          const i = t.data.indexOf(word); const r = document.createRange(); r.setStart(t, i); r.setEnd(t, i + word.length);
          const box = document.querySelector('.desk-frame-scroll-cap') || document.scrollingElement;
          const b0 = r.getBoundingClientRect(); const top = box.getBoundingClientRect ? box.getBoundingClientRect().top : 0; box.scrollTop += b0.top - top - 220;
          await new Promise((k) => requestAnimationFrame(() => requestAnimationFrame(k)));
          const b = r.getBoundingClientRect(); const h = document.elementFromPoint(b.left + 3, b.top + b.height / 2);
          return { word, onItsOwnElement: !!h && (h === dlg || dlg.contains(h)), topmost: h ? String(h.className || h.tagName).slice(0, 40) : null, topmostSheet: h && h.closest('.script-sheet') ? h.closest('.script-sheet').dataset.pageIndex : null };
        };
        const own = dlg.closest('.script-sheet').dataset.pageIndex;
        return { ownSheet: own, first: await probe('word5 '), mid: await probe('word300 '), last: await probe('word419') };
      })()`);
      await sleep(200); await d.shot('P2b-last-words');
      judge('P2b', 'every word of the over-long speech can be seen on screen', 'the last words are visible', seen, !!seen.last?.onItsOwnElement && !!seen.mid?.onItsOwnElement);
    }
    {
      // page 1 ends on a scene heading; page 2 is full: the heading travels, and page 2's last line must reflow onto page 3
      const p1 = fill(25); const p2 = fill(27).map(([t, x]) => [t, x.replace('Filler', 'Second')]); const p3 = fill(20).map(([t, x]) => [t, x.replace('Filler', 'Third')]);
      const id = await makeScript([['scene', 'INT. A - DAY'], ...p1.slice(1), ['action', 'Last of page one.'], ['scene', 'EXT. B - NIGHT'], ...p2, ...p3]); await open(id);
      const ss = await sheets(); const lonely = ss.filter((s, i) => i < ss.length - 1 && s.els.length === 1);
      judge('P3', 'a heading pushed to the next page reflows the pages after it', 'no page holding a single line mid-script', { pages: summary(ss), lonelyPages: lonely.map((s) => ({ page: s.i + 1, only: s.els[0]?.x })) }, lonely.length === 0);
      if (lonely[0]) { await ev(`document.querySelector('.script-sheet[data-page-index="${lonely[0].i}"]')?.scrollIntoView({ block: 'start' })`); await sleep(200); await d.shot('P3-one-line-page'); }
    }
    {
      // the same push, with a character cue as page 2's last line: the cue is thrown onto a page alone, its speech on the page after
      const p1 = fill(25); const p2 = fill(26).map(([t, x]) => [t, x.replace('Filler', 'Second')]);
      const id = await makeScript([['scene', 'INT. A - DAY'], ...p1.slice(1), ['action', 'Last of page one.'], ['scene', 'EXT. B - NIGHT'], ...p2, ['character', 'MARA'], ['dialogue', words(10)], ...fill(4)]); await open(id);
      const ss = await sheets(); const cueLast = ss.filter((s, i) => i < ss.length - 1 && s.els[s.els.length - 1]?.t === 'character');
      const headLast = ss.filter((s, i) => i < ss.length - 1 && s.els[s.els.length - 1]?.t === 'scene');
      judge('P4', 'a character cue is never separated from its speech by a page break', 'no page ends on a cue or a heading', { pages: summary(ss), cueLast: cueLast.map((s) => s.i + 1), headLast: headLast.map((s) => s.i + 1) }, cueLast.length === 0 && headLast.length === 0);
      if (cueLast[0]) { await ev(`document.querySelector('.script-sheet[data-page-index="${cueLast[0].i}"]')?.scrollIntoView({ block: 'start' })`); await sleep(200); await d.shot('P4-cue-alone'); }
    }
    {
      const id = await makeScript([['scene', 'INT. A - DAY'], ...fill(24), ['action', words(60)], ['action', 'After.']]); await open(id);
      const ss = await sheets();
      const used = await ev(`(() => { const s = document.querySelector('.script-sheet'); const r = s.getBoundingClientRect(); const em = parseFloat(getComputedStyle(s).fontSize); const els = [...s.querySelectorAll('.script-el')]; const last = els[els.length - 1].getBoundingClientRect(); return +((r.top + 60 * em - last.bottom) / em).toFixed(0); })()`);
      rec('P5', 'an action paragraph at the page end breaks at a sentence (FD13 1.10.1.3) rather than leaving a hole', 'under ~3 blank lines at the foot of page 1', { blankLinesAtFootOfPage1: used, pages: summary(ss).slice(0, 2) }, used <= 3 ? 'OK' : 'BREAK');
    }
  });

  // ------------------------------------------------------------------ F: Find and Replace a character's name
  await run('F', async () => {
    const els = E(['s', 'INT. A - DAY'], ['c', 'MARA'], ['d', 'Mara knows.'], ['a', 'MARA turns.'], ['c', 'THEO'], ['d', 'Hello, Mara.']);
    const id = await makeScript(els); await open(id);
    if (!(await has('[data-top-search]'))) { rec('F1', 'Find and Replace on a screenplay page', 'a search door', 'no top-rail search on this theme', 'NOTCOVERED'); return; }
    await press('[data-top-search]'); await sleep(600);
    if (!(await has('[data-search-q]'))) { rec('F1', 'Find and Replace on a screenplay page', 'the search field', 'the door opened no field', 'NOTCOVERED'); return; }
    await press('[data-search-q]'); await d.type('Mara', 15); await sleep(600);
    const count = await ev("document.querySelector('[data-search-count]')?.textContent ?? null");
    await d.shot('F1-find');
    if (!(await press('[data-replace-toggle]'))) { rec('F1', 'Replace', 'the Replace line', { count }, 'NOTCOVERED'); return; }
    await sleep(250);
    await press('input[data-replace-with]'); await d.type('Delia', 15); await sleep(250);
    const pressed = await press('[data-replace-all]'); await sleep(1000);
    const said = await ev("document.querySelector('[data-replace-said]')?.textContent ?? null");
    const page = await doc(); const st = await stored(id);
    await d.shot('F2-after-replace-all');
    const onPage = page.filter((e) => /mara/i.test(e.x)).length, inScript = (st.script || []).filter((e) => /mara/i.test(e.x)).length, inShadow = (st.text.match(/mara/gi) || []).length;
    judge('F2', 'Replace All renames the character everywhere', 'no MARA on the page or in the saved script', { count, pressed, said, stillOnPage: onPage, stillInSavedScript: inScript, stillInDerivedText: inShadow }, pressed && onPage === 0 && inScript === 0);
    // what the writer gets if she trusts the message: reopen the page, then make any edit
    await ev("location.hash = '#/'"); await sleep(400); await open(id);
    const reopened = await doc();
    await clickEl(3); await caretEnd(); await d.type(' Yes.', 10); await sleep(SAVE_MS + 300);
    const st2 = await stored(id);
    rec('F3', 'after Replace All: reopen the page, make one edit, save', 'the new name stands', { reopenedStillMara: reopened.filter((e) => /mara/i.test(e.x)).length, savedScriptMara: (st2.script || []).filter((e) => /mara/i.test(e.x)).length, derivedTextMara: (st2.text.match(/mara/gi) || []).length, derivedTextDelia: (st2.text.match(/delia/gi) || []).length }, (st2.script || []).some((e) => /mara/i.test(e.x)) ? 'BREAK' : 'OK');
  });

  // ------------------------------------------------------------------ R: the reorg's Parts, on a screenplay
  let docId = null;
  await run('R', async () => {
    await fresh();
    const made = await ev(`(() => { const b = window.wrizoCreateBinder('Spin Cycle', 'screenplay'); return b && b.id; })()`);
    docId = made;
    const first = await makeScript([['scene', '']], { projectId: docId, orderIndex: 0 }); await open(first);
    let via = 'none';
    if (await frontOpen()) {
      await press('#wz-sliver-tab-parts'); await sleep(300);
      if (await has('[data-doc-kind]')) {
        await press('[data-doc-kind]'); await sleep(250);
        await press('[data-doc-menu-item^="preset"]'); await sleep(250);
        if (await has('[data-preset-pick="screenplay-feature"]')) { await d.shot('R0-presets'); await press('[data-preset-pick="screenplay-feature"]'); await sleep(700); via = 'menu'; }
      }
    }
    let parts = await ev(`window.wrizoParts ? window.wrizoParts.partsOfDoc(${q(docId)}) : null`);
    if (!parts) { rec('R0', 'the Parts layer', 'present', 'absent in this build', 'NOTCOVERED'); return; }
    if (via !== 'menu' || parts.length < 4) {
      rec('R0', 'the Feature preset from the Doc menu', 'four acts', { via, n: parts.length }, 'NOTCOVERED');
      if (cfg.theme === 'flux') return;
      await ev(`(() => { const P = window.wrizoParts; const s = () => ({ script: { v: 1, scenes: [{ id: 'h' + Math.random().toString(36).slice(2), heading: { id: 'h', t: 'scene', text: '' }, body: [] }] }, text: '' }); P.renamePart(${q(first)}, 'Act One'); let prev = ${q(first)}; for (const name of ['Act Two A', 'Act Two B', 'Act Three']) prev = P.newPart(${q(docId)}, { afterId: prev, name, seed: s() }); return true; })()`);
      parts = await ev(`window.wrizoParts.partsOfDoc(${q(docId)})`);
    } else rec('R0', 'the Feature preset from the Doc menu', 'four acts', parts.map((p) => `${p.name}:${p.kind}`), 'OK');
    // each act gets its own pages, as a writer fills them
    const body = (who, where) => toDoc(E(['s', `INT. ${where} - DAY`], ['a', `${where} action.`], ['c', who], ['d', `${where} line.`]), `seed-${where.replace(/\W/g, '')}`);
    const named = ['LAUNDROMAT', 'STREET', 'KITCHEN', 'BUS'];
    for (let i = 0; i < 4; i++) { const dc = body(i === 0 ? 'MARA' : 'THEO', named[i]); await ev(`window.wrizoPatchEntry(${q(parts[i].id)}, ${q({ script: dc, text: ser(dc) })})`); }
    await sleep(200);
    const listed = await ev(`window.wrizoParts.partsOfDoc(${q(docId)}).map((p) => ({ name: p.name, kind: p.kind, words: p.words, level: p.level }))`);
    judge('R1', 'a written screenplay Part shows its length in the Parts list', 'words above zero on each act', listed, listed.every((p) => p.words > 0));
    // an unnamed act: what does its row say?
    const un = await ev(`(() => { const P = window.wrizoParts; const id = P.newPart(${q(docId)}, { afterId: ${q(parts[3].id)}, seed: { script: { v: 1, scenes: [{ id: 'hx', heading: { id: 'hx', t: 'scene', text: 'INT. ROOF - NIGHT' }, body: [] }] }, text: 'INT. ROOF - NIGHT' } }); const r = P.partById(id); P.joinPart; return { id, name: r && r.name }; })()`);
    judge('R2', 'an unnamed screenplay Part is listed by its first slugline', 'INT. ROOF - NIGHT', un.name, /ROOF/.test(un.name || ''));
    // Act Two A: is it page 1 again? does it know Mara?
    await open(parts[1].id);
    const ss = await sheets();
    await clickEl(3); await caretEnd(); await d.key('Enter'); await sleep(120); await d.key('Tab'); await sleep(60);   // dialogue -> Enter = action -> Tab = character
    await d.type('ma', 20); await sleep(150);
    const o = await ev("[...document.querySelectorAll('.script-autocomplete-opt')].map((x) => x.textContent)");
    judge('R3', "Act Two knows the characters of Act One (one script's SmartType)", 'MARA offered', o, o.includes('MARA'));
    await d.key('Escape'); await sleep(80);
    rec('R4', 'the page numbers run through the acts', "Act Two A starts after Act One's last page", { firstSheetNumberShown: ss[0]?.num, pagesInThisAct: ss.length, note: 'each Part paginates alone from page 1' }, ss[0]?.num ? 'OK' : 'BREAK');
    await d.shot('R4-act-two-page-one');
    const sp = await ev(`window.wrizoParts.splitPart(${q(parts[1].id)}, 10)`);
    judge('R5', 'Split a screenplay Part at a scene', 'the Part splits', sp, sp && sp.ok === true);
    const jn = await ev(`window.wrizoParts.joinPart(${q(parts[2].id)})`);
    judge('R6', 'Merge a screenplay Part into the one above', 'the Parts merge', jn, jn && jn.ok === true);
    const lv = await ev(`window.wrizoParts.setPartLevel(${q(docId)}, ${q(parts[2].id)}, 1)`);
    judge('R7', 'Nest a screenplay Part (a sequence under an act)', 'level 1', lv, lv === 1);
    await ev(`window.wrizoParts.setPartLevel(${q(docId)}, ${q(parts[2].id)}, 0)`);
    // move Act Three to the front, then download the whole script
    await ev(`window.wrizoParts.movePart(${q(docId)}, ${q(parts[3].id)}, 0)`); await sleep(200);
    const order = await ev(`window.wrizoParts.partsOfDoc(${q(docId)}).map((p) => p.name)`);
    await open(parts[0].id); await hook();
    await press('[data-mode-key="publish"]'); await sleep(400);
    const ok = await press('.publish-download-binder');
    const f = ok ? await files() : [];
    const text = f[0]?.t || '';
    keep(`binder-${cfg.theme}.md`, text);
    const seen = named.map((w) => ({ w, at: text.indexOf(`INT. ${w}`) })).filter((x) => x.at >= 0).sort((a, b) => a.at - b.at).map((x) => x.w);
    const wantOrder = ['BUS', 'LAUNDROMAT', 'STREET', 'KITCHEN'];
    judge('R8', 'after moving Act Three to the front, the whole-script download follows the Parts order', wantOrder, { partsOrder: order, downloadOrder: seen, file: f[0]?.name }, JSON.stringify(seen) === JSON.stringify(wantOrder));

    // New Part, from the Parts list of a Screenplay Doc
    await open(parts[0].id);
    if (await frontOpen()) { await press('#wz-sliver-tab-parts'); await sleep(250); }
    if (await has('[data-parts-new]')) {
      await press('[data-parts-new]'); await sleep(800);
      const surf = await ev("({ hash: location.hash, script: !!document.querySelector('.script-sheet'), prose: !!document.querySelector('.forward-only-editor') })");
      await d.shot('R9-new-part');
      judge('R9', 'New Part inside a Screenplay Doc', 'a screenplay page', surf, surf.script && !surf.prose);
    } else rec('R9', 'New Part inside a Screenplay Doc', 'the New Part control', 'not reachable in this theme', 'NOTCOVERED');
    // the Plan's "write this Part" door builds this address (reorg/backMenu/planPart.ts toPartHref, without the card's own graft)
    await ev("location.hash = '#/'"); await sleep(150);
    await ev(`location.hash = '#/page/new?binder=${docId}&pn=Midpoint'`); await sleep(900);
    const planDoor = await ev("({ script: !!document.querySelector('.script-sheet'), prose: !!document.querySelector('.forward-only-editor') })");
    judge('R10', "the Plan's door to a new Part, in a Screenplay Doc", 'a screenplay page', planDoor, planDoor.script && !planDoor.prose);

    // a card beside the page: the same control on a screenplay and, as the control, on a prose page
    const board = await ev(`(() => { const W = window; const id = 'sr-board-' + Date.now().toString(36); W.wrizoCreateJournalPage({ id, text: 'Beat board', pageType: 'board', origin: 'loose', source: 'page', createdAt: new Date().toISOString(), boxes: [{ id: 'card1', kind: 'text', x: 60, y: 60, w: 240, h: 140, text: 'Midpoint: he keeps one shirt.' }] }); W.wrizoFlushNow(); return id; })()`);
    const beside = async (pageId, isScript) => {
      await ev(`window.wrizoAddPageLink(${q(pageId)}, { bEntryId: ${q(board)}, bBoxId: 'card1' })`);
      await ev("location.hash = '#/'"); await sleep(200); await ev(`location.hash = '#/page/${pageId}'`);
      await waitFor(isScript ? "!!document.querySelector('.script-sheet .script-el')" : "!!document.querySelector('.forward-only-editor')", 'the page', 12000); await sleep(500);
      if (!(await ev("document.querySelector('.wz-tutor-grip')?.getAttribute('data-open') === 'true'"))) { await press('.wz-tutor-grip'); await sleep(450); }
      if (await has('[id$="-tab-links"]')) { await press('[id$="-tab-links"]'); await sleep(450); }
      const offered = await has('[data-back-beside]');
      const pressed = offered ? await press('[data-back-beside]') : false; await sleep(700);
      const r = await ev(`({ stored: !!(window.wrizoSplit && window.wrizoSplit.get()), drawn: document.querySelectorAll('[data-split], .wz-split-asset, .wz-split-reader').length })`);
      await d.shot(`R11-beside-${isScript ? 'script' : 'prose'}`);
      return { offered, pressed, ...r };
    };
    const onScript = await beside(parts[0].id, true);
    await d.key('Escape'); await sleep(150);
    const proseId = await d.openPage('A prose page for the control.', 'drafting');
    const onProse = await beside(proseId, false);
    if (!onScript.offered && !onProse.offered) rec('R11', 'a card beside the page', 'the Beside control', { onScript, onProse }, 'NOTCOVERED');
    else judge('R11', 'Open beside: a card next to the screenplay (control: the same press on a prose page)', 'the card opens beside the page on both', { onScript, onProse }, onScript.drawn > 0 && onProse.drawn > 0);
  });

  // ------------------------------------------------------------------ V: Convert to Screenplay, the Typewriter, the Title Page, the split
  await run('V', async () => {
    await fresh();
    const prose = 'INT. KITCHEN - DAY\n\nMara pours coffee.\n\nMARA\nYou look terrible.\n\nTHEO\nThanks.\n\nCUT TO:';
    await d.openPage(prose, 'drafting');
    const pageId = (await ev('location.hash')).split('/').pop();
    let done = false;
    if (await frontOpen()) {
      for (const tab of ['#wz-sliver-tab-text', '#wz-sliver-tab-parts']) { if (await has('[data-template="screenplay"]')) break; if (await has(tab)) { await press(tab); await sleep(250); } }
      if (await has('[data-template="screenplay"]')) {
        await press('[data-template="screenplay"]'); await sleep(1000);
        done = true;
      }
    }
    if (done) {
      const after = await ev("({ hash: location.hash, script: !!document.querySelector('.script-sheet'), confirm: !!document.querySelector('.structure-confirm-modal') })");
      const g = after.script ? await doc() : [];
      const orig = await stored(pageId);
      const carried = g.some((e) => /coffee/.test(e.x));
      judge('V1', 'Screenplay chosen on a page that already holds a script in plain text', 'the words convert into scene heading, action, character, dialogue, transition', { after, newPageElements: g.map((e) => e.t + ': ' + e.x.slice(0, 20)), wordsCarriedOver: carried, originalPageKept: !!orig && /coffee/.test(orig.text || '') }, carried && g.some((e) => e.t === 'character') && g.some((e) => e.t === 'dialogue'));
      await d.shot('V1-converted');
    } else rec('V1', 'Convert to Screenplay', 'the control', `no Screenplay template reachable on page ${pageId}`, 'NOTCOVERED');

    const id = await makeScript(E(['s', 'INT. A - DAY'], ['a', 'Words on the page.'])); await open(id);
    const tabs = await ev("[...document.querySelectorAll('.desk-mode-tab')].map((b) => ({ key: b.dataset.modeKey, word: b.textContent.trim(), live: b.getAttribute('aria-disabled') !== 'true' }))");
    const free = tabs.find((t) => /free|journal|typewriter/i.test(t.key) || /free/i.test(t.word));
    const revise = tabs.find((t) => /revise/i.test(t.key));
    judge('V2', 'the Typewriter (Free Write) is available on a screenplay', 'the Free Write tab is live', tabs, !!free?.live);
    judge('V3', 'Revise is available on a screenplay', 'the Revise tab is live', tabs, !!revise?.live);
    await d.shot('V2-modes');
    if (await frontOpen()) {
      for (const tab of ['#wz-sliver-tab-text', '#wz-sliver-tab-parts']) { if (await has('[data-template="title"]')) break; if (await has(tab)) { await press(tab); await sleep(250); } }
      await d.shot('V4-front-menu');
      if (await has('[data-template="title"]')) {
        const before = await ev('location.hash');
        await press('[data-template="title"]'); await sleep(900);
        const after = await ev("({ hash: location.hash, script: !!document.querySelector('.script-sheet'), titleSheet: !!document.querySelector('[class*=\"title-page\"], [class*=\"title-sheet\"]'), labels: [...document.querySelectorAll('input[placeholder], textarea[placeholder]')].map((i) => i.placeholder).slice(0, 8) })");
        await d.shot('V4-title-page');
        rec('V4', 'a title page for this screenplay', 'a screenplay title page attached to the script (title, Written by, contact lower left)', { left: before !== after.hash, ...after }, 'INFO');
      } else rec('V4', 'a title page', 'the control', 'no Title Page template on the script page', 'NOTCOVERED');
    }
    await open(id);
    const seam = await ev("({ splitHostMounted: !!document.querySelector('[data-split-host], .reorg-split, .wz-split') })");
    rec('V5', 'the split screen beside a screenplay page', 'a card or Board can sit beside the script', seam, 'INFO');
  });

  // ------------------------------------------------------------------ W: the whole short, typed as a writer types it, then exported
  await run('W', async () => {
    await fresh();
    let id;
    // the spot-check themes seed the short rather than typing it, from its first scene heading (a seeded leading FADE IN: would take the blank heading K14 measures)
    const LIST = cfg.theme === 'machina' ? SPIN_CYCLE : SPIN_CYCLE.slice(1);
    if (cfg.theme === 'machina') {
      id = await makeScript([['scene', '']]); await open(id);
      const t0 = Date.now();
      for (let i = 0; i < LIST.length; i++) {
        const [k, x] = LIST[i]; const t = T[k];
        if (i > 0) { await d.key('Enter'); await sleep(25); }
        if ((await activeType()) !== t) { await d.key(String(NUM[t]), { ctrl: true }); await sleep(25); }
        await d.type(k === 'p' ? `(${x})` : x, 0);
      }
      out(`INFO typed ${SPIN_CYCLE.reduce((s, [, x]) => s + x.length, 0)} characters in ${Math.round((Date.now() - t0) / 1000)} s`);
      await d.key('ArrowUp'); await sleep(SAVE_MS);
    } else {
      id = await makeScript(LIST.map(([k, x]) => [T[k], k === 'p' ? `(${x})` : (UP.has(T[k]) ? x.toUpperCase() : x)])); await open(id);
    }
    const g = await doc(); const ss = await sheets();
    const wordsN = g.reduce((s, e) => s + e.x.trim().split(/\s+/).filter(Boolean).length, 0);
    const contd = g.filter((e) => /CONT'D/i.test(e.x)).map((e) => e.x);
    const typedMatches = g.length === LIST.length && g.every((e, i) => e.t === T[LIST[i][0]]);
    rec('W1', 'the short, typed through', `${LIST.length} elements, each its own type`, { elements: g.length, typedMatches, words: wordsN, pages: ss.length, contd, sheetLines: ss.map((s) => s.els.length) }, typedMatches ? 'OK' : 'BREAK');
    const perPage = await ev(`[...document.querySelectorAll('.script-sheet')].map((s) => { const r = s.getBoundingClientRect(); const em = parseFloat(getComputedStyle(s).fontSize); const els = [...s.querySelectorAll('.script-el')]; const l = els[els.length - 1].getBoundingClientRect(); return Math.round((l.bottom - (r.top + 6 * em)) / em); })`);
    const totalLines = perPage.reduce((a, b) => a + b, 0);
    rec('W3', 'how full each page of the short is (54 lines is a full page)', 'pages full except the last', { linesPerPage: perPage, totalLines, pagesIfTheLinesRanOn: Math.ceil(totalLines / 54), pagesShown: ss.length }, 'INFO');
    const moreOnPage = ss.flatMap((s) => s.els.map((e) => e.x)).filter((x) => /\(MORE\)/.test(x));
    rec('W2', 'the long speech at a page break', '(MORE) / (CONT\'D)', { more: moreOnPage.length }, moreOnPage.length ? 'OK' : 'BREAK');
    for (let i = 0; i < Math.min(ss.length, 7); i++) { await ev(`document.querySelector('.script-sheet[data-page-index="${i}"]')?.scrollIntoView({ block: 'start' })`); await sleep(160); await d.shot(`W-page-${i + 1}`); }
    await hook();
    await press('[data-mode-key="publish"]'); await sleep(400);
    const offered = await ev("[...document.querySelectorAll('.sprint-modal button')].map((b) => b.textContent.trim())");
    await d.shot('X1-publish-dialog');
    rec('X1', 'the export formats a screenwriter needs', 'PDF, Final Draft (.fdx), Fountain', offered, offered.some((b) => /pdf|fdx|final draft|fountain/i.test(b)) ? 'OK' : 'MISSING');
    const a = await press('.publish-download-page-md'); const fa = a ? await files() : [];
    const b = await press('.publish-download-page-txt'); const fb = b ? await files() : [];
    if (fa[0]) keep(`spin-cycle-${cfg.theme}.md`, fa[0].t);
    if (fb[0]) keep(`spin-cycle-${cfg.theme}.txt`, fb[0].t);
    const md = fa[0]?.t || '', txt = fb[0]?.t || '';
    const headLine = md.split('\n').find((l) => l.includes('LAUNDROMAT')) || '';
    const indented = /^\s{5,}\S/m.test(md);
    rec('X2', 'the Markdown download keeps screenplay layout', 'cues and dialogue set apart (a reader or Fountain parser can tell them)', { file: fa[0]?.name, bytes: md.length, indented, sample: md.slice(0, 200), headLine }, indented ? 'OK' : 'BREAK');
    const up = (txt.match(/SUDS & DUDS/g) || []).length;
    const lower = (txt.match(/suds & duds/g) || []).length;
    rec('X3', 'the plain-text download', 'the script as written, with its layout', { file: fb[0]?.name, bytes: txt.length, sample: txt.slice(0, 200), sluglinesUpper: up, sluglinesLower: lower, blankLines: (txt.match(/\n\n/g) || []).length }, 'INFO');
  });

  out(`INFO console errors: ${JSON.stringify(d.errors.slice(0, 6)).slice(0, 900)}`);
  if (cfg.out) fs.writeFileSync(path.join(cfg.out, 'sr-findings.json'), JSON.stringify({ tag: TAG, at: new Date().toISOString(), results: R }, null, 1));
  const c = (v) => R.filter((r) => r.verdict === v).length;
  out(`FINDINGS ${TAG}: ${c('BREAK')} breaks, ${c('MISSING')} missing, ${c('OK')} ok, ${c('INFO')} info, ${c('NOTCOVERED')} not covered`);
});
process.exit(0);
