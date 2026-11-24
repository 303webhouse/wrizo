// OWED SUCCESSOR, row 42 (docs/flux-live-pin-list.md, owed after live): polish-arbor-chrome.mjs P7's promise - "Arbor's polish (its menus 20% bigger,
// the foot as big as the rest, its own look) does not change Flux's chrome" - read on the Flux a writer gets, whose rail is the REORG rail (the same
// .wz-strip-* classes Arbor's rail wears, so a leak would land here). P7 itself stays verbatim on plain Flux (?flux3=0): it reads the DeskRail's shipped
// sizes, which live Flux does not draw. Instead of pinning Flux's own numbers (a shape), this reads the PROMISE: take every Arbor-scoped rule out of
// the live stylesheet and nothing on Flux's rail or top bar moves.
//   CS-LIVE     (premise) the page is the live Flux (the redesign and the reorg by default, no ?flux3 or ?reorg) and its rail and top bar are drawn
//   CS-REMOVED  (premise) the Arbor-scoped rules (a selector naming data-theme plateau or data-arbor2, at any nesting depth) were found and taken out:
//               the count is printed, and a count of 0 makes the run VOID, not green
//   CS-SCOPE    every element of Flux's rail and top bar reads the same before and after: its box, font size, line height, colours, borders and corners
//   MUT-CS      an unscoped rule written as Arbor's polish (rail labels 20% bigger, no theme in its selector) LANDS (a computed read) and the same
//               comparison goes RED - the read sees a leak when there is one
// Run: node scripts/harness/flux-chrome-scope-live.mjs   (from apps/desktop; Actions harness or a box turn)
process.env.WS_REORG = '1';
process.env.WS_FLUX3 = 'default';
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LIVE = "({ theme: document.documentElement.getAttribute('data-theme'), flux3: document.documentElement.hasAttribute('data-flux3'), top: !!document.querySelector('.reorg-top'), rail: !!document.querySelector('[data-reorg-rail]'), search: location.search })";
const isLive = (l) => !!l && l.theme === 'flux' && l.flux3 && l.top && l.rail && !/flux3|reorg/.test(l.search);

// every element of the rail and the top bar, in document order, with what a size or look change would move
const SNAP = `(() => { const els = [...document.querySelectorAll('[data-reorg-rail], [data-reorg-rail] *, .reorg-top, .reorg-top *')];
  const r1 = (n) => Math.round(n * 10) / 10;
  return els.map((e) => { const s = getComputedStyle(e), b = e.getBoundingClientRect();
    return [e.tagName.toLowerCase() + '.' + [...e.classList].join('.'), r1(b.left), r1(b.top), r1(b.width), r1(b.height), s.fontSize, s.lineHeight, s.color, s.backgroundColor,
      s.borderTopColor + ' ' + s.borderRightColor + ' ' + s.borderBottomColor + ' ' + s.borderLeftColor, s.borderTopWidth + ' ' + s.borderRightWidth + ' ' + s.borderBottomWidth + ' ' + s.borderLeftWidth, s.borderRadius].join('|'); }); })()`;
// the CSSOM walk: a rule's own selector is read FIRST (a CSSStyleRule can carry nested cssRules), then any grouping rule's children
const REMOVE = `(() => { const ARBOR = /data-theme=['"]?plateau|data-arbor2/; let deleted = 0, read = 0, sheets = 0;
  const walk = (list) => { for (let i = list.cssRules.length - 1; i >= 0; i -= 1) { const r = list.cssRules[i]; read += 1;
    if (r.selectorText !== undefined && ARBOR.test(r.selectorText)) { list.deleteRule(i); deleted += 1; continue; }
    if (r.cssRules) walk(r); } };
  for (const sh of document.styleSheets) { try { walk(sh); sheets += 1; } catch { /* a cross-origin sheet: not ours */ } }
  return { deleted, read, sheets }; })()`;
const diff = (a, b) => { const out = []; const n = Math.max(a.length, b.length); for (let i = 0; i < n; i += 1) if (a[i] !== b[i]) out.push({ i, was: a[i] || null, now: b[i] || null }); return out; };

await withHarness(async (app) => {
  const ev = (s) => app.evalJs(s);
  const soft = async (expr, timeout = 6000) => { try { await app.waitFor(expr, { timeout, label: expr.slice(0, 60) }); return true; } catch { return false; } };
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await soft("!document.querySelector('.wz-splash')", 20000);
  const seeded = await ev(`(() => { const W = window; const doc = W.wrizoCreateProject('Harbour');
    const p = W.wrizoCreateJournalPage({ id: 'cs-page', text: 'The harbour was quiet when she arrived.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'project', projectId: doc.id, orderIndex: 0, source: 'page' });
    W.wrizoFlushNow(); return !!doc && !!p; })()`);
  await ev("(() => { localStorage.setItem('wrizo-mode-page-cs-page', 'drafting'); history.replaceState(null, '', '/#/page/cs-page'); return true; })()");
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 20000 });
  await soft("!document.querySelector('.wz-splash')", 25000);
  await soft("document.documentElement.hasAttribute('data-flux3') && !!document.querySelector('.reorg-top') && !!document.querySelector('[data-reorg-rail]')", 10000);
  await app.mouseMove(4, 300);   // the chrome stands (no recede): nothing typed, the pointer on the rail's side
  await sleep(1500);
  await ev("document.getAnimations().forEach((a) => { try { a.finish(); } catch {} }); true");

  const live = await ev(LIVE);
  ok('CS-LIVE (premise) the page is the live Flux (the redesign and the reorg by default, no ?flux3 or ?reorg), its rail and top bar drawn, its Doc seeded', isLive(live) && seeded, { live, seeded });
  const before = await ev(SNAP);
  const removed = await ev(REMOVE);
  await sleep(300);
  const after = await ev(SNAP);
  ok(`CS-REMOVED (premise) the Arbor-scoped rules were found and taken out: ${removed.deleted} of ${removed.read} rules read, in ${removed.sheets} sheets (0 would make the run VOID)`, removed.deleted > 0, removed);
  const d = diff(before, after);
  ok(`CS-SCOPE every element of Flux's rail and top bar (${before.length}) reads the same with Arbor's rules taken out: its box, font size, line height, colours, borders and corners (${d.length} differ)`,
    before.length > 10 && d.length === 0, { elements: before.length, differ: d.slice(0, 6) });
  await ev("(() => { const s = document.createElement('style'); s.id = 'cs-mut'; s.textContent = '[data-reorg-rail] .wz-strip-label{ font-size:calc(1em * 1.2) !important; }'; document.head.appendChild(s); return true; })()");
  await sleep(300);
  const mut = await ev(SNAP);
  const landed = await ev("(() => { const l = document.querySelector('[data-reorg-rail] .wz-strip-label'); if (!l) return null; const now = parseFloat(getComputedStyle(l).fontSize); document.getElementById('cs-mut').disabled = true; const was = parseFloat(getComputedStyle(l).fontSize); document.getElementById('cs-mut').disabled = false; return { now, was }; })()");
  const dm = diff(before, mut);
  ok('MUT-CS an unscoped rule written as Arbor\'s polish (rail labels 20% bigger, no theme in its selector) LANDS and the same comparison goes RED',
    !!landed && landed.now > landed.was * 1.1 && dm.length > 0, { landed, differ: dm.length, first: dm.slice(0, 2) });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1200)}`);
const EXPECTED = 4;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass ? `\nFLUX-CHROME-SCOPE-LIVE VERIFY: PASS (${checks.length} checks)` : `\nFLUX-CHROME-SCOPE-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
