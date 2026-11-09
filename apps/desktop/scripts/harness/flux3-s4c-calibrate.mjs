// THROWAWAY (never merged): the Corridor frames' line strength as MEASURED in the render, for a few opacity factors, so each slot's alpha can be set to the Wrizors' numbers.
import { withHarness } from '../runtime-verify.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FACTORS = [0.8, 1.0, 1.25, 1.5, 1.8, 2.2, 2.7];
try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  const id = `cal-${Date.now()}`;
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'A short older line.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await ev(`localStorage.setItem('wrizo-ambiance-dial', '50'); history.replaceState(null, '', '/?flux3=1#/page/${id}')`);
  await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000 });
  await sleep(2500);
  const shot = async (body) => {
    const data = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
    return ev(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${data}'; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const D = x.getImageData(0, 0, c.width, c.height); const W = c.width;
      const px = (a, b) => { const i = (b * W + a) * 4; return [D.data[i], D.data[i + 1], D.data[i + 2]]; };
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const lum = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
      const cr = (p, q) => (Math.max(lum(p), lum(q)) + 0.05) / (Math.min(lum(p), lum(q)) + 0.05);
      return (() => { ${body} })(); })()`);
  };
  const SC = [0, 1, 2, 3, 4, 5, 6, 7].map((j) => 1 / (1.1 + 1.03 * j));
  const base = await ev("[...document.querySelectorAll('.flux3-cor-frame:not([data-kind])')].map((f) => ({ slot: +f.dataset.slot, o: getComputedStyle(f).getPropertyValue('--o1').trim() }))");
  console.log('CAL base', JSON.stringify(base));
  for (const F of FACTORS) {
    await ev(`document.querySelectorAll('.flux3-cor-frame:not([data-kind])').forEach((f) => { const s = +f.dataset.slot; const b = ${JSON.stringify(base)}.find((x) => x.slot === s); if (b && s >= 0) f.style.setProperty('--o1', String(Math.min(1, parseFloat(b.o) * ${F}))); })`);
    await sleep(200);
    const r = await shot(`const S = ${JSON.stringify(SC)}; const Wd = innerWidth, Hd = innerHeight, vpx = 0.5 * Wd, vpy = 0.21 * Hd; return S.map((s) => { const x = Math.round(vpx - s * vpx), y0 = Math.round(vpy + s * (Hd / 2 - vpy)); const rowBest = []; for (const dy of [-30, -15, 0, 15, 30]) { const y = y0 + dy; const ref = px(x - 10, y); let best = 1; for (let dx = -3; dx <= 3; dx++) best = Math.max(best, cr(px(x + dx, y), ref)); rowBest.push(best); } rowBest.sort((a, b) => a - b); return +rowBest[2].toFixed(2); });`);
    console.log('CAL factor ' + F + ' -> ' + JSON.stringify(r));
  }
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); process.exit(1); }
console.log('CAL DONE');
