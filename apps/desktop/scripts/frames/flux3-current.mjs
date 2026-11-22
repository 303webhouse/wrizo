// FLUX3 THE CURRENT as named screens for the frames job (Fable, Nov 21, 6:00 pm: "Frames to the Wrizors when it draws"):
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=fix-flux-current -f themes=flux -f tones=dark -f widths=1920
//        -f screens_file=apps/desktop/scripts/frames/flux3-current.mjs -f screens=stage-1,stage-2,stage-3,hand-left,hand-right,hands-both
// The stage spark runs for 0.55 s, so each stage frame HOLDS the spark at one moment of its lap (its animations paused at that time, copied into a still layer that the module does not remove), the three
// steps of the concept sheet (flux-stage-current-concept-v2.png): 0.1 s (leaving the button both ways), 0.3 s (along the bar and down to the menus), 0.5 s (finishing its lap). The hands frames hold the
// electron mid-line. Pages are made through the app's seams, never raw storage. Each screen prints what it stood on ("FLUX3-CURRENT-FRAME <screen> {...}").
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
let seq = 0;
const TEXT = 'The harbour was quiet when she arrived. Nobody met her at the quay.\nA second line of her words, long enough to sit under the cursor.';
const mkPage = (app, id) => app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: TEXT, createdAt: new Date(Date.now() + (seq += 1)).toISOString(), origin: 'loose', source: 'page' })})`);
const openRoom = async (app, id) => {
  await app.evalJs("localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50');");
  await sleep(300);
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); history.replaceState(null, '', '/?flux3=1#/page/${id}')`);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the room', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.mouseMove(8, 8);
  await sleep(1800);
};
// press a stage button as a real press does (focus, then click), then freeze the spark at `ms` of its lap into a still layer
const pressAndHold = async (app, key, ms) => {
  await app.evalJs(`(() => { const b = document.querySelector('.desk-mode-tab[data-mode-key="${key}"]'); b.focus(); b.click(); })()`);
  const seen = await waitSoft(app, "!!document.querySelector('[data-flux-current]')", { label: 'the spark', timeout: 3000 });
  if (!seen) return null;
  return app.evalJs(`(() => { const svg = document.querySelector('[data-flux-current]'); if (!svg) return null;
    const clone = svg.cloneNode(true); clone.removeAttribute('data-flux-current'); clone.setAttribute('data-frame-hold', '');
    const src = [...svg.querySelectorAll('path')], dst = [...clone.querySelectorAll('path')];
    svg.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = ${ms}; });
    src.forEach((p, i) => dst[i].setAttribute('stroke-dashoffset', getComputedStyle(p).strokeDashoffset));
    document.body.appendChild(clone); svg.remove();
    return { paths: dst.length, last: window.wrizoFluxCurrent && window.wrizoFluxCurrent.last ? window.wrizoFluxCurrent.last.paths.map((p) => ({ side: p.side, n: p.pts.length, len: Math.round(p.length) })) : null }; })()`);
};
const holdElectron = (app) => app.evalJs(`(() => { const els = [...document.querySelectorAll('[data-flux-hand] .flux-hand-electron')]; els.forEach((e) => e.getAnimations().forEach((a) => { a.pause(); a.currentTime = 760; })); return els.length; })()`);
const openHand = async (app, sel) => {
  await app.evalJs(`(() => { const g = document.querySelector('${sel}'); g.focus(); g.click(); })()`);
  await waitSoft(app, "!!document.querySelector('[data-flux-hand]')", { label: 'the hand', timeout: 3000 });
  await sleep(500);
  await app.evalJs('document.activeElement && document.activeElement.blur && document.activeElement.blur()');   // the press's focus ring is not part of the picture; nothing has editor focus, so the electron is the one that runs
};

export default {
  'stage-1': async (app) => {
    await mkPage(app, 'cf-s1'); await sleep(400); await openRoom(app, 'cf-s1');
    console.log(`FLUX3-CURRENT-FRAME stage-1 ${JSON.stringify(await pressAndHold(app, 'revise', 100))}`);
  },
  'stage-2': async (app) => {
    await mkPage(app, 'cf-s2'); await sleep(400); await openRoom(app, 'cf-s2');
    console.log(`FLUX3-CURRENT-FRAME stage-2 ${JSON.stringify(await pressAndHold(app, 'revise', 300))}`);
  },
  'stage-3': async (app) => {
    await mkPage(app, 'cf-s3'); await sleep(400); await openRoom(app, 'cf-s3');
    console.log(`FLUX3-CURRENT-FRAME stage-3 ${JSON.stringify(await pressAndHold(app, 'revise', 500))}`);
  },
  'hand-left': async (app) => {
    await mkPage(app, 'cf-hl'); await sleep(400); await openRoom(app, 'cf-hl');
    await openHand(app, '.wz-sliver-grip');
    console.log(`FLUX3-CURRENT-FRAME hand-left ${JSON.stringify({ electrons: await holdElectron(app) })}`);
  },
  'hand-right': async (app) => {
    await mkPage(app, 'cf-hr'); await sleep(400); await openRoom(app, 'cf-hr');
    await openHand(app, '.wz-tutor-grip');
    console.log(`FLUX3-CURRENT-FRAME hand-right ${JSON.stringify({ electrons: await holdElectron(app) })}`);
  },
  'hands-both': async (app) => {
    await mkPage(app, 'cf-hb'); await sleep(400); await openRoom(app, 'cf-hb');
    await openHand(app, '.wz-sliver-grip'); await openHand(app, '.wz-tutor-grip');
    console.log(`FLUX3-CURRENT-FRAME hands-both ${JSON.stringify({ electrons: await holdElectron(app) })}`);
  },
};
