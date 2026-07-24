// E1 — Get My Words Out (docs/wrizo-alpha/e1-get-my-words-out-brief.md). A
// committed CDP verification scenario, modeled on fx8.mjs/hb1.mjs's own
// structure (freshDesk/rectOf/trustedClick below are the same shape those
// files already established).
// Run: node scripts/harness/e1.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers S1 (live diagnosis, re-proven here as regression coverage), S2
// (copy path works and says so, honest forced-failure), S3 (real file
// export — This Page / This Binder / Everything, honest degradation for
// Script/Board/ink, filename safety), S4 (download above the coming-soon
// line), and S5's own bar in full, including the OFFLINE PROOF the ticket
// exists for — every export scenario below runs with the network genuinely
// disabled via CDP Network.emulateNetworkConditions(offline:true), not a
// stand-in.
import { withHarness } from '../runtime-verify.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAPTOP_W = 1280;
const LEGACY_W = 900;

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// Seed arbitrary projects/journalEntries, reload, navigate to a hash route,
// wait for a selector, re-arm downloads (Page.setDownloadBehavior does not
// reliably survive a navigation/reload in every Chromium build, so every
// fixture re-arms it after its own reload) and a fresh DPR emulation.
const seedAndOpen = async (app, { projects = [], entries, waitSel, hash, width = LAPTOP_W, height = 900, dlDir }) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    localStorage.setItem('writer-studio-projects', ${JSON.stringify(JSON.stringify(projects))});
    localStorage.setItem('writer-studio-journal-entries', ${JSON.stringify(JSON.stringify(entries))});
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = ${JSON.stringify(hash)}`);
  await app.waitFor(`!!document.querySelector(${JSON.stringify(waitSel)})`, { label: `mounted: ${waitSel}` });
  await sleep(350);
  await app.emulateDpr(1, width, height);
  if (dlDir) await app.enableDownloads(dlDir);
};

const rectOfText = async (app, label) => app.evalJs(`(() => {
  const els = [...document.querySelectorAll('button, a, [role=button]')];
  const el = els.find(x => x.textContent.trim() === ${JSON.stringify(label)}) || els.find(x => x.textContent.includes(${JSON.stringify(label)}));
  if (!el) throw new Error('clickable not found: ' + ${JSON.stringify(label)} + ' :: have [' + els.map(x=>x.textContent.trim()).filter(Boolean).join(' | ') + ']');
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})()`);

// A genuinely TRUSTED click (mouseDown + mouseUp, real CDP Input events) at
// a button/link found by its visible text — the project's own standing
// trusted-gesture discipline. Load-bearing here specifically: a synthetic
// `el.click()` does NOT carry transient user activation, and the Clipboard
// API's `writeText` genuinely rejects without it (confirmed live during
// this build's own S1 diagnosis) — a coordinate-less dispatch would
// silently test the WRONG code path for every copy check below.
const trustedClick = async (app, label) => {
  const { x, y } = await rectOfText(app, label);
  await app.mouseDown(x, y);
  await sleep(30);
  await app.mouseUp(x, y);
};

const mkDlDir = (tag) => fs.mkdtempSync(path.join(os.tmpdir(), `e1-${tag}-`));
const filesIn = (dir) => fs.readdirSync(dir);
const read = (dir, name) => fs.readFileSync(path.join(dir, name), 'utf8');

const NOW = '2026-07-21T12:00:00.000Z';

// E1.1 — fixtures shared between the LIVE run and the PARKED re-verification
// block below, so the parked successors re-prove the SAME reality with the
// SAME numbers (5 live + 1 trashed), never a drifted copy.
const ROUNDTRIP_ENTRY = {
  id: 'e1-roundtrip', projectId: null, source: 'page', origin: 'loose', pageType: 'note',
  text: 'Round Trip Title\n\nThe writer\'s **exact** words, *unaltered*, in order.\n\nA third line, never dropped.',
  createdAt: NOW, updatedAt: NOW,
};
const CORPUS_PROJECTS = [{ id: 'e1-corpus-binder', title: 'Corpus Binder', type: 'creative', storyPlanId: null, createdAt: NOW, updatedAt: NOW }];
const CORPUS_ENTRIES = [
  { id: 'e1-corpus-binder-page', projectId: 'e1-corpus-binder', source: 'page', origin: 'project', pageType: 'manuscript', text: 'Binder Page\n\nBinder content.', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: NOW },
  { id: 'e1-corpus-journal-page', projectId: null, source: 'page', origin: 'journal', text: 'Journal Page\n\nJournal content.', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: NOW },
  { id: 'e1-corpus-loose-page', projectId: null, source: 'page', origin: 'loose', text: 'Loose Page\n\nLoose content.', createdAt: '2026-01-03T00:00:00.000Z', updatedAt: NOW },
  {
    id: 'e1-corpus-board', projectId: null, source: 'page', origin: 'loose', pageType: 'board', text: 'Corpus Board',
    boxes: [
      { id: 'cb-text', kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.1, z: 1, text: 'Board Card\nBoard card body.' },
      { id: 'cb-ink', kind: 'ink', x: 0.5, y: 0.1, w: 0.3, h: 0.1, z: 2, strokes: [{ points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }] },
      { id: 'cb-pin', kind: 'page-pin', x: 0.1, y: 0.4, w: 0.3, h: 0.1, z: 3, entryId: 'e1-corpus-journal-page' },
      // S4 (E1.1) — a 'connection' card: skipped BY NAME (a link between two
      // cards, no writer text), so it must add NO placeholder line.
      { id: 'cb-conn', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 4, connA: 'cb-text', connB: 'cb-ink' },
      // S4 (E1.1) — a fabricated UNKNOWN box kind (a future card species this
      // exporter predates): must export the named placeholder, never vanish.
      { id: 'cb-unknown', kind: 'sculpture', x: 0.1, y: 0.7, w: 0.3, h: 0.1, z: 5, text: 'a future card species' },
      // FX11 S3 (E1.1 review advisory 2) — board-meta with writer-authored lane
      // titles (BM1). Two named + one EMPTY-named (must be filtered from the
      // exported "Lanes:" line): proves both that the titles ride the export and
      // that the empty one is dropped (no phantom hinge).
      { id: 'cb-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 6, lanes: [{ id: 'l1', title: 'Act One' }, { id: 'l-empty', title: '' }, { id: 'l3', title: 'Act Two' }] },
    ],
    createdAt: '2026-01-04T00:00:00.000Z', updatedAt: NOW,
  },
  {
    id: 'e1-corpus-script', projectId: null, source: 'page', origin: 'loose', pageType: 'script', text: 'INT. CORPUS ROOM - DAY',
    script: { v: 1, scenes: [{ id: 'sc1', heading: { id: 'h1', t: 'scene', text: 'INT. CORPUS ROOM - DAY' }, body: [{ id: 'a1', t: 'action', text: 'The writer leaves for vacation.' }] }] },
    createdAt: '2026-01-05T00:00:00.000Z', updatedAt: NOW,
  },
  // MUST be excluded from BOTH sections: a system Board (derived membership
  // mirror, not authored content — zero unique words).
  {
    id: 'e1-corpus-system-board', projectId: null, source: 'page', origin: 'system', pageType: 'board', text: 'Journal',
    boxes: [{ id: 'sb-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, systemKind: 'journal' }],
    createdAt: NOW, updatedAt: NOW,
  },
  // S3 (E1.1) — soft-deleted: now RIDES ALONG under the "## From the Trash"
  // marked section (was: must-be-absent). Read-only — the export never clears
  // deletedAt; this row stays trashed.
  { id: 'e1-corpus-deleted', projectId: null, source: 'page', origin: 'loose', text: 'Deleted Page\n\nWords the writer trashed but did not lose.', createdAt: '2026-01-06T00:00:00.000Z', updatedAt: NOW, deletedAt: NOW },
];

await withHarness(async (app) => {
  // ==========================================================================
  // S1 (re-proven live, as regression coverage) + S2 — the copy path, working
  // and legible. S1's own live diagnosis (this build's report has the full
  // account): a genuinely trusted click already lands the RIGHT text on the
  // real OS/browser clipboard today (proven below via an actual
  // Browser.grantPermissions + navigator.clipboard.readText() round trip,
  // not just the window.__wzLastCopy test seam) — the defect was total
  // silence, never brokenness. Both buttons now say so; a forced total
  // clipboard failure surfaces an honest message instead of nothing.
  // ==========================================================================
  await seedAndOpen(app, {
    entries: [{
      id: 'e1-copy-page', projectId: null, source: 'page', origin: 'loose', pageType: 'note',
      text: '# A Heading\n\nSome **bold** and *italic* words.\n\nA second paragraph.',
      createdAt: NOW, updatedAt: NOW,
    }],
    waitSel: '.forward-only-editor, textarea, [contenteditable]',
    hash: '#/page/e1-copy-page',
  });
  await app.cdp('Browser.grantPermissions', { permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'], origin: app.base });

  await trustedClick(app, 'Publish');
  await sleep(250);

  await trustedClick(app, 'Copy My Words');
  await sleep(300);
  const wordsToast = await app.evalJs("document.querySelector('.action-toast')?.textContent");
  const wordsClip = await app.evalJs("navigator.clipboard.readText()");
  ok('S2: "Copy My Words" places the markdown-stripped plain text on the REAL OS clipboard (a genuine readText() round trip, not just the test seam)',
    wordsClip.replace(/\r\n/g, '\n') === 'A Heading\n\nSome bold and italic words.\n\nA second paragraph.', wordsClip);
  ok('S2: "Copy My Words" renders a confirmation (the house ActionToast quiet-line pattern) — S1\'s own live finding was total silence here before this fix',
    wordsToast === 'Copied — your plain words are on the clipboard.', String(wordsToast));

  await trustedClick(app, 'Copy Formatted');
  await sleep(300);
  const fmtToast = await app.evalJs("document.querySelector('.action-toast')?.textContent");
  const fmtClip = await app.evalJs("navigator.clipboard.readText()");
  ok('S2: "Copy Formatted" places the SAME text with markdown conventions intact on the real clipboard',
    fmtClip.replace(/\r\n/g, '\n') === '# A Heading\n\nSome **bold** and *italic* words.\n\nA second paragraph.', fmtClip);
  ok('S2: "Copy Formatted" renders its own distinct confirmation',
    fmtToast === 'Copied — with formatting intact.', String(fmtToast));

  // Force a GENUINE total clipboard failure — both the Clipboard API AND
  // the execCommand fallback — the same forced-failure technique that
  // reproduced S1's original silent-swallow defect live during diagnosis.
  await app.evalJs(`(() => {
    navigator.clipboard.writeText = () => Promise.reject(new DOMException('forced', 'NotAllowedError'));
    document.execCommand = () => false;
  })()`);
  await trustedClick(app, 'Copy My Words');
  await sleep(300);
  const failToast = await app.evalJs("document.querySelector('.action-toast')?.textContent");
  ok('S2: a FORCED total clipboard failure (both the Clipboard API and the execCommand fallback denied) surfaces an HONEST failure message — never silence (the exact hole S1\'s live diagnosis found: an unhandled async rejection with zero fallback and zero surfaced error)',
    failToast === 'Copy didn’t go through — try again, or use Download below.', String(failToast));

  // ==========================================================================
  // S3/S5 — "This Page" round-trips. Formatted (.md) keeps markdown
  // conventions; plain (.txt) strips them — reading the ACTUAL bytes the
  // browser's own download manager wrote to disk (Page.setDownloadBehavior),
  // not merely a page-side interception of the click.
  // ==========================================================================
  const pageDl = mkDlDir('page');
  await seedAndOpen(app, {
    entries: [ROUNDTRIP_ENTRY],
    waitSel: '.forward-only-editor, textarea, [contenteditable]',
    hash: '#/page/e1-roundtrip',
    dlDir: pageDl,
  });

  // OFFLINE PROOF starts here and covers every export scenario below —
  // the check this ticket exists for, per the brief's own words.
  await app.cdp('Network.enable');
  await app.cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  const onlineFlag = await app.evalJs('navigator.onLine');
  ok('OFFLINE PROOF: the network is genuinely disabled (navigator.onLine === false) for every export scenario that follows — not skipped, not faked',
    onlineFlag === false, String(onlineFlag));

  await trustedClick(app, 'Publish');
  await sleep(250);
  await trustedClick(app, 'This Page (.md)');
  await sleep(700);
  await trustedClick(app, 'This Page (.txt)');
  await sleep(700);

  const pageFiles = filesIn(pageDl);
  // S1 (E1.1) — the "This Page" base filename now carries a stable id-suffix
  // drawn from the id's random TAIL ('e1-roundtrip'.slice(-6) === 'ndtrip'),
  // so the pre-suffix filename assertion ('Round Trip Title.md'/'.txt') is
  // FALSIFIED. It is PARKED verbatim below (HARNESS_PARKED=1) per A4 + the
  // immutability law; this is its LIVE SUCCESSOR, asserting the suffixed form.
  // The file BODY text is unchanged (the suffix lives in the filename only), so
  // the two byte checks that follow keep their original claims verbatim — they
  // merely read whichever .md/.txt now exist rather than a hard-coded old name.
  ok('S3/E1.1 OFFLINE: "This Page" produced exactly two files (.md + .txt) named with the stable id-suffix — "Round Trip Title (ndtrip).md/.txt" — network fully unavailable throughout',
    pageFiles.length === 2 && pageFiles.includes('Round Trip Title (ndtrip).md') && pageFiles.includes('Round Trip Title (ndtrip).txt'),
    JSON.stringify(pageFiles));
  const mdName = pageFiles.find((f) => f.endsWith('.md'));
  const txtName = pageFiles.find((f) => f.endsWith('.txt'));
  const mdBytes = mdName ? read(pageDl, mdName) : '';
  const txtBytes = txtName ? read(pageDl, txtName) : '';
  ok('S3 OFFLINE: the .md file\'s ACTUAL bytes on disk carry the writer\'s exact words, formatting conventions intact, nothing altered/truncated/reordered',
    mdBytes === 'Round Trip Title\n\nThe writer\'s **exact** words, *unaltered*, in order.\n\nA third line, never dropped.', mdBytes);
  ok('S3 OFFLINE: the .txt file\'s ACTUAL bytes carry the same words with conventions stripped to honest plain text',
    txtBytes === 'Round Trip Title\n\nThe writer\'s exact words, unaltered, in order.\n\nA third line, never dropped.', txtBytes);

  // ==========================================================================
  // S1/S2 (E1.1) — the collision fix of record. Two DIFFERENT pages sharing an
  // identical first line ("Same Title") must download as TWO DISTINCT files,
  // each carrying its OWN words — neither clobbers the other on disk.
  //
  // The two ids here are the WORST realistic case, on purpose: they share their
  // whole HEAD ('dupehead') and differ only in their last chars — the exact
  // shape `generateId()` produces for two pages born in the SAME tick (a bulk
  // import, a template expansion, a rapid duplicate), where the 8-char
  // timestamp prefix is identical and only the random tail differs. A
  // head-slice suffix ('dupehe' for both) would STILL collide here; the fix
  // draws from the tail (slice(-6): 'alpha6' vs 'beta66'), so it holds. This
  // fixture is what closes the hole the pre-hardening slice(0,6) left open.
  // ==========================================================================
  const collisionDl = mkDlDir('collision');
  const twoSameTitle = [
    { id: 'dupehead-alpha6', projectId: null, source: 'page', origin: 'loose', pageType: 'note', text: 'Same Title\n\nAlpha body — the first page\'s own words.', createdAt: NOW, updatedAt: NOW },
    { id: 'dupehead-beta66', projectId: null, source: 'page', origin: 'loose', pageType: 'note', text: 'Same Title\n\nBeta body — the second page\'s own words.', createdAt: NOW, updatedAt: NOW },
  ];
  await app.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await seedAndOpen(app, { entries: twoSameTitle, waitSel: '.forward-only-editor, textarea, [contenteditable]', hash: '#/page/dupehead-alpha6', dlDir: collisionDl });
  await app.cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await trustedClick(app, 'Publish');
  await sleep(250);
  await trustedClick(app, 'This Page (.md)');
  await sleep(700);
  await app.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await seedAndOpen(app, { entries: twoSameTitle, waitSel: '.forward-only-editor, textarea, [contenteditable]', hash: '#/page/dupehead-beta66', dlDir: collisionDl });
  await app.cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await trustedClick(app, 'Publish');
  await sleep(250);
  await trustedClick(app, 'This Page (.md)');
  await sleep(700);
  const collisionFiles = filesIn(collisionDl);
  ok('S1/S2 OFFLINE: two same-first-line pages whose ids share their head and differ only in the tail (the same-tick case) download as TWO DISTINCT files ("Same Title (alpha6).md" + "Same Title (beta66).md") — the tail-drawn id-suffix disambiguates; neither overwrites the other on disk',
    collisionFiles.length === 2 && collisionFiles.includes('Same Title (alpha6).md') && collisionFiles.includes('Same Title (beta66).md'),
    JSON.stringify(collisionFiles));
  const aBytes = collisionFiles.includes('Same Title (alpha6).md') ? read(collisionDl, 'Same Title (alpha6).md') : '';
  const bBytes = collisionFiles.includes('Same Title (beta66).md') ? read(collisionDl, 'Same Title (beta66).md') : '';
  ok('S1/S2 OFFLINE: each same-titled file carries its OWN page\'s words intact — both pages\' words survive, neither truncated nor overwritten',
    aBytes.includes('Alpha body — the first page\'s own words.') && bBytes.includes('Beta body — the second page\'s own words.'),
    JSON.stringify({ aBytes, bBytes }));
  await app.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

  // A page carrying hand-drawn ink alongside its text: the ink is never
  // silently dropped from a claimed-complete export — a named placeholder
  // line names it instead.
  const inkDl = mkDlDir('ink');
  await app.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await seedAndOpen(app, {
    entries: [{
      id: 'e1-ink-page', projectId: null, source: 'page', origin: 'loose', pageType: 'note',
      text: 'Ink Alongside Text', strokes: [{ points: [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }] }],
      createdAt: NOW, updatedAt: NOW,
    }],
    waitSel: '.forward-only-editor, textarea, [contenteditable]',
    hash: '#/page/e1-ink-page',
    dlDir: inkDl,
  });
  await app.cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await trustedClick(app, 'Publish');
  await sleep(250);
  await trustedClick(app, 'This Page (.md)');
  await sleep(700);
  const inkFiles = filesIn(inkDl);
  const inkBytes = inkFiles.length ? read(inkDl, inkFiles[0]) : '';
  ok('S3 OFFLINE: a page carrying hand-drawn ink alongside typed text exports the typed text PLUS a named placeholder line for the ink — never silently dropped',
    inkBytes.includes('Ink Alongside Text') && inkBytes.includes('[Hand-drawn ink — not exported as text.]'), inkBytes);

  // Filename safety — Windows/macOS illegal characters stripped, no crash,
  // a non-empty safe name results.
  const illegalDl = mkDlDir('illegal');
  await app.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await seedAndOpen(app, {
    entries: [{
      id: 'e1-illegal-name', projectId: null, source: 'page', origin: 'loose', pageType: 'note',
      text: 'Bad<>:"/\\|?*Name\n\nBody text here.',
      createdAt: NOW, updatedAt: NOW,
    }],
    waitSel: '.forward-only-editor, textarea, [contenteditable]',
    hash: '#/page/e1-illegal-name',
    dlDir: illegalDl,
  });
  await app.cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await trustedClick(app, 'Publish');
  await sleep(250);
  await trustedClick(app, 'This Page (.md)');
  await sleep(700);
  const illegalFiles = filesIn(illegalDl);
  const ILLEGAL_RE = /[<>:"/\\|?*\x00-\x1f]/;
  ok('S5: a first line full of Windows/macOS-illegal filename characters (< > : " / \\ | ? *) produces exactly one safe, non-empty, successfully-written file — the illegal characters never reach the actual filename on disk',
    illegalFiles.length === 1 && !ILLEGAL_RE.test(illegalFiles[0]) && illegalFiles[0].length > 3,
    JSON.stringify(illegalFiles));

  // ==========================================================================
  // S3/S5 — "This Binder": three pages, the binder's own (creation) order
  // preserved, none missing. createdAt is deliberately NOT insertion order
  // in this fixture (page 2 is pushed to the array before page 1's later
  // createdAt) — proving the export sorts by createdAt, not array/localStorage
  // order, matching ProjectHome.tsx's own reading order exactly.
  // ==========================================================================
  const binderDl = mkDlDir('binder');
  await app.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await seedAndOpen(app, {
    projects: [{ id: 'e1-binder', title: 'The Export Test Binder', type: 'creative', storyPlanId: null, createdAt: NOW, updatedAt: NOW }],
    entries: [
      { id: 'e1-ch2', projectId: 'e1-binder', source: 'page', origin: 'project', pageType: 'manuscript', text: 'Chapter Two\n\nSecond chapter body.', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: NOW },
      { id: 'e1-ch1', projectId: 'e1-binder', source: 'page', origin: 'project', pageType: 'manuscript', text: 'Chapter One\n\nFirst chapter body.', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: NOW },
      { id: 'e1-ch3', projectId: 'e1-binder', source: 'page', origin: 'project', pageType: 'manuscript', text: 'Chapter Three\n\nThird chapter body.', createdAt: '2026-01-03T00:00:00.000Z', updatedAt: NOW },
    ],
    waitSel: '.forward-only-editor, textarea, [contenteditable]',
    hash: '#/page/e1-ch1',
    dlDir: binderDl,
  });
  await app.cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await trustedClick(app, 'Publish');
  await sleep(250);
  const binderBtnPresent = await app.evalJs("__diag().buttons.includes('This Binder')");
  ok('S4: "This Binder" only appears when the open page actually has a binder home (no greyed states)', binderBtnPresent === true, String(binderBtnPresent));
  await trustedClick(app, 'This Binder');
  await sleep(700);
  const binderFiles = filesIn(binderDl);
  const binderText = binderFiles.length ? read(binderDl, binderFiles[0]) : '';
  const chapterOrder = ['Chapter One', 'Chapter Two', 'Chapter Three'].map(t => binderText.indexOf(t));
  ok('S3 OFFLINE: "This Binder" wrote exactly one concatenated document (the disclosed builder\'s-call format — see the build report)',
    binderFiles.length === 1, JSON.stringify(binderFiles));
  ok('S3 OFFLINE: all three chapters are present, none missing, in the binder\'s OWN order (creation order — Chapter One, Two, Three) despite being seeded out of that order',
    chapterOrder.every(i => i >= 0) && chapterOrder[0] < chapterOrder[1] && chapterOrder[1] < chapterOrder[2], JSON.stringify(chapterOrder));
  ok('S3 OFFLINE: every chapter\'s own body text is present verbatim',
    binderText.includes('First chapter body.') && binderText.includes('Second chapter body.') && binderText.includes('Third chapter body.'), '');

  // ==========================================================================
  // S3/S5 — "Everything," the vacation insurance. The shared corpus (module
  // scope): a binder page, a journal page, a loose page, a board (text + ink +
  // page-pin cards, PLUS an E1.1 'connection' card and a fabricated unknown
  // kind), and a script — PLUS a system Board (still EXCLUDED — derived mirror)
  // and a soft-deleted page (E1.1: now RIDES ALONG under "## From the Trash",
  // no longer excluded). Asserts LIVE + TRASHED counts explicitly, the trash
  // section's honesty, and the S4 unknown-kind placeholder.
  // ==========================================================================
  const everythingDl = mkDlDir('everything');
  await app.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await seedAndOpen(app, {
    projects: CORPUS_PROJECTS,
    entries: CORPUS_ENTRIES,
    waitSel: '.forward-only-editor, textarea, [contenteditable]',
    hash: '#/page/e1-corpus-loose-page',
    dlDir: everythingDl,
  });
  await app.cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await trustedClick(app, 'Publish');
  await sleep(250);
  await trustedClick(app, 'Everything');
  await sleep(900);
  const everythingFiles = filesIn(everythingDl);
  const everythingText = everythingFiles.length ? read(everythingDl, everythingFiles[0]) : '';
  // Split at the "## From the Trash" marker: live pages above, trashed below.
  const trashIdx = everythingText.indexOf('## From the Trash');
  const liveSection = trashIdx >= 0 ? everythingText.slice(0, trashIdx) : everythingText;
  const trashSection = trashIdx >= 0 ? everythingText.slice(trashIdx) : '';
  const liveDocCount = (liveSection.match(/^# /gm) || []).length;
  const trashDocCount = (trashSection.match(/^# /gm) || []).length;
  ok('S3 OFFLINE: "Everything" wrote exactly one document',
    everythingFiles.length === 1, JSON.stringify(everythingFiles));
  // S3/E1.1 — LIVE + TRASHED counted EXPLICITLY (both numbers named), not one
  // blended total. Live successor to the parked "docCount === 5" assertion
  // (below): 5 live page headers above the marker + 1 trashed header below it.
  ok('S3/E1.1 OFFLINE: "Everything" counts LIVE and TRASHED explicitly — 5 live page headers above the "## From the Trash" marker (binder + journal + loose + board + script) and 1 trashed page header below it (6 total), not one blended count',
    liveDocCount === 5 && trashDocCount === 1, JSON.stringify({ liveDocCount, trashDocCount }));
  ok('S3 OFFLINE: the binder/journal/loose pages\' own bodies are present verbatim',
    everythingText.includes('Binder content.') && everythingText.includes('Journal content.') && everythingText.includes('Loose content.'), '');
  ok('S3 OFFLINE: the Board exports honestly — its text card\'s own title+body, the ink card as a NAMED placeholder (never silently dropped), and the page-pin card as a named membership reference',
    everythingText.includes('Board card body.') && everythingText.includes('[Hand-drawn ink — not exported as text.]') && everythingText.includes('Pinned: Journal Page'), '');
  // S4/E1.1 — the inverted whitelist: a fabricated unknown-kind card exports
  // the named placeholder (never silently dropped), and it appears EXACTLY
  // ONCE — proving the by-name-skipped 'connection' card produced no placeholder.
  ok('S4/E1.1 OFFLINE: a fabricated unknown-kind board card exports the named placeholder line — never silence — and it appears exactly once (the by-name-skipped "connection" card adds no placeholder)',
    everythingText.includes('[A card of an unrecognized kind — not exported as text.]')
      && (everythingText.match(/A card of an unrecognized kind/g) || []).length === 1,
    JSON.stringify({ placeholderCount: (everythingText.match(/A card of an unrecognized kind/g) || []).length }));
  ok('S3 OFFLINE: the Script page exports via the existing serializeScriptDoc rendering (uppercase slugline, the action line verbatim)',
    everythingText.includes('INT. CORPUS ROOM - DAY') && everythingText.includes('The writer leaves for vacation.'), '');
  ok('S3 OFFLINE: the system Board\'s own title ("Journal," the seeded systemKind text) never appears as its own exported page',
    !new RegExp('^# Journal$', 'm').test(everythingText), '');
  // S3/E1.1 — the "## From the Trash" marker is EXPORTED BODY TEXT (not routed
  // through deskLexicon), present exactly once.
  ok('S3/E1.1 OFFLINE: the honest "## From the Trash" marker is present exactly once as exported body text (deliberately NOT routed through deskLexicon)',
    (everythingText.match(/^## From the Trash$/gm) || []).length === 1, JSON.stringify({ trashIdx }));
  // FX11 S3 (E1.1 review advisory 2) — writer-authored lane titles ride the
  // export. The corpus board carries board-meta lanes [Act One, (empty), Act
  // Two]; the export emits ONE "Lanes:" line, the named titles in lane order,
  // the empty-named lane filtered — exported BODY text, deliberately OUTSIDE
  // deskLexicon (the ratified E1 boundary, same as the card headers).
  ok('FX11 S3 OFFLINE: a board with named lanes shows both titles in "Everything" as one "Lanes:" line in lane order, the empty-named lane filtered',
    everythingText.includes('Lanes: Act One, Act Two'), JSON.stringify({ has: everythingText.includes('Lanes: Act One, Act Two'), noEmpty: !everythingText.includes('Lanes: Act One, , Act Two') }));
  ok('FX11 S3 OFFLINE: exactly ONE "Lanes:" line in the whole export — boards without named lanes (and the excluded system board) emit none (no empty hinge)',
    (everythingText.match(/^Lanes: /gm) || []).length === 1, JSON.stringify({ laneLines: (everythingText.match(/^Lanes: /gm) || []).length }));
  // S3/E1.1 — live successor to the parked trash-EXCLUSION assertion (below):
  // the soft-deleted page RIDES ALONG under the marker and is ABSENT above it.
  ok('S3/E1.1 OFFLINE: the soft-deleted page RIDES ALONG — its title "Deleted Page" and its words appear UNDER the "## From the Trash" marked section, and NEVER in the live section above it (read-only: still soft-deleted, never resurrected)',
    trashIdx >= 0 && trashSection.includes('Deleted Page') && trashSection.includes('Words the writer trashed but did not lose.') && !liveSection.includes('Deleted Page'),
    JSON.stringify({ inTrash: trashSection.includes('Deleted Page'), inLive: liveSection.includes('Deleted Page') }));

  await app.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

  // ==========================================================================
  // S4 — the "coming soon" line survives, verbatim, but now sits BELOW the
  // real, unmissable Download section rather than leading the dialog.
  // ==========================================================================
  const dialogOrder = await app.evalJs(`(() => {
    const dialog = document.querySelector('[aria-label="Publish"]');
    const text = dialog.innerText;
    return {
      downloadIdx: text.indexOf('Download'),
      comingSoonIdx: text.indexOf('are coming soon'),
      hasComingSoon: text.includes('Publishing options'),
    };
  })()`);
  ok('S4: the download actions render ABOVE the (still true, unchanged) "coming soon" line — Publish no longer reads as a dead end',
    dialogOrder.hasComingSoon && dialogOrder.downloadIdx >= 0 && dialogOrder.downloadIdx < dialogOrder.comingSoonIdx, JSON.stringify(dialogOrder));

  // ==========================================================================
  // Geometry — 1100 / 1280 / 2200 (framed), legacy <1100 unchanged. Every
  // width re-proves the SAME Download row actually renders and works
  // (both-reference-widths discipline); legacy re-proves the pre-AB1 chrome
  // (no .desk-frame) is untouched — the Publish dialog itself was already
  // SHARED between the framed and legacy hosts before this ticket (both
  // branches render the same publishDialog JSX), so this ticket's fix
  // reaches the legacy view too, by construction, not by a new gate this
  // ticket added (the same "shared code, not framed-gated" shape fx8.mjs's
  // own Legacy section documented for board cards).
  // ==========================================================================
  for (const width of [1100, 1280, 2200]) {
    await seedAndOpen(app, {
      entries: [{ id: 'e1-geom-page', projectId: null, source: 'page', origin: 'loose', pageType: 'note', text: 'Geometry Page\n\nBody.', createdAt: NOW, updatedAt: NOW }],
      waitSel: '.forward-only-editor, textarea, [contenteditable]',
      hash: '#/page/e1-geom-page',
      width, height: 900,
    });
    const framedShape = await app.evalJs("!!document.querySelector('.desk-frame')");
    await trustedClick(app, 'Publish');
    await sleep(250);
    const btns = await app.evalJs("__diag().buttons");
    ok(`Geometry @${width}px: framed (.desk-frame present) and the full Download row renders (This Page .md/.txt + Everything)`,
      framedShape === true && btns.includes('This Page (.md)') && btns.includes('This Page (.txt)') && btns.includes('Everything'),
      JSON.stringify({ framedShape, btns: btns.filter(b => /download|page|everything/i.test(b)) }));
    await app.evalJs("document.querySelector('.sprint-modal-backdrop')?.click()");
    await sleep(150);
  }

  await seedAndOpen(app, {
    entries: [{ id: 'e1-legacy-page', projectId: null, source: 'page', origin: 'loose', pageType: 'note', text: 'Legacy Page\n\nBody.', createdAt: NOW, updatedAt: NOW }],
    waitSel: '.page, textarea, [contenteditable]',
    hash: '#/page/e1-legacy-page',
    width: LEGACY_W, height: 900,
  });
  const legacyShape = await app.evalJs(`(() => ({
    hasDeskFrame: !!document.querySelector('.desk-frame'),
    hasPageClass: !!document.querySelector('.page'),
  }))()`);
  ok('Legacy (<1100px): the surrounding chrome stays byte-identical — no .desk-frame, the same pre-AB1 .page wrapper (this ticket never touches that branch\'s own markup)',
    !legacyShape.hasDeskFrame && legacyShape.hasPageClass, JSON.stringify(legacyShape));
  await trustedClick(app, 'Publish');
  await sleep(250);
  const legacyBtns = await app.evalJs("__diag().buttons");
  ok('Legacy (<1100px): the SAME Publish dialog (already shared with the framed host pre-ticket) carries the real Download row too — a legacy-viewport writer gets the same vacation insurance, not a lesser one',
    legacyBtns.includes('This Page (.md)') && legacyBtns.includes('Everything'), JSON.stringify(legacyBtns.filter(b => /download|page|everything/i.test(b))));

  // ==========================================================================
  // ScriptEditor's OWN Publish dialog — a second, independent copy-path
  // implementation (plainScriptWords/serializeScriptDoc, not
  // stripMarkdownConventions/entry.text) gets the SAME S2 fix, proven live
  // here too, plus its own Download row. Also re-proves the legacy
  // "Copy script text" toolbar button (which has NO Publish dialog and NO
  // mounted toast) is genuinely UNTOUCHED — it stays fire-and-forget, not
  // silently broken by wiring a toast call into a tree that never renders it.
  // ==========================================================================
  await seedAndOpen(app, {
    entries: [{
      id: 'e1-script-page', projectId: null, source: 'page', origin: 'loose', pageType: 'script',
      script: { v: 1, scenes: [{ id: 'sc1', heading: { id: 'h1', t: 'scene', text: 'INT. TEST ROOM - DAY' }, body: [{ id: 'a1', t: 'action', text: 'A script-page action line.' }] }] },
      text: 'INT. TEST ROOM - DAY', createdAt: NOW, updatedAt: NOW,
    }],
    waitSel: '.script-sheet',
    hash: '#/page/e1-script-page',
  });
  await app.cdp('Browser.grantPermissions', { permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'], origin: app.base });
  await trustedClick(app, 'Publish');
  await sleep(250);
  await trustedClick(app, 'Copy My Words');
  await sleep(300);
  const scriptWordsToast = await app.evalJs("document.querySelector('.action-toast')?.textContent");
  ok('S2 (ScriptEditor\'s own Publish dialog): "Copy My Words" renders the same house confirmation',
    scriptWordsToast === 'Copied — your plain words are on the clipboard.', String(scriptWordsToast));
  await trustedClick(app, 'Copy Formatted');
  await sleep(300);
  const scriptFmtClip = await app.evalJs('navigator.clipboard.readText()');
  ok('S2 (ScriptEditor): "Copy Formatted" places the serializeScriptDoc rendering on the real clipboard (uppercase slugline convention intact)',
    scriptFmtClip.includes('INT. TEST ROOM - DAY') && scriptFmtClip.includes('A script-page action line.'), scriptFmtClip);

  await sleep(150);
  await app.emulateDpr(1, LEGACY_W, 900);
  await sleep(200);
  const legacyScriptBtns = await app.evalJs('__diag().buttons');
  ok('Legacy (<1100px) ScriptEditor: has its OWN pre-existing "Copy script text" toolbar button, with no Publish dialog at all — untouched by this ticket',
    legacyScriptBtns.includes('Copy script text') && !legacyScriptBtns.includes('This Page (.md)'), JSON.stringify(legacyScriptBtns));
  await trustedClick(app, 'Copy script text');
  await sleep(300);
  const legacyScriptClip = await app.evalJs('navigator.clipboard.readText()').catch((e) => `ERR:${e.message}`);
  ok('Legacy (<1100px) ScriptEditor: "Copy script text" still genuinely copies (fire-and-forget, unchanged) — no crash from calling the shared copyScriptText with no toast node mounted in this branch',
    typeof legacyScriptClip === 'string' && legacyScriptClip.includes('INT. TEST ROOM - DAY'), String(legacyScriptClip));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// E1.1 (2026-07-23) establishes this file's PARKED scaffold (the cd1.mjs/
// ab3.mjs convention: SUPERSEDED species, ORIGINAL quoted verbatim, live
// successor named — the recorded original text is NEVER rewritten in place,
// per the immutability law ratified 2026-07-22). Three checks are parked, all
// SUPERSEDED by the E1.1 fix (Fable's E1 post-merge review + the E1.1 brief):
//   1. the "This Page" pre-suffix filename assertion — S1 gave every "This
//      Page" file a stable id-suffix, so the bare-title name no longer holds.
//   2. the "Everything" docCount === 5 assertion — S3 makes the soft-deleted
//      page ride along under "## From the Trash," so the file now carries live
//      + trashed headers (5 + 1), counted explicitly, not one blended 5.
//   3. the "Everything" trash-EXCLUSION assertion — same S3: the soft-deleted
//      page now APPEARS (under the marker), the exact inverse of the old claim.
// Each successor is proven fresh in this file's own LIVE section above, and
// re-proven here against a fresh re-drive.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    // ---- Park 1: the round-trip "This Page" filename, pre-suffix. ----------
    // ORIGINAL (this file's own live S3 section, pre-E1.1):
    //   ok('S3 OFFLINE: "This Page" produced exactly two files (.md + .txt),
    //   network fully unavailable throughout', pageFiles.length === 2 &&
    //   pageFiles.includes('Round Trip Title.md') && pageFiles.includes(
    //   'Round Trip Title.txt'), JSON.stringify(pageFiles));
    // S1 (E1.1): every "This Page" base filename now carries a stable id-suffix
    // (Title + " (" + entry.id.slice(-6) + ")" — the id's random TAIL, so
    // same-tick pages stay distinct), so two pages sharing a first line can no
    // longer clobber each other on disk. The bare-title name is superseded by
    // the suffixed form. Live successor: this file's own live S3 round-trip
    // section (asserting "Round Trip Title (ndtrip).md/.txt").
    const parkPageDl = mkDlDir('parked-page');
    await seedAndOpen(app, { entries: [ROUNDTRIP_ENTRY], waitSel: '.forward-only-editor, textarea, [contenteditable]', hash: '#/page/e1-roundtrip', dlDir: parkPageDl });
    await trustedClick(app, 'Publish');
    await sleep(250);
    await trustedClick(app, 'This Page (.md)');
    await sleep(700);
    await trustedClick(app, 'This Page (.txt)');
    await sleep(700);
    const parkPageFiles = filesIn(parkPageDl);
    pok('PARKED (was "S3 OFFLINE: \'This Page\' produced exactly two files (.md + .txt), network fully unavailable throughout" — asserting the bare-title names "Round Trip Title.md/.txt") — S1/E1.1: every "This Page" filename now carries the stable id-suffix; the suffixed form "Round Trip Title (ndtrip).md/.txt" supersedes it — live successor: this file\'s own live S3 round-trip section',
      parkPageFiles.length === 2 && parkPageFiles.includes('Round Trip Title (ndtrip).md') && parkPageFiles.includes('Round Trip Title (ndtrip).txt')
        && !parkPageFiles.includes('Round Trip Title.md') && !parkPageFiles.includes('Round Trip Title.txt'),
      JSON.stringify(parkPageFiles));

    // ---- Parks 2 & 3: the "Everything" corpus, pre-Trash. -----------------
    // Both re-verified off ONE fresh corpus export.
    const parkEvDl = mkDlDir('parked-everything');
    await seedAndOpen(app, { projects: CORPUS_PROJECTS, entries: CORPUS_ENTRIES, waitSel: '.forward-only-editor, textarea, [contenteditable]', hash: '#/page/e1-corpus-loose-page', dlDir: parkEvDl });
    await trustedClick(app, 'Publish');
    await sleep(250);
    await trustedClick(app, 'Everything');
    await sleep(900);
    const parkEvFiles = filesIn(parkEvDl);
    const parkEvText = parkEvFiles.length ? read(parkEvDl, parkEvFiles[0]) : '';
    const parkTrashIdx = parkEvText.indexOf('## From the Trash');
    const parkLiveSection = parkTrashIdx >= 0 ? parkEvText.slice(0, parkTrashIdx) : parkEvText;
    const parkTrashSection = parkTrashIdx >= 0 ? parkEvText.slice(parkTrashIdx) : '';
    const parkLiveDocCount = (parkLiveSection.match(/^# /gm) || []).length;
    const parkTrashDocCount = (parkTrashSection.match(/^# /gm) || []).length;

    // ORIGINAL (this file's own live S3/S5 section, pre-E1.1):
    //   ok('S5: the exported document COUNT (5, counting each page\'s own "# "
    //   header) equals the writer\'s own LIVE page count — binder + journal +
    //   loose + board + script — the system Board and the soft-deleted page
    //   correctly excluded, no silent omissions AND no phantom inclusions',
    //   docCount === 5, `docCount=${docCount}`);
    // S3 (E1.1): the soft-deleted page now rides along under "## From the
    // Trash," so the file carries 5 live + 1 trashed headers, counted
    // explicitly (both numbers named), not one blended 5. Live successor: this
    // file's own live "counts LIVE and TRASHED explicitly" check above.
    pok('PARKED (was "S5: the exported document COUNT (5, counting each page\'s own \'# \' header) equals the writer\'s own LIVE page count — binder + journal + loose + board + script — the system Board and the soft-deleted page correctly excluded, no silent omissions AND no phantom inclusions" — asserting docCount === 5) — S3/E1.1: the soft-deleted page rides along under "## From the Trash"; the count is now 5 live + 1 trashed, named explicitly — live successor: this file\'s own live LIVE-and-TRASHED count check',
      parkLiveDocCount === 5 && parkTrashDocCount === 1, JSON.stringify({ parkLiveDocCount, parkTrashDocCount }));

    // ORIGINAL (this file's own live S3 section, pre-E1.1):
    //   ok('S3 OFFLINE: the soft-deleted page\'s own title never appears — not
    //   a live page the writer currently owns', !everythingText.includes(
    //   'Deleted Page'), '');
    // S3 (E1.1, Nick's ratified word): the Trash RIDES ALONG — the soft-deleted
    // page now appears under the "## From the Trash" marked section (and only
    // there, never in the live section above), the exact inverse of the old
    // exclusion claim. Read-only: still soft-deleted, never resurrected. Live
    // successor: this file's own live "RIDES ALONG" check above.
    pok('PARKED (was "S3 OFFLINE: the soft-deleted page\'s own title never appears — not a live page the writer currently owns" — asserting !everythingText.includes(\'Deleted Page\')) — S3/E1.1: the Trash rides along; the soft-deleted page now APPEARS under "## From the Trash" (and never in the live section above) — live successor: this file\'s own live "RIDES ALONG" check',
      parkTrashIdx >= 0 && parkTrashSection.includes('Deleted Page') && !parkLiveSection.includes('Deleted Page'),
      JSON.stringify({ parkTrashIdx, inTrash: parkTrashSection.includes('Deleted Page'), inLive: parkLiveSection.includes('Deleted Page') }));

    return parkedChecks;
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nE1 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all superseded-check successors green`
    : `\nE1 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const allChecksE1 = checks.concat(parkedChecks);
const pass = allChecksE1.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nE1 VERIFY: PASS (${allChecksE1.length} checks)` : `\nE1 VERIFY: FAIL — ${allChecksE1.filter((c) => !c.pass).length}/${allChecksE1.length} failed`);
process.exit(pass ? 0 : 1);
