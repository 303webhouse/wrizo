// Page side of visual-1a-touch.mjs: measures every INK tool as a finger meets it. Reads only; it presses nothing but the tab's own openers (Studio, a row, the brush list, the own-colour door).
(() => {
  const q = (s) => document.querySelector(s);
  const all = (s) => [...document.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const press = async (s) => { const el = q(s); if (!el) return false; el.click(); await sleep(400); return true; };
  const TOOLS = '.wz-ink-tab button, .wz-ink-tab input, .ink-undo';
  const shown = () => all(TOOLS).filter((el) => el.getClientRects().length > 0);
  const label = (el) => (el.getAttribute('data-ink-row') || el.getAttribute('data-recent-tip') || el.getAttribute('aria-label') || el.textContent.trim() || el.className).slice(0, 28) + ' .' + String(el.className).split(' ').filter((c) => c.startsWith('wz-') || c.startsWith('reorg-') || c === 'ink-undo' || c.startsWith('mode-swatch')).join('.');

  const measure = async (state, out, sheetSel) => {
    const panel = q('.wz-sliver-panel');
    for (const el of shown()) {
      const key = label(el);
      // a finger first scrolls it into view: to the drawer's foot, clear of the face that stays at the top
      el.scrollIntoView({ block: 'end', inline: 'nearest' });
      await sleep(30);
      const r = el.getBoundingClientRect();
      out.names.add(key);
      if (el.classList.contains('ink-undo')) out.undo = true;
      if (r.width < 43.5 || r.height < 43.5) out.small.push(`${state}: ${key} ${r.width.toFixed(0)}x${r.height.toFixed(0)}`);
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const hit = document.elementFromPoint(x, y);
      if (!hit || !(el === hit || el.contains(hit))) out.unreached.push(`${state}: ${key} under ${hit ? String(hit.className).slice(0, 30) || hit.tagName : 'nothing'}`);
      if (r.left < -0.5 || r.right > window.innerWidth + 0.5) out.wide.push(`${state}: ${key} off screen ${r.left.toFixed(0)}-${r.right.toFixed(0)}`);
      if (panel && panel.contains(el)) { const p = panel.getBoundingClientRect(); if (r.left < p.left - 1 || r.right > p.right + 1) out.wide.push(`${state}: ${key} outside the drawer ${r.left.toFixed(0)}-${r.right.toFixed(0)} of ${p.left.toFixed(0)}-${p.right.toFixed(0)}`); }
    }
    if (panel) {
      if (panel.scrollWidth > panel.clientWidth + 1) out.wide.push(`${state}: drawer scrolls sideways ${panel.scrollWidth}>${panel.clientWidth}`);
      const sheet = q(sheetSel);
      const ph = panel.getBoundingClientRect().height, sh = sheet ? sheet.getBoundingClientRect().height : 0;
      if (!sheet || ph > sh + 1) out.tall.push(`${state}: drawer ${ph.toFixed(0)} against sheet ${sh.toFixed(0)}`);
      panel.scrollTop = 0;
    }
    if (document.documentElement.scrollWidth > window.innerWidth + 1) out.wide.push(`${state}: the window scrolls sideways`);
  };

  const walk = async (surface) => {
    const sheetSel = surface === 'board' ? '.board-canvas-wrap' : '.mode-page';
    const out = { names: new Set(), small: [], unreached: [], wide: [], tall: [], undo: false };
    const v = window.__vi;
    await v.setStudio(false);
    await measure('face', out, sheetSel);
    await v.setStudio(true);
    await measure('studio', out, sheetSel);
    await press('.wz-ink-brush');
    await measure('brush list', out, sheetSel);
    await press('.wz-ink-brush');
    await v.openRow('brushes');
    await measure('brushes', out, sheetSel);
    await v.openRow('colour');
    await press('.wz-ink-custom-open');
    await measure('colour', out, sheetSel);
    await v.setStudio(false);
    return { seen: out.names.size, undo: out.undo, small: [...new Set(out.small)], unreached: [...new Set(out.unreached)], wide: [...new Set(out.wide)], tall: [...new Set(out.tall)] };
  };

  const size = (s) => { const el = q(s); if (!el) return { w: -1, h: -1 }; const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
  const mouse = () => ({ coarse: matchMedia('(pointer: coarse)').matches, down: size('.wz-ink-size-down'), dot: size('.wz-ink-swatch'), studio: size('.wz-ink-studio'), undo: size('.ink-undo') });

  window.__vit = { walk, mouse };
})();
