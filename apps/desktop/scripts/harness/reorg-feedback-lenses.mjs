// THE FEEDBACK LENS FRAME (Fable, Nov 20, 11:15 pm: "your section 3b item 1, the FEEDBACK lens rebuild (Structure / Tone / Consistency, <=3 prompts each, plus Ask Your Own; EDIT adds Usage / Punctuation /
// Citations above them). Build the frame now; the Wrizors draft the prompts' words for Nick's yes, and you drop them in when ruled."). Nick's F2 and F3 (machina-stage-menus-decide.md, draft 3): BUILD's FEEDBACK
// is Structure, Tone, Consistency "replacing the asks", each opening to at most three prompts, plus "Ask Your Own"; EDIT adds Usage, Punctuation, Citations above them. Behind ?reorg=1, Machina, on a page.
// THE WORDS ARE RULED (Nick, Nov 20, 11:43 pm: all 18 prompts and the placeholder, claude/wrizors/feedback-lens-prompts-draft.md draft 2; prompts in sentence case, lens names in Title Case): all six lenses are drawn.
// [successor to the first frame, which drew only Structure and Consistency with the words ruled so far.] The rules (order, the cap of three, empty lenses undrawn) are proved on a full dummy table by
// reorg-feedback-lenses-unit.mjs; this file proves what the Back menu draws and does.
//   FL1  BUILD: FEEDBACK draws Structure, Tone, Consistency, each a disclosure closed by default; today's four-ask roster and the three computed sections (Consistency, Structure, Fragments) are gone
//   FL2  opening a lens shows its three approved prompts verbatim (Structure, Tone, Consistency)
//   FL3  pressing a prompt STAGES it in the composer, caret at the end, and sends nothing (no request); a second press REPLACES it
//   FL4  the composer is "Ask Your Own" (the heading) with the placeholder "Ask about this Doc…"; empty it cannot send, staged it can
//   FL5  EDIT (Revise): Usage, Punctuation, Citations ABOVE Structure, Tone, Consistency, each lens's three prompts verbatim, and a press stages there too (the old asks were BUILD-only)
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

// THE APPROVED WORDS, VERBATIM (feedback-lens-prompts-draft.md draft 2). Citations 2 reads "Are my citations in one style?" until a Doc has a style guide (the draft's own fallback: the Doc's style guide is not built yet).
const W = {
  structure: ['Where does my main point first show up?', 'Which paragraph could move or go?', 'Does each Part do one job?'],
  tone: ['Where does my tone shift?', 'Who does this sound written for?', 'Which lines sound stiffer or looser than the rest?'],
  consistency: ['Which term is doing two jobs?', 'Where do names, dates or numbers disagree?', 'Where do tense or point of view slip?'],
  usage: ['Which words am I using wrong?', 'Where am I wordy?', 'Which words do I repeat too much?'],
  punctuation: ['Where are my commas off?', 'Which sentences run on?', 'Are my quotation marks and apostrophes right?'],
  citations: ['Which claims need a source?', 'Are my citations in one style?', 'Is every source I cite in my sources list?'],
};
const NAMES = { structure: 'Structure', tone: 'Tone', consistency: 'Consistency', usage: 'Usage', punctuation: 'Punctuation', citations: 'Citations' };
const PLACEHOLDER = 'Ask about this Doc\u2026';

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
  ok('FL1 BUILD: FEEDBACK draws Structure, Tone, Consistency, each closed by default; the four-ask roster and the three computed sections are gone',
    !!lenses && lenses.map((l) => l.id).join() === 'structure,tone,consistency' && lenses.every((l) => l.expanded === 'false' && l.prompts.length === 0) && old.roster === 0 && old.sections.length === 0, { lenses, old });

  for (const id of ['structure', 'tone', 'consistency']) await click(app, `[data-lens="${id}"] .wz-lens-head`);
  await sleep(300);
  const open = await app.evalJs(LENSES);
  ok('FL2 opening a lens shows its three approved prompts verbatim (Structure, Tone, Consistency), and the names read in Title Case',
    !!open && open.length === 3 && open.every((l) => l.expanded === 'true' && l.prompts.map(norm).join('|') === W[l.id].join('|') && norm(l.name).replace(/[\u25B8\u25BE]/g, '') === NAMES[l.id]), open);

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
    !!s1 && norm(s1.v) === W.structure[0] && s1.at === s1.len && !!s2 && norm(s2.v) === W.consistency[1] && reqs === 0 && logAfter === logBefore, { s1, s2, reqs, logBefore, logAfter });

  // ---- FL4 ----
  const own = await app.evalJs("(() => ({ head: (document.querySelector('.wz-tutor-convo > .wz-tutor-h') || {}).textContent, ph: (document.querySelector('.wz-tutor-convo-input') || {}).placeholder, sendOn: !document.querySelector('.wz-tutor-convo-send').disabled }))()");
  await app.evalJs("(() => { const i = document.querySelector('.wz-tutor-convo-input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, ''); i.dispatchEvent(new Event('input', { bubbles: true })); })()"); await sleep(300);
  const emptied = await app.evalJs("!document.querySelector('.wz-tutor-convo-send').disabled");
  ok('FL4 the composer is headed "Ask Your Own" with the placeholder "Ask about this Doc…"; staged it can send, empty it cannot', norm(own.head) === 'Ask Your Own' && own.ph === PLACEHOLDER && own.sendOn === true && emptied === false, { own, emptied });

  // ---- FL7 ----
  const keep = await app.evalJs("(() => ({ dock: !!document.querySelector('.wz-tutor-dock-btn'), convo: !!document.querySelector('.wz-tutor-convo-log') }))()");
  ok('FL7 the dock button and the conversation are still there in BUILD', keep.dock && keep.convo, keep);

  // ---- FL5 ----
  await openPage(app, 'fl-p', 'revise'); await openDrawer(app); await feedbackTab(app);
  for (const id of ['usage', 'punctuation', 'citations', 'structure', 'tone', 'consistency']) await click(app, `[data-lens="${id}"] .wz-lens-head`);
  await sleep(300);
  const editLenses = await app.evalJs(LENSES);
  await app.evalJs("document.querySelectorAll('[data-lens=\"usage\"] [data-lens-prompt]')[1]?.click()"); await sleep(400);
  const e1 = await app.evalJs("(document.querySelector('.wz-tutor-convo-input') || {}).value");
  const editOld = await app.evalJs(OLD);
  ok('FL5 EDIT (Revise): Usage, Punctuation, Citations above Structure, Tone, Consistency, every prompt verbatim; no roster; a press stages there too',
    !!editLenses && editLenses.map((l) => l.id).join() === 'usage,punctuation,citations,structure,tone,consistency' && editLenses.every((l) => l.prompts.map(norm).join('|') === W[l.id].join('|')) && norm(e1) === W.usage[1] && editOld.roster === 0, { ids: editLenses && editLenses.map((l) => l.id), e1, editOld });

  // ---- FL8 ----
  await openPage(app, 'fl-p', 'journal'); await openDrawer(app); await feedbackTab(app);
  const sprintLens = await app.evalJs("document.querySelectorAll('.wz-tutor-panel [data-lens]').length");
  ok('FL8 SPRINT draws no lens (it keeps its one writing prompt)', sprintLens === 0, { sprintLens });

  // ---- FL6 ----
  await openPage(app, 'fl-p', 'drafting', { reorg: false }); await openDrawer(app);
  const offOld = await app.evalJs(OLD);
  await openPage(app, 'fl-p', 'drafting', { theme: 'plateau' }); await openDrawer(app);   // Arbor's id in the theme store is 'plateau' ('arbor' is no registered theme: the first form of this leg ran in Machina, with the Feedback tab never opened)
  const arborLens = await app.evalJs("document.querySelectorAll('[data-lens]').length + (document.getElementById('wz-tutor-tab-plan') ? 1 : 0) + (document.documentElement.getAttribute('data-theme') === 'plateau' ? 0 : 1)");
  ok('FL6 with the switch off (Machina) today\'s Consultant stands (the four-ask roster, no lens frame); in Arbor with it on, no lens frame', offOld.roster === 4 && offOld.lens === 0 && arborLens === 0, { offOld, arborLens });

  // ---- FL9 ----
  const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
  const code = ['components/Tutor.tsx', 'reorg/backMenu/LensPanel.tsx', 'reorg/backMenu/feedbackLenses.ts'].map((f) => (fs.existsSync(path.join(SRC, f)) ? read(f) : '').replace(/\/\/.*$/gm, '')).join('\n');
  const lex = read('store/lexicon/canonical/chrome.ts');
  const words = [...Object.values(W).flat(), PLACEHOLDER, 'Ask Your Own', ...Object.values(NAMES)];
  const inCode = words.filter((w) => code.includes(`'${w}'`) || code.includes(`"${w}"`) || code.includes(`>${w}<`));
  const missing = words.filter((w) => !lex.includes(`"${w}"`) && !lex.includes(`'${w}'`));
  ok('FL9 every prompt and lens name is a lexicon word, none written into the components', inCode.length === 0 && missing.length === 0, { inCode, missing });
  return checks;
});

const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nREORG-FEEDBACK-LENSES VERIFY: PASS (${checks.length} checks)` : `\nREORG-FEEDBACK-LENSES VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
