// FLUX3 THE CURRENT as named screens for the frames job (Fable, Nov 21, 6:00 pm: "Frames to the Wrizors when it draws"):
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=fix-flux-current -f themes=flux -f tones=dark -f widths=1920
//        -f screens_file=apps/desktop/scripts/frames/flux3-current.mjs -f screens=stage-1,stage-2,stage-3,hand-left,hand-right,hands-both
// The stage spark runs for 0.55 s, so each stage frame HOLDS the spark at one moment of its lap (its animations paused at that time, copied into a still layer that the module does not remove), the three
// steps of the concept sheet (flux-stage-current-concept-v2.png): 0.1 s (leaving the button both ways), 0.3 s (along the bar and down to the menus), 0.5 s (finishing its lap). The hands frames hold the
// electron mid-line. Pages are made through the app's seams, never raw storage. Each screen prints what it stood on ("FLUX3-CURRENT-FRAME <screen> {...}").
import fs from 'node:fs';
import path from 'node:path';
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
  // THE WRIZORS' THREE CHECKS (Fable, Nov 21, 9:40 pm):
  // reduced-motion: one frame with reduced motion emulated: a stage change and a menu opening draw no spark and no line (the counts are printed with the frame)
  'reduced-motion': async (app) => {
    await mkPage(app, 'cf-rm'); await sleep(400); await openRoom(app, 'cf-rm');
    try {
      await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await sleep(300);
      await app.evalJs(`(() => { const b = document.querySelector('.desk-mode-tab[data-mode-key="revise"]'); b.focus(); b.click(); })()`);
      await sleep(120);
      const mid = await app.evalJs("document.querySelectorAll('[data-flux-current]').length");
      await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); g.focus(); g.click(); })()");
      await sleep(900);
      const state = await app.evalJs("({ reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, sparks: document.querySelectorAll('[data-flux-current]').length, hands: document.querySelectorAll('[data-flux-hand]').length, runs: window.wrizoFluxCurrent ? window.wrizoFluxCurrent.runs : null, menuOpen: document.querySelector('.wz-sliver-panel') && document.querySelector('.wz-sliver-panel').getAttribute('data-open') })");
      console.log(`FLUX3-CURRENT-FRAME reduced-motion ${JSON.stringify({ sparksDuringStage: mid, ...state })}`);
    } finally {
      await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    }
  },
  // hand-typing: a hand open, then she writes until the chrome recedes: the electron's animation is paused and it is not drawn (the frame shows the page with the line and no electron)
  'hand-typing': async (app) => {
    await mkPage(app, 'cf-ht'); await sleep(400); await openRoom(app, 'cf-ht');
    await openHand(app, '.wz-sliver-grip');
    const before = await app.evalJs("(() => { const e = document.querySelector('[data-flux-hand] .flux-hand-electron'); const a = e && e.getAnimations()[0]; return { playState: a ? a.playState : null, visibility: e ? getComputedStyle(e).visibility : null }; })()");
    await app.evalJs("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
    let receded = false;
    for (let i = 0; i < 40 && !receded; i += 1) { await app.typeKeys('and she kept writing '); await sleep(250); receded = await app.evalJs("!!document.querySelector('[data-chrome-receded=\"true\"]')"); }
    await sleep(600);
    const after = await app.evalJs("(() => { const e = document.querySelector('[data-flux-hand] .flux-hand-electron'); const a = e && e.getAnimations()[0]; const l = document.querySelector('[data-flux-hand] .flux-hand-line'); return { receded: !!document.querySelector('[data-chrome-receded=\"true\"]'), playState: a ? a.playState : null, visibility: e ? getComputedStyle(e).visibility : null, line: !!l, runs: window.wrizoFluxCurrent ? window.wrizoFluxCurrent.runs : null }; })()");
    console.log(`FLUX3-CURRENT-FRAME hand-typing ${JSON.stringify({ before, after })}`);
  },
  // recording: the 5-second film for Nick (stage change, then a hand opening). The runner cannot film in real time, so every animation in the page is PAUSED and stepped by its own clock, one captured frame per step,
  // written as numbered JPEGs into <out>/recording/ (fps in recording.json); the film is made from them (ffmpeg, on Nick's machine). Real clicks, the real layer: only the clock is stepped.
  recording: async (app) => {
    await mkPage(app, 'cf-rec'); await sleep(400); await openRoom(app, 'cf-rec');
    const outArg = process.argv.indexOf('--out');
    const OUT = path.resolve(outArg > 0 ? process.argv[outArg + 1] : 'frames-out');
    const REC = path.join(OUT, 'recording');
    fs.mkdirSync(REC, { recursive: true });
    let n = 0;
    const grab = async () => { const d = await app.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); fs.writeFileSync(path.join(REC, `f${String(n).padStart(4, '0')}.jpg`), Buffer.from(d.data, 'base64')); n += 1; };
    const FPS = 24, STEP = 1000 / FPS;
    const stepAll = (t) => app.evalJs(`(() => { document.getAnimations().forEach((a) => { try { a.pause(); a.currentTime = ${t}; } catch (e) { /* a finished one */ } }); return true; })()`);
    const playAll = () => app.evalJs("(() => { document.getAnimations().forEach((a) => { try { a.play(); } catch (e) { /* ignore */ } }); return true; })()");
    for (let i = 0; i < 10; i += 1) { await grab(); await sleep(30); }                      // the page at rest
    await app.evalJs(`(() => { const b = document.querySelector('.desk-mode-tab[data-mode-key="revise"]'); b.focus(); b.click(); })()`);
    await waitSoft(app, "!!document.querySelector('[data-flux-current]')", { label: 'the spark', timeout: 3000 });
    for (let t = 0; t <= 560; t += STEP) { await stepAll(t); await grab(); }                  // the stage current, 0 to 0.56 s of its own clock
    await playAll(); await sleep(700);
    for (let i = 0; i < 10; i += 1) { await grab(); await sleep(30); }                      // at rest again
    await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); g.focus(); g.click(); })()");
    await waitSoft(app, "!!document.querySelector('[data-flux-hand]')", { label: 'the hand', timeout: 3000 });
    for (let t = 0; t <= 2600; t += STEP) { await stepAll(t); await grab(); }                // the menu opening as current: the line, the box, the electron's run and the start of the next
    await playAll();
    fs.writeFileSync(path.join(REC, 'recording.json'), JSON.stringify({ frames: n, fps: FPS, seconds: Math.round((n / FPS) * 10) / 10 }) + '\n');
    console.log(`FLUX3-CURRENT-FRAME recording ${JSON.stringify({ frames: n, fps: FPS, seconds: Math.round((n / FPS) * 10) / 10, dir: REC })}`);
  },
};
