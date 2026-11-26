// SPRINT'S BACK MENU (Fable, Nov 20, 3:15 pm: "SPRINT's Back menu (FEEDBACK only, writing prompts only, the strict Consultant rules, PLAN/ASSETS greyed with a note) ... red first").
// Nick's 1:20 pm answer, claude/wrizors/machina-stage-menus-decide.md draft 3, F1: in SPRINT (Free Write, the Typewriter) the Back menu keeps its handle, only FEEDBACK can be used,
// PLAN and ASSETS show greyed with a note (as TEXT and INK do in FINALIZE), and Feedback offers WRITING PROMPTS ONLY: one prompt at a time, short, no questions back, no
// conversation; "Another prompt" is her press, never the app's; the command-line default retires. The prompts are deck-drawn (store/tutorFreeWriteDeck.ts): the press sends nothing.
//
// A loose page, Machina, ?reorg=1, 1366x768. SPRINT = the page's mode 'journal' (Free Write); BUILD = 'drafting'.
//   S1  in SPRINT the tab row still reads Plan, Assets, Feedback; Plan and Assets are greyed (aria-disabled, data-locked) and Feedback is the chosen one
//   S2  pressing a greyed tab (click, then the arrow keys) changes nothing: Feedback stays chosen, its panel stays
//   S3  the note is on the page in the lexicon's words, and each greyed tab points at it (aria-describedby)
//   S4  Feedback in SPRINT is the prompt and its button and nothing else: no composer, no Ask, no lenses (Consistency, Structure, Fragments), no preset roster of three, no conversation log, no disclosure "?"
//   S5  the command-line default retires: opening the drawer in SPRINT puts the caret in no input
//   S6  the first press draws a prompt that is a verbatim member of the deck's writing-prompt pool; the button then reads Another Prompt; one prompt stands, a second press REPLACES it (never two)
//   S7  a press sends nothing: no request to the Tutor or the network is made across the presses
//   S8  the ceiling stands: after three prompts the fourth press answers with the refill note and the standing prompt stays
//   S9  contrast: the greyed tabs read at 3:1 or more on the drawer, the note at 4.5:1 or more
//   S10 in BUILD (Draft) nothing is locked: the three tabs press, Plan opens; Feedback is today's Tutor (the composer, the lenses) and the Assets tab still lists
//   S11 with the switch off, Machina Free Write has today's Consultant tab: no locked tab, the composer, the three presets
//   S12 coming from BUILD to SPRINT the menu follows the mode: a page whose mode flips Draft -> Free Write locks the tabs; flipping back unlocks them (Plan pressable again)
// Run (the Actions harness):  node apps/desktop/scripts/harness/reorg-sprint-back.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(detail).slice(0, 700)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.evalJs(`window.wrizoCreateJournalPage(${q({ id: 'sp-p', text: 'The first line of a page that has some words on it, so the page is not empty.', createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose' })}); window.wrizoFlushNow(); true`);
}

async function openPage(app, id, mode, { reorg = true } = {}) {
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs(`window.wrizoTheme.set('machina'); localStorage.setItem('wrizo-mode-page-${id}', '${mode}')`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0&sprint=deck' : '/?arbor2=0'}#/page/${id}')`);   // &sprint=deck: the Consultant is ON by default now (Nov 21, Nick); this file's S4-S10 are the LOCAL DECK's, so they ask for it
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const openDrawer = async (app) => {
  const open = await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'");
  if (!open) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(700); }
};
const TABS = `(() => [...document.querySelectorAll('#wz-tutor-tab-plan, #wz-tutor-tab-links, #wz-tutor-tab-tutor')].map((b) => ({ id: b.id.replace('wz-tutor-tab-', ''), text: b.textContent.trim(), selected: b.getAttribute('aria-selected'), disabled: b.getAttribute('aria-disabled'), locked: b.getAttribute('data-locked'), by: b.getAttribute('aria-describedby') })))()`;
const click = (app, id) => app.evalJs(`document.querySelector('#wz-tutor-tab-${id}')?.click()`);
const BODY = `(() => { const p = document.querySelector('#wz-tutor-panel'); if (!p) return null; const has = (s) => !!p.querySelector(s);
  return { composer: has('.wz-tutor-convo-input'), send: has('.wz-tutor-convo-send'), sections: p.querySelectorAll('.wz-tutor-section').length, roster: p.querySelectorAll('.wz-tutor-fw-preset').length, log: has('.wz-tutor-convo-log'), note: has('.wz-tutor-convo [role=note], .wz-tutor-body > .wz-drawer-note'), draftRoster: has('.wz-tutor-draft-roster'),
    sprint: has('.wz-sprint-feedback'), press: p.querySelectorAll('.wz-sprint-press').length, pressText: (p.querySelector('.wz-sprint-press') || {}).textContent || null, prompts: p.querySelectorAll('.wz-sprint-prompt[data-drawn]').length, promptText: (p.querySelector('.wz-sprint-prompt[data-drawn]') || {}).textContent || null,
    refill: (p.querySelector('.wz-sprint-refill') || {}).textContent || null, noteText: (p.querySelector('.wz-sprint-note') || {}).textContent || null, noteId: (p.querySelector('.wz-sprint-note') || {}).id || null,
    active: document.activeElement ? document.activeElement.tagName + '.' + String(document.activeElement.className).split(' ')[0] : null, links: has('.wz-back-assets, .wz-assets-list, .wz-links-pane') }; })()`;
const press = (app) => app.evalJs("document.querySelector('.wz-sprint-press')?.click()");
const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const COLORS = (sel) => `(() => { const el = document.querySelector(${q(sel)}); if (!el) return null; const parse = (s) => { const m = String(s).match(/[\\d.]+/g); return m ? m.slice(0, 4).map(Number) : null; };
  let bg = null; for (let n = el; n && !bg; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && (c.length < 4 || c[3] > 0.95) && !(c[0] === 0 && c[1] === 0 && c[2] === 0 && c.length === 4 && c[3] === 0)) bg = c; }
  return { fg: parse(getComputedStyle(el).color), bg: bg || [255, 255, 255] }; })()`;

await withHarness(async (app) => {
  await seed(app);

  // ---- SPRINT ----
  await openPage(app, 'sp-p', 'journal');
  await openDrawer(app);
  const tabs = await app.evalJs(TABS);
  const byId = (id) => (tabs || []).find((t) => t.id === id) || {};
  ok('S1 in SPRINT the tab row reads Plan, Assets, Feedback; Plan and Assets are greyed, Feedback is chosen',
    !!tabs && tabs.length === 3 && tabs.map((t) => t.id).join() === 'plan,links,tutor' && byId('plan').disabled === 'true' && byId('links').disabled === 'true' && byId('plan').locked === 'true' && byId('links').locked === 'true' && byId('tutor').disabled === null && byId('tutor').selected === 'true',
    JSON.stringify(tabs));

  await click(app, 'plan'); await sleep(250); await click(app, 'links'); await sleep(250);
  await app.evalJs("document.querySelector('#wz-tutor-tab-tutor')?.focus()");
  for (const key of ['ArrowLeft', 'ArrowLeft', 'ArrowRight', 'Home']) { await app.key(key); await sleep(120); }
  const after = await app.evalJs(TABS);
  const body0 = await app.evalJs(BODY);
  ok('S2 pressing a greyed tab (click, then the arrow keys and Home) changes nothing: Feedback stays chosen and its panel stays',
    !!after && after.find((t) => t.id === 'tutor').selected === 'true' && after.filter((t) => t.selected === 'true').length === 1 && !!body0 && body0.sprint === true, JSON.stringify({ after, sprint: body0 && body0.sprint }));

  ok('S3 the note is on the page in the lexicon words, and each greyed tab points at it',
    !!body0 && body0.noteText === 'Plan and Assets are locked in Sprint. Move to Build to use them.' && !!body0.noteId && byId('plan').by === body0.noteId && byId('links').by === body0.noteId && byId('tutor').by === null,
    JSON.stringify({ note: body0 && body0.noteText, id: body0 && body0.noteId, plan: byId('plan').by, links: byId('links').by }));

  ok('S4 Feedback in SPRINT is the prompt and its button and nothing else: no composer, no Send, no lenses, no roster of three, no log, no Draft asks',
    !!body0 && body0.composer === false && body0.send === false && body0.sections === 0 && body0.roster === 0 && body0.log === false && body0.draftRoster === false && body0.press === 1 && body0.pressText === 'Writing Prompt', JSON.stringify(body0));

  ok('S5 the command-line default retires: opening the drawer in SPRINT puts the caret in no input', !!body0 && !/^INPUT/.test(body0.active || ''), JSON.stringify({ active: body0 && body0.active }));

  // ---- the prompt ----
  await app.evalJs("(() => { window.__nf = []; const f = window.fetch.bind(window); window.fetch = (...a) => { try { window.__nf.push(String(a[0] && a[0].url ? a[0].url : a[0])); } catch { /* ignore */ } return f(...a); }; const o = XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open = function (m, u) { window.__nf.push(String(u)); return o.apply(this, arguments); }; return true; })()");
  const pool = await app.evalJs("window.wrizoTutorFreeWriteDeck ? [...window.wrizoTutorFreeWriteDeck.POOLS.writingPrompt] : null");
  await press(app); await sleep(250);
  const b1 = await app.evalJs(BODY);
  await press(app); await sleep(250);
  const b2 = await app.evalJs(BODY);
  ok('S6 the first press draws a verbatim member of the writing-prompt pool; the button then reads Another Prompt; one prompt stands and a second press replaces it',
    !!pool && !!b1 && pool.includes(b1.promptText) && b1.pressText === 'Another Prompt' && b1.prompts === 1 && !!b2 && b2.prompts === 1 && pool.includes(b2.promptText), JSON.stringify({ first: b1 && b1.promptText, second: b2 && b2.promptText, n: [b1 && b1.prompts, b2 && b2.prompts] }));
  await press(app); await sleep(250);
  const b3 = await app.evalJs(BODY);
  await press(app); await sleep(250);
  const b4 = await app.evalJs(BODY);
  ok('S8 the ceiling stands: after three prompts the fourth press answers with the refill note and the standing prompt stays',
    !!b3 && pool.includes(b3.promptText) && b3.refill === null && !!b4 && b4.refill === 'Write 100 words to unlock more prompts' && b4.promptText === b3.promptText && b4.prompts === 1, JSON.stringify({ third: b3 && b3.promptText, refill: b4 && b4.refill, same: b4 && b3 && b4.promptText === b3.promptText }));
  const nf = await app.evalJs('window.__nf');
  ok('S7 a press sends nothing: no request to the Tutor or the network across the presses', Array.isArray(nf) && nf.filter((u) => /tutor|chat|anthropic|api\/ai|consult/i.test(u)).length === 0, JSON.stringify(nf && nf.slice(0, 6)));

  const c1 = await app.evalJs(COLORS('#wz-tutor-tab-plan'));
  const c2 = await app.evalJs(COLORS('.wz-sprint-note'));
  const r1 = c1 ? ratio(c1.fg, c1.bg) : 0;
  const r2 = c2 ? ratio(c2.fg, c2.bg) : 0;
  ok('S9 contrast: the greyed tabs read at 3:1 or more on the drawer, the note at 4.5:1 or more', r1 >= 3 && r2 >= 4.5, JSON.stringify({ tab: Math.round(r1 * 100) / 100, note: Math.round(r2 * 100) / 100, c1, c2 }));

  // ---- BUILD ----
  await openPage(app, 'sp-p', 'drafting');
  await openDrawer(app);
  const bt = await app.evalJs(TABS);
  const buildOk = !!bt && bt.length === 3 && bt.every((t) => t.disabled === null && t.locked === null);
  await click(app, 'plan'); await sleep(350);
  const planSel = (await app.evalJs(TABS) || []).find((t) => t.selected === 'true');
  await click(app, 'links'); await sleep(350);
  const linksSel = (await app.evalJs(TABS) || []).find((t) => t.selected === 'true');
  await click(app, 'tutor'); await sleep(350);
  const bb = await app.evalJs(BODY);
  // SUPERSEDED (the FEEDBACK lens frame, Fable, Nov 20, 11:15 pm: in BUILD the Back menu's FEEDBACK is the lens frame plus Ask Your Own, replacing the four asks and the three computed sections). The original, verbatim:
  // ok('S10 in BUILD (Draft) nothing is locked: the three tabs press, and Feedback is today\'s Tutor (the composer, the lenses, the Draft asks)',
  //   buildOk && !!planSel && planSel.id === 'plan' && !!linksSel && linksSel.id === 'links' && !!bb && bb.sprint === false && bb.composer === true && bb.sections >= 2 && bb.draftRoster === true, JSON.stringify({ buildOk, planSel: planSel && planSel.id, linksSel: linksSel && linksSel.id, bb }));
  const lensN = await app.evalJs("document.querySelectorAll('.wz-tutor-panel [data-lens]').length");
  // SUPERSEDED (L9, the Tutor's notes on file: the notes are a section of their own on this tab, which the count of every section took for a computed one). The original, verbatim:
  // ok('S10 [successor: the lens frame] in BUILD (Draft) nothing is locked: the three tabs press, and Feedback is the lens frame and the composer (three lenses, no Draft asks, no computed sections)',
  //   buildOk && !!planSel && planSel.id === 'plan' && !!linksSel && linksSel.id === 'links' && !!bb && bb.sprint === false && bb.composer === true && bb.sections === 0 && bb.draftRoster === false && lensN === 3, JSON.stringify({ buildOk, planSel: planSel && planSel.id, linksSel: linksSel && linksSel.id, bb, lensN }));
  const others = await app.evalJs(`document.querySelectorAll('#wz-tutor-panel .wz-tutor-section:not([data-testid="tutor-notes"])').length`);
  const notesN = await app.evalJs(`document.querySelectorAll('#wz-tutor-panel [data-testid="tutor-notes"]').length`);
  ok('S10 [successor: notes on file] in BUILD (Draft) nothing is locked: the three tabs press, and Feedback is the lens frame and the composer (three lenses, no Draft asks, no computed sections), with the notes on file as its one section',
    buildOk && !!planSel && planSel.id === 'plan' && !!linksSel && linksSel.id === 'links' && !!bb && bb.sprint === false && bb.composer === true && others === 0 && notesN === 1 && bb.sections === 1 && bb.draftRoster === false && lensN === 3, JSON.stringify({ buildOk, planSel: planSel && planSel.id, linksSel: linksSel && linksSel.id, bb, others, notesN, lensN }));

  // ---- the switch off ----
  await openPage(app, 'sp-p', 'journal', { reorg: false });
  await openDrawer(app);
  const off = await app.evalJs("(() => ({ tabs: [...document.querySelectorAll('[id^=wz-tutor-tab-]')].map((b) => ({ t: b.textContent.trim(), disabled: b.getAttribute('aria-disabled'), locked: b.getAttribute('data-locked') })), composer: !!document.querySelector('.wz-tutor-convo-input'), roster: document.querySelectorAll('.wz-tutor-fw-preset').length, sprint: !!document.querySelector('.wz-sprint-feedback') }))()");
  ok('S11 with the switch off, Machina Free Write has today\'s Consultant tab: two tabs, none locked, the composer, the three presets, no sprint panel',
    !!off && off.tabs.length === 2 && off.tabs.every((t) => t.disabled === null && t.locked === null) && off.composer === true && off.roster === 3 && off.sprint === false, JSON.stringify(off));

  // ---- the mode follows ----
  await openPage(app, 'sp-p', 'drafting');
  await openDrawer(app);
  const d0 = await app.evalJs(TABS);
  await app.evalJs("localStorage.setItem('wrizo-mode-page-sp-p', 'journal')");
  await openPage(app, 'sp-p', 'journal');
  await openDrawer(app);
  const d1 = await app.evalJs(TABS);
  await openPage(app, 'sp-p', 'drafting');
  await openDrawer(app);
  await click(app, 'plan'); await sleep(300);
  const d2 = (await app.evalJs(TABS) || []).find((t) => t.selected === 'true');
  ok('S12 the menu follows the mode: Draft opens unlocked, Free Write locks Plan and Assets, back in Draft Plan presses again',
    !!d0 && d0.every((t) => t.locked === null) && !!d1 && d1.filter((t) => t.locked === 'true').length === 2 && !!d2 && d2.id === 'plan', JSON.stringify({ d0, d1, d2 }));
});

const failed = checks.filter((c) => !c.pass);
console.log(failed.length === 0 ? `\nREORG-SPRINT-BACK VERIFY: PASS (${checks.length} checks)` : `\nREORG-SPRINT-BACK VERIFY: FAIL - ${failed.length}/${checks.length} failed`);
process.exit(failed.length === 0 ? 0 : 1);
