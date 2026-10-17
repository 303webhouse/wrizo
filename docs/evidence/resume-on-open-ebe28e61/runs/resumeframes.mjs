// RESUME-ON-OPEN FRAMES (this desk; Fable: "cold boot to a Page, to a board, and to the blank Free Write Page"). WT names the worktree (its runtime-verify, whose server double signs EVERY boot in); FRAMES_OUT = folder.
// WS_LANDING=1 leaves the landing ON (the double otherwise switches it off for the front-door harnesses). Seeding through the app's seams (wrizoCreateJournalPage, wrizoRecordLastPlace, wrizoFlushNow).
// Order: (1) the blank Free Write Page (a clean profile, no history), (2) a cold boot to the last Page, (3) a cold boot to the last board.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
process.env.WS_LANDING = '1';
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const OUT = process.env.FRAMES_OUT; mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
await withHarness(async (app) => {
  const flags = (hold = 50) => app.evalJs(`(() => { localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','${hold}');
    localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); })()`);
  const settled = async () => { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {}); await sleep(1100); };
  // a cold open starts at the root: a reload on a page address is a DEEP LINK, which wins over the landing (resume-on-open E5) - so step back to '#/' first, as the harness's own E8b does
  const coldBoot = async () => { await app.evalJs("location.hash = '#/'"); await sleep(400); await flags(50); await app.reload(); await settled(); };
  const facts = () => app.evalJs(`({ hash: location.hash, frontDoor: !!document.querySelector('.wz-arrival'), activeTab: (document.querySelector('.desk-mode-tab.active') || {}).textContent || null,
    crumb: (document.querySelector('.crumb-here') || {}).textContent || null, editor: !!document.querySelector('.forward-only-editor'), board: !!document.querySelector('.board-canvas'),
    livePages: JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').filter((e) => !e.deletedAt).length, pointer: JSON.parse(localStorage.getItem('wz.lastPlace') || 'null'),
    bundle: ([...document.scripts].map((s) => s.src).find((x) => x.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, '') })`);
  const shot = async (name) => { writeFileSync(join(OUT, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); const f = await facts(); const row = { frame: name, ...f }; rows.push(row); console.log('RSF ' + JSON.stringify(row)); };
  await app.emulateDpr(1, 1280, 800);
  await app.goto('/'); await settled();
  // (1) no history at all -> the blank Free Write Page
  await app.evalJs("localStorage.removeItem('wz.lastPlace')");
  await coldBoot(); await shot('1-cold-boot-blank-free-write-page');
  // (2) a Page
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'rsf-page', text: 'The ferry was late, so Ada counted gulls instead of minutes.', origin: 'loose', source: 'page', createdAt: new Date().toISOString() })})`);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'rsf-newer', text: 'A newer page that is NOT the last place.', origin: 'loose', source: 'page', createdAt: new Date(Date.now() + 60000).toISOString() })})`);
  await app.evalJs('window.wrizoFlushNow()');
  await app.evalJs("window.wrizoRecordLastPlace('test-user', 'page', 'rsf-page')");
  await coldBoot(); await shot('2-cold-boot-to-the-last-page');
  // (3) a board
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'rsf-board', text: 'Harbour board', pageType: 'board', origin: 'loose', source: 'page', createdAt: new Date().toISOString(),
    boxes: [{ id: 'rsf-c1', kind: 'text', x: 0.08, y: 0.1, w: 0.24, h: 0.16, z: 1, text: 'The harbour scene' }, { id: 'rsf-c2', kind: 'text', x: 0.45, y: 0.2, w: 0.24, h: 0.16, z: 2, text: 'The letter' }] })})`);
  await app.evalJs('window.wrizoFlushNow()');
  await app.evalJs("window.wrizoRecordLastPlace('test-user', 'page', 'rsf-board')");
  await coldBoot(); await shot('3-cold-boot-to-the-last-board');
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`RSF FRAMES: ${rows.length} -> ${OUT}`);
