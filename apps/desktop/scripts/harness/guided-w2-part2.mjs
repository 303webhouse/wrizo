// W2 PART 2 - THE LIVE APP (a box turn). PART 1 (guided-w2.mjs) holds the contract and the model on the real stores; this proves what only a browser can:
//   the Walk's doors (Notes · Write this · Place a page…) in each skin's words; "Place a page…" = the picker filtered to pages, nothing grafted until a press, the card kindles, the Walk never moves (page primacy);
//   "Write this" = an unborn page (no row until the first keystroke), the return chip "‹ Back to <Deck>" on the page, the chip returns to the SAME card in the Deck, a typed page is born in the Deck's set grafted to the card;
//   the page side's "Place this…" (Decks' steps, place labels across Drawers) and the Grafts row "Deck · Step"; a phone width keeps a one-tap way back.
// Skins: Arbor + Flux, dark + light. Run: node scripts/harness/guided-w2-part2.mjs [outDir]   (a box turn: take it with box-take.mjs, export WS_BOX_TURN; with outDir it also writes the frames Fable clears).
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv[2] || null;
if (out) fs.mkdirSync(out, { recursive: true });
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const WORDS = { plateau: { write: 'Write this', place: 'Place a page…', placeThis: 'Place this…' }, flux: { write: '[BOOT DOC]', place: '[INPUT DOC]', placeThis: 'PORT TO…' } };

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const shot = async (name) => { if (out) fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
  const rectOf = (sel) => q(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); })()`);
  const point = (sel) => q(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const click = async (sel) => { const p = await point(sel); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); await sleep(450); return true; };
  // while the writer has been typing the page's chrome has dissolved (it returns on a pointer move): a real hand moves, then presses - so does the driver
  const wakeClick = async (sel) => { const p = await point(sel); if (!p) return false; await app.mouseMove(p.x - 30, p.y + 10); await sleep(300); await app.mouseMove(p.x, p.y); await sleep(700); return click(sel); };
  const rows = () => q(`JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')`);
  const rowOf = async (id) => (await rows()).find((e) => e.id === id) || null;
  const liveLinks = (e) => ((e && e.pageLinks) || []).filter((l) => !l.deletedAt);
  const hash = () => q('location.hash');
  const current = () => q("document.querySelector('.walk-card')?.getAttribute('data-box-id') ?? null");

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
  // the fixture, through the seams: two Drawers; a Deck in each; pages in the first. (ON the Desk: no surface with a flush handler is mounted while seeding.)
  const seed = async () => {
    await q(`(() => {
      const d = window.wrizoCreateDrawer('The Well'); const p = window.wrizoCreateProject('The Well', 'creative'); window.wrizoSetProjectDrawer(p.id, d.id);
      const d2 = window.wrizoCreateDrawer('Essays'); const p2 = window.wrizoCreateProject('Essays', 'creative'); window.wrizoSetProjectDrawer(p2.id, d2.id);
      const step = (id, i, t) => ({ id, kind: 'text', x: 0.03 + (i - 1) * 0.3, y: 0.05, w: 0.2, h: 0.105, z: 1, seq: i, text: t + '\\n', prompt: 'What happens?', deckStep: { deck: 'three-act', step: 'hook' } });
      const meta = (id) => ({ id, kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, homeView: 'walk' });
      window.wrizoCreateJournalPage({ id: 'w2-deck', text: 'Three-Act', pageType: 'board', projectId: p.id, boxes: [step('s1', 1, 'Setup'), step('s2', 2, 'Midpoint'), step('s3', 3, 'Climax'), meta('m1')], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:01.000Z' });
      window.wrizoCreateJournalPage({ id: 'w2-deck2', text: 'Argument', pageType: 'board', projectId: p2.id, boxes: [step('a1', 1, 'Claim'), meta('m2')], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:02.000Z' });
      window.wrizoCreateJournalPage({ id: 'w2-pg1', text: 'The rope\\nfirst words', projectId: p.id, origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:03.000Z' });
      window.wrizoCreateJournalPage({ id: 'w2-pg2', text: 'The map\\nmore words', projectId: p.id, origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:04.000Z' });
      window.__w2p = p.id; window.wrizoFlushNow(); })()`);
    await sleep(500);
  };
  const open = async (id, sel) => { await q(`location.hash = '#/page/${id}'`); await waitSoft(`!!document.querySelector('${sel}')`, { label: id, timeout: 8000 }); await sleep(900); };
  const goDeck = async () => { await open('w2-deck', '.walk-card'); };

  for (const theme of ['plateau', 'flux']) {
    for (const tone of ['dark', 'light']) {
      const T = `${theme === 'plateau' ? 'Arbor' : 'Flux'} ${tone}`;
      const tag = `${theme === 'plateau' ? 'arbor' : 'flux'}-${tone}`;
      const W = WORDS[theme];
      try {
        await fresh(theme, tone); await seed();
        await goDeck();

        // D - the doors, in this skin's words, after Notes
        const doors = await q("[...document.querySelectorAll('.walk-door')].map((b) => ({ key: b.dataset.door, text: b.textContent.trim() }))");
        ok(`${T}: D1 the doors are Notes, Write this, Place a page, in that order`, doors && doors.map((d) => d.key).join() === 'notes,write,place', JSON.stringify(doors));
        ok(`${T}: D2 the doors speak the skin's words`, doors && doors[1]?.text === W.write && doors[2]?.text === W.place, `${doors && doors[1]?.text} | ${doors && doors[2]?.text}`);
        await shot(`${tag}-doors`);

        // P - Place a page: the picker filtered to pages; looking grafts nothing; the Walk does not move; a press grafts and the card kindles
        const cardBefore = await rectOf('.walk-card'); const c1 = await current();
        await click('.walk-door[data-door="place"]');
        const pickerUp = await waitSoft("!!document.querySelector('[data-graft-picker][data-graft-mode=\"pages\"]')", { label: 'pages picker', timeout: 4000 });
        ok(`${T}: P1 "Place a page" opens the picker in pages mode`, pickerUp);
        const groups = await q("[...document.querySelectorAll('[data-graft-picker] [data-graft-pickgroup]')].map((g) => g.getAttribute('data-graft-pickgroup'))");
        ok(`${T}: P2 only Pages are listed (no Cards, no Boards)`, Array.isArray(groups) && groups.length === 1 && groups[0] === 'Pages', JSON.stringify(groups));
        const head = await q("document.querySelector('[data-graft-picker] .wz-graft-picker-h')?.textContent ?? null");
        ok(`${T}: P3 the picker carries the door's own word`, head === W.place, String(head));
        ok(`${T}: P4 the Walk's card did not move or resize (page primacy)`, JSON.stringify(await rectOf('.walk-card')) === JSON.stringify(cardBefore), JSON.stringify([cardBefore, await rectOf('.walk-card')]));
        await shot(`${tag}-picker-pages`);
        const before = await rowOf('w2-deck');
        ok(`${T}: P5 looking at the picker grafts nothing`, liveLinks(before).length === 0);
        await click('[data-graft-picker] [data-graft-pick][data-graft-entry="w2-pg1"]');
        await sleep(900);
        const after = await rowOf('w2-deck'); const l1 = liveLinks(after);
        ok(`${T}: P6 a press grafts that page to that card (one record the board owns)`, l1.length === 1 && l1[0].aBoxId === c1 && l1[0].bEntryId === 'w2-pg1', JSON.stringify(l1));
        await q("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(300);
        const kind = await q(`document.querySelector('.walk-mark[data-current="true"]')?.getAttribute('data-kindled')`);
        ok(`${T}: P7 the card kindles (its rail mark)`, kind === 'true', String(kind));
        if (await q("!!document.querySelector('[data-graft-picker]')")) await click('.walk-stage');

        // W - Write this on the second step: an unborn page, a chip, the chip returns to the same card; a typed page is born grafted
        await q(`document.querySelector('.walk-nav[data-dir="next"]')?.click()`); await sleep(700);
        const c2 = await current();
        ok(`${T}: W0 stepped to the second card`, !!c2 && c2 !== c1, `${c1} -> ${c2}`);
        const count0 = (await rows()).length;
        await click('.walk-door[data-door="write"]');
        await waitSoft("/^#\\/page\\/new\\?/.test(location.hash)", { label: 'unborn address', timeout: 6000 });
        const h1 = await hash();
        ok(`${T}: W1 the door opens an UNBORN page naming the card`, /^#\/page\/new\?/.test(h1) && h1.includes('gb=w2-deck') && h1.includes('gc=' + c2), h1);
        await waitSoft("!!document.querySelector('[data-return-chip]')", { label: 'chip', timeout: 6000 }); await sleep(500);
        ok(`${T}: W2 no page exists until the first keystroke`, (await rows()).length === count0, `${count0} -> ${(await rows()).length}`);
        const chip = await q("(() => { const b = document.querySelector('[data-return-chip]'); return b ? { text: b.textContent.trim(), kind: b.getAttribute('data-return-chip'), title: b.getAttribute('title') } : null; })()");
        ok(`${T}: W3 the return chip names the Deck`, !!chip && chip.text === '‹ Back to Three-Act' && chip.kind === 'step', JSON.stringify(chip));
        const mode = await q("document.querySelector('.mode-switcher [aria-pressed=\"true\"], .mode-switcher [aria-selected=\"true\"], [data-mode-active]')?.textContent?.trim() ?? null");
        ok(`${T}: W4 the page opens for writing in Free Write`, !mode || /free write|journal|draft file|free|\[?write/i.test(String(mode)) && !/^draft$/i.test(String(mode)), String(mode));
        await shot(`${tag}-write-this-chip`);
        await click('[data-return-chip]');
        await waitSoft(`location.hash === '#/page/w2-deck'`, { label: 'back at the deck', timeout: 6000 });
        await waitSoft("!!document.querySelector('.walk-card')", { label: 'walk back', timeout: 6000 }); await sleep(700);
        ok(`${T}: W5 the chip returns to the SAME card in the Deck's Walk`, (await current()) === c2, `${c2} vs ${await current()}`);
        ok(`${T}: W6 leaving without typing left no page and no graft`, (await rows()).length === count0 && liveLinks(await rowOf('w2-deck')).length === 1);

        // WT - type: born in the Deck's set, grafted to the card, in Free Write; the chip returns to that step
        await click('.walk-door[data-door="write"]');
        await waitSoft("!!document.querySelector('[data-return-chip]')", { label: 'chip again', timeout: 6000 }); await sleep(700);
        await q("(document.querySelector('.forward-only-editor') || document.querySelector('[contenteditable=\"true\"]'))?.focus()"); await sleep(200);
        await app.typeKeys('The midpoint, in my own words');
        for (let i = 0; i < 30; i += 1) { await sleep(400); if ((await rows()).some((e) => (e.text || '').includes('midpoint'))) break; }   // the page's own save cadence: the row first holds the first character, then the words
        const born = (await rows()).filter((e) => !['w2-deck', 'w2-deck2', 'w2-pg1', 'w2-pg2'].includes(e.id) && e.pageType !== 'board');
        ok(`${T}: T1 the first keystroke births one page, with the words`, born.length === 1 && (born[0].text || '').includes('midpoint'), `${born.length} ${born[0] && born[0].text}`);
        const set = (await rowOf('w2-deck')).projectId;
        ok(`${T}: T2 it is born in the Deck's set`, born[0] && born[0].projectId === set, `${born[0] && born[0].projectId} vs ${set}`);
        const dl = liveLinks(await rowOf('w2-deck')).filter((l) => l.bEntryId === (born[0] && born[0].id));
        ok(`${T}: T3 it is grafted to the card it was written for`, dl.length === 1 && dl[0].aBoxId === c2, JSON.stringify(dl));
        const modeKey = born[0] ? await q(`localStorage.getItem('wrizo-mode-page-${born[0].id}')`) : null;
        ok(`${T}: T4 and it will reopen in Free Write`, modeKey === 'journal', String(modeKey));
        if (born[0]) {
          await q("document.querySelector('.wz-tutor-grip')?.getAttribute('data-open') !== 'true' && document.querySelector('.wz-tutor-grip')?.click()"); await sleep(700);
          await q("document.querySelector('#wz-tutor-tab-links')?.click()"); await sleep(600);
          const grow = await q("[...document.querySelectorAll('.wz-links-pane [data-graft-entry=\"w2-deck\"] .wz-graft-title')].map((n) => n.textContent)");
          ok(`${T}: T5 the page's Grafts row reads "Three-Act · Midpoint"`, Array.isArray(grow) && grow.includes('Three-Act · Midpoint'), JSON.stringify(grow));
          await shot(`${tag}-grafts-row`);
          await wakeClick('[data-graft-add]'); await sleep(500);
          const came = await q("document.querySelector('[data-graft-picker] [data-graft-came] .wz-graft-title')?.textContent ?? null");
          const cameCk = await q("document.querySelector('[data-graft-picker] [data-graft-came]')?.getAttribute('aria-checked') ?? null");
          ok(`${T}: T6 "Came from" names the step, already placed (checked)`, came === 'Three-Act · Midpoint' && cameCk === 'true', `${came} / ${cameCk}`);
          await q("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(300);
        }
        await wakeClick('[data-return-chip]');
        await waitSoft("!!document.querySelector('.walk-card')", { label: 'walk back 2', timeout: 6000 }); await sleep(700);
        ok(`${T}: T7 from the typed page the chip still returns to that card`, (await current()) === c2, `${c2} vs ${await current()}`);
        const kind2 = await q(`document.querySelector('.walk-mark[data-current="true"]')?.getAttribute('data-kindled')`);
        ok(`${T}: T8 the card is kindled`, kind2 === 'true', String(kind2));

        // PT - Place this: from a page, the Decks' steps with place labels across Drawers; a press places; nothing without one
        await open('w2-pg2', '.forward-only-editor, [contenteditable="true"]');
        await q("document.querySelector('.wz-tutor-grip')?.getAttribute('data-open') !== 'true' && document.querySelector('.wz-tutor-grip')?.click()"); await sleep(700);
        await q("document.querySelector('#wz-tutor-tab-links')?.click()"); await sleep(600);
        const linksBefore = liveLinks(await rowOf('w2-pg2')).length;
        const pt = await q("(() => { const b = document.querySelector('[data-graft-place-this]'); return b ? b.textContent.trim() : null; })()");
        ok(`${T}: X1 the page offers "${W.placeThis}"`, pt === W.placeThis, String(pt));
        await click('[data-graft-place-this]');
        const stepRows = await q("[...document.querySelectorAll('[data-graft-picker][data-graft-mode=\"steps\"] [data-graft-pick]')].map((b) => ({ entry: b.dataset.graftEntry, box: b.dataset.graftBox, title: b.querySelector('.wz-graft-title')?.textContent, place: b.querySelector('.wz-graft-place')?.textContent ?? null }))");
        const titles = (stepRows || []).map((r) => r.title);
        ok(`${T}: X2 the Decks' steps are listed as "Deck · Step"`, ['Three-Act · Setup', 'Three-Act · Midpoint', 'Three-Act · Climax', 'Argument · Claim'].every((t) => titles.includes(t)), JSON.stringify(titles));
        const claim = (stepRows || []).find((r) => r.title === 'Argument · Claim');
        ok(`${T}: X3 a step from another Drawer carries its place label (and the page's own Drawer's carry none)`, !!claim && claim.place === 'Essays' && (stepRows || []).filter((r) => r.entry === 'w2-deck').every((r) => !r.place), JSON.stringify(stepRows));
        await shot(`${tag}-place-this`);
        ok(`${T}: X4 looking grafts nothing`, liveLinks(await rowOf('w2-pg2')).length === linksBefore);
        await click('[data-graft-picker] [data-graft-pick][data-graft-entry="w2-deck2"]'); await sleep(900);
        const pl = liveLinks(await rowOf('w2-pg2'));
        ok(`${T}: X5 a press places the page on that step (a record the page owns)`, pl.length === linksBefore + 1 && pl.some((l) => l.bEntryId === 'w2-deck2' && l.bBoxId === 'a1'), JSON.stringify(pl));
        await q("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(300);
        const grow2 = await q("[...document.querySelectorAll('.wz-links-pane [data-graft-entry=\"w2-deck2\"] .wz-graft-title')].map((n) => n.textContent)");
        ok(`${T}: X6 the placed page's Grafts row reads "Argument · Claim"`, Array.isArray(grow2) && grow2.includes('Argument · Claim'), JSON.stringify(grow2));
        await shot(`${tag}-placed-row`);
        await open('w2-deck2', '.walk-card');
        const k3 = await q(`document.querySelector('.walk-mark[data-current="true"]')?.getAttribute('data-kindled')`);
        ok(`${T}: X7 the Deck's step kindles from the page side`, k3 === 'true', String(k3));

        // R - a reload mid-flow: the unborn address survives (the card rides it), still no page; typing then still grafts
        await open('w2-deck', '.walk-card');
        const n3 = (await rows()).length;
        await click('.walk-door[data-door="write"]');
        await waitSoft("/^#\\/page\\/new\\?/.test(location.hash)", { label: 'unborn again', timeout: 6000 }); await sleep(600);
        await app.reload(); await waitSoft("!!document.querySelector('[contenteditable=\"true\"], .forward-only-editor')", { label: 'unborn after reload', timeout: 9000 }); await sleep(900);
        ok(`${T}: R1 a reload on the unborn page leaves no page behind and keeps the door's meaning`, (await rows()).length === n3 && /gb=w2-deck/.test(await hash()), `${n3} -> ${(await rows()).length} ${await hash()}`);
      } catch (e) { ok(`${T}: scenario ran to the end`, false, String((e && e.stack) || e).slice(0, 300)); }
    }
  }

  // S - a phone width: the Deck is the Walk only; "Write this" still has a one-tap way back
  try {
    await fresh('plateau', 'dark', 800); await seed(); await goDeck();
    const c = await current();
    await click('.walk-door[data-door="write"]');
    await waitSoft("!!document.querySelector('[data-return-chip]')", { label: 'narrow chip', timeout: 7000 }); await sleep(500);
    ok('narrow: S1 the page has the return chip below the frame gate', await q("!!document.querySelector('[data-return-chip=\"step\"]')"));
    await shot('arbor-dark-narrow-chip');
    await click('[data-return-chip]');
    await waitSoft("!!document.querySelector('.walk-card')", { label: 'narrow walk back', timeout: 7000 }); await sleep(600);
    ok('narrow: S2 one tap returns to the same card', (await current()) === c, `${c} vs ${await current()}`);
  } catch (e) { ok('narrow: scenario ran to the end', false, String((e && e.stack) || e).slice(0, 300)); }
});

const bad = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail && !c.pass ? '  -- ' + c.detail : ''}`);
console.log(`\nGUIDED-W2 PART 2: ${bad.length === 0 ? 'PASS' : 'FAIL'} (${checks.length - bad.length}/${checks.length})`);
process.exit(bad.length === 0 ? 0 : 1);
