// TUTOR-B ITEM 7 STEP 1 — FRAMES OF THE NOTES-ON-FILE SCREEN, for Nick to see before anything ships (Fable, Nov 24: "does NOT ship until Nick has seen its screens").
// A screens file for the frames job (scripts/ci-frames.mjs --screens-file): it default-exports named screens, each `async (app, ctx) => {...}` that ends ON the screen.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=tutor/7-memory -f screens=tutor-notes-empty,tutor-notes-filled,tutor-notes-proposal,tutor-notes-edit,tutor-notes-wipe,tutor-notes-offline \
//       -f themes=plateau -f screens_file=apps/desktop/scripts/frames/tutor-notes.mjs
//
// The frames job's server double does not know the notes routes (they live in this branch's runtime-verify.mjs, and the job runs the trusted tooling's copy), so each screen
// stands the notes API up INSIDE THE PAGE: a fetch wrapper that answers /api/tutor/notes the way the real server does (list, add, edit, delete, wipe). Nothing here reaches a
// server, and no real writer's note is on any frame: every note below is made up.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SEC = '[data-testid="tutor-notes"]';

// runs in the page
function installNotesApi(seed, fail) {
  window.__notes = seed;
  window.__notesFail = !!fail;
  let n = 100;
  const f0 = window.fetch.bind(window);
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  window.fetch = (u, o) => {
    const opts = o || {};
    const m = String(u).match(/\/api\/tutor\/notes(?:\/([^/?#]+))?/);
    if (!m) return f0(u, o);
    if (window.__notesFail) return Promise.reject(new TypeError('Failed to fetch'));
    const method = String(opts.method || 'GET').toUpperCase();
    const body = opts.body ? JSON.parse(opts.body) : {};
    const id = m[1] || null;
    const now = new Date().toISOString();
    if (method === 'GET') return Promise.resolve(json(200, { notes: window.__notes }));
    if (method === 'POST') {
      n += 1;
      const note = { id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, kind: body.kind, text: body.text, source: body.source, createdAt: now, updatedAt: now };
      window.__notes = [...window.__notes, note];
      return Promise.resolve(json(201, { note }));
    }
    if (method === 'PATCH' && id) {
      const i = window.__notes.findIndex((x) => x.id === id);
      if (i < 0) return Promise.resolve(json(404, { error: 'not found' }));
      const note = { ...window.__notes[i], ...body, updatedAt: now };
      window.__notes = window.__notes.map((x, j) => (j === i ? note : x));
      return Promise.resolve(json(200, { note }));
    }
    if (method === 'DELETE' && id) {
      const had = window.__notes.some((x) => x.id === id);
      window.__notes = window.__notes.filter((x) => x.id !== id);
      return Promise.resolve(had ? json(200, { deleted: 1 }) : json(404, { error: 'not found' }));
    }
    if (method === 'DELETE') { const c = window.__notes.length; window.__notes = []; return Promise.resolve(json(200, { deleted: c })); }
    return Promise.resolve(json(400, { error: 'bad request' }));
  };
}

const note = (i, kind, text, source) => ({ id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, kind, text, source, createdAt: `2026-11-0${i}T10:00:00.000Z`, updatedAt: `2026-11-0${i}T10:00:00.000Z` });
const SEED = [
  note(1, 'tendency', 'Comma splices recur, about one per paragraph.', 'proposed'),
  note(2, 'goal', 'Working toward a finished novel draft by spring.', 'interview'),
  note(3, 'blocker', 'Gets stuck at endings; the last scene is often missing.', 'proposed'),
  note(4, 'interest', 'Wants feedback on dialogue first.', 'own'),
];

const lex = (app, term) => app.evalJs(`window.wrizoDeskLexicon.t(${JSON.stringify(term)})`);
const clickBtn = (app, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(SEC + ' button')})].find((x) => x.textContent.trim() === ${JSON.stringify(text)}); if (!b) throw new Error('no button ' + ${JSON.stringify(text)}); b.click(); return true; })()`);

// a prose page with the Tutor's panel open and the notes section showing, the notes API standing in the page
async function openNotes(app, seed, fail = false) {
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page' });
  await sleep(500);
  await app.click('Draft'); await sleep(600);   // out of Free Write: there the Tutor only offers prompts, and the notes list is not on show
  await app.evalJs(`(${installNotesApi.toString()})(${JSON.stringify(seed)}, ${fail ? 'true' : 'false'})`);
  await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
  try { await app.waitFor(`!!document.querySelector(${JSON.stringify(SEC)})`, { label: 'the notes section in the Tutor panel', timeout: 8000 }); } catch (e) {
    // say what the page looks like instead (kept short: the frames job cuts an error to 300 characters)
    const d = await app.evalJs(`JSON.stringify({ open: document.querySelector('.wz-tutor-panel')?.dataset.open ?? null, grip: !!document.querySelector('.wz-tutor-grip'), bible: !!document.querySelector('.wz-tutor-bible-row'), anyNotes: document.querySelectorAll('[data-testid]').length, hint: (document.querySelector('.wz-tutor-panel')?.textContent || '').slice(0, 60), user: !!window.wrizoDeskLexicon })`);
    throw new Error('no notes section: ' + d);
  }
  await sleep(500);
}
const show = async (app) => {
  await app.evalJs(`document.querySelector(${JSON.stringify(SEC)}).scrollIntoView({ block: 'center' }); true`);
  await app.mouseMove(2, 2);
  await sleep(500);
};

export default {
  // nothing on file yet: the empty line and the add row
  'tutor-notes-empty': async (app) => { await openNotes(app, []); await show(app); },
  // four notes, one of each kind and source: what she sees, with Edit and Delete on each
  'tutor-notes-filled': async (app) => { await openNotes(app, SEED); await show(app); },
  // the AI proposed a note: nothing is kept unless she presses yes (the card, with Yes and No)
  'tutor-notes-proposal': async (app) => {
    await openNotes(app, SEED);
    await app.evalJs("window.wrizoProposeNote({ kind: 'tendency', text: 'Opening paragraphs run long before the first image.' })");
    await sleep(300);
    await show(app);
  },
  // Edit pressed on the first note: a text box and a kind, Save and Cancel
  'tutor-notes-edit': async (app) => {
    await openNotes(app, SEED);
    await clickBtn(app, await lex(app, 'tutorBibleEdit'));
    await sleep(300);
    await show(app);
  },
  // Wipe all pressed: the one question first, "this can't be undone"
  'tutor-notes-wipe': async (app) => {
    await openNotes(app, SEED);
    await clickBtn(app, await lex(app, 'tutorNotesWipe'));
    await sleep(300);
    await show(app);
  },
  // the server cannot be reached when she adds a note: one quiet line, nothing changes, her words stay in the box
  'tutor-notes-offline': async (app) => {
    await openNotes(app, SEED);
    await app.evalJs('window.__notesFail = true; true');
    await app.setText('Loves short scenes.', `${SEC} .wz-tutor-bible-row input.wz-tutor-bible-input`);
    await clickBtn(app, await lex(app, 'tutorBibleAdd'));
    await sleep(500);
    await show(app);
  },
};
