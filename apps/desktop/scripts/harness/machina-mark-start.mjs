// MACHINA MARK + START FILES (a box turn; Fable, Oct 29, #11): (1) Machina's board "pair with a new page" button reads "Start Files" (the lexicon's own override, beside boardPairWithPage's Arbor "Start Pages" and
// Flux's "Start Docs"); (2) the WRIZ wordmark's outlined block is STEEL in COOL and ORANGE in NEUTRAL (it follows --line-active, the active carrier), never the same orange in both.
//   S1  Machina: the .board-pair button reads "Start Files"            S2  Arbor still reads "Start Pages" (the canonical is untouched)
//   M1  COOL: the .brand-mark::after border colour is the steel (#7FA0BC)    M2  NEUTRAL: it is the orange (#FF9800)     M3  the mark is square, no shadow
//   M4  the WRIZ letters are unchanged (the ::before content)
// Run (repo root or apps/desktop; needs a box turn):  node scripts/harness/machina-mark-start.mjs      MK_FRAMES=<dir> saves one frame per cast
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FRAMES = process.env.MK_FRAMES || null;
const frame = async (app, name) => { if (!FRAMES) return; mkdirSync(FRAMES, { recursive: true }); writeFileSync(join(FRAMES, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };

const READ = `(() => { const m = document.querySelector('.brand-mark'); const a = m ? getComputedStyle(m, '::after') : null; const b = m ? getComputedStyle(m, '::before') : null;
  const p = document.querySelector('.board-pair');
  return { pair: p ? p.textContent.trim() : null, border: a ? a.borderTopColor : null, borderW: a ? a.borderTopWidth : null, shadow: a ? a.boxShadow : null, radius: a ? a.borderTopLeftRadius : null, word: b ? b.content : null, cast: document.documentElement.getAttribute('data-cast') }; })()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.evalJs("window.wrizoCreateJournalPage({ id: 'mk-board', text: '', pageType: 'board', boxes: [], createdAt: new Date().toISOString(), origin: null })");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after seed' });

  const open = async (label) => {
    await app.evalJs("location.hash = '#/page/mk-board'");
    await app.waitFor("!!document.querySelector('.board-pair')", { label: `board (${label})`, timeout: 12000 }).catch(() => {});
    await sleep(500);
  };

  await app.evalJs("window.wrizoTheme.set('plateau')");
  await open('arbor');
  const arbor = await app.evalJs(READ);
  ok('S2: Arbor still reads "Start Pages" (the canonical is untouched)', arbor.pair === 'Start Pages', JSON.stringify(arbor));

  for (const cast of ['cool', 'neutral']) {
    await app.evalJs(`window.wrizoTheme.set('machina'); window.wrizoCast && window.wrizoCast.set('${cast}')`);
    await open(cast);
    const r = await app.evalJs(READ);
    await frame(app, `mark-${cast}`);
    if (cast === 'cool') {
      ok('S1: Machina\'s board button reads "Start Files"', r.pair === 'Start Files', JSON.stringify(r));
      ok('M1: COOL - the wordmark block is steel (#7FA0BC)', r.border === 'rgb(127, 160, 188)', JSON.stringify(r));
    } else {
      ok('M2: NEUTRAL - the wordmark block is orange (#FF9800)', r.border === 'rgb(255, 152, 0)', JSON.stringify(r));
    }
    ok(`M3 [${cast}]: the block is square, outlined, no shadow`, r.radius === '0px' && r.shadow === 'none' && parseFloat(r.borderW) >= 1, JSON.stringify(r));
    ok(`M4 [${cast}]: the letters are still WRIZ`, r.word === '"WRIZ"', JSON.stringify(r));
  }
}).catch((e) => { ok('harness ran to a verdict', false, String(e && e.stack || e)); });

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? '  ' + c.detail : ''}`);
console.log(failed.length ? `MACHINA-MARK-START VERIFY: FAIL (${failed.length} of ${checks.length})` : `MACHINA-MARK-START VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
