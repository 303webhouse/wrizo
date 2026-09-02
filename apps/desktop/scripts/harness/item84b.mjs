// ITEM 84 — THE DRAFT ROSTER (the Tutor's chip row in Draft: three staging asks
// and TD4, the selection ask). Committed CDP verification scenario, the sibling
// of item84.mjs (the deck phase). Fixtures/technique adopted VERBATIM from
// item84.mjs / tu1.mjs / tu2.mjs / sc1.mjs / fx18.mjs — the "don't re-derive
// fixtures" law.
// Run: node scripts/harness/item84b.mjs  (from apps/desktop, dist-web freshly built).
//
// WHAT THIS FILE HAS TO BITE ON, mapped to the build brief's own §8:
//
//   S0 — THE STRINGS, BYTE-EXACT. The brief warns in as many words that "a
//        builder copying from the mockup HTML will ship an overturned string":
//        ask 3 reads "Where do I lose the thread?" in Pass 2 and in the mockup,
//        and was amended under the voice law. So this file asserts all four
//        strings byte-for-byte AND asserts the overturned form absent from the
//        DOM. The constants below were EXTRACTED from the brief's §2 table when
//        this file was generated, never retyped — there is no keystroke in the
//        chain where the em dash could degrade.
//
//   S1 — THE MODE BOUNDARY. Draft renders the roster; Free Write renders the
//        deck phase's roster and never this one; Board renders neither. A
//        SCREENPLAY page renders THIS one, because ScriptEditor mounts the panel
//        with mode="drafting" unconditionally — a screenplay page IS a Draft
//        page, and "Draft only" therefore includes it. Revise cannot be tested
//        from the outside because it cannot exist: EditorMode has no 'revise'
//        member and the Revise tab is live:false, so the check is that the tab
//        is genuinely inert and the Draft roster stays put.
//
//   S2 — STAGING, NOT SENDING. "A chip press loads its string into the composer
//        as editable text, cursor placed in it. Nothing goes on the wire on a
//        chip press." Proven as three separate claims: the composer holds the
//        exact string; the caret is IN it and the input is genuinely editable;
//        and the press put zero bytes on any wire — measured from both ends
//        (a page-side counter over fetch/XHR/beacon/WebSocket to ANY url, and
//        the server double's own request counter), because a page-side trap
//        alone could be wrong about what escapes it and a server counter alone
//        only watches one route.
//
//   S3 — TD4'S GATE. "Disabled-visible without a selection — it holds its slot
//        rather than appearing and vanishing." So: present in the DOM, disabled,
//        and SAYING WHY (a disabled control cannot otherwise answer for itself);
//        then live the moment a stretch is selected; then disabled again when
//        the writer puts the selection down.
//
//   S4 — THE WIRE PRECISION, and this is the per-button harness obligation the
//        disclosure sentence attaches to each gated counsel: "TD4 — the wire adds
//        the SELECTION ONLY. pageText stays a render prop, never a TD4 wire key."
//        The measurement is built so that the page CANNOT ride unnoticed: the
//        first send advances the Tutor's cursor to the page's full length, so the
//        second send has no delta at all — and the TD4 body must then be exactly
//        { messages, selection }, with the page's own surrounding sentences
//        absent from the entire serialized body. A body carrying the page would
//        fail on the key set AND on the substring sweep.
//
//   S5 — PER-PRESS CONSENT ("only then"), the button law made mechanical. Ask 1's
//        naming cannot consent for ask 4's wire: a send staged by asks 1-3 must
//        carry NO selection key at all — including a send where TD4 armed first
//        and another chip was pressed after it — and one press must fund exactly
//        one send, never two.
//
//   S6 — THE DISCLOSURE. v4's ratified sentence renders byte-exact and LEADS;
//        v3's body stands verbatim beneath it (annotation form); the ack writes
//        version 4; a v3-acknowledged device is shown it exactly once.
//
//   S7 — GEOMETRY. FX18's regime is untouched: at both reference widths the
//        paper's own rectangle is byte-identical with the panel closed and with
//        it open carrying the roster. Paper never reflows for chrome.
//
//   S8 — A13, the wall. No press may put a byte on a writing surface.
//
// PARK SWEEP (this ticket's own, run before writing this file). One assertion
// parks and it belongs to this file's own predecessor: item84.mjs's S6 "and that
// Draft panel carries no roster either" reads .wz-tutor-fw-roster, so it still
// PASSES — but it stops meaning what it says now that Draft carries a roster of
// its own. Parked verbatim in item84.mjs with a pointer to S1 below, never
// rewritten in place. The disclosure bump parks two more (tu5.mjs) plus one each
// in tu1.mjs and tu2.mjs — the version-NUMBER assertions only; every WORDING
// assertion in those files stays true, because v4 renders in annotation form and
// v3's body still carries v3's words exactly. The ten skip-the-disclosure fixture
// seeds moved 3 -> 4, which is a FIXTURE REPAIR on TU5 S6's own recorded
// precedent (tu1.mjs:98) and not a park: no assertion below any of them changes
// meaning. tu1.mjs's A13 structural walk clicks every other button species in the
// panel and asserts the page text never changes — the Draft chips join that walk
// and pass it, because staging writes to the Tutor's OWN composer. fx10.mjs's
// no-scroll-within-scroll walk reads computed overflow across every panel
// descendant; the chip column declares none.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// THE STRINGS OF RECORD — docs/menus/tutor/item84-draft-roster-build-brief.md §2,
// which took them from tutor-menus-lock-record.md §3 (ask 3's amendment) and §4
// (the sweep). Extracted, never retyped. NEVER from the pass files or the mockup
// HTML — that record's own §3 rule.
const ASKS = [
  "Where does this drag?",
  "What's load-bearing here — and what could go?",
  "Where does the thread slip?",
  "Look at just this stretch — what's it doing?",
];
const ASK_IDS = ['drag', 'loadBearing', 'threadSlip', 'stretch'];
const STRETCH_ASK = ASKS[3];              // TD4 — the one chip that adds a payload

// The OVERTURNED string: what ask 3 reads in Pass 2 and in the mockup HTML. It is
// asserted ABSENT. This is the check that catches a copy from either source.
const OVERTURNED_ASK_3 = 'Where do I lose the thread?';

// DISCLOSURE v4, candidate B — Nick's word 2026-08-17, provisionally-binding,
// committed at 1ef1659. Verified against its own manifest before use: 1 sentence,
// 183 bytes, md5 9287082c0e3c0a2b243c71ce01c89b43. Extracted from the brief.
const DISCLOSURE_V4 = "Nothing leaves your desk unasked: an ask sends your words, this page's recent changes, and your Bible; a counsel that reads more names it on the button and sends only that, only then.";

// The page fixture. Three sentences so the middle one can be selected and the two
// around it can be swept for: if the page ever rode along with the selection,
// "Alpha" or "Charlie" would appear in the wire body.
const PAGE_TEXT = 'Alpha one two three. Bravo the chosen stretch. Charlie four five six.';
const STRETCH = 'Bravo the chosen stretch';

// --- item84.mjs / tu1.mjs / tu2.mjs's own fixtures, copied verbatim ---------
const freshDesk = async (app, width = 1400, height = 900, { skipDisclosure = true } = {}) => {
  await app.goto('/');
  await app.evalJs(
    "localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');"
    + (skipDisclosure ? " localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');" : ''),
  );
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const freshProsePage = async (app, width = 1400, height = 900, opts = {}) => {
  await freshDesk(app, width, height, opts);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(400); // store/persistence.ts's FLUSH_DELAY (300ms) — tu1.mjs's own note
};

const freshScriptPage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor('!!document.querySelector(\'[data-kind="screenplay"]\')', { label: 'CreateProject picker (screenplay)' });
  await app.evalJs('document.querySelector(\'[data-kind="screenplay"]\').click()');
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.script-el-active')", { label: 'screenplay surface' });
  await sleep(400);
};

const freshBoard = async (app, boardId, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'Item 84b Board', projectId: null, pageType: 'board', source: 'page', boxes: [], createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board framed' });
  await sleep(400);
  await app.emulateDpr(1, width, height);
};

const openTutor = async (app) => {
  await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
  await sleep(300);
};

const rawEntry = async (app, id) =>
  app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(id)}) ?? null`);

const armTutorMode = (app, mode) =>
  app.evalJs(`fetch('/api/_tutor_mode', { method: 'POST', body: JSON.stringify(${JSON.stringify(mode)}) })`);

const lastTutorBody = async (app) =>
  app.evalJs("fetch('/api/_state').then(r => r.json()).then(s => s.lastTutorChatBody)");

const serverTutorChatCount = (app) =>
  app.evalJs("fetch('/api/_state').then(r => r.json()).then(s => s.tutorChatCount)");

const switchMode = async (app, label) => {
  await app.evalJs(`[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent.trim() === ${JSON.stringify(label)})?.click()`);
  await sleep(400);
};

const lex = (app, term) => app.evalJs(`window.wrizoDeskLexicon.t(${JSON.stringify(term)})`);

// fx18.mjs's own rectangle reader, verbatim.
const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height) }; })()`);

// item84.mjs's page-side outbound-traffic counter, verbatim but for its own key:
// every primitive by which a byte could leave this document, not just the Tutor's
// route, because the claim is "nothing travels", not "one endpoint wasn't called".
const installNetCounter = (app) => app.evalJs(`(() => {
  if (window.__i84b) { window.__i84b.reset(); return true; }
  const R = { fetch: 0, xhr: 0, beacon: 0, ws: 0, urls: [] };
  const note = (kind, url) => { R[kind] += 1; R.urls.push(kind + ':' + String(url)); };
  const realFetch = window.fetch;
  window.fetch = function (...args) {
    const u = args[0] && args[0].url ? args[0].url : args[0];
    note('fetch', u);
    return realFetch.apply(this, args);
  };
  const realOpen = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    note('xhr', url);
    return realOpen.call(this, method, url, ...rest);
  };
  if (navigator.sendBeacon) {
    const realBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, data) => { note('beacon', url); return realBeacon(url, data); };
  }
  const RealWS = window.WebSocket;
  window.WebSocket = function (url, protocols) { note('ws', url); return new RealWS(url, protocols); };
  window.WebSocket.prototype = RealWS.prototype;
  R.reset = () => { R.fetch = 0; R.xhr = 0; R.beacon = 0; R.ws = 0; R.urls = []; };
  window.__i84b = R;
  return true;
})()`);
const netCounts = (app) => app.evalJs(
  "(() => { const R = window.__i84b; return { fetch: R.fetch, xhr: R.xhr, beacon: R.beacon, ws: R.ws, urls: R.urls.slice(0, 8) }; })()",
);
const resetNet = (app) => app.evalJs('window.__i84b.reset(); true');

// --- item 84b's own helpers ------------------------------------------------
const rosterState = (app) => app.evalJs(`(() => {
  const roster = document.querySelector('.wz-tutor-draft-roster');
  const asks = [...document.querySelectorAll('.wz-tutor-draft-ask')];
  const composer = document.querySelector('.wz-tutor-convo-input');
  return {
    rosterPresent: !!roster,
    fwRosterPresent: !!document.querySelector('.wz-tutor-fw-roster'),
    convoPresent: !!document.querySelector('.wz-tutor-convo-row'),
    labels: asks.map(b => b.textContent),
    ids: asks.map(b => b.dataset.ask),
    disabled: asks.map(b => b.disabled),
    sendsSelection: asks.map(b => b.dataset.sendsSelection),
    gated: asks.map(b => b.dataset.gated),
    titles: asks.map(b => b.getAttribute('title')),
    aboveComposer: !!(roster && composer && (roster.compareDocumentPosition(composer) & Node.DOCUMENT_POSITION_FOLLOWING)),
    insideConvo: !!(roster && roster.closest('.wz-tutor-convo')),
    bodyHasOverturned: document.body.innerText.includes("Where do I lose the thread?"),
  };
})()`);

const pressAsk = async (app, id) => {
  await app.evalJs(`document.querySelector('.wz-tutor-draft-ask[data-ask="${id}"]')?.click()`);
  await sleep(200);
};

const composerState = (app) => app.evalJs(`(() => {
  const el = document.querySelector('.wz-tutor-convo-input');
  if (!el) return null;
  return {
    value: el.value,
    focused: document.activeElement === el,
    caret: el.selectionStart,
    caretAtEnd: el.selectionStart === el.value.length && el.selectionEnd === el.value.length,
    readOnly: el.readOnly,
    disabled: el.disabled,
  };
})()`);

// Select a stretch inside the writing surface, by GLOBAL text offset so a needle
// split across text nodes still resolves. Dispatches selectionchange explicitly
// (Chromium also fires it natively, asynchronously) so the host's listener runs
// before the assertion that follows.
const selectStretch = async (app, surfaceSel, needle) => {
  const out = await app.evalJs(`(() => {
    const el = document.querySelector(${JSON.stringify(surfaceSel)});
    if (!el) return { err: 'no surface' };
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = []; let all = '';
    let n; while ((n = walker.nextNode())) { nodes.push({ node: n, at: all.length }); all += n.data; }
    const needle = ${JSON.stringify(needle)};
    const start = all.indexOf(needle);
    if (start < 0) return { err: 'needle absent', all };
    const end = start + needle.length;
    const locate = (off) => {
      for (let i = nodes.length - 1; i >= 0; i--) if (nodes[i].at <= off) return { node: nodes[i].node, offset: off - nodes[i].at };
      return null;
    };
    const a = locate(start), b = locate(end);
    if (!a || !b) return { err: 'no mapping' };
    const r = document.createRange();
    r.setStart(a.node, a.offset); r.setEnd(b.node, b.offset);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
    return { text: sel.toString() };
  })()`);
  await sleep(250);
  return out;
};

const clearSelection = async (app, surfaceSel) => {
  await app.evalJs(`(() => {
    const el = document.querySelector(${JSON.stringify(surfaceSel)});
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const first = walker.nextNode();
    if (!first) return false;
    const r = document.createRange();
    r.setStart(first, 0); r.collapse(true);           // a caret ON the page — the writer putting the selection down
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
    return true;
  })()`);
  await sleep(250);
};

const sendComposer = async (app) => {
  await app.evalJs("document.querySelector('.wz-tutor-convo-send')?.click()");
  await sleep(600);
};

// A prose page carrying PAGE_TEXT, switched into Draft, Tutor open.
const draftPageWithText = async (app, width = 1400, height = 900) => {
  await freshProsePage(app, width, height);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys(PAGE_TEXT);
  await sleep(400);
  await switchMode(app, 'Draft');
  await openTutor(app);
};

await withHarness(async (app) => {
  // ==========================================================================
  // S0 — THE STRINGS OF RECORD, byte-exact, and the overturned one absent.
  // ==========================================================================
  {
    await draftPageWithText(app);
    const st = await rosterState(app);
    ok('S0: the Draft roster renders exactly FOUR asks, in the lock record\'s own order',
      st.labels.length === 4 && JSON.stringify(st.ids) === JSON.stringify(ASK_IDS), JSON.stringify(st.ids));
    for (let i = 0; i < 4; i++) {
      ok(`S0 [ask ${i + 1}]: the chip's text is BYTE-EXACT against the build brief's §2 table — ${JSON.stringify(ASKS[i])}`,
        st.labels[i] === ASKS[i], JSON.stringify({ rendered: st.labels[i], required: ASKS[i] }));
    }
    ok('S0 (THE TRAP): the OVERTURNED ask 3 — the pre-amendment string that still stands in Pass 2 and in the mockup HTML — appears NOWHERE in the rendered app. This is the check that catches a copy from either invalid source',
      st.bodyHasOverturned === false && st.labels.every(l => l !== OVERTURNED_ASK_3), JSON.stringify(st.labels));
    ok('S0: exactly ONE chip declares that it sends a selection, and it is ask 4 (TD4) — the per-button wire declaration',
      JSON.stringify(st.sendsSelection) === JSON.stringify(['false', 'false', 'false', 'true']), JSON.stringify(st.sendsSelection));
    ok('S0: the roster mounts where the arc ruled it mounts — inside "Talk it through", above the composer',
      st.insideConvo === true && st.aboveComposer === true, JSON.stringify({ insideConvo: st.insideConvo, aboveComposer: st.aboveComposer }));
  }

  // ==========================================================================
  // S1 — THE MODE BOUNDARY. Draft and nowhere it is not Draft.
  // ==========================================================================
  {
    await draftPageWithText(app);
    const draft = await rosterState(app);
    ok('S1: in DRAFT the roster renders, and the Free Write roster does NOT — the two rosters are one branch\'s two sides and never co-render',
      draft.rosterPresent === true && draft.fwRosterPresent === false, JSON.stringify(draft));

    await switchMode(app, 'Free Write');
    const fw = await rosterState(app);
    ok('S1: switching that same page to FREE WRITE removes the Draft roster entirely — ABSENT, never disabled (G3) — and the deck phase\'s own roster takes its place',
      fw.rosterPresent === false && fw.labels.length === 0 && fw.fwRosterPresent === true, JSON.stringify(fw));
    ok('S1: the Free Write panel is otherwise untouched — the conversation and its composer still render',
      fw.convoPresent === true, JSON.stringify(fw));

    await switchMode(app, 'Draft');
    const back = await rosterState(app);
    ok('S1: switching back to Draft restores it — the mode branch is live, not decided once at mount',
      back.rosterPresent === true && JSON.stringify(back.labels) === JSON.stringify(ASKS), JSON.stringify(back.labels));

    // REVISE cannot be entered, and that is the brief's "no live surface" proven
    // from the outside rather than asserted from the type.
    await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent.trim() === 'Revise')?.click()");
    await sleep(400);
    const afterRevise = await rosterState(app);
    const modeNow = await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.classList.contains('active'))?.textContent.trim()");
    ok('S1 (REVISE): the Revise tab is inert — clicking it does not leave Draft, so the roster cannot render in Revise because Revise has no live surface to render on',
      modeNow === 'Draft' && afterRevise.rosterPresent === true, JSON.stringify({ modeNow, roster: afterRevise.rosterPresent }));
  }

  {
    await freshScriptPage(app, 1400, 900);
    await openTutor(app);
    const script = await rosterState(app);
    ok('S1 (SCREENPLAY): a screenplay page IS a Draft page (ScriptEditor mounts the panel with mode="drafting"), so the Draft roster renders there too, and the Free Write roster does not',
      script.rosterPresent === true && script.fwRosterPresent === false && script.convoPresent === true, JSON.stringify(script));
    ok('S1 (SCREENPLAY): and it carries the same four strings of record',
      JSON.stringify(script.labels) === JSON.stringify(ASKS), JSON.stringify(script.labels));
  }

  {
    await freshBoard(app, 'item84b-board', 1400, 900);
    await openTutor(app);
    const board = await rosterState(app);
    ok('S1 (BOARD): a surface with no writing mode at all mounts NEITHER roster, and the panel is otherwise whole',
      board.rosterPresent === false && board.fwRosterPresent === false && board.convoPresent === true, JSON.stringify(board));
  }

  // ==========================================================================
  // S2 — STAGING, NOT SENDING. The composer takes the string; the wire takes
  // nothing. Measured from both ends.
  // ==========================================================================
  {
    await draftPageWithText(app);
    await installNetCounter(app);
    const serverBefore = await serverTutorChatCount(app);
    await resetNet(app); // zero page-side AFTER the /api/_state read above

    for (let i = 0; i < 3; i++) {
      await pressAsk(app, ASK_IDS[i]);
      const c = await composerState(app);
      ok(`S2 [ask ${i + 1}]: the press STAGES its own string into the composer, byte-exact`,
        c.value === ASKS[i], JSON.stringify({ value: c.value, required: ASKS[i] }));
      ok(`S2 [ask ${i + 1}]: and it arrives VISIBLY EDITABLE — the caret is in the text, the input is focused, and it is neither readOnly nor disabled ("never styled as final")`,
        c.focused === true && c.caretAtEnd === true && c.readOnly === false && c.disabled === false, JSON.stringify(c));
    }
    // A second press of the same chip REPLACES, never appends.
    await pressAsk(app, ASK_IDS[0]);
    const replaced = await composerState(app);
    ok('S2: pressing another chip REPLACES the staged ask — the composer stages one ask, never a pile of them',
      replaced.value === ASKS[0], JSON.stringify(replaced));

    await sleep(400); // give any deferred/async send every chance to fire before measuring
    const net = await netCounts(app);                     // CDP read — no fetch
    const serverAfter = await serverTutorChatCount(app);  // fetch, deliberately after

    ok('S2 (NOTHING ON THE WIRE ON A CHIP PRESS): the whole roster pressed produces ZERO outbound calls of any kind — no fetch, no XHR, no beacon, no websocket, to ANY url',
      net.fetch === 0 && net.xhr === 0 && net.beacon === 0 && net.ws === 0, JSON.stringify(net));
    ok('S2: and the server double agrees — its /api/tutor/chat request count is identical across the whole press sequence',
      serverBefore === serverAfter, JSON.stringify({ serverBefore, serverAfter }));
  }

  // ==========================================================================
  // S3 — TD4'S GATE: disabled-VISIBLE, and it says why.
  // ==========================================================================
  {
    await draftPageWithText(app);
    const cold = await rosterState(app);
    ok('S3: with no selection TD4 is DISABLED-VISIBLE — it holds its slot in the roster rather than appearing and vanishing (the gate flips by the second; layout stability outranks purity of absence)',
      cold.labels.length === 4 && cold.disabled[3] === true && cold.gated[3] === 'true', JSON.stringify({ disabled: cold.disabled, gated: cold.gated }));
    ok('S3: the other three are NOT gated — they need nothing to be pressable',
      cold.disabled.slice(0, 3).every(d => d === false), JSON.stringify(cold.disabled));
    ok('S3: and the gated chip SAYS WHY — a disabled control cannot otherwise answer for itself',
      typeof cold.titles[3] === 'string' && cold.titles[3].length > 0 && cold.titles.slice(0, 3).every(t => t === null),
      JSON.stringify(cold.titles));

    const sel = await selectStretch(app, '.forward-only-editor', STRETCH);
    ok('S3 (precondition): the fixture really selected the intended stretch on the page',
      sel && sel.text === STRETCH, JSON.stringify(sel));
    const live = await rosterState(app);
    ok('S3: with a stretch selected TD4 goes LIVE — a TRANSIENT gate on real capability, never G3\'s locked door wearing paint',
      live.disabled[3] === false && live.gated[3] === 'false' && live.titles[3] === null, JSON.stringify({ disabled: live.disabled, gated: live.gated }));

    await clearSelection(app, '.forward-only-editor');
    const put_down = await rosterState(app);
    ok('S3: putting the selection down on the page gates it again — the chip tracks the writer\'s own pointing, in both directions',
      put_down.disabled[3] === true && put_down.gated[3] === 'true', JSON.stringify({ disabled: put_down.disabled, gated: put_down.gated }));
  }

  // ==========================================================================
  // S4 — THE WIRE PRECISION. TD4 adds the SELECTION ONLY; pageText stays a
  // render prop and never becomes a wire key.
  // ==========================================================================
  {
    await armTutorMode(app, { configured: true, reply: 'A stubbed reply.' });
    await draftPageWithText(app);

    // SEND ONE — an ordinary ask. Its delta legitimately carries the page (v3's
    // second named traveler), and its purpose here is to ADVANCE THE CURSOR so
    // that send two has no delta at all and the selection stands alone.
    await pressAsk(app, 'drag');
    await sendComposer(app);
    const first = await lastTutorBody(app);
    ok('S4 (asks 1-3 add NO wire key): an ordinary ask\'s body carries no `selection` key at all — absent, never an empty string, so this ticket changed nothing about how asks 1-3 travel',
      !!first && !('selection' in first), JSON.stringify(Object.keys(first || {})));
    ok('S4 (precondition): that first send carried the page as its ordinary delta — the traveler v3 already names — which is what advances the cursor for the measurement below',
      !!first && typeof first.delta === 'string' && first.delta.includes('Charlie'), JSON.stringify({ keys: Object.keys(first || {}) }));

    // SEND TWO — TD4. No new writing since the cursor, so a delta CANNOT ride:
    // whatever the body carries beyond `messages` is what TD4 itself added.
    const sel = await selectStretch(app, '.forward-only-editor', STRETCH);
    ok('S4 (precondition): the stretch is selected and TD4 is live',
      sel && sel.text === STRETCH, JSON.stringify(sel));
    await pressAsk(app, 'stretch');
    await sendComposer(app);
    const td4 = await lastTutorBody(app);
    const keys = Object.keys(td4 || {}).sort();
    const serialized = JSON.stringify(td4 || {});

    ok('S4 (THE BUTTON LAW, per-press and mechanical): TD4\'s wire carries the SELECTED STRETCH, byte-exact — exactly what its own button names',
      !!td4 && td4.selection === STRETCH, JSON.stringify({ selection: td4 && td4.selection, required: STRETCH }));
    ok('S4 (SENDS ONLY THAT): the body\'s top-level keys are EXACTLY { messages, selection } — no delta (nothing new since the cursor), no bible, and no page under any key. `pageText` stayed a render prop, as the lock record\'s wire precision requires',
      JSON.stringify(keys) === JSON.stringify(['messages', 'selection']), JSON.stringify(keys));
    ok('S4: and the page did not ride in disguise — neither sentence surrounding the selected stretch appears ANYWHERE in the serialized body',
      !serialized.includes('Alpha one two three') && !serialized.includes('Charlie four five six'),
      JSON.stringify({ hasAlpha: serialized.includes('Alpha one two three'), hasCharlie: serialized.includes('Charlie four five six') }));
    ok('S4: no "a little either side for context" — the selection is the stretch and nothing wider',
      !!td4 && td4.selection.length === STRETCH.length, JSON.stringify({ len: td4 && td4.selection.length, required: STRETCH.length }));
    ok('S4 (NAMES IT ON THE BUTTON): the writer\'s own message on that send is the chip\'s own words — the button\'s text and the ask that travelled are the same string',
      !!td4 && td4.messages[td4.messages.length - 1].text === STRETCH_ASK,
      JSON.stringify(td4 && td4.messages[td4.messages.length - 1]));
  }

  // ==========================================================================
  // S5 — PER-PRESS CONSENT ("only then"). One press funds one send, and one
  // chip's naming never consents for another chip's wire.
  // ==========================================================================
  {
    await armTutorMode(app, { configured: true, reply: 'A stubbed reply.' });
    await draftPageWithText(app);
    await pressAsk(app, 'drag');
    await sendComposer(app);              // burn the delta; the cursor now sits at the page's end

    // (a) ARM, THEN PRESS ANOTHER CHIP. Ask 1's button names no selection, so
    // ask 1's press must not inherit ask 4's payload.
    await selectStretch(app, '.forward-only-editor', STRETCH);
    await pressAsk(app, 'stretch');       // arms
    await pressAsk(app, 'drag');          // must DISARM — its own button names nothing
    await sendComposer(app);
    const disarmed = await lastTutorBody(app);
    ok('S5 (PER-PRESS CONSENT): arming TD4 and then pressing a different chip sends NO selection — ask 1\'s naming cannot consent for ask 4\'s wire, and here that is a mechanism rather than a promise',
      !!disarmed && !('selection' in disarmed) && disarmed.messages[disarmed.messages.length - 1].text === ASKS[0],
      JSON.stringify({ keys: Object.keys(disarmed || {}), last: disarmed && disarmed.messages[disarmed.messages.length - 1].text }));

    // (b) ONE PRESS FUNDS ONE SEND. Arm, send (it rides), then send a typed
    // question — the second send must carry nothing.
    await selectStretch(app, '.forward-only-editor', STRETCH);
    await pressAsk(app, 'stretch');
    await sendComposer(app);
    const rode = await lastTutorBody(app);
    ok('S5 (precondition): the armed selection rode on its own send',
      !!rode && rode.selection === STRETCH, JSON.stringify({ selection: rode && rode.selection }));
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('And a second question, typed.');
    await sleep(200);
    await sendComposer(app);
    const second = await lastTutorBody(app);
    ok('S5 ("ONLY THEN"): the very next send carries NO selection — one press funds exactly one send, and the arm cannot be spent twice',
      !!second && !('selection' in second) && second.messages[second.messages.length - 1].text === 'And a second question, typed.',
      JSON.stringify({ keys: Object.keys(second || {}), last: second && second.messages[second.messages.length - 1].text }));
  }

  // ==========================================================================
  // S6 — THE DISCLOSURE. v4 leads, v3 stands verbatim beneath, the ack writes 4.
  // ==========================================================================
  {
    await freshProsePage(app, 1400, 900, { skipDisclosure: false });
    const v4Lex = await lex(app, 'tutorDisclosureBodyV4');
    const v3Lex = await lex(app, 'tutorDisclosureBodyV3');
    ok('S6: the lexicon\'s v4 body IS the ratified sentence, byte-exact against its own committee manifest (1 sentence, 183 bytes, md5 9287082c0e3c0a2b243c71ce01c89b43)',
      v4Lex === DISCLOSURE_V4, JSON.stringify({ lexicon: v4Lex, required: DISCLOSURE_V4 }));

    ok('S6 (precondition): a genuinely fresh device has acknowledged nothing',
      (await app.evalJs("localStorage.getItem('wrizo-tutor-disclosure-seen-version')")) === null);
    await openTutor(app);
    const shape = await app.evalJs(`(() => {
      const modal = document.querySelector('.wz-tutor-disclosure');
      const ann = document.querySelector('.wz-tutor-disclosure-annotation');
      const body = document.querySelector('.wz-tutor-disclosure-body');
      return {
        shown: !!modal,
        annotation: ann ? ann.textContent : null,
        body: body ? body.textContent : null,
        annotationLeads: !!(ann && body && (ann.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING)),
      };
    })()`);
    ok('S6: it shows on the first-ever open, and v4\'s sentence renders BYTE-EXACT',
      shape.shown === true && shape.annotation === DISCLOSURE_V4, JSON.stringify(shape));
    ok('S6 (ANNOTATION FORM): v4 LEADS and v3 stands VERBATIM BENEATH it — v3\'s own string, unedited and uncopied, still carried exactly',
      shape.annotationLeads === true && shape.body === v3Lex, JSON.stringify({ leads: shape.annotationLeads, body: shape.body }));
    await app.evalJs("document.querySelector('.wz-tutor-disclosure-ack').click()");
    await sleep(250);
    ok('S6: the ack dismisses it and writes the CURRENT version (4) under the version key',
      (await app.evalJs("!document.querySelector('.wz-tutor-disclosure')"))
      && (await app.evalJs("localStorage.getItem('wrizo-tutor-disclosure-seen-version')")) === '4');
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()"); await sleep(200);
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()"); await sleep(300);
    ok('S6: and it does NOT reappear on the second open — exactly once',
      (await app.evalJs("!document.querySelector('.wz-tutor-disclosure')")));

    // A v3-ACKNOWLEDGED DEVICE — every writer who has already used the Tutor.
    await freshDesk(app, 1400, 900, { skipDisclosure: false });
    await app.evalJs("localStorage.setItem('wrizo-tutor-disclosure-seen-version', '3')");
    await app.reload();
    await app.goto('/project/new');
    await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject (v3-seeded)' });
    await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
    await app.click('Start writing');
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor (v3-seeded)' });
    await sleep(400);
    await openTutor(app);
    const v3Seeded = await app.evalJs("document.querySelector('.wz-tutor-disclosure-annotation')?.textContent ?? null");
    ok('S6 (v3-acknowledged device): 3 < 4, so v4 STILL shows exactly once, with its own sentence — no bespoke branch, just the integer compare',
      v3Seeded === DISCLOSURE_V4, JSON.stringify({ v3Seeded }));
    await app.evalJs("document.querySelector('.wz-tutor-disclosure-ack').click()"); await sleep(250);
    ok('S6 (v3-acknowledged device): the ack advances the version to 4',
      (await app.evalJs("localStorage.getItem('wrizo-tutor-disclosure-seen-version')")) === '4');
  }

  // ==========================================================================
  // S7 — GEOMETRY. Paper never reflows for chrome, at both reference widths.
  // ==========================================================================
  {
    for (const [w, h] of [[1100, 900], [1366, 768]]) {
      await freshProsePage(app, w, h);
      await switchMode(app, 'Draft');
      await sleep(300);
      const closed = await rectOf(app, '.mode-pagecol');
      await openTutor(app);
      const st = await rosterState(app);
      const open = await rectOf(app, '.mode-pagecol');
      ok(`S7 @ ${w}x${h}: the roster renders with the panel open`,
        st.rosterPresent === true && st.labels.length === 4, JSON.stringify({ roster: st.rosterPresent, n: st.labels.length }));
      ok(`S7 @ ${w}x${h} (PAPER NEVER REFLOWS FOR CHROME): the paper's own rectangle is IDENTICAL with the panel closed and with it open carrying the four chips — the chip row changes no measurement, and FX18's regime is untouched`,
        !!closed && !!open && JSON.stringify(closed) === JSON.stringify(open), JSON.stringify({ closed, open }));
    }
  }

  // ==========================================================================
  // S8 — A13: the wall. A press can never put a byte on a writing surface.
  // ==========================================================================
  {
    await draftPageWithText(app);
    const pageId = await app.evalJs("location.hash.split('/page/')[1]");
    const pageBefore = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
    const storedBefore = (await rawEntry(app, pageId))?.text;
    await selectStretch(app, '.forward-only-editor', STRETCH); // so TD4 is pressable too

    for (const id of ASK_IDS) {
      await pressAsk(app, id);
      const pageNow = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
      ok(`S8 (A13) [${id}]: pressing the chip never changes the page's own text — a staged ask addresses the Tutor's own composer and has no path to the paper`,
        pageNow === pageBefore, JSON.stringify({ pageBefore, pageNow }));
    }
    await sleep(400);
    const storedAfter = (await rawEntry(app, pageId))?.text;
    ok('S8 (A13): and the persisted page entry is byte-identical after the whole roster has been pressed, TD4 included',
      storedBefore === storedAfter, JSON.stringify({ storedBefore, storedAfter }));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// ITEM 84b parks nothing OF ITS OWN — it is the successor file. The assertions
// this ticket parked live in the files that own them: item84.mjs (the deck
// phase's Draft-panel-carries-no-roster check) and tu1/tu2/tu5 (the disclosure
// version-NUMBER checks the 3 -> 4 bump superseded). See this file's own header
// park sweep.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nITEM84B PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; item84b.mjs parks nothing of its own (it is the successor: see item84.mjs, tu1.mjs, tu2.mjs and tu5.mjs for the checks this ticket parked).`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nITEM84B VERIFY: PASS (${checks.length} checks)` : `\nITEM84B VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
