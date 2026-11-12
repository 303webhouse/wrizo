// MEASURE, not a check (#76): item85c's S2 sequence, printed. A row written straight into the browser's store (past the app), then ONE ordinary product write: is the raw row still there?
// On main's product the whole-cache write took it away (item85c S2 expects exactly that). With #76 part 1 a row that appears in the store behind a window's back is another window's write, and is taken in.
// Run: node scripts/harness/writing-audit/s2-raw-probe.mjs (on Actions via writing-audit.yml, script=s2-raw-probe.mjs). Prints S2PROBE {raw, seam} after the write.
import { withHarness } from '../../runtime-verify.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await withHarness(async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.evalJs("window.wrizoCreateJournalPage({ id: '85c-seam', text: 'seeded through the seam', origin: 'loose' })");
  await sleep(1500);
  await app.evalJs(`(() => { const now = new Date().toISOString(); const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); es.push({ id: '85c-raw', text: 'seeded raw', source: 'page', origin: 'loose', createdAt: now, updatedAt: now }); localStorage.setItem('writer-studio-journal-entries', JSON.stringify(es)); })()`);
  const read = () => app.evalJs(`(() => { const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); return JSON.stringify({ raw: es.some(e => e.id === '85c-raw'), seam: es.some(e => e.id === '85c-seam'), rows: es.length }); })()`);
  console.log('S2PROBE before the product write ' + await read());
  await app.evalJs("window.wrizoCreateJournalPage({ text: 'an ordinary product write' })");
  await sleep(1500);
  console.log('S2PROBE after one product write ' + await read());
});
process.exit(0);
