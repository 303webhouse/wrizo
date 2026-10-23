// W3 / W11a PART 2 - THE LIVE APP (a box turn). PART 1 (guided-w3.mjs) proved the modules and the sources browserless; this proves what only a browser can: the placeholder is a pseudo-element of
// the real card, the "?" sits at the end of the real title, the popover is anchored, Esc returns focus, "more" stages and sends nothing, the first keystroke hides the question and the question
// comes back when the words go, the page does not move - in Arbor and in Flux.
//
// AUTHORED BROWSERLESS (not yet run on the box): the first box turn is its first run; any failure there is the harness's or the build's, and is read as such before either is touched.
//
// Run: node scripts/harness/guided-w3-part2.mjs [outDir]      (box turn, through scripts/box-take.mjs; with outDir it also writes the eight frames Fable clears: a dealt Three-Act and the "?" open,
//                                                              Arbor and Flux, dark and light page tone)
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv[2] || null;
if (out) fs.mkdirSync(out, { recursive: true });
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const shot = async (name) => { if (out) fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
  const point = (sel) => q(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const click = async (sel) => { const p = await point(sel); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); await sleep(350); return true; };
  const boxes = () => q('window.wrizoBoard()');
  const cardIds = async () => (await boxes()).filter((b) => b.kind === 'text').map((b) => b.id);

  // fresh app, the theme and page tone set, one empty board homed in a project, opened
  const fresh = async (theme, tone) => {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await app.reload();
    await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await sleep(600);
    await q(`window.wrizoTheme && window.wrizoTheme.set('${theme}')`);
    await q(`window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${tone}' })`);
    await sleep(400);
    await q(`(() => { const p = window.wrizoCreateProject('Guided W3', 'creative'); window.__gw3Project = p.id; window.wrizoCreateJournalPage({ id: 'gw3-board', text: 'Guided board', pageType: 'board', projectId: p.id, boxes: [], origin: 'project', source: 'page' }); window.wrizoFlushNow(); })()`);
    await sleep(400);
    await q("location.hash = '#/page/gw3-board'");
    await waitSoft("!!document.querySelector('.board-canvas')", { label: 'board' });
    await sleep(700);
  };
  // the deal, through the empty board's own Presets door and the wizard (the writer's path)
  const dealThreeAct = async () => {
    const door = await click(".wz-beginnings[data-beginnings=board] .wz-beginning[data-beginning='loadDeck']");
    const wiz = await waitSoft("!!document.querySelector('.deck-wizard-dialog')", { label: 'wizard', timeout: 5000 });
    await q("document.querySelector('[data-deck-id=\"three-act\"]')?.click()"); await sleep(400);
    await q("document.querySelector('[data-option-id=\"novel\"]')?.click()"); await sleep(900);
    return { door, wiz };
  };

  for (const theme of ['plateau', 'flux']) {
    for (const tone of ['dark', 'light']) {
      const T = `${theme === 'plateau' ? 'Arbor' : 'Flux'} ${tone}`;
      const full = tone === 'dark';   // the assertions run once per theme; the light leg is for the frames
      await fresh(theme, tone);
      const d = await dealThreeAct();
      const ids = await cardIds();
      if (full) ok(`[${T}] a Three-Act (Novel) is dealt from the empty board's Presets door`, d.door && d.wiz && ids.length === 9, JSON.stringify(d));

      // THE PLACEHOLDER: a pseudo-element of the card face, never text
      const face = await q(`(() => [...document.querySelectorAll('.board-box .board-text')].map((f) => { const cs = getComputedStyle(f, '::after'); return { prompt: f.getAttribute('data-prompt'), content: cs.content, color: cs.color, text: f.textContent }; }))()`);
      if (full) {
        ok(`[${T}] every dealt card face wears its question as data-prompt, painted by ::after`, face.length === 9 && face.every((f) => f.prompt && f.content === JSON.stringify(theme === 'flux' ? `> ${f.prompt} ▮` : f.prompt)), JSON.stringify(face[0]));
        ok(`[${T}] the question is NOT in the card's text (textContent is the stored title line only)`, face.every((f) => !f.text.includes(f.prompt)) && face.every((f) => !/\n./.test(f.text.trim())), JSON.stringify(face[0] && face[0].text));
        ok(`[${T}] the question's colour is ${theme === 'plateau' ? "Arbor's olive (#4F5730)" : 'the Flux readout meta cyan (#8FD6EE)'}, never the frame's #8f9a58`, theme === 'plateau' ? face[0].color === 'rgb(79, 87, 48)' : face[0].color === 'rgb(143, 214, 238)', face[0].color);
        const stored = await boxes();
        ok(`[${T}] stored: every dealt card has an EMPTY body, a prompt and deckStep { deck, step }; the prompt is not in the text`, stored.filter((b) => b.kind === 'text').every((b) => /^[^\n]+\n$/.test(b.text) && typeof b.prompt === 'string' && b.deckStep && b.deckStep.deck === 'three-act' && !b.text.includes(b.prompt)), JSON.stringify(stored[0]));
      }
      await shot(`three-act-${theme === 'plateau' ? 'arbor' : 'flux'}-${tone}`);

      // THE "?" at the title's end
      const g = await q(`(() => [...document.querySelectorAll('.board-box')].filter((b) => b.querySelector('.board-step-help')).map((b) => {
        const btn = b.querySelector('.board-step-help'); const face = b.querySelector('.board-text'); const cr = b.getBoundingClientRect(); const br = btn.getBoundingClientRect();
        const first = face.firstChild; let right = null, top = null, h = null;
        const w = document.createTreeWalker(face, NodeFilter.SHOW_TEXT); const title = (face.textContent.split('\\n')[0] || '').length;
        let remaining = title, node = null, off = 0; while (w.nextNode()) { const n = w.currentNode; if (n.data.length >= remaining) { node = n; off = remaining; break; } remaining -= n.data.length; }
        if (node && off > 0) { const r = document.createRange(); r.setStart(node, off - 1); r.setEnd(node, off); const rr = r.getBoundingClientRect(); right = rr.right; top = rr.top; h = rr.height; }
        return { inside: br.left >= cr.left && br.right <= cr.right + 1 && br.top >= cr.top - 1 && br.bottom <= cr.bottom, afterTitle: right !== null && br.left >= right - 1, onTitleLine: top !== null && br.top + br.height / 2 >= top - 2 && br.top + br.height / 2 <= top + h + 2, text: btn.textContent.trim(), first: !!first };
      }))()`);
      if (full) {
        ok(`[${T}] every dealt card carries the "?" (${theme === 'flux' ? '[?]' : '?'}) after the end of its title, on the title's line, inside the card`, g.length === 9 && g.every((x) => x.inside && x.afterTitle && x.onTitleLine && x.text === (theme === 'flux' ? '[?]' : '?')), JSON.stringify(g[0]));
      }

      if (full) {
        // THE PAGE IS PRIMARY: the popover moves nothing
        const rectsBefore = await q("(() => { const c = document.querySelector('.board-canvas').getBoundingClientRect(); const k = document.querySelector('.board-box').getBoundingClientRect(); return [c.left, c.top, c.width, c.height, k.left, k.top, k.width, k.height].map(Math.round); })()");
        const opened = await click('.board-box .board-step-help');
        const pop = await q(`(() => { const p = document.querySelector('.board-step-pop'); const b = document.querySelector('.board-box .board-step-help'); if (!p) return null; const pr = p.getBoundingClientRect(); const br = b.getBoundingClientRect(); return { text: p.textContent, below: pr.top >= br.bottom, arrowUnder: Math.abs(pr.left + 28 - (br.left + br.width / 2)) <= 3 || pr.left <= 9 || pr.right >= innerWidth - 9, focusMore: document.activeElement && document.activeElement.classList.contains('board-step-pop-more'), expanded: b.getAttribute('aria-expanded'), dialog: p.getAttribute('role') }; })()`);
        await shot(`three-act-help-${theme === 'plateau' ? 'arbor' : 'flux'}-${tone}`);
        ok(`[${T}] the "?" opens a popover ANCHORED at it: the step's name, one sentence, one example, and "more -> ${theme === 'flux' ? 'Operator' : 'Tutor'}"; focus moves to "more"`,
          opened && !!pop && pop.dialog === 'dialog' && pop.below && pop.arrowUnder && pop.focusMore && pop.expanded === 'true' && /first image or line/.test(pop.text) && /dead man is dead/.test(pop.text) && pop.text.toLowerCase().includes(theme === 'flux' ? 'more' : 'more') && pop.text.includes(theme === 'flux' ? 'Operator' : 'Tutor'), JSON.stringify(pop));
        const rectsOpen = await q("(() => { const c = document.querySelector('.board-canvas').getBoundingClientRect(); const k = document.querySelector('.board-box').getBoundingClientRect(); return [c.left, c.top, c.width, c.height, k.left, k.top, k.width, k.height].map(Math.round); })()");
        ok(`[${T}] PAGE IS PRIMARY: the board canvas and the card do not move or resize while the popover is open`, JSON.stringify(rectsBefore) === JSON.stringify(rectsOpen), JSON.stringify({ rectsBefore, rectsOpen }));
        await app.key('Escape'); await sleep(250);
        const afterEsc = await q("({ gone: !document.querySelector('.board-step-pop'), focusOnGlyph: !!document.activeElement && document.activeElement.classList.contains('board-step-help') })");
        ok(`[${T}] Esc closes the popover and RETURNS focus to the "?"`, afterEsc.gone && afterEsc.focusOnGlyph, JSON.stringify(afterEsc));

        // MORE: stages an ask in the Tutor's composer and sends nothing
        await q("window.__tutorCalls = 0; const f = window.fetch; window.fetch = function (u) { try { if (/tutor|chat/i.test(String(u && u.url || u))) window.__tutorCalls += 1; } catch (e) {} return f.apply(this, arguments); };");
        await click('.board-box .board-step-help');
        await click('.board-step-pop-more'); await sleep(700);
        const staged = await q("({ popGone: !document.querySelector('.board-step-pop'), open: document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true', value: document.querySelector('.wz-tutor-convo-input')?.value, calls: window.__tutorCalls, focus: document.activeElement && document.activeElement.classList.contains('wz-tutor-convo-input') })");
        ok(`[${T}] "more" STAGES "What does Hook do?" in the Tutor composer (drawer opened, caret there) and sends NOTHING`, staged.popGone && staged.open && staged.value === 'What does Hook do?' && staged.calls === 0, JSON.stringify(staged));
        await app.key('Escape'); await sleep(300);

        // THE FIRST KEYSTROKE hides the question; deleting the words brings it back
        const ps = await point('.board-box .board-text');
        await app.doubleClick(ps.x, ps.y);
        await waitSoft("!!document.querySelector('.board-popup-editor')", { label: 'popup', timeout: 5000 });
        const pre = await q("(() => { const e = document.querySelector('.board-popup-editor'); return { empty: e.getAttribute('data-body-empty'), has: !!e.getAttribute('data-prompt'), content: getComputedStyle(e, '::after').content }; })()");
        await q("document.querySelector('.board-popup-editor').focus()");
        await app.typeKeys('She waits');
        await sleep(300);
        const post = await q("(() => { const e = document.querySelector('.board-popup-editor'); return { empty: e.getAttribute('data-body-empty'), content: getComputedStyle(e, '::after').content }; })()");
        ok(`[${T}] in the card pop-up the question shows while the body is empty and the FIRST keystroke hides it`, pre.empty === 'true' && pre.has && pre.content !== 'none' && post.empty === 'false' && post.content === 'none', JSON.stringify({ pre, post }));
        await q("document.querySelector('.board-popup-done').click()"); await sleep(400);
        const hid = await q("(() => { const f = document.querySelector('.board-box .board-text'); return { attr: f.getAttribute('data-prompt'), text: f.textContent }; })()");
        const kept = (await boxes()).find((b) => b.deckStep && b.deckStep.step === 'hook');
        ok(`[${T}] on the face the question is gone once the card has words; the stored card keeps its prompt and deckStep and holds the writer's words as its body`, hid.attr === null && /She waits/.test(hid.text) && !!kept && !!kept.prompt && /^Hook\nShe waits/.test(kept.text), JSON.stringify({ hid, kept: kept && kept.text }));
        const ps2 = await point('.board-box .board-text');
        await app.doubleClick(ps2.x, ps2.y);
        await waitSoft("!!document.querySelector('.board-popup-editor')", { label: 'popup again', timeout: 5000 });
        await q("document.querySelector('.board-popup-editor').focus()");
        for (let i = 0; i < 9; i++) await app.key('Backspace');
        await sleep(300);
        await q("document.querySelector('.board-popup-done').click()"); await sleep(400);
        const back = await q("document.querySelector('.board-box .board-text').getAttribute('data-prompt')");
        ok(`[${T}] delete the words and the question returns ("a card with no words still shows its question")`, !!back, String(back));
      }
    }
  }

  // FROM MY PAGES: the writer picks pages in an order; one card per page lands in that order, titled with the page, each GRAFTED to its page (seen where the writer sees a graft: the card's Inputs tab)
  await fresh('plateau', 'dark');
  const seedPages = [['gw3-pg1', 'Mara at the window\nShe watches the ferry light.'], ['gw3-pg2', 'The blue cup\nTheir mother’s.'], ['gw3-pg3', 'Second horn']];   // (JSON carries the newlines into the page)
  await q(`(() => { for (const [id, text] of ${JSON.stringify(seedPages)}) window.wrizoCreateJournalPage({ id, text, projectId: window.__gw3Project, origin: 'project', source: 'page' }); window.wrizoFlushNow(); })()`);
  await q("location.hash = '#/page/gw3-board'"); await sleep(900);
  await click(".wz-beginnings[data-beginnings=board] .wz-beginning[data-beginning='loadDeck']");
  await waitSoft("!!document.querySelector('.deck-wizard-dialog')", { label: 'wizard (pages)', timeout: 5000 });
  const inLibrary = await q("!!document.querySelector('[data-deck-id=\"from-my-pages\"]')");
  ok('From my pages is offered in the board door\'s library (this project has pages to pick from)', inLibrary, String(inLibrary));
  await q("document.querySelector('[data-deck-id=\"from-my-pages\"]')?.click()"); await sleep(400);
  const disabledFirst = await q("document.querySelector('.deck-wizard-deal')?.disabled === true");
  await click("[data-page-id='gw3-pg2']"); await click("[data-page-id='gw3-pg1']");
  const nums = await q("[...document.querySelectorAll('.deck-wizard-page-btn')].map((b) => b.getAttribute('data-page-id') + ':' + b.querySelector('.deck-wizard-page-n').textContent)");
  await click('.deck-wizard-deal'); await sleep(900);
  const dealtPages = (await boxes()).filter((b) => b.kind === 'text');
  ok('the page step numbers the picks in the order picked, and Deal is disabled until one is picked', disabledFirst && nums.includes('gw3-pg2:1') && nums.includes('gw3-pg1:2'), JSON.stringify({ disabledFirst, nums }));
  ok('From my pages deals one card per picked page IN THAT ORDER, titled with the page, body empty, a question as its placeholder', dealtPages.length === 2 && dealtPages[0].text === 'The blue cup\n' && dealtPages[1].text === 'Mara at the window\n' && dealtPages.every((b) => b.prompt === 'What does this part do for the whole?' && b.deckStep && b.deckStep.deck === 'from-my-pages'), JSON.stringify(dealtPages.map((b) => b.text)));
  const selId = dealtPages[0].id;
  const selPt = await point('[data-box-id="' + selId + '"] .board-text'); await app.mouseMove(selPt.x, selPt.y); await app.mouseDown(selPt.x, selPt.y); await sleep(60); await app.mouseUp(selPt.x, selPt.y); await sleep(500);
  await q("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(800);
  await q("document.querySelector('#wz-tutor-tab-links')?.click()"); await sleep(700);
  const panel = await q("document.querySelector('.wz-tutor-panel')?.textContent || ''");
  ok('each card is grafted to its own page: the first card\'s Inputs tab names The blue cup and not the other page', /The blue cup/.test(panel) && !/Mara at the window/.test(panel), panel.slice(0, 200));
  const pagesAfter = await q("(() => ['gw3-pg1', 'gw3-pg2', 'gw3-pg3'].map((id) => window.wrizoGetPageText ? window.wrizoGetPageText(id) : null))()");
  void pagesAfter;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nGUIDED-W3 PART 2: FAIL - ${failed.length}/${checks.length}` : `\nGUIDED-W3 PART 2: PASS (${checks.length} checks${out ? '; frames in ' + out : ''})`);
process.exit(failed.length ? 1 : 0);
