// THE FEEDBACK LENS FRAME (Fable, Nov 20, 11:15 pm: "your section 3b item 1, the FEEDBACK lens rebuild (Structure / Tone / Consistency, <=3 prompts each, plus Ask Your Own; EDIT adds Usage / Punctuation /
// Citations above them). Build the frame now; the Wrizors draft the prompts' words for Nick's yes, and you drop them in when ruled."). Nick's F2 and F3 (machina-stage-menus-decide.md, draft 3): BUILD's FEEDBACK
// is Structure, Tone, Consistency "replacing the asks", each opening to at most three prompts, plus "Ask Your Own"; EDIT adds Usage, Punctuation, Citations above them. Behind ?reorg=1, Machina, on a page.
// Only RULED words are drawn: Structure's three (Nick's approved asks) and Consistency's two; Tone, Usage, Punctuation and Citations have no ruled prompt yet, so they are not drawn (the frame never shows an
// empty promise) and appear when the table (reorg/backMenu/feedbackLenses.ts) is given their words. The rules (order, the cap of three, empty lenses undrawn) are proved on a full dummy table by
// reorg-feedback-lenses-unit.mjs; this file proves what the Back menu draws and does.
//   FL1  BUILD: FEEDBACK draws the lens frame: Structure and Consistency (the ruled ones), each a disclosure closed by default; today's four-ask roster and the three computed sections (Consistency, Structure, Fragments) are gone
//   FL2  opening a lens shows its ruled prompts verbatim: Structure three, Consistency two
//   FL3  pressing a prompt STAGES it in the composer, caret at the end, and sends nothing (no request); a second press REPLACES it
//   FL4  the composer is "Ask Your Own" (the heading), empty it cannot send, staged it can
//   FL5  EDIT (Revise): the same frame, and a press stages there too (the old asks were BUILD-only)
//   FL6  with the switch off (Machina) today's Consultant stands: the four-ask roster, no lens frame; in Arbor with the switch on, none either
//   FL7  the dock button and the Bible are still there in BUILD
//   FL8  SPRINT draws no lens (it keeps its one writing prompt)
//   FL9  every prompt and lens name is a lexicon word, none written into the components
// Run (the Actions harness):  node apps/desktop/scripts/harness/reorg-feedback-lenses.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 800)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);

const STRUCTURE = ["What's load-bearing here — and what could go?", 'What is the claim here, and where is the evidence?', 'Who is the reader, and what do they need first?'];
const CONSISTENCY = ['Where does the thread slip?', 'Which term is doing two jobs?'];

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.evalJs(`window.wrizoCreateJournalPage(${q({ id: 'fl-p', text: 'The first line of a page that has some words on it, so the page is not empty.', createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose' })}); window.wrizoFlushNow(); true`);
}
async function openPage(app, id, mode, { theme = 'machina', reorg = true } = {}) {
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs(`window.wrizoTheme.set('${theme}'); localStorage.setItem('wrizo-mode-page-${id}', '${mode}')`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const openDrawer = async (app) => {
  const open = await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'");
  if (!open) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(700); }
};
const feedbackTab = async (app) => { await app.evalJs("document.getElementById('wz-tutor-tab-tutor')?.click()"); await sleep(500); };
const click = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${q(sel)}); if (!b) return false; b.click(); return true; })()`);
const LENSES = "(() => [...document.querySelectorAll('.wz-tutor-panel [data-lens]')].map((s) => ({ id: s.getAttribute('data-lens'), name: (s.querySelector('.wz-lens-head') || {}).textContent, expanded: (s.querySelector('.wz-lens-head') || {}).getAttribute && s.querySelector('.wz-lens-head').getAttribute('aria-expanded'), prompts: [...s.querySelectorAll('[data-lens-prompt]')].map((b) => b.textContent.trim()) })))()";
const OLD = "(() => ({ roster: document.querySelectorAll('.wz-tutor-panel .wz-tutor-draft-roster .wz-tutor-draft-ask').length, sections: [...document.querySelectorAll('.wz-tutor-panel .wz-tutor-sections .wz-tutor-h')].map((h) => h.textContent.trim()).filter((t) => /Consistency|Structure|Fragments/.test(t)), lens: document.querySelectorAll('.wz-tutor-panel [data-lens]').length }))()";
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

await withHarness(async (app) => {
  await seed(app);

  // ---- BUILD ----
  await openPage(app, 'fl-p', 'drafting'); await openDrawer(app); await feedbackTab(app);
  const lenses = await app.evalJs(LENSES);
  const old = await app.evalJs(OLD);
  ok('FL1 BUILD: FEEDBACK draws the lens frame: Structure and Consistency (the ruled ones), each closed by default; the four-ask roster and the three computed sections are gone',
    !!lenses && lenses.map((l) => l.id).join() === 'structure,consistency' && lenses.every((l) => l.expanded === 'false' && l.prompts.length === 0) && old.roster === 0 && old.sections.length === 0, { lenses, old });

  await click(app, '[data-lens="structure"] .wz-lens-head'); await click(app, '[data-lens="consistency"] .wz-lens-head'); await sleep(300);
  const open = await app.evalJs(LENSES);
  ok('FL2 opening a lens shows its ruled prompts verbatim: Structure three, Consistency two',
    !!open && open[0].expanded === 'true' && open[0].prompts.map(norm).join('|') === STRUCTURE.join('|') && open[1].prompts.map(norm).join('|') === CONSISTENCY.join('|'), open);

  // ---- FL3 ----
  await app.evalJs("window.__reqs = 0; const f = window.fetch; window.fetch = function () { window.__reqs += 1; return f.apply(this, arguments); }; const o = XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open = function () { window.__reqs += 1; return o.apply(this, arguments); }; true");
  const logBefore = await app.evalJs("document.querySelectorAll('.wz-tutor-convo-log .wz-tutor-msg').length");
  await click(app, '[data-lens="structure"] [data-lens-prompt]:nth-child(1)');
  await app.evalJs("document.querySelectorAll('[data-lens=\"structure\"] [data-lens-prompt]')[0]?.click()"); await sleep(400);
  const s1 = await app.evalJs("(() => { const i = document.querySelector('.wz-tutor-convo-input'); return i ? { v: i.value, at: i.selectionStart, len: i.value.length, focus: document.activeElement === i } : null; })()");
  await app.evalJs("document.querySelectorAll('[data-lens=\"consistency\"] [data-lens-prompt]')[1]?.click()"); await sleep(400);
  const s2 = await app.evalJs("(() => { const i = document.querySelector('.wz-tutor-convo-input'); return i ? { v: i.value } : null; })()");
  const reqs = await app.evalJs('window.__reqs');
  const logAfter = await app.evalJs("document.querySelectorAll('.wz-tutor-convo-log .wz-tutor-msg').length");
  ok('FL3 a press STAGES the prompt in the composer (caret at the end) and sends nothing; a second press REPLACES it',
    !!s1 && norm(s1.v) === STRUCTURE[0] && s1.at === s1.len && !!s2 && norm(s2.v) === CONSISTENCY[1] && reqs === 0 && logAfter === logBefore, { s1, s2, reqs, logBefore, logAfter });

  // ---- FL4 ----
  const own = await app.evalJs("(() => ({ head: (document.querySelector('.wz-tutor-convo > .wz-tutor-h') || {}).textContent, sendOn: !document.querySelector('.wz-tutor-convo-send').disabled }))()");
  await app.evalJs("(() => { const i = document.querySelector('.wz-tutor-convo-input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, ''); i.dispatchEvent(new Event('input', { bubbles: true })); })()"); await sleep(300);
  const emptied = await app.evalJs("!document.querySelector('.wz-tutor-convo-send').disabled");
  ok('FL4 the composer is headed "Ask Your Own"; staged it can send, empty it cannot', norm(own.head) === 'Ask Your Own' && own.sendOn === true && emptied === false, { own, emptied });

  // ---- FL7 ----
  const keep = await app.evalJs("(() => ({ dock: !!document.querySelector('.wz-tutor-dock-btn'), convo: !!document.querySelector('.wz-tutor-convo-log') }))()");
  ok('FL7 the dock button and the conversation are still there in BUILD', keep.dock && keep.convo, keep);

  // ---- FL5 ----
  await openPage(app, 'fl-p', 'revise'); await openDrawer(app); await feedbackTab(app);
  const editLenses = await app.evalJs(LENSES);
  await click(app, '[data-lens="structure"] .wz-lens-head'); await sleep(300);
  await app.evalJs("document.querySelectorAll('[data-lens=\"structure\"] [data-lens-prompt]')[1]?.click()"); await sleep(400);
  const e1 = await app.evalJs("(document.querySelector('.wz-tutor-convo-input') || {}).value");
  const editOld = await app.evalJs(OLD);
  ok('FL5 EDIT (Revise): the same frame, no roster, and a press stages there too', !!editLenses && editLenses.map((l) => l.id).join() === 'structure,consistency' && norm(e1) === STRUCTURE[1] && editOld.roster === 0, { editLenses: editLenses && editLenses.map((l) => l.id), e1, editOld });

  // ---- FL8 ----
  await openPage(app, 'fl-p', 'journal'); await openDrawer(app); await feedbackTab(app);
  const sprintLens = await app.evalJs("document.querySelectorAll('.wz-tutor-panel [data-lens]').length");
  ok('FL8 SPRINT draws no lens (it keeps its one writing prompt)', sprintLens === 0, { sprintLens });

  // ---- FL6 ----
  await openPage(app, 'fl-p', 'drafting', { reorg: false }); await openDrawer(app);
  const offOld = await app.evalJs(OLD);
  await openPage(app, 'fl-p', 'drafting', { theme: 'arbor' }); await openDrawer(app);
  const arborLens = await app.evalJs("document.querySelectorAll('[data-lens]').length");
  ok('FL6 with the switch off (Machina) today\'s Consultant stands (the four-ask roster, no lens frame); in Arbor with it on, no lens frame', offOld.roster === 4 && offOld.lens === 0 && arborLens === 0, { offOld, arborLens });

  // ---- FL9 ----
  const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
  const code = ['components/Tutor.tsx', 'reorg/backMenu/LensPanel.tsx', 'reorg/backMenu/feedbackLenses.ts'].map((f) => (fs.existsSync(path.join(SRC, f)) ? read(f) : '').replace(/\/\/.*$/gm, '')).join('\n');
  const lex = read('store/lexicon/canonical/chrome.ts');
  const words = [...STRUCTURE, ...CONSISTENCY, 'Ask Your Own', 'Structure', 'Consistency', 'Tone', 'Usage', 'Punctuation', 'Citations'];
  const inCode = words.filter((w) => code.includes(`'${w}'`) || code.includes(`"${w}"`) || code.includes(`>${w}<`));
  const missing = words.filter((w) => !lex.includes(`"${w}"`) && !lex.includes(`'${w}'`));
  ok('FL9 every prompt and lens name is a lexicon word, none written into the components', inCode.length === 0 && missing.length === 0, { inCode, missing });
  return checks;
});

const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nREORG-FEEDBACK-LENSES VERIFY: PASS (${checks.length} checks)` : `\nREORG-FEEDBACK-LENSES VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
