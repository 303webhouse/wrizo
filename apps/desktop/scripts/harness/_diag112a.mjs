// TEMPORARY DIAGNOSTIC — not a committed check. Controls the S4 anchor reading at
// 1100 against DRAFT, to separate "112-A broke the anchor" from "this is what the
// app already does at 1100 and the harness expectation was wrong."
import { withHarness } from '../runtime-verify.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [];

const freshDesk = async (app, width, height) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, width, height);
};
const freshProsePage = async (app, width, height) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page' });
  await app.emulateDpr(1, width, height);
  await sleep(300);
};
const enterMode = async (app, key) => {
  await app.evalJs(`document.querySelector('.desk-mode-tab[data-mode-key="${key}"]')?.click()`);
  await sleep(450);
};
const GEO = `(() => {
  const r = (s) => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return { l:+b.left.toFixed(1), r:+b.right.toFixed(1), w:+b.width.toFixed(1) }; };
  return {
    sheet: r('.mode-page'), col: r('.mode-pagecol'),
    dock: r('[data-menus-dock], .wz-sliver'), panel: r('.wz-sliver-panel'),
    grip: r('.wz-sliver-grip'),
    open: document.querySelector('.wz-sliver')?.getAttribute('data-open'),
    vw: window.innerWidth,
  };
})()`;

await withHarness(async (app) => {
  for (const [w, h] of [[1100, 900], [1366, 768]]) {
    for (const mode of ['draft', 'revise', 'freewrite']) {
      await freshProsePage(app, w, h);
      await enterMode(app, mode);
      const closed = await app.evalJs(GEO);
      await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
      await sleep(450);
      const open = await app.evalJs(GEO);
      out.push({
        leg: `${w}x${h} ${mode}`,
        closedDelta: closed.sheet && closed.dock ? +(closed.sheet.l - closed.dock.r).toFixed(2) : null,
        openDelta: open.sheet && open.dock ? +(open.sheet.l - open.dock.r).toFixed(2) : null,
        closed, open,
      });
    }
  }
  return [{ name: 'diag', pass: true, detail: '' }];
});
// eslint-disable-next-line no-console
console.log(JSON.stringify(out, null, 2));
