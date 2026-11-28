// #145 (Nick, Nov 27: "the '+' icon's location doesn't make sense as the Back menu covers it. There is also a small square icon that has a pop-out that also needs a
// new home." Shown three homes, he picked B: under the page at its right end, beside the page count, the pop-out opening upward). THE REAL APP in Flux's own look, a
// Draft page with two connections, 1366x768, 1536x706 (his window) and 1920x885.
//   H   "+" and the squares stand under the page, at its right end: below its foot, none of it on the page, "+" ending at the page's right edge
//   N   they cross neither the page count and its meter, nor each other
//   S   with the Back menu open, and with the Front menu open, they are still seen and a press still lands on them
//   U   a square's box, and the "+" box, open upward from the row in the lane to the page's right, inside the window, never over the page (Fable, Nov 27, 6:25 pm:
//       the never-cover rule); where that lane is too narrow the page gives way, as for a menu; pressed with the Back menu open, the Back menu gives the lane up
// Run: node scripts/harness/page-145.mjs   (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const SIZES = [[1280, 800], [1366, 768], [1536, 706], [1920, 885]];

const PROBE = `(() => {
  const R = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom].map((n) => Math.round(n * 10) / 10); };
  const page = document.querySelector('.desk-frame-stage .mode-page'), plus = document.querySelector('[data-flux3-plus]'), ports = [...document.querySelectorAll('.flux3-port')];
  const count = [...document.querySelectorAll('.desk-frame-instrument *')].filter((e) => !e.children.length && e.textContent.trim() && e.getBoundingClientRect().width > 0).map(R);
  const pw = page.getBoundingClientRect().width;   // the lane's rows are as wide as the page: only what is drawn in them is read
  const meter = [...document.querySelectorAll('.desk-frame-instrument *')].filter((e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && b.width < pw * 0.5 && cs.visibility !== 'hidden' && (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderLeftWidth) > 0); }).map(R);
  const hit = (e) => { const b = e.getBoundingClientRect(); const h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !!h && (h === e || e.contains(h)) && getComputedStyle(e).visibility !== 'hidden'; };
  return { page: R(page), plus: R(plus), ports: ports.map(R), lane: count.concat(meter), seen: !!plus && hit(plus) && ports.every(hit),
    box: R(document.querySelector('[data-flux3-port-box], [data-flux3-plus-box]')), back: document.querySelector('.wz-tutor-grip')?.getAttribute('aria-expanded') === 'true', vw: innerWidth, vh: innerHeight };
})()`;
const cross = (a, b) => !!a && !!b && a[0] < b[2] - 0.5 && b[0] < a[2] - 0.5 && a[1] < b[3] - 0.5 && b[1] < a[3] - 0.5;

await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const S = () => ev(PROBE);
  const press = async (sel) => { const p = await ev(`(() => { const b = document.querySelector(${J(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await app.mouseUp(p.x, p.y); await sleep(900); return true; };
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux')");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoAddPageLink === 'function'", { label: 'the seams' });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  for (const [id, text] of [['p145', 'The lamp burned low over the harbour.'], ['p145a', 'The harbour notes.'], ['p145b', 'The lamp notes.']]) await ev(`window.wrizoCreateJournalPage(${J({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' })})`);
  await ev("window.wrizoAddPageLink('p145', { bEntryId: 'p145a' }); window.wrizoAddPageLink('p145', { bEntryId: 'p145b' }); localStorage.setItem('wrizo-mode-page-p145', 'drafting'); window.wrizoFlushNow()");

  for (const [w, h] of SIZES) {
    const at = `Flux ${w}x${h}`;
    await app.emulateDpr(1, w, h);
    await ev("location.hash = '#/'"); await sleep(300);
    await ev("location.hash = '#/page/p145'");
    await app.waitFor("document.querySelectorAll('.flux3-port').length >= 2 && !!document.querySelector('[data-flux3-plus]')", { label: 'the plus and the squares', timeout: 15000 });
    await app.mouseMove(w / 2, 20);
    await sleep(1800);
    const r = await S();
    const all = [r.plus, ...r.ports];
    ok(`${at} H: "+" and the squares stand under the page at its right end`, all.every((b) => b && b[1] >= r.page[3] - 0.5 && b[2] <= r.page[2] + 1 && b[0] >= r.page[0] + (r.page[2] - r.page[0]) / 2) && Math.abs(r.plus[2] - r.page[2]) <= 2, { page: r.page, plus: r.plus, ports: r.ports });
    ok(`${at} N: they cross neither the count and its meter nor each other`, r.lane.length > 0 && all.every((b, i) => r.lane.every((l) => !cross(b, l)) && all.every((c, j) => i === j || !cross(b, c))), { all, lane: r.lane });
    for (const [side, grip] of [['Back', '.wz-tutor-grip'], ['Front', '.wz-sliver-grip']]) {
      await press(grip); await sleep(600);
      const o = await S();
      ok(`${at} S: with the ${side} menu open they are still seen and a press lands`, o.seen && [o.plus, ...o.ports].every((b) => b[1] >= o.page[3] - 0.5 && b[2] <= o.page[2] + 1), { seen: o.seen, page: o.page, plus: o.plus, ports: o.ports });
      await press(grip); await sleep(600);
    }
    {
      await press('.wz-tutor-grip'); await sleep(600);
      await press('.flux3-port');
      const o = await S();
      ok(`${at} U: pressed with the Back menu open, the Back menu gives the lane up and the box stands clear of the page`, !o.back && !!o.box && !cross(o.box, o.page), { back: o.back, box: o.box, page: o.page });
      await ev("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(900);
      await app.mouseMove(w / 2, 20); await sleep(900);
      const c = await S();
      ok(`${at} U: closed again, the page stands as it stood`, !c.box && JSON.stringify(c.page) === JSON.stringify(r.page), { rest: r.page, now: c.page });
    }
    for (const [what, sel] of [["a square's", '.flux3-port'], ['the "+"', '[data-flux3-plus]']]) {
      await app.mouseMove(w / 2, 20); await sleep(300);
      const before = await ev(`document.querySelector(${J(sel)}).getBoundingClientRect().top`);
      await press(sel);
      const o = await S();
      // SUPERSEDED (Fable, Nov 27, 6:25 pm: an opened box must not lie over the page), the original verbatim:
      // ok(`${at} U: ${what} box opens upward, inside the window`, !!o.box && o.box[3] <= before + 1 && o.box[0] >= 0 && o.box[1] >= 0 && o.box[2] <= o.vw, { box: o.box, opener: before });
      const foot = await ev("document.querySelector('[data-flux3-plus]').getBoundingClientRect().bottom");
      ok(`${at} U: ${what} box opens upward from the row, beside the page, never over it, inside the window`, !!o.box && !cross(o.box, o.page) && o.box[0] >= o.page[2] - 0.5 && o.box[3] <= foot + 1 && o.box[1] < before && o.box[2] <= o.vw + 0.5 && o.box[1] >= 0, { box: o.box, page: o.page, opener: before, foot });
      await ev("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(500);
    }
  }
});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nPAGE-145 VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
