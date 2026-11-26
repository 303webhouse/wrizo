// #133 (Fable, Nov 25, 9:30 pm: the two narrowings left - Back at 1536 and Machina's pop-out at 1366 - are "accepted, as long as no word is cut off").
// THE REAL PAGE, every theme, Draft, at 1366x768 and 1536x864: each rail pop-out and each Back menu tab is opened and every drawn word is read.
// A word is CUT when it runs past the panel (or a box inside it that does not scroll sideways), when it is broken across two lines, or when its box
// draws it with an ellipsis. W: nothing is cut at today's width that is whole at the panel's width before #133 (the panel is set to that width in
// place and read again). Words cut at BOTH widths are printed (DIAG) and not judged: they were cut before. MUT: the panel forced to 120 px must
// cut words, or the reading is blind.
// THE PRODUCT'S OWN LOOKS, as page-small-133.mjs. Run: node scripts/harness/page-small-133-words.mjs  (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default', WS_PLACE: '1' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
// the widths before #133 (train-l8-1), 1366 / 1536, as page-small-133.mjs holds them
const BEFORE = { plateau: { pop: [269, 300], back: [317, 402] }, flux: { pop: [269, 300], back: [317, 402] }, machina: { pop: [300, 300], back: [317, 402] } };

const READ = (sel) => `(() => { const panel = document.querySelector(${J(sel)}); if (!panel) return null; const pb = panel.getBoundingClientRect(); const cut = []; let seen = 0;
  const w = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement; const cs = getComputedStyle(el); if (!n.data.trim() || cs.visibility !== 'visible' || el.closest('[hidden], [aria-hidden="true"]')) continue;
    let left = pb.left, right = pb.right, scrolls = false, ell = false, drawn = el.getBoundingClientRect().width > 1;
    for (let a = el; a && a !== panel.parentElement; a = a.parentElement) { const s = getComputedStyle(a); if (Number(s.opacity) === 0 || s.display === 'none') drawn = false;
      if (s.overflowX === 'auto' || s.overflowX === 'scroll') { if (a.scrollWidth > a.clientWidth + 1) scrolls = true; }
      if (s.overflowX !== 'visible') { const b = a.getBoundingClientRect(); left = Math.max(left, b.left); right = Math.min(right, b.right); if (s.textOverflow === 'ellipsis' && a.scrollWidth > a.clientWidth + 1) ell = true; } }
    if (!drawn) continue;
    const re = /\\S+/g; for (let m = re.exec(n.data); m; m = re.exec(n.data)) {
      const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); const rects = [...r.getClientRects()].filter((q) => q.width > 0.5 && q.height > 0); if (!rects.length) continue; seen += 1;
      const past = rects.some((q) => q.right > right + 1 || q.left < left - 1); const split = rects.length > 1 && !/[-\\u2013\\u2014\\/]/.test(m[0]) && Math.abs(rects[0].top - rects[rects.length - 1].top) > 2;
      if (ell || split || (past && !scrolls)) cut.push(m[0] + (ell ? ' (ellipsis)' : split ? ' (split)' : ' (past the edge)')); } }
  return { width: Math.round(pb.width), seen, cut: [...new Set(cut)] }; })()`;
// force a width in place, and give back EXACTLY the inline widths that were there (the app sets the panel's own width inline: removing it would leave
// every later reading at the stylesheet's width)
const FORCE = (sel, px) => `(() => { const p = document.querySelector(${J(sel)}); if (!p) return false; const keys = ['width', 'max-width', 'min-width'];
  ${px === null ? "for (const k of keys) { const was = (p.__w || {})[k]; if (was && was[0]) p.style.setProperty(k, was[0], was[1]); else p.style.removeProperty(k); }"
    : `p.__w = Object.fromEntries(keys.map((k) => [k, [p.style.getPropertyValue(k), p.style.getPropertyPriority(k)]])); p.style.setProperty('width', '${px}px', 'important'); p.style.setProperty('max-width', 'none', 'important'); p.style.setProperty('min-width', '0', 'important');`} return true; })()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.evalJs(`(() => { const W = window; const d = W.wrizoCreateDrawer('Fiction'); const n = W.wrizoCreateProject('The Glass Orchard'); W.wrizoSetProjectDrawer(n.id, d.id);
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    page('pw-1', 'Chapter one. The wind came in off the water before dawn.', { origin: 'project', projectId: n.id, orderIndex: 0 });
    page('pw-2', 'Chapter two. A screenplay of the harbour at night.', { origin: 'project', projectId: n.id, orderIndex: 1 });
    page('pw-3', 'Unfiled notes about the lighthouse keeper', { origin: 'loose' });
    W.wrizoCreateStoryPlan(n.id, 'three_act', ['setup', 'midpoint', 'resolution']); localStorage.setItem('wrizo-mode-page-pw-1', 'drafting'); W.wrizoFlushNow(); })()`);

  for (const [theme, name] of [['plateau', 'Arbor'], ['flux', 'Flux'], ['machina', 'Machina']]) {
    await app.evalJs("location.hash = '#/'");
    await app.evalJs(`localStorage.setItem('wrizo-theme', '${theme}')`);
    await app.reload();
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
    for (const [w, h] of [[1366, 768], [1536, 864]]) {
      const i = w === 1366 ? 0 : 1; const at = `${name} ${w}`;
      await app.emulateDpr(1, w, h);
      await app.evalJs("location.hash = '#/'"); await sleep(300);
      await app.evalJs("location.hash = '#/page/pw-1'");
      await app.waitFor("!!document.querySelector('.desk-frame-stage .mode-page')", { label: 'the page', timeout: 10000 });
      await sleep(900);
      const one = async (label, sel, before) => {
        const now = await app.evalJs(READ(sel));
        if (!now || !now.seen) { console.log(`DIAG ${at} ${label}: nothing drawn`); return null; }
        await app.evalJs(FORCE(sel, before)); await sleep(500);
        const old = await app.evalJs(READ(sel));
        await app.evalJs(FORCE(sel, null)); await sleep(300);
        const fresh = now.cut.filter((c) => !old.cut.includes(c));
        console.log(`DIAG ${at} ${label}: ${now.width} px (before ${before}), ${now.seen} words, cut now ${J(now.cut)}, cut at the old width ${J(old.cut)}`);
        ok(`${at} W ${label}: no word is cut at ${now.width} px that is whole at ${before} px`, fresh.length === 0, fresh);
        return now;
      };
      // the rail's pop-outs: every strip button that opens one
      const buttons = await app.evalJs("[...document.querySelectorAll('.desk-frame-strip button')].map((b) => (b.textContent || '').trim()).filter(Boolean)");
      let opened = 0;
      for (const [n, label] of buttons.entries()) {
        if (/theme|controls|sound|help/i.test(label)) continue;
        await app.evalJs(`[...document.querySelectorAll('.desk-frame-strip button')].filter((b) => (b.textContent || '').trim())[${n}]?.click()`);
        await sleep(800);
        if (!(await app.evalJs("location.hash === '#/page/pw-1'"))) { await app.evalJs("location.hash = '#/page/pw-1'"); await sleep(900); continue; }
        if (!(await app.evalJs("!!document.querySelector('.wz-cascade-panel[data-visible=\"true\"]')"))) continue;
        opened += 1;
        await one(`pop-out "${label}"`, '.wz-cascade-panel[data-visible="true"]', BEFORE[theme].pop[i]);
        await app.evalJs(`[...document.querySelectorAll('.desk-frame-strip button')].filter((b) => (b.textContent || '').trim())[${n}]?.click()`);
        await sleep(600);
      }
      ok(`${at} (premise): at least one rail pop-out was read`, opened > 0, buttons);
      await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()");
      await sleep(900);
      const tabs = await app.evalJs("[...document.querySelectorAll('[id^=\"wz-tutor-tab-\"]')].map((t) => (t.textContent || '').trim())");
      ok(`${at} (premise): the Back menu opens with its tabs`, tabs.length >= 2, tabs);
      for (const [n, label] of tabs.entries()) {
        await app.evalJs(`document.querySelectorAll('[id^="wz-tutor-tab-"]')[${n}]?.click()`);
        await sleep(700);
        await one(`Back "${label}"`, '.wz-tutor-panel', BEFORE[theme].back[i]);
      }
      if (theme === 'machina' && w === 1536) {
        await app.evalJs(FORCE('.wz-tutor-panel', 120)); await sleep(500);
        const tiny = await app.evalJs(READ('.wz-tutor-panel'));
        ok('MUT the Back menu forced to 120 px cuts words, so the reading can see a cut', !!tiny && tiny.cut.length > 0, tiny);
        await app.evalJs(FORCE('.wz-tutor-panel', null));
      }
    }
  }
});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nPAGE-SMALL-133-WORDS VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
