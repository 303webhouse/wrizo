// TUTOR-DRAWER-PROBE (Fable, fast lane, after tutor-drawer-mirror @ 45693124)
// - a READ-ONLY dump, not a verify-checks file. Bug 2 ("the open tab shows
// brass, should be olive") is FIXED directly, in index.css/DrawerTabs.tsx -
// this round 1's own dump confirmed it live (measured rgb(255,152,0)) and
// Fable's own word ("make it olive now") closed it without needing a
// second round of guessing. Bug 1 ("the '-' arrow tab sits inside the
// TUTOR tab") is still open: the anchor-position algebra by hand never
// confidently matched the described symptom, and this lane has no box turn
// to look at the live DOM directly. Rather than guess a fix from a theory
// that already failed once this arc (scrollbar-minimal's fonts.ready
// lead), this script DUMPS what the live page actually measures: the
// grip's own rect + its full parent chain, the glyph's own rect + the
// stylesheet rule that governs IT specifically (walking its own ancestor
// chain, since the glyph carries no color rule of its own - see
// matchingRulesJs's own header below), and the TUTOR tab's computed
// colour/border plus every matching rule at every ancestor level.
//
// ROUND 2 (Fable, on round 1's own output) - two bugs in the PROBE, fixed
// here: `rectAndChainJs(...)` calls that were never passed through
// app.evalJs(...) (so selfAndParents/glyph printed raw JS source text
// instead of evaluating it), and matchingRulesJs scoped to the glyph alone
// (which owns no color rule, so always reported empty - see each fix's own
// header comment for the full account).
//
// No assertions, no PASS/FAIL, no exit code - prints one JSON object and
// exits 0. Chat 1 runs it and posts the output; the fix for bug 1 comes
// from reading THIS, not from re-guessing the algebra a second time.
// Run: node scripts/harness/tutor-drawer-probe.mjs   (from apps/desktop, dist-web freshly built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mouse = (app, type, x, y, clickCount, buttons) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount, pointerType: 'mouse' });
const click = async (app, p, clickCount = 1) => {
  await mouse(app, 'mouseMoved', p.x, p.y, 0, 0);
  await mouse(app, 'mousePressed', p.x, p.y, clickCount, 1);
  await mouse(app, 'mouseReleased', p.x, p.y, clickCount, 0);
};
const centerOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
  const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);

// ROUND 2 (Fable, Oct 15, on the first run's output) - two bugs in this
// probe itself, not in the page it was measuring:
//
// (1) selfAndParents/glyph printed SOURCE TEXT. rectAndChainJs/
//     matchingRulesJs below are plain string-builders - they return the JS
//     EXPRESSION to evaluate, not its result. Every call site must pass that
//     string THROUGH app.evalJs(...); four call sites in the walk further
//     down read `await rectAndChainJs(...)` directly, which just awaits a
//     plain string (a no-op) and stores the source text itself. Fixed by
//     wrapping every one of them in app.evalJs(...) - the fix is at the call
//     sites, not in these two builders, which were already correct.
//
// (2) EMPTY RULE LISTS for the glyph specifically. `.wz-tutor-grip-glyph`
//     carries no CSS rule of its own at all (index.css: `.wz-tutor-grip-
//     glyph{ font-size:13px; line-height:1; }` - no color) - its "‹" reads
//     whatever colour it INHERITS from its parent button, which a rule-
//     matching probe scoped to the glyph element alone can never find by
//     definition, selector games aside. matchingRulesJs now walks the
//     element's own ancestor chain (same depth as rectAndChainJs) and
//     reports which rules match AT EACH LEVEL, labelled by how far up that
//     level sits - so "the arrow" resolves to its OWN governing rule,
//     wherever in the chain that rule actually lives.
const matchingRulesJs = (sel, props, depth = 4) => `(() => {
  const start = document.querySelector(${JSON.stringify(sel)}); if (!start) return null;
  const props = ${JSON.stringify(props)};
  const matchesAt = (el) => {
    const hits = [];
    for (let si = 0; si < document.styleSheets.length; si++) {
      let rules; try { rules = document.styleSheets[si].cssRules; } catch { continue; }
      const walk = (list) => {
        for (const rule of list) {
          if (rule.cssRules) { walk(rule.cssRules); continue; } // @media etc.
          if (!rule.selectorText || !rule.style) continue;
          let m = false; try { m = el.matches(rule.selectorText); } catch { continue; }
          if (!m) continue;
          const decl = props.filter((p) => rule.style.getPropertyValue(p));
          if (decl.length) hits.push({ sheet: document.styleSheets[si].href || '(inline)', selector: rule.selectorText,
            declares: Object.fromEntries(decl.map((p) => [p, rule.style.getPropertyValue(p)])) });
        }
      };
      walk(rules);
    }
    return hits;
  };
  const byLevel = []; let node = start;
  for (let i = 0; i < ${depth} && node; i++) {
    byLevel.push({ level: i, tag: node.tagName.toLowerCase(), className: node.className || null, matches: matchesAt(node) });
    node = node.parentElement;
  }
  return byLevel;
})()`;

const rectAndChainJs = (sel, depth) => `(() => {
  const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
  const describe = (node) => {
    const r = node.getBoundingClientRect();
    const cs = getComputedStyle(node);
    return {
      tag: node.tagName.toLowerCase(), id: node.id || null, className: node.className || null,
      rect: { top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) },
      computed: { position: cs.position, top: cs.top, right: cs.right, bottom: cs.bottom, left: cs.left, zIndex: cs.zIndex, transform: cs.transform, color: cs.color },
    };
  };
  const chain = []; let node = el;
  for (let i = 0; i < ${depth} && node; i++) { chain.push(describe(node)); node = node.parentElement; }
  return chain;
})()`;

const freshBoard = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the dump below still runs */ }
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({
    id: 'tdp-board', text: 'Tutor drawer probe board', pageType: 'board', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z',
    boxes: [
      { id: 'tdp-a', kind: 'text', x: 0.06, y: 0.08, w: 0.2, h: 0.14, z: 1, text: 'Card A' },
      { id: 'tdp-b', kind: 'text', x: 0.3, y: 0.3, w: 0.2, h: 0.14, z: 2, text: 'Card B' },
    ],
  })})`);
  await sleep(400);
  await app.evalJs("location.hash = '#/page/tdp-board'");
  await app.waitFor("!!document.querySelector('[data-box-id=\"tdp-a\"]')", { label: 'the board cards' });
  await sleep(400);
};

await withHarness(async (app) => {
  const dump = {};
  for (const [theme, label] of [[null, 'plateau'], ['flux', 'flux']]) {
    await freshBoard(app);
    if (theme) { await app.evalJs(`window.wrizoTheme.set('${theme}')`); await sleep(200); }

    // open the drawer with a real click, same as the product's own gesture
    const gripPt = await centerOf(app, '.wz-tutor-grip');
    let opened = false;
    if (gripPt) {
      await click(app, gripPt, 1);
      try { await app.waitFor("document.querySelector('.wz-tutor-grip')?.getAttribute('data-open') === 'true'", { label: 'tutor open', timeout: 3000 }); opened = true; } catch { /* recorded below */ }
    }
    await sleep(300); // panel's own fade transition

    dump[label] = {
      opened,
      grip: {
        selfAndParents: await app.evalJs(rectAndChainJs('.wz-tutor-grip', 6)),
        glyph: await app.evalJs(rectAndChainJs('.wz-tutor-grip-glyph', 1)),
        matchingColorRulesByLevel: await app.evalJs(matchingRulesJs('.wz-tutor-grip-glyph', ['color'])),
      },
      tutorTab: {
        selfAndParents: await app.evalJs(rectAndChainJs('#wz-tutor-tab-tutor', 3)),
        dataOn: await app.evalJs("document.querySelector('#wz-tutor-tab-tutor')?.getAttribute('data-on') ?? null"),
        computed: await app.evalJs(`(() => { const el = document.querySelector('#wz-tutor-tab-tutor'); if (!el) return null; const cs = getComputedStyle(el);
          return { color: cs.color, borderTopColor: cs.borderTopColor, borderBottomColor: cs.borderBottomColor, borderLeftColor: cs.borderLeftColor, borderRightColor: cs.borderRightColor,
            borderStyle: cs.borderStyle, borderWidth: cs.borderWidth, background: cs.backgroundColor }; })()`),
        matchingRulesByLevel: await app.evalJs(matchingRulesJs('#wz-tutor-tab-tutor', ['color', 'border-color', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color', 'border'])),
      },
      // the reported symptom, directly: do the grip's rect and the TUTOR
      // tab's rect actually overlap on screen?
      overlap: await app.evalJs(`(() => {
        const g = document.querySelector('.wz-tutor-grip'), t = document.querySelector('#wz-tutor-tab-tutor');
        if (!g || !t) return null;
        const gr = g.getBoundingClientRect(), tr = t.getBoundingClientRect();
        const ix = Math.max(0, Math.min(gr.right, tr.right) - Math.max(gr.left, tr.left));
        const iy = Math.max(0, Math.min(gr.bottom, tr.bottom) - Math.max(gr.top, tr.top));
        return { grip: { left: Math.round(gr.left), top: Math.round(gr.top), right: Math.round(gr.right), bottom: Math.round(gr.bottom) },
          tutorTab: { left: Math.round(tr.left), top: Math.round(tr.top), right: Math.round(tr.right), bottom: Math.round(tr.bottom) },
          intersects: ix > 0 && iy > 0, intersectArea: Math.round(ix * iy) };
      })()`),
    };
  }

  console.log(JSON.stringify(dump, null, 2));
  console.log('\nTUTOR-DRAWER-PROBE: dump complete, no assertions - read above, do not grep for VERIFY.');
});
