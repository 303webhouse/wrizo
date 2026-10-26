// W1 PART 2 - THE LIVE APP (a box turn). PART 1 (guided-w1.mjs) holds the contract and the pure model; this proves what only a browser can, against the DOM contract in that file's header:
//   .show-as > .show-as-btn[data-view][aria-pressed]   .walk > .walk-stage > .walk-card[data-box-id] (+ .walk-grip)   .walk-nav[data-dir]   .walk-doors > .walk-door[data-door]   .walk-rail > .walk-mark[data-state][data-current]
//   .book-thumbs > .book-thumb[data-current]   .wz-thumb[data-thumb=board|deck|book]
// WRITTEN BEFORE THE BUILD (red on the W3 tip). Sections: H home views by door, V show-as switching + memory, A adding follows the view, G walk geometry, P the page never moves, N chevrons, M motion, Y keyboard, R the rail,
// D dress in computed style, T thumbnails by kind, B the Journal as a Book, S small screens. Run: node scripts/harness/guided-w1-part2.mjs [outDir]   (a box turn; with outDir it also writes the frames Fable clears).
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv[2] || null;
if (out) fs.mkdirSync(out, { recursive: true });
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.env.WS_PLACE = '1';
process.env.WS_KEEP_BOOK = '1';   // the Journal opens in FLIP here (the harness server otherwise gives the Book's home as Open, for the older harnesses that reach its canvas)
const { withHarness } = await import('../runtime-verify.mjs');

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const shot = async (name) => { if (out) fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
  const point = (sel) => q(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const click = async (sel) => { const p = await point(sel); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); await sleep(350); return true; };
  const boxes = () => q('window.wrizoBoard()');
  // is the card FLAT? one pixel in its left margin near the top edge against one at mid-height (no text in that column): a vignette painted over the card shows as a band at the top. Screenshot at DPR 1, read with sharp.
  const flatAt = async (sel) => {
    const sharp = (await import('sharp')).default;
    const r = await q(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map(Math.round); })()`);
    if (!r) return null;
    const { data, info } = await sharp(Buffer.from(await app.screenshot(), 'base64')).raw().toBuffer({ resolveWithObject: true });
    const px = (x, y) => [0, 1, 2].map((c) => data[(y * info.width + x) * info.channels + c]);
    const x = r[0] + 20;
    const top = px(x, r[1] + 8), mid = px(x, r[1] + Math.round(r[3] / 2));
    return { top, mid, diff: Math.max(...top.map((v, i) => Math.abs(v - mid[i]))) };
  };
  const rectOf = (sel) => q(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); })()`);
  const pressed = () => q("(() => { const b = document.querySelector('.show-as-btn[aria-pressed=\"true\"]'); return b ? b.getAttribute('data-view') : null; })()");

  const fresh = async (theme, tone, width = 1400) => {
    await app.emulateDpr(1, width, 900);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await app.reload();
    await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await sleep(600);
    await q(`window.wrizoTheme && window.wrizoTheme.set('${theme}')`);
    await q(`window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${tone}' })`);
    await sleep(400);
  };
  // a project with a plain board (no board-meta), a three-card board with x/y and seq, and a Deck (board-meta homeView walk)
  const seed = async () => {
    await q(`(() => { const d = window.wrizoCreateDrawer('The Well'); const p = window.wrizoCreateProject('The Well', 'creative'); window.wrizoSetProjectDrawer(p.id, d.id); window.__w1p = p.id;
      const text = (id, x, y, seq, t) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.105, z: 1, text: t, ...(seq ? { seq } : {}) });
      window.wrizoCreateJournalPage({ id: 'w1-plain', text: 'A plain board', pageType: 'board', projectId: p.id, boxes: [], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:01.000Z' });
      window.wrizoCreateJournalPage({ id: 'w1-three', text: 'Three cards', pageType: 'board', projectId: p.id, boxes: [text('t1', 0.05, 0.06, 1, 'First\\nOne.'), text('t2', 0.4, 0.2, 2, 'Second\\nTwo.'), text('t3', 0.2, 0.4, 3, 'Third\\n')], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:02.000Z' });
      const nine = []; for (let i = 1; i <= 9; i++) nine.push({ ...text('d' + i, 0.03 + ((i - 1) % 3) * 0.32, 0.04 + Math.floor((i - 1) / 3) * 0.14, i, 'Step ' + i + '\\n'), prompt: 'What happens in step ' + i + '?', deckStep: { deck: 'three-act', step: 'hook' } });
      nine.push({ id: 'dm', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, homeView: 'walk' });
      window.wrizoCreateJournalPage({ id: 'w1-adddeck', text: 'Short run', pageType: 'board', projectId: p.id, boxes: [1, 2, 3].map((i) => ({ ...text('e' + i, 0.03 + (i - 1) * 0.32, 0.04, i, 'Step ' + i + '\\n'), prompt: 'What happens?', deckStep: { deck: 'three-act', step: 'hook' } })).concat([{ id: 'am', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, homeView: 'walk' }]), origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:04.000Z' });
      window.wrizoCreateJournalPage({ id: 'w1-deck', text: 'Three-Act', pageType: 'board', projectId: p.id, boxes: nine, origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:03.000Z' });
      window.wrizoFlushNow(); })()`);
    await sleep(500);
  };
  const open = async (id, sel) => { await q(`location.hash = '#/page/${id}'`); await waitSoft(`!!document.querySelector('${sel}')`, { label: id, timeout: 8000 }); await sleep(900); };
  // a mouse writer hovers the strip first (its words open and the icons shift), then aims - so does the driver: hover, wait for the open state, re-measure, click
  const showAs = async (view) => {
    const strip = await point('.show-as');
    if (strip) { await app.mouseMove(strip.x, strip.y); await waitSoft("document.querySelector('.show-as')?.getAttribute('data-open') === 'true'", { label: 'show-as open', timeout: 2000 }); await sleep(120); }
    return click(`.show-as-btn[data-view="${view}"]`);
  };

  for (const theme of ['plateau', 'flux']) {
    for (const tone of ['dark', 'light']) {
      const T = `${theme === 'plateau' ? 'Arbor' : 'Flux'} ${tone}`;
      const full = tone === 'dark';
      const tag = `${theme === 'plateau' ? 'arbor' : 'flux'}-${tone}`;
      try {
      await fresh(theme, tone); await seed();

      // H - home views by door: a plain board opens in Open; a Deck (board-meta homeView walk) opens in the Walk; a board with NO field is Open (no migration)
      await open('w1-plain', '.board-canvas');
      const h1 = await pressed();
      await open('w1-deck', '.walk');
      const h2 = await pressed();
      if (full) {
        ok(`[${T}] no field = a Board that opens in Open (the Show-as shows Open pressed, the canvas is up)`, h1 === 'open', String(h1));
        ok(`[${T}] a Deck (board-meta homeView walk) opens in the Walk: the card is up and Walk is the pressed view`, h2 === 'walk' && !!(await q("!!document.querySelector('.walk-card')")), String(h2));
      }
      await app.mouseMove(5, 450); await sleep(250);
      await shot(`02-walk-${tag}`);
      const qPull = await q("(() => { const e = document.querySelector('.walk-card .board-popup-editor[data-prompt][data-body-empty=\"true\"]'); return e ? parseFloat(getComputedStyle(e, '::after').marginTop) : null; })()");
      ok(`[${T}] the dealt question stands on the caret's line (pulled up one editor line: margin ${qPull}px)`, qPull !== null && qPull < -15, String(qPull));
      const flat = await flatAt('.walk-card');
      ok(`[${T}] the Walk card is flat - no grey vignette band at its top (top pixel ${flat && flat.top} against mid ${flat && flat.mid})`, !!flat && flat.diff <= 4, JSON.stringify(flat));
      if (theme === 'flux') {
        const lum = await q("(() => { const c = getComputedStyle(document.querySelector('.walk-card')); const m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/.exec(c.backgroundColor); if (!m) return null; return Math.round((0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) / 2.55); })()");
        ok(`[${T}] Flux: the Walk card follows the page tone - ${tone === 'light' ? 'a light card on the light page' : 'a dark card on the dark page'} (luminance ${lum}%)`, lum !== null && (tone === 'light' ? lum > 85 : lum < 20), String(lum));
      }

      // the Walk's anatomy
      const anatomy = await q(`(() => { const c = document.querySelector('.walk-card'); const r = c && c.getBoundingClientRect(); return { card: !!c, w: r ? Math.round(r.width) : 0, prev: !!document.querySelector('.walk-nav[data-dir=prev]'), next: !!document.querySelector('.walk-nav[data-dir=next]'), doors: [...document.querySelectorAll('.walk-door')].map((d) => d.getAttribute('data-door')), marks: document.querySelectorAll('.walk-mark').length, grip: !!document.querySelector('.walk-grip'), help: !!document.querySelector('.walk-card .board-step-help') }; })()`);
      if (full) {
        ok(`[${T}] the Walk card is 700 wide at a wide viewport; Previous / Next, the resize grip, the question mark and one rail mark per card (9) are there`, anatomy.card && anatomy.w === 700 && anatomy.prev && anatomy.next && anatomy.grip && anatomy.help && anatomy.marks === 9, JSON.stringify(anatomy));
        ok(`[${T}] the doors under the card are Notes only - "Write this" and "Place a page..." are ABSENT until W2 wires them`, same(anatomy.doors, ['notes']), JSON.stringify(anatomy.doors));
      }

      // V - show as: positions and order are untouched by switching; the memory is per board; the words
      if (full) {
        await open('w1-three', '.board-canvas');
        const before = (await boxes()).filter((b) => b.kind === 'text').map((b) => [b.id, b.x, b.y, b.seq]);
        const openW0 = await rectOf('.board-canvas-wrap');
        // QUICK AIM (hover intent): a mouse that lands on an icon and presses at once hits THAT icon - the words open only once it has rested. The pointer is teleported to the Storyboard icon and clicked within 40 ms,
        // the way a driver (fx11, bm1) or a quick hand does; opening on arrival shifted the icons under it and the press landed on another one.
        await app.mouseMove(5, 450); await sleep(300);
        const aim = await point('.show-as-btn[data-view="storyboard"]');
        await app.mouseMove(aim.x, aim.y); await app.mouseDown(aim.x, aim.y); await sleep(40); await app.mouseUp(aim.x, aim.y); await sleep(600);
        const quick = await pressed();
        ok(`[${T}] hover intent: a pointer that lands on the Storyboard icon and presses at once HITS it (pressed view: ${quick})`, quick === 'storyboard', String(quick));
        await showAs('open'); await sleep(500);
        const seen = [];
        for (const v of ['storyboard', 'outline', 'walk', 'open']) { await showAs(v); await sleep(500); seen.push(await pressed()); }   // the views must REALLY switch - an unchanged board proves nothing if no view ever changed (the red run on 90c01bcc passed this vacuously)
        const after = (await boxes()).filter((b) => b.kind === 'text').map((b) => [b.id, b.x, b.y, b.seq]);
        ok(`[${T}] Show as switches Open / Storyboard / Outline / Walk without moving a card or touching the order (x, y and seq are byte-identical)`, JSON.stringify(seen) === JSON.stringify(['storyboard', 'outline', 'walk', 'open']) && JSON.stringify(before) === JSON.stringify(after) && before.length === 3, JSON.stringify({ seen, before, after }));
        // the Open canvas is full width again after the board was shown another way (Walk -> Open left it 700 wide: the measuring effects ran once, at mount, with no wrap to measure)
        const backOpen = await rectOf('.board-canvas-wrap');
        ok(`[${T}] Open comes back at the same full width after Storyboard / Outline / Walk (wrap ${backOpen && backOpen[2]}px, first shown ${openW0 && openW0[2]}px)`, !!backOpen && !!openW0 && openW0[2] > 900 && Math.abs(backOpen[2] - openW0[2]) <= 2, JSON.stringify({ backOpen, openW0 }));
        // and a Deck (it MOUNTS in the Walk, so its first mount has no wrap at all) opens at full width when the writer shows it as Open
        await open('w1-deck', '.walk'); await showAs('open'); await sleep(900);
        const deckOpen = await rectOf('.board-canvas-wrap');
        ok(`[${T}] a Deck shown as Open has a full-width canvas (wrap ${deckOpen && deckOpen[2]}px)`, !!deckOpen && deckOpen[2] > 900, JSON.stringify(deckOpen));
        await showAs('walk'); await sleep(700);
        await open('w1-three', '.show-as');
        await showAs('storyboard'); await sleep(400);
        await app.reload(); await waitSoft("!!document.querySelector('.show-as')", { label: 'show-as after reload', timeout: 8000 }); await sleep(900);
        const remembered = await pressed();
        await open('w1-plain', '.board-canvas');
        const other = await pressed();
        ok(`[${T}] "last shown as" is remembered per board on the device: the board reopens in Storyboard after a reload; another board is unaffected`, remembered === 'storyboard' && other === 'open', JSON.stringify({ remembered, other }));
        const views = await q("[...document.querySelectorAll('.show-as-btn')].map((b) => b.getAttribute('data-view'))");
        ok(`[${T}] a Board offers Open, Storyboard, Outline, Walk (in that order) - icons, the word on hover`, same(views, ['open', 'storyboard', 'outline', 'walk']) && (await q("[...document.querySelectorAll('.show-as-btn')].every((b) => !!(b.getAttribute('title') || b.getAttribute('aria-label')))")), JSON.stringify(views));
        const strip = await point('.show-as'); await app.mouseMove(strip.x, strip.y); await sleep(400);
        const openWords = await q("(() => ({ open: document.querySelector('.show-as')?.getAttribute('data-open'), words: [...document.querySelectorAll('.show-as-word')].map((w) => getComputedStyle(w).display !== 'none' && w.textContent.trim()) }))()");
        ok(`[${T}] hovering the strip with a mouse opens it: icons AND words`, openWords.open === 'true' && openWords.words.length === 4 && openWords.words.every(Boolean), JSON.stringify(openWords));
        await sleep(600); await shot(`02-walk-showas-open-${tag}`);   // a capture taken straight after the hover came back tiled once (the eighth box turn's Arbor frame): let the repaint settle first
        await app.mouseMove(5, 450); await sleep(300);
        // a touch or pen pointer over the strip must NOT open it (opening shifts the icons between pointer-down and up, and the tap would land on another icon)
        const touchOpen = await q("(() => { const s = document.querySelector('.show-as'); s.dispatchEvent(new PointerEvent('pointerover', { pointerType: 'touch', bubbles: true })); s.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' })); return new Promise((r) => setTimeout(() => r(s.getAttribute('data-open')), 200)); })()");
        ok(`[${T}] a touch pointer over the strip does not open it (no icon shifts under a tap)`, touchOpen === 'false', String(touchOpen));
      }

      // 03 / 05 frames - the same three-card board shown Open, as a Storyboard and as an Outline (Arbor, both tones)
      if (theme === 'plateau') {
        await open('w1-three', '.show-as');
        for (const v of ['open', 'storyboard', 'outline']) { await showAs(v); await sleep(900); await app.mouseMove(5, 450); await sleep(250); await shot(`${v === 'outline' ? '05' : '03'}-${v}-${tag}`); }
        await showAs('open'); await sleep(500);
      }

      // A - adding follows the view shown: in the Walk a new card is appended to the order (seq) and becomes the current card
      if (full) {
        await open('w1-adddeck', '.walk');   // its OWN deck: the Walk jumps to the card just added and remembers it, which must not leak into the decks the other sections read
        await q("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(400);
        await q("[...document.querySelectorAll('.wz-sliver-item-btn')].find((b) => /^(add card|add node)$/i.test(b.textContent.trim()))?.click()"); await sleep(700);
        const afterAdd = (await boxes()).filter((b) => b.kind === 'text');
        const added = afterAdd.find((b) => !/^e\d$/.test(b.id));
        const maxSeq = Math.max(...afterAdd.filter((b) => /^e\d$/.test(b.id)).map((b) => b.seq));
        const nowOn = await q("[...document.querySelectorAll('.walk-mark')].findIndex((m) => m.getAttribute('data-current') === 'true')");
        ok(`[${T}] adding in the Walk appends a card to the order (seq after the last), not a card at a position, and the Walk jumps to it`, !!added && afterAdd.length === 4 && added.seq > maxSeq && nowOn === 3, JSON.stringify({ n: afterAdd.length, seq: added && added.seq, maxSeq, nowOn }));
        await open('w1-plain', '.board-canvas');
        const nOpen = (await boxes()).filter((b) => b.kind === 'text').length;
        await q("[...document.querySelectorAll('.wz-sliver-item-btn')].find((b) => /^(add card|add node)$/i.test(b.textContent.trim()))?.click()"); await sleep(700);
        const openAdded = (await boxes()).filter((b) => b.kind === 'text');
        ok(`[${T}] adding in Open still places a card at a position (x / y), and writes no seq`, openAdded.length === nOpen + 1 && openAdded.every((b) => typeof b.x === 'number'), JSON.stringify({ nOpen, n: openAdded.length }));
      }

      await open('w1-deck', '.walk');
      const rewind = async () => { await q("document.querySelector('.walk-mark')?.click()"); await sleep(600); };   // the Walk resumes where the writer was (device memory); each section starts from the first card
      await rewind();
      if (full) {
        // R - the rail: empty = seed, kindled = leaf, current = ring; Start Here folds into the first seed
        const rail = await q("[...document.querySelectorAll('.walk-mark')].map((m) => m.getAttribute('data-state') + (m.getAttribute('data-current') === 'true' ? '*' : ''))");
        ok(`[${T}] the rail is one mark per card: the first is current, the rest seeds (no card has words yet)`, rail.length >= 9 && rail[0].startsWith('current') && rail.slice(1, 9).every((s) => s === 'seed'), JSON.stringify(rail));

        // N - chevrons: inside the card's width, just above its corners, ~55% at rest, square hit boxes; they recede while typing and return on pointer move
        const nav = await q(`(() => { const c = document.querySelector('.walk-card').getBoundingClientRect(); const p = document.querySelector('.walk-nav[data-dir=prev]'), n = document.querySelector('.walk-nav[data-dir=next]'); const pr = p.getBoundingClientRect(), nr = n.getBoundingClientRect(); const op = parseFloat(getComputedStyle(p).opacity); return { inside: pr.left >= c.left - 1 && nr.right <= c.right + 1, above: pr.bottom <= c.top + 2 && nr.bottom <= c.top + 2, prevLeft: Math.abs(pr.left - c.left) < 30, nextRight: Math.abs(nr.right - c.right) < 30, opacity: op, squareP: Math.abs(pr.width - pr.height) <= 1, squareN: Math.abs(nr.width - nr.height) <= 1 }; })()`);
        ok(`[${T}] the chevrons sit just above the card's top corners inside its width, rest at about 55%, with square hit boxes`, nav.inside && nav.above && nav.prevLeft && nav.nextRight && nav.opacity > 0.5 && nav.opacity < 0.6 && nav.squareP && nav.squareN, JSON.stringify(nav));
        await click('.walk-card'); await sleep(300);
        await app.typeKeys('She waits'); await sleep(1500);
        const typing = await q("parseFloat(getComputedStyle(document.querySelector('.walk-nav[data-dir=prev]')).opacity)");
        await app.mouseMove(300, 300); await app.mouseMove(320, 320); await sleep(900);
        const back = await q("parseFloat(getComputedStyle(document.querySelector('.walk-nav[data-dir=prev]')).opacity)");
        ok(`[${T}] the chevrons RECEDE while the writer types and return on pointer move`, typing < 0.2 && back > 0.5, JSON.stringify({ typing, back }));
        const rail2 = await q("[...document.querySelectorAll('.walk-mark')].map((m) => m.getAttribute('data-state') + ':' + m.getAttribute('data-kindled'))");
        ok(`[${T}] writing in the card kindles its mark (the first mark stays the current ring and is now kindled - the card has the writer's words), stored as ordinary card text`, rail2[0] === 'current:true' && rail2.slice(1, 9).every((x) => x === 'seed:false') && (await boxes()).find((b) => b.id === 'd1').text.includes('She waits'), JSON.stringify(rail2));
        await shot(`02-writing-${tag}`);

        // G - geometry: the card grows with its text to 520, then scrolls INSIDE; the page / stage never moves when a drawer opens (the K-style check)
        await app.typeKeys(' and she waits and she waits and she waits '.repeat(60)); await sleep(800);
        const grown = await q("(() => { const c = document.querySelector('.walk-card'); const r = c.getBoundingClientRect(); const cs = getComputedStyle(c); return { h: Math.round(r.height), overflow: cs.overflowY, scrolls: c.scrollHeight > c.clientHeight }; })()");
        ok(`[${T}] the card grows with its text up to 520 and then scrolls INSIDE`, grown.h <= 521 && grown.h >= 500 && /auto|scroll/.test(grown.overflow) && grown.scrolls, JSON.stringify(grown));
        await q("(() => { const c = document.querySelector('.walk-card'); c.scrollTop = 0; })()"); await sleep(400);   // typing leaves the card scrolled to the caret (the end), where the fade is correctly off
        const fadeOn = await q("(() => { const f = document.querySelector('.walk-fade'); return f ? [f.getAttribute('data-on'), parseFloat(getComputedStyle(f).opacity)] : null; })()");
        await q("(() => { const c = document.querySelector('.walk-card'); c.scrollTop = c.scrollHeight; })()"); await sleep(500);
        const fadeEnd = await q("(() => { const f = document.querySelector('.walk-fade'); return f ? [f.getAttribute('data-on'), parseFloat(getComputedStyle(f).opacity)] : null; })()");
        await q("(() => { const c = document.querySelector('.walk-card'); c.scrollTop = 0; })()"); await sleep(300);
        ok(`[${T}] a soft fade sits at the foot of the scrolling card while there is more below, and is gone once the writer has scrolled to the end`, !!fadeOn && fadeOn[0] === 'true' && fadeOn[1] > 0.9 && !!fadeEnd && fadeEnd[0] === 'false' && fadeEnd[1] < 0.1, JSON.stringify({ fadeOn, fadeEnd }));
        const stageBefore = await rectOf('.walk-stage');
        await q("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(700);
        await q("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(700);
        const stageOpen = await rectOf('.walk-stage');
        ok(`[${T}] PAGE IS PRIMARY: the Walk's stage does not move or resize when the side drawers open`, JSON.stringify(stageBefore) === JSON.stringify(stageOpen), JSON.stringify({ stageBefore, stageOpen }));
        await q("document.querySelector('.wz-tutor-grip')?.click()"); await q("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(500);

        // resize persists per board on the device
        const grip = await point('.walk-grip');
        const cardNow = await rectOf('.walk-card');
        await app.mouseMove(grip.x, grip.y); await app.mouseDown(grip.x, grip.y); await app.mouseMove(grip.x - 120, grip.y); await app.mouseMove(grip.x - 160, grip.y); await app.mouseUp(grip.x - 160, grip.y); await sleep(500);
        const resized = await rectOf('.walk-card');
        await app.reload(); await waitSoft("!!document.querySelector('.walk-card')", { label: 'walk after reload', timeout: 8000 }); await sleep(900);
        const afterReload = await rectOf('.walk-card');
        ok(`[${T}] the card's resize is remembered per board on the device (width ${cardNow[2]} -> ${resized[2]}; the same after a reload; never below 360)`, resized[2] < cardNow[2] && afterReload[2] === resized[2] && afterReload[2] >= 360, JSON.stringify({ cardNow, resized, afterReload }));
      }

      // M - motion: the swipe is a pure slide, about 280 ms; reduced motion is an instant cut
      await open('w1-deck', '.walk'); await rewind();
      if (full) {
        const motion = await q(`(async () => { const nx = document.querySelector('.walk-nav[data-dir=next]'); const before = [...document.querySelectorAll('.walk-card')].length; nx.click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const cards = [...document.querySelectorAll('.walk-card')]; const anims = cards.map((c) => { const cs = getComputedStyle(c); return { dur: cs.animationDuration, name: cs.animationName, op: cs.opacity }; }); return { before, during: cards.length, anims }; })()`);
        await sleep(500);
        ok(`[${T}] the swipe is a pure slide: both cards fully opaque while it runs, 280 ms, its animation moves transform and never opacity`, motion.during === 2 && motion.anims.every((a) => a.op === '1' && a.dur === '0.28s' && /walk-/.test(a.name)), JSON.stringify(motion));
        await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await sleep(300);
        const cut = await q(`(async () => { document.querySelector('.walk-nav[data-dir=next]').click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const cards = [...document.querySelectorAll('.walk-card')]; return { n: cards.length, anim: cards.map((c) => getComputedStyle(c).animationName) }; })()`);
        await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
        ok(`[${T}] reduced motion is an instant cut: one card, no animation`, cut.n === 1 && cut.anim.every((a) => a === 'none'), JSON.stringify(cut));

        // Y - keyboard: left / right step, Esc leaves for the board's last shown view, Enter on the focused door
        await open('w1-deck', '.walk'); await rewind();
        const idx = async () => q("[...document.querySelectorAll('.walk-mark')].findIndex((m) => m.getAttribute('data-current') === 'true')");
        // NICK'S RULING, Oct 25: the CARET lands in the card on opening and on every step; left / right step only while the card is EMPTY; with words in it they move the caret, and PageUp / PageDown and the chevrons always step.
        // PARKED, never edited (the original assertion, kept verbatim, no longer run - it assumed the caret is NOT in the card on a step and that the arrows never move the caret from an empty one):
        //   await q("document.querySelector('.walk-card .board-popup-editor')?.focus()"); await app.key('ArrowRight'); await sleep(400); const iEdit = await idx();
        //   ok(`[${T}] with the caret in the card, ArrowRight moves the caret and does not step the Walk`, iEdit === 0, String(iEdit));
        // SUPERSEDED: it is false for an EMPTY card now (the arrow steps). Successors: C1-C5 below. (Park count this file: 1.)
        const where = () => q("(() => { const a = document.activeElement; return { inCard: !!a && !!a.closest('.walk-card'), editor: !!a && a.classList.contains('board-popup-editor') }; })()");
        const caret = () => q("(() => { const s = getSelection(); return s && s.rangeCount ? s.anchorOffset + ':' + (s.anchorNode ? s.anchorNode.nodeName : '') : null; })()");
        const pageKey = async (k) => { const vk = k === 'PageDown' ? 34 : 33; const p = { key: k, code: k, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk }; await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p }); await sleep(500); };
        const goMark = async (i) => { await q(`document.querySelectorAll('.walk-mark')[${i}]?.click()`); await sleep(600); };
        // C1 - the caret lands in the card on stepping (the rewind stepped here) and on opening (a reload mounts the Walk fresh)
        const c1step = await where();
        await app.reload(); await waitSoft("!!document.querySelector('.walk-card')", { label: 'walk after reload', timeout: 8000 }); await sleep(900);
        const c1open = await where();
        ok(`[${T}] the caret LANDS in the card on opening the Walk and on stepping it (Nick, Oct 25)`, c1step.editor && c1open.editor, JSON.stringify({ c1step, c1open }));
        // C3 - a card with the writer's words (d1 holds some): the arrows move the caret and never step; PageDown / PageUp and the chevrons step
        await goMark(0);
        const w0 = await idx(); const off0 = await caret();
        await app.key('ArrowRight'); await sleep(400); const wR = await idx();
        await app.key('ArrowLeft'); await sleep(400); const wL = await idx(); const off1 = await caret();
        ok(`[${T}] with the writer's words in the card, the arrows move the caret and do NOT step the Walk (left / right at card ${w0 + 1}: still on ${wL + 1}; the caret ${off0} -> ${off1})`, w0 === 0 && wR === 0 && wL === 0 && off0 !== off1, JSON.stringify({ w0, wR, wL, off0, off1 }));
        await pageKey('PageDown'); const p1 = await idx(); await pageKey('PageUp'); const p0 = await idx();
        await q("document.querySelector('.walk-nav[data-dir=next]')?.click()"); await sleep(600); const n1 = await idx(); await q("document.querySelector('.walk-nav[data-dir=prev]')?.click()"); await sleep(600); const n0 = await idx();
        ok(`[${T}] PageDown / PageUp and the chevrons step the Walk with the caret in a card that has words`, p1 === 1 && p0 === 0 && n1 === 1 && n0 === 0, JSON.stringify({ p1, p0, n1, n0 }));
        // a probe on the page records each arrow as the document sees it (target, whether anything already took it) - the detail of a red names the thing that ate the key
        await q("(() => { window.__kd = []; document.addEventListener('keydown', (e) => window.__kd.push([e.key, e.defaultPrevented, (e.target.tagName || '') + '.' + String(e.target.className || '').slice(0, 24)]), false); })()");
        // C2 - an EMPTY card (d2): left / right step from inside it, the caret landing in each card they arrive at
        await goMark(1);
        const e0 = await idx(); const emptyWhere = await where();
        await app.key('ArrowRight'); await sleep(500); const e1 = await idx(); const afterStep = await where();
        await app.key('ArrowRight'); await sleep(500); const e2 = await idx(); await app.key('ArrowLeft'); await sleep(500); const e3 = await idx();
        const kd = await q("({ bubble: window.__kd, active: document.activeElement ? document.activeElement.tagName + '.' + String(document.activeElement.className || '').slice(0, 30) : null })");
        ok(`[${T}] ArrowRight / ArrowLeft step through EMPTY cards from inside them, and the caret lands in each card they reach`, e0 === 1 && emptyWhere.editor && e1 === 2 && afterStep.editor && e2 === 3 && e3 === 2, JSON.stringify({ idx: [e0, e1, e2, e3], emptyWhere, afterStep, kd }));
        // C5 - the ends stop (no wrap)
        await goMark(0); await q("document.querySelector('.walk-card .board-popup-editor')?.blur()"); await sleep(200);
        await app.key('ArrowLeft'); await sleep(400); const endL = await idx();
        ok(`[${T}] the arrows stop at the first card (no wrap)`, endL === 0, String(endL));
        await q("document.querySelector('.walk-door[data-door=notes]')?.focus()");
        { const ent = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }; await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', text: '\r', ...ent }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...ent }); }   // a trusted keyDown WITH its text: a native button activates on the keypress that app.key's rawKeyDown never sends
        await sleep(400);
        const notesFocus = await q("!!document.activeElement && !!document.activeElement.closest('.walk-card')");
        ok(`[${T}] Enter on the focused Notes door puts the caret in the card`, notesFocus, String(notesFocus));
        await q("(window.wrizoBoardMode && window.wrizoBoardMode.set('w1-deck', 'outline'))"); await sleep(300);
        await showAs('walk'); await sleep(500);
        await app.key('Escape'); await sleep(700);
        const afterEsc = await pressed();
        ok(`[${T}] Esc leaves the Walk for the board in its last shown view (Outline here)`, afterEsc === 'outline', String(afterEsc));
      }

      // D - dress in computed style
      await open('w1-deck', '.walk');
      if (!(await q("!!document.querySelector('.walk-card')"))) { await showAs('walk'); await waitSoft("!!document.querySelector('.walk-card')", { label: 'walk back', timeout: 6000 }); await sleep(500); }   // the Esc check above left the board in Outline (the hash is unchanged, so open() is a no-op)
      await app.mouseMove(5, 450); await sleep(300);   // the pointer rests away from every control: hover is brass by design, the rest state is what is measured
      if (full) {
        const dress = await q(`(() => { const sel = ['.walk-card', '.walk-door', '.walk-nav', '.show-as-btn', '.walk-stage']; const out = {}; for (const s of sel) { const e = document.querySelector(s); if (!e) { out[s] = null; continue; } const cs = getComputedStyle(e); const sh = cs.boxShadow; out[s] = { radius: cs.borderTopLeftRadius, blur: sh === 'none' ? 0 : Math.max(...sh.split(/rgba?\\([^)]*\\)/).join(' ').split(',').map((x) => parseFloat(x.trim().split(/\\s+/)[2] || '0'))) }; } const mark = document.querySelector('.walk-mark'); out.markRadius = mark && getComputedStyle(mark).borderTopLeftRadius; return out; })()`);
        ok(`[${T}] square edges and no blurred shadow on the Walk card, doors, chevrons, Show-as and stage (computed style); circles only for the rail marks`, ['.walk-card', '.walk-door', '.walk-nav', '.show-as-btn', '.walk-stage'].every((s) => dress[s] && parseFloat(dress[s].radius) === 0 && dress[s].blur === 0) && (theme === 'flux' ? parseFloat(dress.markRadius) === 0 : /50%|\d{2,}px/.test(dress.markRadius || '')), JSON.stringify(dress));   // Arbor's rail marks are circles; Flux's are pixel ticks (square)
        if (theme === 'plateau') {
          const rest = await q("(() => [...document.querySelectorAll('.walk-door, .show-as-btn[aria-pressed=\"false\"]')].map((e) => getComputedStyle(e).color + '|' + getComputedStyle(e).borderTopColor))()");
          const lumOf = (c) => { const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(c); if (!m) return 0; const f = [m[1], m[2], m[3]].map((v) => { const s = +v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
          const groundL = lumOf('rgb(29, 24, 20)'), doorL = lumOf(rest[0].split('|')[0]);
          ok(`[${T}] Arbor: the door text reads on the room's dark ground (contrast ${((Math.max(doorL, groundL) + 0.05) / (Math.min(doorL, groundL) + 0.05)).toFixed(1)}:1, floor 4.5:1 - the on-paper olive is 2.4:1 there)`, (Math.max(doorL, groundL) + 0.05) / (Math.min(doorL, groundL) + 0.05) >= 4.5, rest[0]);
          const navL = lumOf(await q("getComputedStyle(document.querySelector('.walk-nav')).color"));
          ok(`[${T}] Arbor: the chevrons read on the dark ground at full strength (the room's mid ink, not the on-paper ink: contrast ${((navL + 0.05) / (groundL + 0.05)).toFixed(1)}:1)`, (navL + 0.05) / (groundL + 0.05) >= 4.5, String(navL));
          ok(`[${T}] Arbor: no brass on a rest-state door or Show-as icon (brass is human action only: current, chosen, hover)`, rest.length >= 4 && rest.every((c) => !c.includes('rgb(255, 152, 0)')), JSON.stringify(rest));
        } else {
          const tick = await q("(() => { const m = document.querySelector('.walk-mark[data-state=current]'); return m ? getComputedStyle(m).borderLeftColor + ' ' + getComputedStyle(m).borderLeftWidth : null; })()");
          ok(`[${T}] Flux: the current tick wears the thin orange LEFT bar`, !!tick && tick.startsWith('rgb(255, 152, 0)'), String(tick));
          // the corner brackets stand just OUTSIDE the card's corners, and are not clipped by it (inside the scrolling card they were invisible in the first box turn's frames)
          const br = await q("(() => { const c = document.querySelector('.walk-card').getBoundingClientRect(); const b = document.querySelector('.walk-brackets'); if (!b) return null; const r = b.getBoundingClientRect(); const bg = getComputedStyle(b).backgroundImage; return { dl: Math.round(c.left - r.left), dr: Math.round(r.right - c.right), dt: Math.round(c.top - r.top), db: Math.round(r.bottom - c.bottom), inCard: !!document.querySelector('.walk-card .walk-brackets'), drawn: /linear-gradient/.test(bg) }; })()");
          ok(`[${T}] Flux: the corner brackets stand 6 px outside the card (a sibling of it, never inside the scrolling card that would clip them)`, !!br && !br.inCard && br.drawn && [br.dl, br.dr, br.dt, br.db].every((n) => n >= 4 && n <= 8), JSON.stringify(br));
        }
      }
      } catch (e) { ok(`[${T}] the section ran to the end (nothing it needs was missing)`, false, String((e && e.message) || e).slice(0, 200)); }
    }
  }

  const guard = async (name, fn) => { try { await fn(); } catch (e) { ok(`${name}: the section ran to the end (nothing it needs was missing)`, false, String((e && e.message) || e).slice(0, 200)); } };
  // T - thumbnails by kind (the Boards pop-out): Board wide, Deck a stack of three with its fact, Book tall
  await guard('T thumbnails', async () => {
  await fresh('plateau', 'dark'); await seed();
  await open('w1-plain', '.board-canvas');
  await click('.wz-strip [data-category="plan"]'); await sleep(900);
  const thumbs = await q("[...document.querySelectorAll('.wz-thumb')].map((t) => t.getAttribute('data-thumb') + ':' + (t.closest('.wz-section-row, .wz-journal-row')?.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 40))");
  ok('the Boards pop-out draws thumbnails by kind: a Board (wide), a Deck (a short stack, with its "n of 9" fact), the Journal (a tall book)', thumbs.some((t) => t.startsWith('board:')) && thumbs.some((t) => t.startsWith('deck:') && /\d of 9/.test(t)) && thumbs.some((t) => t.startsWith('book:')) && !thumbs.some((t) => /\b(board|deck|book)\b/i.test(t.split(':')[1].replace(/Three cards|Three-Act|A plain board/g, ''))), JSON.stringify(thumbs));
  const stack = await q("(() => { const t = document.querySelector('.wz-thumb[data-thumb=deck]'); if (!t) return null; const sh = getComputedStyle(t).boxShadow; const layers = sh.split(/,(?![^(]*\\))/).map((s) => s.trim()); return { n: layers.length, blur: Math.max(...layers.map((l) => parseFloat(l.replace(/rgba?\\([^)]*\\)/g, '').trim().split(/\\s+/)[2] || '0'))), edge: getComputedStyle(t).borderTopColor }; })()");
  ok('a Deck thumbnail is a stack of three sheets: two hard-edged offset layers behind the top sheet, no blur, an olive edge that reads on the dark pop-out', !!stack && stack.n === 4 && stack.blur === 0 && stack.edge === 'rgb(143, 154, 88)', JSON.stringify(stack));
  await shot('01-listing-arbor-dark');

  });
  await guard('B journal book', async () => {
  // B - the Journal as a Book: Flip and Thumbnails only; Flip walks the pages one at a time with the same chevrons and swipe
  await q(`(() => { for (const [id, t] of [['j1', 'First journal page'], ['j2', 'Second journal page'], ['j3', 'Third journal page']]) window.wrizoCreateJournalPage({ id, text: t, origin: 'journal', source: 'page', createdAt: '2026-02-0' + id.slice(1) + 'T00:00:00.000Z' }); window.wrizoFlushNow(); })()`);
  await q("location.hash = '#/journal'"); await waitSoft("!!document.querySelector('.show-as')", { label: 'journal', timeout: 8000 }); await sleep(900);
  const bookViews = await q("[...document.querySelectorAll('.show-as-btn')].map((b) => b.getAttribute('data-view'))");
  ok('the Journal is a Book: Show as offers Flip, Thumbnails and Open (none of the Board views), and it opens in Flip', same(bookViews, ['flip', 'thumbnails', 'open']) && (await pressed()) === 'flip', JSON.stringify(bookViews));
  const flip = await q("({ one: document.querySelectorAll('.walk-card').length === 1, nav: !!document.querySelector('.walk-nav[data-dir=prev]') && !!document.querySelector('.walk-nav[data-dir=next]') })");
  ok('Flip shows one page at a time with the same top-corner chevrons as the Walk', flip.one && flip.nav, JSON.stringify(flip));
  await app.mouseMove(5, 450); await sleep(250);
  await shot('04-flip-arbor-dark');
  const flipFlat = await flatAt('.walk-card');
  ok(`the Flip leaf is flat - no grey vignette band at its top (top pixel ${flipFlat && flipFlat.top} against mid ${flipFlat && flipFlat.mid})`, !!flipFlat && flipFlat.diff <= 4, JSON.stringify(flipFlat));
  await showAs('thumbnails'); await sleep(700);
  const grid = await q("({ pages: document.querySelectorAll('.book-thumb').length, current: document.querySelectorAll('.book-thumb[data-current=\"true\"]').length })");
  ok('Thumbnails is a grid of tall pages with the current page marked', grid.pages >= 3 && grid.current === 1, JSON.stringify(grid));
  await shot('04-thumbnails-arbor-dark');
  await showAs('open'); await sleep(700);
  const jopen = await q("({ canvas: !!document.querySelector('.board-canvas'), pressed: document.querySelector('.show-as-btn[aria-pressed=\"true\"]')?.getAttribute('data-view') })");
  ok('the Journal\'s open canvas (its page-pins) is still reachable as the third Book view', jopen.canvas && jopen.pressed === 'open', JSON.stringify(jopen));

  });
  await guard('S small screens', async () => {
  // S - small screens (frame 07): below the DeskFrame width a Deck's only view is the Walk
  await fresh('plateau', 'dark', 900); await seed();
  await open('w1-deck', '.walk');
  const small = await q("({ walk: !!document.querySelector('.walk-card'), views: document.querySelectorAll('.show-as-btn').length, peek: !!document.querySelector('.walk-peek'), stacked: (() => { const d = document.querySelector('.walk-doors'); return d ? getComputedStyle(d).flexDirection : null; })() })");
  ok('below the DeskFrame width a Deck is only ever the Walk: one card, the doors stacked, the next card peeking, no view choice', small.walk && small.views <= 1 && small.peek && small.stacked === 'column', JSON.stringify(small));
  await shot('07-phone-arbor-dark');

  });
  await guard('10 long card', async () => {
  // 10 - a long card (the question or the writer's words fill the card, then scroll)
  await fresh('plateau', 'dark'); await seed();
  await open('w1-deck', '.walk'); await click('.walk-card'); await app.typeKeys('A long first card. '.repeat(120)); await sleep(800);
  await shot('10-long-card-arbor-dark');
  });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nGUIDED-W1 PART 2 VERIFY: FAIL - ${failed.length}/${checks.length}` : `\nGUIDED-W1 PART 2 VERIFY: PASS (${checks.length} checks${out ? '; frames in ' + out : ''})`);
process.exit(failed.length ? 1 : 0);

function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
