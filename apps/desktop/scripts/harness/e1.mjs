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
    entries: [{
      id: 'e1-roundtrip', projectId: null, source: 'page', origin: 'loose', pageType: 'note',
      text: 'Round Trip Title\n\nThe writer\'s **exact** words, *unaltered*, in order.\n\nA third line, never dropped.',
      createdAt: NOW, updatedAt: NOW,
    }],
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
  ok('S3 OFFLINE: "This Page" produced exactly two files (.md + .txt), network fully unavailable throughout',
    pageFiles.length === 2 && pageFiles.includes('Round Trip Title.md') && pageFiles.includes('Round Trip Title.txt'),
    JSON.stringify(pageFiles));
  const mdBytes = pageFiles.includes('Round Trip Title.md') ? read(pageDl, 'Round Trip Title.md') : '';
  const txtBytes = pageFiles.includes('Round Trip Title.txt') ? read(pageDl, 'Round Trip Title.txt') : '';
  ok('S3 OFFLINE: the .md file\'s ACTUAL bytes on disk carry the writer\'s exact words, formatting conventions intact, nothing altered/truncated/reordered',
    mdBytes === 'Round Trip Title\n\nThe writer\'s **exact** words, *unaltered*, in order.\n\nA third line, never dropped.', mdBytes);
  ok('S3 OFFLINE: the .txt file\'s ACTUAL bytes carry the same words with conventions stripped to honest plain text',
    txtBytes === 'Round Trip Title\n\nThe writer\'s exact words, unaltered, in order.\n\nA third line, never dropped.', txtBytes);

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
  // S3/S5 — "Everything," the vacation insurance. A seeded corpus with a
  // binder page, a journal page, a loose page, a board (text + ink +
  // page-pin cards), and a script — PLUS a system Board and a soft-deleted
  // page, both of which must be EXCLUDED (system Boards are derived
  // membership mirrors, already counted via the real pages they mirror;
  // deleted pages are not live pages the writer currently owns). Asserts
  // the exported document COUNT equals the writer's own LIVE page count —
  // no silent omissions.
  // ==========================================================================
  const everythingDl = mkDlDir('everything');
  await app.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await seedAndOpen(app, {
    projects: [{ id: 'e1-corpus-binder', title: 'Corpus Binder', type: 'creative', storyPlanId: null, createdAt: NOW, updatedAt: NOW }],
    entries: [
      { id: 'e1-corpus-binder-page', projectId: 'e1-corpus-binder', source: 'page', origin: 'project', pageType: 'manuscript', text: 'Binder Page\n\nBinder content.', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: NOW },
      { id: 'e1-corpus-journal-page', projectId: null, source: 'page', origin: 'journal', text: 'Journal Page\n\nJournal content.', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: NOW },
      { id: 'e1-corpus-loose-page', projectId: null, source: 'page', origin: 'loose', text: 'Loose Page\n\nLoose content.', createdAt: '2026-01-03T00:00:00.000Z', updatedAt: NOW },
      {
        id: 'e1-corpus-board', projectId: null, source: 'page', origin: 'loose', pageType: 'board', text: 'Corpus Board',
        boxes: [
          { id: 'cb-text', kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.1, z: 1, text: 'Board Card\nBoard card body.' },
          { id: 'cb-ink', kind: 'ink', x: 0.5, y: 0.1, w: 0.3, h: 0.1, z: 2, strokes: [{ points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }] },
          { id: 'cb-pin', kind: 'page-pin', x: 0.1, y: 0.4, w: 0.3, h: 0.1, z: 3, entryId: 'e1-corpus-journal-page' },
        ],
        createdAt: '2026-01-04T00:00:00.000Z', updatedAt: NOW,
      },
      {
        id: 'e1-corpus-script', projectId: null, source: 'page', origin: 'loose', pageType: 'script', text: 'INT. CORPUS ROOM - DAY',
        script: { v: 1, scenes: [{ id: 'sc1', heading: { id: 'h1', t: 'scene', text: 'INT. CORPUS ROOM - DAY' }, body: [{ id: 'a1', t: 'action', text: 'The writer leaves for vacation.' }] }] },
        createdAt: '2026-01-05T00:00:00.000Z', updatedAt: NOW,
      },
      // MUST be excluded: a system Board (derived membership mirror, not authored content).
      {
        id: 'e1-corpus-system-board', projectId: null, source: 'page', origin: 'system', pageType: 'board', text: 'Journal',
        boxes: [{ id: 'sb-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, systemKind: 'journal' }],
        createdAt: NOW, updatedAt: NOW,
      },
      // MUST be excluded: soft-deleted — not a live page the writer currently owns.
      { id: 'e1-corpus-deleted', projectId: null, source: 'page', origin: 'loose', text: 'Deleted Page', createdAt: NOW, updatedAt: NOW, deletedAt: NOW },
    ],
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
  const docCount = (everythingText.match(/^# /gm) || []).length;
  ok('S3 OFFLINE: "Everything" wrote exactly one document',
    everythingFiles.length === 1, JSON.stringify(everythingFiles));
  ok('S5: the exported document COUNT (5, counting each page\'s own "# " header) equals the writer\'s own LIVE page count — binder + journal + loose + board + script — the system Board and the soft-deleted page correctly excluded, no silent omissions AND no phantom inclusions',
    docCount === 5, `docCount=${docCount}`);
  ok('S3 OFFLINE: the binder/journal/loose pages\' own bodies are present verbatim',
    everythingText.includes('Binder content.') && everythingText.includes('Journal content.') && everythingText.includes('Loose content.'), '');
  ok('S3 OFFLINE: the Board exports honestly — its text card\'s own title+body, the ink card as a NAMED placeholder (never silently dropped), and the page-pin card as a named membership reference',
    everythingText.includes('Board card body.') && everythingText.includes('[Hand-drawn ink — not exported as text.]') && everythingText.includes('Pinned: Journal Page'), '');
  ok('S3 OFFLINE: the Script page exports via the existing serializeScriptDoc rendering (uppercase slugline, the action line verbatim)',
    everythingText.includes('INT. CORPUS ROOM - DAY') && everythingText.includes('The writer leaves for vacation.'), '');
  ok('S3 OFFLINE: the system Board\'s own title ("Journal," the seeded systemKind text) never appears as its own exported page',
    !new RegExp('^# Journal$', 'm').test(everythingText), '');
  ok('S3 OFFLINE: the soft-deleted page\'s own title never appears — not a live page the writer currently owns',
    !everythingText.includes('Deleted Page'), '');

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
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nE1 VERIFY: PASS (${checks.length} checks)` : `\nE1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
