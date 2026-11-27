// MOBILE slice 1 (MOBILE-B, Nov 26) - THE COMPANION IN A REAL BROWSER. Runs on Actions (or a box turn): it opens a browser through runtime-verify's withHarness.
// IT SERVES ITSELF: the driver's own double answers every sync with nothing and keeps nothing, so a note could never be confirmed. This file serves the built app as the real server does (a folder's index.html,
// then the app's page for anything unknown) with a stand-in account that keeps what is pushed (newer wins, as the real one), and a switch that CUTS THE SIGNAL: every request is dropped, for the page and for
// the phone's offline helper alike. The account's rows are seeded on the stand-in SERVER and reach the app by its own sync; nothing is written to the app's storage but one repeat of its own waiting note.
//   SIZE   at 390x844 and 360x800, on every screen: nothing scrolls sideways, every control is at least 48px tall, Desk, the + and Library are on screen
//   WIDTH  at 1099px /m/ is the companion; at 1101px it is today's Wrizo
//   WAIT   a note sent with no signal waits with its mark, survives a reload with no signal, is sent once when the signal returns, and is then on the account once
//   TWICE  the same note sent again makes no second Card
//   MOBILE it lands on the Board named Mobile; renamed, the next note makes a new one
//   OUT    a waiting note is gone after sign-out at the desk, and after another account signs in
// FRAMES: $RUNNER_TEMP/suite/mobile-b-frames (else the OS temp): MOBILE-B-frame-<screen>.jpg, every screen at 390x844.
// Run (from apps/desktop): node scripts/harness/mobile-shell.mjs
import http from 'node:http';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(here, '..', '..', 'dist-web');
const FRAMES = path.join(process.env.RUNNER_TEMP ? path.join(process.env.RUNNER_TEMP, 'suite') : os.tmpdir(), 'mobile-b-frames');
mkdirSync(FRAMES, { recursive: true });

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- the stand-in account ----------------------------------------------------------------------------------------------------------------------------------
const COLLECTIONS = ['projects', 'storyPlans', 'sessions', 'drafts', 'journalEntries', 'drawers'];
const A = { who: 'main', offline: false, asked: 0, wholeReads: 0, tick: 0, rows: Object.fromEntries(COLLECTIONS.map((c) => [c, new Map()])), rail: null };
const stamp = () => new Date(Date.now() + (A.tick++ % 50)).toISOString();
const put = (coll, row) => A.rows[coll].set(row.id, { row: JSON.parse(JSON.stringify(row)), at: stamp() });
const rows = (coll) => [...A.rows[coll].values()].map((v) => v.row);
const boards = () => rows('journalEntries').filter((r) => r.pageType === 'board' && !r.deletedAt);
const cardsWithText = (text) => boards().flatMap((b) => (b.boxes || []).filter((x) => x.text === text).map((x) => ({ board: b, box: x })));

const T = (n) => new Date(Date.UTC(2026, 10, 20, 9, n)).toISOString();
const born = (n) => ({ createdAt: T(n), updatedAt: T(n) });
const card = (id, text, n, extra = {}) => ({ id, kind: 'text', x: 0.05, y: 0.05 + n * 0.14, w: 0.3, h: 0.12, z: n + 1, text, ...extra });
const entry = (id, text, n, extra = {}) => ({ id, text, projectId: null, source: 'page', ...born(n), ...extra });
function seed() {
  put('drawers', { id: 'd-novels', name: 'Novels', order: 0, ...born(0) });
  put('projects', { id: 'doc-salt', title: 'The Salt Road', type: 'creative', kind: 'book', drawerId: 'd-novels', storyPlanId: null, docSettings: { assets: [{ entryId: 'b-weather', at: T(1) }] }, ...born(1) });
  put('journalEntries', entry('part-1', '# The Ferry\n\nThe ferry left at **dawn** with a cargo of limestone and one passenger who had *not* paid.\n\nMara watched the quay until it was a grey line.', 2, { projectId: 'doc-salt', pageType: 'manuscript', orderIndex: 0, planBoardId: 'b-plan', pageLinks: [] }));
  put('journalEntries', entry('part-2', 'The customs house smelled of wet rope and oranges.', 3, { projectId: 'doc-salt', pageType: 'manuscript', orderIndex: 1 }));
  put('journalEntries', entry('part-3', 'A letter arrives, and it is the wrong one.', 4, { projectId: 'doc-salt', pageType: 'manuscript', orderIndex: 2 }));
  put('journalEntries', entry('b-plan', '', 5, { pageType: 'board', origin: 'loose', boxes: [card('r1', 'Departure', 0, { seq: 0 }), card('r2', 'The customs house', 1, { seq: 1 }), card('r3', 'The wrong letter', 2, { seq: 2 })], pageLinks: [{ id: 'l1', aEntryId: 'b-plan', aBoxId: 'r1', bEntryId: 'part-1', ...born(6) }] }));
  put('journalEntries', entry('b-research', 'Harbour research', 7, { projectId: 'doc-salt', pageType: 'board', boxes: [card('c1', 'Ferry timetables, 1911', 0), card('c2', 'Limestone was shipped as ballast', 1), card('c3', 'Ask about the lamp signals', 2)] }));
  put('journalEntries', entry('b-weather', 'Weather and tides', 8, { pageType: 'board', origin: 'loose', boxes: [card('w1', 'Spring tide on the ninth', 0)] }));
  put('journalEntries', entry('loose-1', 'Opening lines I might use somewhere\n\nShe had kept the key for a door that was gone.', 9, { origin: 'loose' }));
  A.rail = { pins: { 'd-novels': { order: 0, at: T(1) } }, boxes: {} };
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon' };
function serve() {
  const send = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
  const server = http.createServer(async (req, res) => {
    if (A.offline) { req.socket.destroy(); return; }   // no signal
    const p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    let body = '';
    for await (const chunk of req) body += chunk;
    if (p === '/auth/signup-status') return send(res, 200, { open: true });
    if (p === '/auth/logout') { A.who = null; res.writeHead(204); return res.end(); }
    if (p.startsWith('/auth/')) return A.who ? send(res, 200, { id: A.who, email: '', name: A.who }) : send(res, 401, { error: 'unauthorized' });
    if (p === '/api/sync') {
      const b = JSON.parse(body || '{}');
      if (!b.lastSyncAt && b.pull !== false) A.wholeReads += 1;
      for (const c of COLLECTIONS) for (const r of b.push?.[c] ?? []) { const have = A.rows[c].get(r.id); if (!have || r.updatedAt > have.row.updatedAt) put(c, r); }
      const since = b.lastSyncAt;
      const pull = Object.fromEntries(COLLECTIONS.map((c) => [c, [...A.rows[c].values()].filter((v) => !since || v.at > since).map((v) => v.row)]));
      return send(res, 200, { serverTime: stamp(), pull: b.pull === false ? {} : pull, rejected: [] });
    }
    if (p.startsWith('/api/card-held/')) { A.asked += 1; const id = p.slice('/api/card-held/'.length); return A.who ? send(res, 200, { held: rows('journalEntries').some((r) => (r.boxes || []).some((x) => x.id === id)) }) : send(res, 401, { error: 'unauthorized' }); }
    if (p === '/api/rail') return req.method === 'GET' ? send(res, 200, { rail: A.rail }) : send(res, 200, { rail: A.rail });
    if (p.startsWith('/api/')) return send(res, 404, { error: 'not found' });
    let file = path.join(DIST, p);
    if (!file.startsWith(DIST)) { res.writeHead(404); return res.end(); }
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!existsSync(file)) file = path.join(DIST, 'index.html');
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(await readFile(file));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

seed();
const { server, url } = await serve();

try {
  await withHarness(async (app) => {
    const js = (e) => app.evalJs(e);
    const size = (width, height) => app.cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    const until = async (expr, label, ms = 20000) => {
      const end = Date.now() + ms;
      let last = null;
      while (Date.now() < end) { try { if (await js(`!!(${expr})`)) return true; } catch (e) { last = e; } await sleep(120); }
      console.log(`WAITED IN VAIN for ${label}${last ? ': ' + last.message : ''} :: ${await js("document.body.innerText.slice(0,300)").catch(() => '')}`);
      return false;
    };
    const click = async (sel) => { if (!(await until(`document.querySelector(${JSON.stringify(sel)})`, sel))) return false; await js(`document.querySelector(${JSON.stringify(sel)}).click()`); await sleep(150); return true; };
    const clickText = async (sel, text) => { const found = await js(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.textContent.includes(${JSON.stringify(text)})); if (el) el.click(); return !!el; })()`); await sleep(150); return found; };
    const goto = async (hash) => { await js(`location.hash = ${JSON.stringify(hash)}`); await sleep(250); };
    const open = async (to) => { await app.cdp('Page.navigate', { url: url + to }); await sleep(500); };
    const reload = async () => { await app.cdp('Page.reload', {}); await sleep(900); };
    const text = () => js('document.body.innerText');
    const type = (value) => app.setText(value, '#mc-note');
    const waitingKeys = () => js("Object.keys(localStorage).filter((k) => k.startsWith('wrizo.mobile.'))");
    const signal = () => js("window.dispatchEvent(new Event('online'))");

    // ---- one look at a screen: sizes, and its frame ----
    const problems = [];
    const look = async (name, label, frame) => {
      const r = await js(`(() => {
        const W = window.innerWidth, H = window.innerHeight;
        const sheet = document.querySelector('.mc-sheet');
        const scope = sheet || document.querySelector('.mc-shell');
        const short = [...scope.querySelectorAll('button, a.mc-btn, input, textarea')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.height < 47.5; }).map((e) => (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 24) + ' ' + Math.round(e.getBoundingClientRect().height));
        const wide = document.documentElement.scrollWidth - W;
        const bar = [...document.querySelectorAll('.mc-bar button')].map((e) => e.getBoundingClientRect()).every((b) => b.left >= 0 && b.right <= W + 0.5 && b.bottom <= H + 0.5 && b.top >= 0);
        const send = sheet ? (() => { const b = sheet.querySelector('[data-send]').getBoundingClientRect(); return b.bottom <= H + 0.5 && b.right <= W + 0.5 && b.top >= 0; })() : true;
        return { short, wide, bar, send };
      })()`);
      if (r.short.length || r.wide > 0 || !r.bar || !r.send) problems.push(`${label}/${name}: ${JSON.stringify(r)}`);
      if (frame) writeFileSync(path.join(FRAMES, `MOBILE-B-frame-${name}.jpg`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 82 })).data, 'base64'));
    };

    // ---- she signs in at the desk (the stand-in already knows her), then opens the companion ----
    await size(390, 844);
    await until("localStorage.getItem('writer-studio-journal-entries')?.includes('part-1')", 'the desk to pull her work');
    await open('/m/');
    ok('OPEN /m/ shows the companion, signed in', await until("document.querySelector('.mc-bar') && document.querySelector('[data-door=\"desk\"]')", 'the companion'));
    ok('OPEN Desk shows her pinned Project and her recent work', (await until("document.body.innerText.includes('Novels') && document.body.innerText.includes('The Salt Road')", 'pins and recent')));

    const tour = async (label, frame) => {
      await goto('#/desk'); await look('01-desk', label, frame);
      await goto('#/library/docs'); await look('02-library-docs', label, frame);
      await click('[data-tab="projects"]'); await look('03-library-projects', label, frame);
      await click('[data-row="d-novels"]'); await look('04-project', label, frame);
      await goto('#/library/unfiled'); await look('05-library-unfiled', label, frame);
      await goto('#/find/limestone'); await look('06-find', label, frame);
      await goto('#/doc/part-1/read/part-1'); await look('07-doc-read', label, frame);
      await click('[data-view="plan"]'); await look('08-doc-plan', label, frame);
      await click('[data-view="assets"]'); await look('09-doc-assets', label, frame);
      await goto('#/board/b-research/wall'); await look('10-board-wall', label, frame);
      await click('[data-as="list"]'); await look('11-board-list', label, frame);
      await click('[data-card="c1"]'); await look('12-card', label, frame);
      await goto('#/desk');
      await click('.mc-plus'); await type('A note about the lamp signals'); await look('13-add-note', label, frame);
      await click('[data-change]'); await look('14-add-send-to', label, frame);
      await clickText('[data-place-doc]', 'Opening lines'); await look('15-add-doc-without-board', label, frame);
      await click('[data-sheet-back]');
    };
    await tour('390x844', true);
    const plan = await (async () => { await goto('#/doc/part-1/plan/part-1'); return text(); })();
    ok('PLAN a written Part is ticked and named; a row with no Part says so', plan.includes('✓') && plan.includes('No Part yet'), plan.replace(/\n+/g, ' / ').slice(0, 200));
    // PLANTAB (Fable, Nov 26, 10:15 pm): the Doc's Plan tab says what the desk's own Plan tab says in her theme
    const tabSays = async (theme) => {
      await js(`localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)})`); await reload();
      await until(`document.documentElement.getAttribute('data-theme') === ${JSON.stringify(theme)} && document.querySelector('[data-view="plan"]')`, `the Doc's tabs in ${theme}`);
      return js(`document.querySelector('[data-view="plan"]')?.textContent ?? ''`);
    };
    const inFlux = await tabSays('flux');
    ok("PLANTAB in Flux the Plan tab says the desk's word, Spine", inFlux === 'Spine', inFlux);
    const inArbor = await tabSays('plateau');
    ok('PLANTAB in Arbor it still says Plan', inArbor === 'Plan', inArbor);

    await goto('#/doc/part-1/read/part-1');
    ok('READ her marks are drawn, never shown as marks', await js("!!document.querySelector('.mc-page strong') && !!document.querySelector('.mc-page h1') && !document.querySelector('.mc-page').innerText.includes('**')"));
    ok('PLUS the + has no word and has its spoken name', await js("document.querySelector('.mc-plus').textContent.trim() === '+' && document.querySelector('.mc-plus').getAttribute('aria-label') === 'Add a note, photo, sketch or recording'"));
    // KIND (Fable, Nov 26): where Docs, Boards and Cards share a list, each row says which it is, in the test version's words
    const rowsSay = () => js("[...document.querySelectorAll('.mc-main .mc-row')].map((r) => (r.querySelector('.mc-name')?.textContent ?? r.textContent) + ' = ' + (r.querySelector('.mc-where')?.textContent ?? ''))");
    await goto('#/desk');
    const recent = await rowsSay();
    ok('KIND Desk: a Doc row says Doc, a Board row says Board', recent.includes('The Salt Road = Doc') && recent.includes('Harbour research = Board'), JSON.stringify(recent));
    await goto('#/find/limestone');
    const found = await rowsSay();
    ok("KIND Find: a Part's hit says Doc, a card's says Card and its Board", found.some((r) => r.startsWith('The Salt Road = Doc · ')) && found.includes('Limestone was shipped as ballast = Card · Harbour research'), JSON.stringify(found));
    await goto('#/doc/part-1/assets/part-1');
    const assets = await rowsSay();
    ok('KIND Assets: cards and Boards say which they are', assets.includes('Departure = Card') && assets.includes('Harbour research = Board'), JSON.stringify(assets));

    // TITLE (Fable, Nov 26): the test version's optional title; it is the Card's first line
    await goto('#/desk'); await click('.mc-plus');
    const field = await js("(() => { const i = document.querySelector('#mc-title'); return i ? [i.placeholder, i.getAttribute('aria-label'), document.activeElement && document.activeElement.id] : null; })()");
    ok('TITLE the note has the optional title field, and the caret still starts in the note', !!field && field[0] === 'A title (optional)' && field[1] === 'Title' && field[2] === 'mc-note', JSON.stringify(field));
    const send = async (title, body) => {
      await goto('#/desk'); if (!(await js("!!document.querySelector('.mc-sheet')"))) await click('.mc-plus');
      if (title && (await js("!!document.querySelector('#mc-title')"))) await app.setText(title, '#mc-title');
      if (body) await type(body);
      await click('[data-send]'); await sleep(400);
      await until("!document.querySelector('[data-waiting]')", 'the note to be sent', 30000);
    };
    await send('Lamp signals', 'two flashes, then dark');
    ok('TITLE a titled note lands as one Card: the title, then her words', cardsWithText('Lamp signals\ntwo flashes, then dark').length === 1, JSON.stringify(boards().flatMap((b) => (b.boxes || []).map((x) => x.text)).filter((x) => /flashes|Lamp signals/.test(x))));
    await send('Only a title here', '');
    ok('TITLE a title alone is a note', cardsWithText('Only a title here').length === 1);
    await send('', 'no title, just this');
    ok('TITLE with no title her words are stored as typed', cardsWithText('no title, just this').length === 1);
    await js("document.querySelector('[data-sheet-back]')?.click()");

    // ASK (Fable, Nov 26): a send asks the account yes or no; it does not download it
    await sleep(1500); A.wholeReads = 0; A.asked = 0;
    await send('', 'asked, not downloaded');
    ok('ASK a sent note downloads nothing of the whole account; the account is asked yes or no', cardsWithText('asked, not downloaded').length === 1 && A.wholeReads === 0 && A.asked >= 1, `whole-account downloads=${A.wholeReads} asked=${A.asked} copies=${cardsWithText('asked, not downloaded').length}`);
    await js("document.querySelector('[data-sheet-back]')?.click()");

    await goto('#/desk'); await click('.mc-plus');
    ok('SENDTO from Desk it reads Mobile; she is never made to file first', await js("document.querySelector('[data-send-to]').textContent === 'Mobile' && document.querySelector('[data-send]').disabled === true"));
    await click('[data-sheet-back]');

    await size(360, 800);
    await tour('360x800', false);
    ok('SIZE 390x844 and 360x800: nothing sideways, targets 48px or more, the bar and Send on screen', problems.length === 0, problems.join(' ; '));
    await size(390, 844);

    // ---- a note with no signal ----
    await goto('#/desk');
    await until('navigator.serviceWorker && navigator.serviceWorker.controller', 'the offline helper to take charge');
    A.offline = true;
    await click('.mc-plus'); await type('from the train, no signal'); await click('[data-send]');
    ok('WAIT the note waits with its mark', await until("document.querySelector('[data-waiting]') && document.body.innerText.includes('from the train, no signal')", 'the waiting mark'));
    await look('16-desk-waiting', '390x844', true);
    ok('WAIT nothing reached the account', cardsWithText('from the train, no signal').length === 0);
    await reload();
    ok('WAIT it survives a reload with no signal (the companion opens, the note is there)', await until("document.querySelector('[data-waiting]') && document.body.innerText.includes('from the train, no signal')", 'the note after a reload'));
    const kept = await js("(() => { const k = Object.keys(localStorage).find((x) => x.startsWith('wrizo.mobile.waiting.')); return k ? [k, localStorage.getItem(k)] : null; })()");
    A.offline = false;
    await signal();
    ok('WAIT it is sent when the signal returns, and the mark goes', await until("!document.querySelector('[data-waiting]')", 'the note to be sent', 30000));
    await sleep(1500); await signal(); await sleep(2500);
    const got = cardsWithText('from the train, no signal');
    ok('WAIT it is on the account exactly once, on the Board named Mobile', got.length === 1 && got[0].board.text === 'Mobile' && got[0].board.projectId === null, `copies=${got.length} board=${got[0]?.board.text}`);
    ok('WAIT no copy of it is left waiting on the phone', (await waitingKeys()).every((k) => k === 'wrizo.mobile.account'), JSON.stringify(await waitingKeys()));
    // TWICE: the very same note (same id), put back in the queue as if the answer had been lost
    await js(`localStorage.setItem(${JSON.stringify(kept[0])}, ${JSON.stringify(kept[1])})`);
    await signal();
    ok('TWICE the same note is taken as already sent', await until(`!localStorage.getItem(${JSON.stringify(kept[0])})`, 'the repeat to clear', 30000));
    ok('TWICE one note sent twice makes one Card', cardsWithText('from the train, no signal').length === 1, `copies=${cardsWithText('from the train, no signal').length}`);
    await goto('#/desk');
    ok('KIND the Mobile row says Board', await until("document.querySelector('[data-mobile-board] .mc-where')?.textContent === 'Board'", 'the kind on the Mobile row', 3000));
    ok('MOBILE Desk shows the Mobile Board', await until("document.querySelector('[data-mobile-board]')", 'the Mobile row'));
    await click('[data-mobile-board]'); await look('17-mobile-board', '390x844', true);

    // renamed at the desk: the next note makes a new one
    const first = boards().find((b) => b.text === 'Mobile');
    await sleep(50); put('journalEntries', { ...first, text: 'Train thoughts', updatedAt: new Date().toISOString() });
    await goto('#/desk'); await click('.mc-plus'); await type('second note'); await click('[data-send]');
    ok('MOBILE after she renames it, the next note makes a new Mobile Board', await until("!document.querySelector('[data-waiting]')", 'the second note', 30000) && cardsWithText('second note').length === 1 && cardsWithText('second note')[0].board.id !== first.id && cardsWithText('second note')[0].board.text === 'Mobile', cardsWithText('second note')[0]?.board.text);

    // Add Card on a Board: the note lands there
    await goto('#/board/b-research/wall'); await click('[data-add-card]');
    ok('BOARD Add Card is already addressed to this Board', await js("document.querySelector('[data-send-to]').textContent === 'Harbour research'"));
    await type('added on the board'); await click('[data-send]');
    await sleep(3000);
    ok('BOARD the Card lands on it', cardsWithText('added on the board')[0]?.board.id === 'b-research', cardsWithText('added on the board')[0]?.board.id);

    // ---- the widths ----
    await size(1099, 800); await open('/m/');
    ok('WIDTH at 1099px /m/ is the companion', await until("location.pathname.startsWith('/m') && document.querySelector('.mc-bar')", 'companion at 1099'));
    writeFileSync(path.join(FRAMES, 'MOBILE-B-width-1099.jpg'), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 70 })).data, 'base64'));
    await size(1101, 800); await open('/m/');
    ok("WIDTH at 1101px /m/ hands her today's Wrizo", await until("!location.pathname.startsWith('/m') && !document.querySelector('.mc-bar') && document.querySelector('#root').children.length > 0", 'the desk at 1101'), await js('location.pathname'));

    // ---- sign-out wipes what waits ----
    await size(390, 844); await open('/m/');
    await until("document.querySelector('.mc-bar')", 'companion');
    A.offline = true;
    await click('.mc-plus'); await type('written, never sent, then signed out'); await click('[data-send]');
    await until("document.querySelector('[data-waiting]')", 'waiting before sign-out');
    const keysBefore = await waitingKeys();
    A.offline = false;
    await size(1280, 800); await open('/');
    // on a writing page the desk keeps Sign out in its corner menu; elsewhere it stands in the header
    const signOut = "[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Sign out')";
    await until(`${signOut} || document.querySelector('[aria-label="Desk menu"]')`, 'the desk sign-out button or its menu');
    if (!(await js(`!!(${signOut})`))) await js(`document.querySelector('[aria-label="Desk menu"]').click()`);
    await until(signOut, 'the desk sign-out button');
    await js(`(${signOut}).click()`);
    ok('OUT a waiting note is gone after sign-out at the desk', await until("Object.keys(localStorage).every((k) => !k.startsWith('wrizo.mobile.'))", 'the wipe') && keysBefore.some((k) => k.startsWith('wrizo.mobile.waiting.')), JSON.stringify(await waitingKeys()));
    await size(390, 844); await open('/m/');
    ok('OUT signed out, the companion shows only Sign In', await until("document.querySelector('a.mc-btn') && !document.querySelector('.mc-bar')", 'the sign-in door'));
    writeFileSync(path.join(FRAMES, 'MOBILE-B-frame-18-signed-out.jpg'), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 82 })).data, 'base64'));
    ok('OUT nothing of it ever reached the account', cardsWithText('written, never sent, then signed out').length === 0);

    // another account on the same phone: what waited under hers is wiped, never sent
    await js("localStorage.setItem('wrizo.mobile.waiting.main', JSON.stringify({ v: 1, notes: [{ id: 'n-left', text: 'hers, left behind', to: { kind: 'unfiled' }, madeAt: new Date().toISOString(), account: 'main' }] }))");
    A.who = 'sample';
    await reload(); await sleep(1500);
    ok("OUT another account signing in wipes what waited under hers, and never sends it", (await js("!localStorage.getItem('wrizo.mobile.waiting.main')")) && cardsWithText('hers, left behind').length === 0);
  }, { targetUrl: url });
} catch (e) {
  ok('the walk finished', false, e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : String(e));
} finally {
  server.close();
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 1200)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(`FRAMES: ${FRAMES}`);
console.log(passed === checks.length ? `\nMOBILE-SHELL VERIFY: PASS (${checks.length} checks)` : `\nMOBILE-SHELL VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
