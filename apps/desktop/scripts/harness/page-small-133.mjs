// #133 (Nick, Nov 25: "on a small screen the page is too small"; Fable's order, orders-nov25.md POLISH) - the REAL-PAGE checks. The browserless twin
// (the size law itself) is page-small-133-source.mjs. Seeding goes through the app's seams; the panels are opened by their own openers.
//   Every theme (Arbor, Flux, Machina), Draft, at 1366x768, 1536x864 and 1920x1080:
//   S   the page's share of the stage: 61-63% at 1366 and 1536; at 1920 over 50% (today: 48%, 43%, 37%)
//   R   opening a rail pop-out, the Front menu or the Back menu never moves or resizes the page
//   ONE at 1600 and narrower one side panel stands at a time (each opening closes the last); at 1920 the Front and Back menus stand together
//   T   no open panel covers the page's text column
//   C   no opener that is on screen stands under, or across the border of, an open panel - its own included; an open panel's opener takes a press
//   W   (Fable, Nov 25, 7:30: "no panel is narrower than before") at 1600 and narrower each panel is as wide as it was on the source before #133,
//       or, where that would stand on the text, as wide as reaches the text (4 px short of it; 8 px allowed)
//   H   no open panel stands over a readout of the page's header (Flux: "… 0 CONNECTIONS")
//   Y   typing lands: words typed at the end of the page are stored, and no word is lost
//   MS  (mutant, 1366) the page forced to scale 1 - S must go red.   MT (mutant, 1366) the pop-out forced 480 px wide - T must go red.
// THE PRODUCT'S OWN LOOKS: the driver pins the older themes and the reorg off for files that do not ask, so this one asks (WS_REORG, WS_ARBOR2,
// WS_MACHINA2, WS_FLUX3), before the driver loads, and checks it got them.
// Needs a box turn or an Actions runner.  Run: node scripts/harness/page-small-133.mjs   (from apps/desktop, dist-web built)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default' });
const { withHarness } = await import('../runtime-verify.mjs');

const SHOTS = process.env.WS_133_SHOTS || null;
const snap = async (app, name) => { if (!SHOTS) return; mkdirSync(SHOTS, { recursive: true }); writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${detail}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);

const THEMES = [{ id: 'plateau', name: 'Arbor', mark: 'data-arbor2' }, { id: 'flux', name: 'Flux', mark: 'data-flux3' }, { id: 'machina', name: 'Machina', mark: 'data-machina2' }];
const SIZES = [[1366, 768], [1536, 864], [1920, 1080]];
const SMALL_W = 1600;
// the panels' widths measured on train-l8-1, the source before #133 (1366 / 1536)
const BEFORE = {
  plateau: { pop: [269, 300], front: [264, 264], back: [317, 402] },
  flux: { pop: [269, 300], front: [184, 184], back: [317, 402] },
  machina: { pop: [300, 300], front: [184, 209], back: [317, 402] },
};
const PARA = 'The quick brown fox jumps over the lazy dog while the tide comes in and the lamplight wavers on the water. '.repeat(26);

// the page side: boxes as [left, top, right, bottom], null when not drawn
const PROBE = `(() => {
  const seen = (e) => { if (!e) return null; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return null;
    const b = e.getBoundingClientRect(); return b.width > 1 && b.height > 1 ? [b.left, b.top, b.right, b.bottom].map(Math.round) : null; };
  const page = document.querySelector('.desk-frame-stage .mode-page');
  const stage = document.querySelector('.desk-frame-stage');
  const pb = page.getBoundingClientRect(); const sb = stage.getBoundingClientRect();
  const scale = page.offsetWidth ? pb.width / page.offsetWidth : 1; const cs = getComputedStyle(page);
  const text = [pb.left + parseFloat(cs.paddingLeft) * scale, pb.top, pb.right - parseFloat(cs.paddingRight) * scale, pb.bottom].map(Math.round);
  const popEl = document.querySelector('.wz-cascade-panel[data-visible="true"]:not([data-leaving])');
  const frontOpen = document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true';
  const backOpen = document.querySelector('.wz-tutor-grip')?.getAttribute('aria-expanded') === 'true';
  const panels = { pop: seen(popEl), front: frontOpen ? seen(document.querySelector('.wz-sliver-panel')) : null, back: backOpen ? seen(document.querySelector('.wz-tutor-panel')) : null };
  const dead = [['front', '.wz-sliver-grip'], ['back', '.wz-tutor-grip']].filter(([o, sel]) => { if (!panels[o]) return false; const g = document.querySelector(sel); const b = g.getBoundingClientRect(); const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !hit || !g.contains(hit); }).map(([o]) => o);
  const heads = [...document.querySelectorAll('.flux3-dochead > *')].map((e) => seen(e)).filter(Boolean);
  return { heads, dead, page: [pb.left, pb.top, pb.width, pb.height].map(Math.round), share: Math.round((pb.width / sb.width) * 1000) / 1000, text, panels,
    stands: Object.keys(panels).filter((k) => panels[k]), openers: { front: seen(document.querySelector('.wz-sliver-grip')), back: seen(document.querySelector('.wz-tutor-grip')) } };
})()`;
const across = (a, b) => !!a && !!b && a[0] < b[2] - 1 && b[0] < a[2] - 1 && a[1] < b[3] - 1 && b[1] < a[3] - 1;
const coversText = (s) => Object.entries(s.panels).filter(([, p]) => across(p, s.text)).map(([k]) => k);
// an opener stands beside its own panel and beside every other: never across a border; and an open panel's own opener is what a press there hits
const crossed = (s) => { const out = []; for (const [o, box] of Object.entries(s.openers)) for (const [p, panel] of Object.entries(s.panels)) if (across(box, panel)) out.push(`${o} opener across ${p}`); return out.concat(s.dead.map((o) => `${o} opener takes no press`)); };
const same = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 1);

const click = (app, expr) => app.evalJs(`(() => { const el = ${expr}; if (!el) return false; el.click(); return true; })()`);
const OPEN = {
  pop: "[...document.querySelectorAll('.desk-frame-strip button')].find((b) => /pages|docs/i.test(b.textContent))",
  front: "document.querySelector('.wz-sliver-grip')",
  back: "document.querySelector('.wz-tutor-grip')",
};
const state = (app) => app.evalJs(PROBE);
const open = async (app, what) => { const did = await click(app, OPEN[what]); await sleep(900); return did; };
const closeAll = async (app) => {
  await app.evalJs("location.hash = '#/'"); await sleep(300);
};
const openPage = async (app, id) => {
  await closeAll(app);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.desk-frame-stage .mode-page') && !!document.querySelector('.forward-only-editor')", { label: id, timeout: 10000 });
  await sleep(900);
};
const storedText = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${J(id)}) || {}).text || ''`);
const words = (t) => t.split(/\s+/).filter(Boolean).length;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  for (const th of THEMES) {
    await app.evalJs(`localStorage.setItem('wrizo-theme', '${th.id}')`);
    await app.reload();
    await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
    ok(`${th.name} (premise): the product's own look is on (${th.mark}), with the reorg`, await app.evalJs(`document.documentElement.hasAttribute('${th.mark}') && !window.__wrizoReorgOff`));
    for (const [w, h] of SIZES) {
      const at = `${th.name} ${w}x${h}`;
      const id = `p133-${th.id}-${w}`;
      await app.emulateDpr(1, w, h);
      await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: PARA, createdAt: new Date().toISOString(), origin: null, source: 'page' })})`);
      await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); window.wrizoFlushNow()`);
      await openPage(app, id);
      const rest = await state(app);
      await snap(app, `${th.id}-${w}-closed`);
      ok(`${at} S: the page takes ${w <= SMALL_W ? '61-63%' : 'over 50%'} of the stage`, w <= SMALL_W ? rest.share >= 0.61 && rest.share <= 0.63 : rest.share > 0.5, `share ${rest.share}`);

      const seq = {};
      for (const what of ['pop', 'front', 'back']) { const did = await open(app, what); seq[what] = { did, ...(await state(app)) }; await snap(app, `${th.id}-${w}-${what}`); }
      ok(`${at} (premise): each panel opened by its own opener`, ['pop', 'front', 'back'].every((k) => seq[k].did && seq[k].panels[k]), J(Object.fromEntries(Object.entries(seq).map(([k, s]) => [k, s.stands]))));
      // SUPERSEDED at 1600 and narrower (#138, Nick Nov 26: an open menu never covers the page - the page gives from that menu's side only, its top and far edge stay), the original verbatim:
      // ok(`${at} R: opening the panels never moves or resizes the page`, Object.values(seq).every((s) => same(s.page, rest.page)), J({ rest: rest.page, back: seq.back.page }));
      if (w > SMALL_W) ok(`${at} R: opening the panels never moves or resizes the page`, Object.values(seq).every((s) => same(s.page, rest.page)), J({ rest: rest.page, back: seq.back.page }));
      else ok(`${at} R [#138 successor]: a rail pop-out never moves the page; the Front and Back menus take their room from it from their own side only`, same(seq.pop.page, rest.page) && ['front', 'back'].every((k) => { const gave138 = (a, b) => !!a && !!b && Math.abs(a[1] - b[1]) <= 0.6 && (Math.abs(a[0] - b[0]) <= 0.6 || Math.abs(a[0] + a[2] - b[0] - b[2]) <= 0.6) && b[2] <= a[2] + 0.6; return gave138(rest.page, seq[k].page) && Math.abs(k === 'front' ? rest.page[0] + rest.page[2] - seq[k].page[0] - seq[k].page[2] : rest.page[0] - seq[k].page[0]) <= 1; }), J({ rest: rest.page, pop: seq.pop.page, front: seq.front.page, back: seq.back.page }));
      if (w <= SMALL_W) ok(`${at} ONE: one side panel at a time`, ['pop', 'front', 'back'].every((k) => seq[k].stands.length === 1 && seq[k].stands[0] === k), J(Object.values(seq).map((s) => s.stands)));
      else ok(`${at} ONE: above ${SMALL_W} the Front and Back menus stand together`, seq.back.stands.includes('front') && seq.back.stands.includes('back'), J(seq.back.stands));
      ok(`${at} T: no open panel covers the page's text`, Object.values(seq).every((s) => coversText(s).length === 0), J(Object.fromEntries(Object.entries(seq).map(([k, s]) => [k, coversText(s)]))));
      ok(`${at} C: no opener across a panel, and each open panel's opener takes a press`, Object.values(seq).every((s) => crossed(s).length === 0), J(Object.values(seq).flatMap(crossed)));

      if (w <= SMALL_W) {
        const at133 = w === 1366 ? 0 : 1;
        const narrow = [];
        for (const what of ['pop', 'front', 'back']) {
          const st = seq[what]; const p = st.panels[what]; if (!p) { narrow.push(`${what} not open`); continue; }
          const width = p[2] - p[0]; const room = what === 'back' ? p[2] - st.text[2] - (th.id === 'flux' ? 16 : 0) : st.text[0] - p[0];   // Flux's Back tab stands at the drawer's inner edge, inside that room
          // SUPERSEDED at 1600 and narrower (#138, Nick Nov 26: an open menu never covers the page - the page gives from that menu's side only, its top and far edge stay); the Back menu stands at its 320 px (the page gives only that), the original verbatim: const want = Math.min(BEFORE[th.id][what][at133], room - 8);
          const want = Math.min(what === 'back' ? 317 : BEFORE[th.id][what][at133], room - 8);
          if (width < want - 1.5) narrow.push(`${what} ${width} < ${want} (before ${BEFORE[th.id][what][at133]}, room ${room})`);
        }
        ok(`${at} W [#138 successor]: the pop-out and Front are no narrower than before; the Back menu is its 320 px`, narrow.length === 0, narrow.join('; '));
      }
      ok(`${at} H: no open panel stands over a header readout`, Object.values(seq).every((st) => Object.values(st.panels).every((p) => st.heads.every((h) => !across(p, h)))), J(Object.fromEntries(Object.entries(seq).map(([k, st]) => [k, st.heads.length]))));

      if (w === 1366) {
        await openPage(app, id);
        await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'p133-ms'; s.textContent = '.desk-frame-stage--prose .mode-page{ transform:none !important; }'; document.head.appendChild(s); })()");
        const ms = await state(app);
        ok(`${at} MS (mutant, landed=${!same(ms.page, rest.page)}): the page at scale 1 turns S red`, !same(ms.page, rest.page) && !(ms.share >= 0.61), `share ${ms.share}`);
        await app.evalJs("document.getElementById('p133-ms').remove()");
        await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'p133-mt'; s.textContent = '.wz-cascade-panel[data-visible=\"true\"]{ width:480px !important; max-width:480px !important; }'; document.head.appendChild(s); })()");
        await open(app, 'pop');
        const mt = await state(app);
        const landed = !!mt.panels.pop && mt.panels.pop[2] - mt.panels.pop[0] > 400;
        ok(`${at} MT (mutant, landed=${landed}): a 480 px pop-out turns T red`, landed && coversText(mt).includes('pop'), J(mt.panels.pop));
        await app.evalJs("document.getElementById('p133-mt').remove()");
      }

      await openPage(app, id);
      const before = await storedText(app, id);
      await app.evalJs("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const sel = getSelection(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); sel.removeAllRanges(); sel.addRange(r); })()");
      await app.type(' zebra quartz');
      await sleep(2500);
      const after = await storedText(app, id);
      ok(`${at} Y: typing lands and no word is lost`, after.includes('zebra quartz') && words(after) === words(before) + 2, J({ before: words(before), after: words(after) }));
    }
    await closeAll(app);
  }
});
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPAGE-SMALL-133 VERIFY: PASS (${checks.length} checks)` : `\nPAGE-SMALL-133 VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
