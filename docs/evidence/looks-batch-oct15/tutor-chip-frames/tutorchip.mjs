// THE TUTOR CHIP + THE OPEN TAB - THE FRAMES (this desk's capture script), from the lookb worktree's own dist-web (the looks batch):
// a page with the Tutor drawer open, Arbor and Flux. Per frame: the chips' face text and the prompt each carries (title / aria-label / data attributes),
// the open TUTOR tab's computed colour and border, and the grip/tab rectangles (does the grip sit inside the tab).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from 'file:///C:/Users/nickh/writer-studio/.claude/worktrees/lookb/apps/desktop/scripts/runtime-verify.mjs';

const OUT = process.env.FRAMES_OUT;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const COMBOS = [
  { id: 'arbor', theme: 'plateau', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'flux-dark', theme: 'flux', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
];
const facts = (app) => app.evalJs(`(() => {
  const panel = document.querySelector('.wz-tutor-panel');
  const chips = panel ? [...panel.querySelectorAll('button')].filter((b) => !b.classList.contains('wz-drawer-note-btn')).map((b) => ({ text: b.textContent.trim().replace(/\\s+/g, ' ').slice(0, 40), title: b.getAttribute('title'), aria: b.getAttribute('aria-label'), cls: String(b.className).split(' ')[0], data: Object.assign({}, b.dataset) })) : [];
  const tab = document.querySelector('#wz-tutor-tab-tutor'); const grip = document.querySelector('.wz-tutor-grip');
  const rc = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) }; };
  const tcs = tab ? getComputedStyle(tab) : null;
  const tr = rc(tab), gr = rc(grip);
  return { origin: location.origin, theme: document.documentElement.getAttribute('data-theme'),
    bundle: ([...document.scripts].map((s) => s.src).find((s) => s.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, ''), splashPresent: !!document.querySelector('.wz-splash'),
    panelOpen: !!(panel && panel.dataset.open === 'true'), chips,
    tab: tab ? { dataOn: tab.dataset.on, color: tcs.color, borderColor: tcs.borderTopColor, background: tcs.backgroundColor } : null, tabRect: tr, gripRect: gr,
    gripInsideTab: !!(tr && gr && gr.l >= tr.l && gr.r <= tr.r && gr.t >= tr.t && gr.b <= tr.b) }; })()`);

await withHarness(async (app) => {
  for (const combo of COMBOS) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
      localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify(combo.prefs))}); localStorage.setItem('wrizo-theme', ${JSON.stringify(combo.theme)});
      localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'tc-page', text: 'A loose page with a few words in it.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(500);
    await app.evalJs("location.hash = '#/page/tc-page'");
    await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 9000 }); await sleep(900);
    await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()");
    await waitSoft(app, "!!document.querySelector(\".wz-tutor-panel[data-open='true']\")", { label: 'tutor open', timeout: 4000 }); await sleep(1100);
    writeFileSync(join(OUT, `${combo.id}-tutor-open.png`), Buffer.from(await app.screenshot(), 'base64'));
    const row = { frame: `${combo.id}-tutor-open`, file: `${combo.id}-tutor-open.png`, ...(await facts(app)) }; rows.push(row); console.log(JSON.stringify(row).slice(0, 1200));
  }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`TUTOR CHIP FRAMES: ${rows.length} frames -> ${OUT}`);
