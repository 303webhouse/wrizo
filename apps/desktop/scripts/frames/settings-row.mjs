// REVIEW FRAME for #63's page-turn sound switch (Fable, Nov 12, 5:25 pm): the SETTINGS ROW, one frame per theme.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<frames sha> -f themes=plateau,flux,machina -f screens=settings-row -f tones=light -f widths=1366 \
//      -f screens_file=apps/desktop/scripts/frames/settings-row.mjs
// The switch lives in the left rail's Settings (the cascade panel the page's own strip opens): the row `.wz-cascade-turnsound` ("Page-turn sound: On / Off", a two-button group).
// The panel is opened by the same selector the red-first check uses; nothing is pressed, so the frame shows each theme's DEFAULT (Arbor on, Flux on, Machina off).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const soft = async (app, expr, label) => { try { await app.waitFor(expr, { label }); } catch { /* the frame is taken either way */ } };
export default {
  'settings-row': async (app) => {
    await app.goto('/page/new');
    await soft(app, `!!document.querySelector('${ED}')`, 'blank page');
    await sleep(900);
    await app.evalJs(`(() => { const b = document.querySelector('.wz-strip [data-category="settings"]') || document.querySelector('[data-category="settings"]'); if (b) b.click(); return !!b; })()`);
    await soft(app, `!!document.querySelector('.wz-cascade-turnsound')`, 'the Page-turn sound row');
    await sleep(700);
  },
};
