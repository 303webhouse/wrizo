// TUTOR-B ITEM 7 STEP 1 — THE NOTES-ON-FILE SCREEN (components/TutorNotes.tsx, store/tutorNotes.ts). A CDP scenario against the real rendered bundle and runtime-verify.mjs's notes double
// (which answers the real server's contract in memory; the server's own rules are tutor-notes.mjs's). Run: node scripts/harness/tutor-notes-screen.mjs (from apps/desktop, dist-web freshly built).
// NEEDS A BOX TURN or an Actions run (a browser harness); written without being run on the box: the first run is the red-on-main / green-on-branch proof.
//   NS1  the section: in the Tutor's panel, titled by its lexicon string; empty at first ("Nothing on file."); opening the panel makes ONE list call and no row
//   NS2  kept only on her yes: a PROPOSAL (window.wrizoProposeNote) shows a card with Yes and No; showing it, and No, make NO call and no row; Yes makes exactly one POST (source "proposed") and the card goes
//   NS3  she writes her own: kind + text + Add makes one POST (source "own"), the note is listed, the input clears; a reload brings it back from the server (the proposal does not survive a reload)
//   NS4  edit: Edit shows a text box and a kind; Save makes one PATCH and the list shows the change; Escape makes no call
//   NS5  delete one: Delete makes one DELETE of that id at once, with no confirm
//   NS6  wipe all: ONE confirm first with the words "can't be undone"; Cancel makes no DELETE; the confirmed wipe makes exactly one DELETE of the collection; the list and the server's table are empty
//   NS7  an act that does not reach the server says so in one quiet line and changes nothing on screen (the note is not shown as added, the input keeps her words)
//   NS8  PAGE IS PRIMARY: with the section open and every act above done, the editor's rect, text and mounted-ness never changed (adding, editing, deleting, wiping, proposing); and no control here puts a byte on the page
//   NS9  every string is the lexicon's; signed out the section renders nothing and calls nothing (source scan: the hook returns before any fetch)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FLUSH = 420;
const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', 'src');
const SEC = '[data-testid="tutor-notes"]';

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};
const freshProsePage = async (app) => {
  await freshDesk(app);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(FLUSH);
};
const openTutor = async (app) => { await app.evalJs("document.querySelector('.wz-tutor-grip').click()"); await sleep(300); };
const lex = (app, term) => app.evalJs(`window.wrizoDeskLexicon.t(${JSON.stringify(term)})`);
const notesState = (app) => app.evalJs("fetch('/api/_notes_state').then(r => r.json())");
const notesMode = (app, m) => app.evalJs(`fetch('/api/_notes_mode', { method: 'POST', body: JSON.stringify(${JSON.stringify(m)}) }).then(r => r.json())`);
const callsOf = async (app, method) => (await notesState(app)).calls.filter((c) => !method || c.method === method);
const sectionText = (app) => app.evalJs(`document.querySelector(${JSON.stringify(SEC)})?.textContent ?? null`);
// click a button inside the section by its exact text
const clickBtn = (app, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(SEC + ' button')})].find((x) => x.textContent.trim() === ${JSON.stringify(text)}); if (!b) throw new Error('no button ' + ${JSON.stringify(text)}); b.click(); return true; })()`);
const hasBtn = (app, text) => app.evalJs(`[...document.querySelectorAll(${JSON.stringify(SEC + ' button')})].some((x) => x.textContent.trim() === ${JSON.stringify(text)})`);
const editorProbe = (app) => app.evalJs(`(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return null; const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height, text: e.textContent }; })()`);
const same = (a, b) => !!a && !!b && a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height && a.text === b.text;
const ADD_INPUT = `${SEC} .wz-tutor-bible-row .wz-tutor-bible-input`;

await withHarness(async (app) => {
  await freshProsePage(app);
  await notesMode(app, { reset: true });
  await openTutor(app);
  await app.waitFor(`!!document.querySelector(${JSON.stringify(SEC)})`, { label: 'the notes section in the Tutor panel' });
  await sleep(300);
  const before = await editorProbe(app);

  // NS1
  const title = await lex(app, 'tutorNotesTitle');
  const empty = await lex(app, 'tutorNotesEmpty');
  const t1 = await sectionText(app);
  ok('NS1 the section is in the panel, titled by its lexicon string', !!t1 && t1.includes(title), String(t1).slice(0, 120));
  ok('NS1 empty at first: "Nothing on file."', !!t1 && t1.includes(empty), String(t1).slice(0, 120));
  const c1 = await callsOf(app);
  ok('NS1 opening the panel makes one list call and nothing else (no row, no write)', c1.length >= 1 && c1.every((c) => c.method === 'GET') && (await notesState(app)).notes.length === 0, JSON.stringify(c1.map((c) => c.method)));

  // NS2: a proposal is only an offer
  const yes = await lex(app, 'tutorNotesYes'); const no = await lex(app, 'tutorNotesNo'); const asked = await lex(app, 'tutorNotesProposed');
  await notesMode(app, { reset: true });
  await app.evalJs("window.wrizoProposeNote({ kind: 'blocker', text: 'Stalls on opening lines.' })");
  await sleep(150);
  const card = await app.evalJs(`document.querySelector('[data-testid="tutor-notes-proposal"]')?.textContent ?? null`);
  ok('NS2 a proposal shows a card with her yes and no, saying what would be kept', !!card && card.includes(asked) && card.includes('Stalls on opening lines.') && card.includes(yes) && card.includes(no), String(card).slice(0, 160));
  ok('NS2 showing it makes no call and no row', (await callsOf(app)).length === 0 && (await notesState(app)).notes.length === 0);
  await clickBtn(app, no); await sleep(200);
  ok('NS2 No: the card goes, and still no call and no row (nothing was ever saved)', !(await app.evalJs(`!!document.querySelector('[data-testid="tutor-notes-proposal"]')`)) && (await callsOf(app)).length === 0 && (await notesState(app)).notes.length === 0);
  await app.evalJs("window.wrizoProposeNote({ kind: 'goal', text: 'Finish the first draft by spring.' })");
  await sleep(150);
  await clickBtn(app, yes); await sleep(300);
  const posts = await callsOf(app, 'POST');
  ok('NS2 Yes: exactly one POST, source "proposed", with her kind and text; the card goes; the note is listed', posts.length === 1 && posts[0].body.source === 'proposed' && posts[0].body.kind === 'goal' && posts[0].body.text === 'Finish the first draft by spring.' && !(await app.evalJs(`!!document.querySelector('[data-testid="tutor-notes-proposal"]')`)) && (await sectionText(app)).includes('Finish the first draft by spring.'), JSON.stringify(posts));

  // NS3: her own
  await app.evalJs(`(() => { const s = document.querySelector(${JSON.stringify(SEC + ' select')}); const set = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set; set.call(s, 'interest'); s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await app.setText('Loves short scenes.', ADD_INPUT);
  await clickBtn(app, await lex(app, 'tutorBibleAdd')); await sleep(300);
  const posts2 = await callsOf(app, 'POST');
  ok('NS3 her own note: one more POST, source "own", the kind she picked', posts2.length === 2 && posts2[1].body.source === 'own' && posts2[1].body.kind === 'interest' && posts2[1].body.text === 'Loves short scenes.', JSON.stringify(posts2[1]));
  ok('NS3 it is listed and the input is empty again', (await sectionText(app)).includes('Loves short scenes.') && (await app.evalJs(`document.querySelector(${JSON.stringify(ADD_INPUT)}).value`)) === '');
  await app.evalJs("window.wrizoProposeNote({ kind: 'tendency', text: 'A proposal that must not survive a reload.' })");
  await sleep(100);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'editor after reload' });
  await openTutor(app);
  await app.waitFor(`!!document.querySelector(${JSON.stringify(SEC)})`, { label: 'notes section after reload' });
  await sleep(400);
  const t3 = await sectionText(app);
  ok('NS3 after a reload both kept notes come back from the server, and the unanswered proposal is gone', t3.includes('Finish the first draft by spring.') && t3.includes('Loves short scenes.') && !t3.includes('must not survive') && (await notesState(app)).notes.length === 2, String(t3).slice(0, 200));

  // NS4: edit
  const edit = await lex(app, 'tutorBibleEdit'); const save = await lex(app, 'tutorBibleSave');
  await clickBtn(app, edit); await sleep(150);
  const hasBox = await app.evalJs(`!!document.querySelector(${JSON.stringify(SEC + ' .wz-tutor-bible-edit input')}) && !!document.querySelector(${JSON.stringify(SEC + ' .wz-tutor-bible-edit select')})`);
  const callsBefore = (await callsOf(app)).length;
  await app.key('Escape'); await sleep(150);
  ok('NS4 Edit shows a text box and a kind; Escape closes it with no call', hasBox && !(await app.evalJs(`!!document.querySelector(${JSON.stringify(SEC + ' .wz-tutor-bible-edit')})`)) && (await callsOf(app)).length === callsBefore);
  await clickBtn(app, edit); await sleep(150);
  await app.setText('Finish the first draft by summer.', `${SEC} .wz-tutor-bible-edit input`);
  await clickBtn(app, save); await sleep(300);
  const patches = await callsOf(app, 'PATCH');
  ok('NS4 Save: exactly one PATCH of that note, and the list shows the change', patches.length === 1 && patches[0].body.text === 'Finish the first draft by summer.' && (await sectionText(app)).includes('by summer.') && !(await sectionText(app)).includes('by spring.'), JSON.stringify(patches));

  // NS5: delete one, no confirm
  const del = await lex(app, 'tutorBibleDelete');
  await clickBtn(app, del); await sleep(300);
  const dels = await callsOf(app, 'DELETE');
  ok('NS5 Delete: one DELETE of one note at once, no confirm asked, and one note is left', dels.length === 1 && /\/api\/tutor\/notes\/[0-9a-f-]{36}$/.test(dels[0].path) && !(await app.evalJs(`!!document.querySelector('[data-testid="tutor-notes-wipe-confirm"]')`)) && (await notesState(app)).notes.length === 1);

  // NS6: wipe
  await notesMode(app, { seed: [{ kind: 'goal', text: 'Second seeded note.' }, { kind: 'blocker', text: 'Third seeded note.' }] });
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'editor after seed reload' });
  await openTutor(app);
  await app.waitFor(`!!document.querySelector(${JSON.stringify(SEC)})`, { label: 'notes section after seed' });
  await sleep(400);
  const wipe = await lex(app, 'tutorNotesWipe'); const ask = await lex(app, 'tutorNotesWipeAsk'); const wipeYes = await lex(app, 'tutorNotesWipeYes'); const cancel = await lex(app, 'tutorBibleCancel');
  const delsBefore = (await callsOf(app, 'DELETE')).length;
  await clickBtn(app, wipe); await sleep(150);
  const confirmText = await app.evalJs(`document.querySelector('[data-testid="tutor-notes-wipe-confirm"]')?.textContent ?? null`);
  ok('NS6 Wipe asks ONCE first, in the words "this can\'t be undone", and makes no call yet', !!confirmText && confirmText.includes(ask) && /can't be undone/.test(confirmText) && (await callsOf(app, 'DELETE')).length === delsBefore, String(confirmText));
  await clickBtn(app, cancel); await sleep(150);
  ok('NS6 Cancel: the confirm goes, no DELETE, every note still there', !(await app.evalJs(`!!document.querySelector('[data-testid="tutor-notes-wipe-confirm"]')`)) && (await callsOf(app, 'DELETE')).length === delsBefore && (await notesState(app)).notes.length === 3);
  await clickBtn(app, wipe); await sleep(100);
  await clickBtn(app, wipeYes); await sleep(300);
  const wipes = (await callsOf(app, 'DELETE')).filter((c) => c.path === '/api/tutor/notes');
  ok('NS6 the confirmed wipe: exactly one DELETE of the collection; the server\'s table is empty; the screen says "Nothing on file."', wipes.length === 1 && (await notesState(app)).notes.length === 0 && (await sectionText(app)).includes(empty));

  // NS7: an act that does not reach the server
  await notesMode(app, { fail: true });
  await app.setText('This will not be saved.', ADD_INPUT);
  await clickBtn(app, await lex(app, 'tutorBibleAdd')); await sleep(300);
  const failedLine = await lex(app, 'tutorNotesFailed');
  const t7 = await sectionText(app);
  ok('NS7 offline: one quiet line says it did not go through, the note is not shown as added, and the input keeps her words', t7.includes(failedLine) && !t7.includes('This will not be saved.') && (await app.evalJs(`document.querySelector(${JSON.stringify(ADD_INPUT)}).value`)) === 'This will not be saved.' && (await notesState(app)).notes.length === 0, t7.slice(0, 200));
  await notesMode(app, { fail: false });

  // NS8: the page is primary
  await app.evalJs("window.wrizoProposeNote({ kind: 'interest', text: 'A last proposal, then No.' })");
  await sleep(100);
  await clickBtn(app, no); await sleep(200);
  const after = await editorProbe(app);
  ok('NS8 the editor\'s rect, its text and its mounted-ness never changed through any act of the section', same(before, after), JSON.stringify({ before, after }));

  // NS9: strings and the signed-out law
  const terms = ['tutorNotesTitle', 'tutorNotesNote', 'tutorNotesEmpty', 'tutorNotesLoading', 'tutorNotesError', 'tutorNotesFailed', 'tutorNotesAddPlaceholder', 'tutorNotesKindLabel', 'tutorNotesKindTendency', 'tutorNotesKindInterest', 'tutorNotesKindBlocker', 'tutorNotesKindGoal', 'tutorNotesProposed', 'tutorNotesYes', 'tutorNotesNo', 'tutorNotesWipe', 'tutorNotesWipeAsk', 'tutorNotesWipeYes'];
  const vals = []; for (const t of terms) vals.push([t, await lex(app, t)]);
  ok('NS9 every string of the section resolves in the lexicon to real words (none empty, none the key itself)', vals.every(([k, v]) => typeof v === 'string' && v.trim() && v !== k), JSON.stringify(vals.filter(([k, v]) => !v || v === k)));
  const hook = fs.readFileSync(path.join(SRC, 'store', 'tutorNotes.ts'), 'utf8');
  const comp = fs.readFileSync(path.join(SRC, 'components', 'TutorNotes.tsx'), 'utf8');
  ok('NS9 signed out: the hook returns before any fetch, and the section renders nothing', /if \(!signedIn\) \{ setNotes\(\[\]\); setState\('anon'\); return; \}/.test(hook) && /if \(state === 'anon'\) return null;/.test(comp));
  ok('NS9 no note is kept in the browser: no localStorage, sessionStorage or indexedDB in the notes store or screen', !/localStorage|sessionStorage|indexedDB/.test(hook + comp));
  ok('NS9 the screen touches no editor: no editorRef, no setText of the page, no import of an editor', !/editorRef|forward-only-editor|ForwardOnlyEditor|PageEditor/.test(comp + hook));
});

const pass = checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).replace(/\s+/g, ' ').slice(0, 300)}]` : ''}`);
console.log(pass ? `\nTUTOR-NOTES-SCREEN VERIFY: PASS (${checks.length} checks)` : `\nTUTOR-NOTES-SCREEN VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
