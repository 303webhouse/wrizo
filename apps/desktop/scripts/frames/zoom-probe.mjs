// §3b ARBOR item 4, a PROBE (no product change): how the runner's Chrome reports geometry under CSS zoom on <html> and on one subtree, so the
// chrome scale's mechanism is chosen on measured behaviour. One screen, 1920 wide; the readings go to the job log (ZOOM-PROBE ...).
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<sha> -f themes=machina -f widths=1920 -f screens_file=apps/desktop/scripts/frames/zoom-probe.mjs -f screens=zoom-probe
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PROBE = (where) => `(() => {
  const host = document.createElement('div'); host.id = 'zp-host'; host.style.cssText = 'position:fixed;left:100px;top:100px;width:200px;height:50px;background:#f0f;z-index:2147483000;';
  const inner = document.createElement('div'); inner.style.cssText = 'position:absolute;left:10px;top:10px;width:50px;height:20px;background:#0f0;'; host.appendChild(inner);
  document.body.appendChild(host);
  if (${JSON.stringify(where)} === 'html') document.documentElement.style.zoom = '1.5';
  if (${JSON.stringify(where)} === 'host') host.style.zoom = '1.5';
  const hr = host.getBoundingClientRect(), ir = inner.getBoundingClientRect();
  const vw = (() => { const t = document.createElement('div'); t.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:1px;'; document.body.appendChild(t); const w = t.getBoundingClientRect().width; const ow = t.offsetWidth; t.remove(); return { rect: w, offset: ow }; })();
  return new Promise((res) => {
    const got = {};
    const onDown = (e) => { got.clientX = e.clientX; got.clientY = e.clientY; got.offsetX = e.offsetX; got.offsetY = e.offsetY; };
    inner.addEventListener('pointerdown', onDown, { once: true });
    window.__zpRes = () => res({ where: ${JSON.stringify(where)}, innerWidth, dpr: devicePixelRatio, htmlZoom: getComputedStyle(document.documentElement).zoom, hostRect: [hr.left, hr.top, hr.width, hr.height], innerRect: [ir.left, ir.top, ir.width, ir.height], hostOffset: [host.offsetLeft, host.offsetTop, host.offsetWidth, host.offsetHeight], vw, got,
      hit: (() => { const el = document.elementFromPoint(ir.left + 2, ir.top + 2); return el === inner ? 'inner' : el === host ? 'host' : (el && el.tagName); })() });
    window.__zpInner = [ir.left + ir.width / 2, ir.top + ir.height / 2];
  }); })()`;

export default {
  'zoom-probe': async (app) => {
    for (const where of ['none', 'host', 'html']) {
      await app.evalJs("document.documentElement.style.zoom = ''; document.getElementById('zp-host')?.remove(); null");
      const p = app.evalJs(PROBE(where));
      await sleep(200);
      const at = await app.evalJs('window.__zpInner');
      // a real pointer at the inner box's measured middle (viewport px), so clientX is the browser's own
      await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: at[0], y: at[1], button: 'left', buttons: 1, clickCount: 1 });
      await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at[0], y: at[1], button: 'left', buttons: 0, clickCount: 1 });
      await sleep(200);
      await app.evalJs('window.__zpRes && window.__zpRes(); null');
      console.log(`ZOOM-PROBE ${JSON.stringify(await p)} pressedAt=${JSON.stringify(at)}`);
    }
    await app.evalJs("document.documentElement.style.zoom = ''; document.getElementById('zp-host')?.remove(); null");
  },
};
