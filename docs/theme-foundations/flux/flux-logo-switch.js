// MOCKUP ONLY — the Wrizo logo in the Flux mockups, with a switch between the two finalists from flux-logo-mockups.html:
//   TERMINAL   - the Flux WRIZO letters (Rajdhani 700, tracked), the O a solid orange block cursor
//   HAND-DRAWN - the founding hand-drawn mark recoloured as cyan signal, the scribbled o replaced by the cursor
// It puts the mark at the left of the top bar (where Flux's wordmark lives in the app) and plays a short "jack in" splash with the mark large on load.
// The choice is remembered across the mockup files (localStorage), and ?logo=hand / ?logo=terminal in the address forces one.
(function () {
  const KEY = 'flux-mock-logo';
  const PNG = '../../../apps/desktop/public/brand/wrizo-logo.png';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = `
  .logo-wrap{display:flex;align-items:center;gap:12px;margin-right:6px}
  .logo{display:inline-flex;align-items:center;cursor:default}
  .logo .lt{font-family:'Rajdhani','Arial Narrow',sans-serif;font-weight:700;letter-spacing:.32em;color:#E8F6FA;text-shadow:.04em 0 0 rgba(0,194,255,.45);line-height:1}
  .logo .lc{display:inline-block;background:#FF9800}
  .logo canvas{display:block}
  .logo-cur{animation:fluxLogoBlink 1.05s steps(1,end) infinite}
  @keyframes fluxLogoBlink{0%,49%{opacity:1}50%,100%{opacity:0}}
  .logo-sw{display:inline-flex;border:1px solid #244D7C}
  .logo-sw button{background:none;border:0;border-left:1px solid #244D7C;color:#7EB4C4;font:600 10.5px 'Rajdhani',sans-serif;letter-spacing:.18em;text-transform:uppercase;padding:4px 8px;cursor:pointer}
  .logo-sw button:first-child{border-left:0}
  .logo-sw button[aria-pressed="true"]{color:#00C2FF;background:rgba(0,194,255,.10)}
  .logo-sw button:hover{color:#E8F6FA}
  #logoSplash{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:18px;background:rgba(1,8,17,.92);transition:opacity .6s ease;pointer-events:none}
  #logoSplash.out{opacity:0}
  #logoSplash small{font:600 12px 'Rajdhani',sans-serif;letter-spacing:.4em;color:#7EB4C4}
  @media (prefers-reduced-motion:reduce){ .logo-cur{animation:none} }`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const qp = new URLSearchParams(location.search).get('logo');
  let choice = qp === 'hand' || qp === 'terminal' ? qp : (() => { try { return localStorage.getItem(KEY) || 'terminal'; } catch (_) { return 'terminal'; } })();
  const img = new Image(); img.src = PNG;
  const ready = new Promise((r) => { img.onload = r; img.onerror = r; });

  // render the mark at a given height (px) into an element
  function render(el, h) {
    el.innerHTML = ''; el.style.height = ''; el.style.overflow = '';
    if (choice === 'terminal') {
      const t = document.createElement('span'); t.className = 'lt'; t.textContent = 'WRIZ'; t.style.fontSize = h + 'px';
      const c = document.createElement('span'); c.className = 'lc logo-cur'; c.style.width = (h * .62) + 'px'; c.style.height = (h * .74) + 'px'; c.style.marginLeft = (h * .02) + 'px'; c.style.alignSelf = 'flex-end'; c.style.marginBottom = (h * .12) + 'px';
      el.style.alignItems = 'flex-end'; el.append(t, c); return;
    }
    el.style.alignItems = 'flex-start'; el.style.height = h + 'px'; el.style.overflow = 'visible';
    const cv = document.createElement('canvas'), c = document.createElement('span'); c.className = 'lc logo-cur';
    const H = h * 2.1;                                        // the drawing is tall: its letters sit in a band at ~30-55% of its height, the z's loop hangs below
    const mt = h / 2 - .42 * H;                               // centre that letter band on the element's centre line
    el.append(cv, c);
    ready.then(() => {
      if (!img.naturalWidth) return;
      const keep = .77, sw = img.naturalWidth * keep, sh = img.naturalHeight, k = 2, w = Math.round(H * sw / sh);
      cv.width = w * k; cv.height = H * k; cv.style.width = w + 'px'; cv.style.height = H + 'px'; cv.style.marginTop = mt + 'px';
      const x = cv.getContext('2d');
      const pass = (color, dx) => { const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; const ox = o.getContext('2d'); ox.drawImage(img, 0, 0, sw, sh, 0, 0, o.width, o.height); ox.globalCompositeOperation = 'source-in'; ox.fillStyle = color; ox.fillRect(0, 0, o.width, o.height); x.drawImage(o, dx * k, 0); };
      pass('rgba(166,255,61,.45)', Math.max(1, H / 90)); pass('#00C2FF', 0);
      c.style.width = (H * .17) + 'px'; c.style.height = (H * .25) + 'px'; c.style.marginLeft = (H * .03) + 'px'; c.style.marginTop = (mt + H * .31) + 'px';
    });
  }

  // the top-bar mark + the switch
  const top = document.getElementById('top');
  const wrap = document.createElement('div'); wrap.className = 'logo-wrap';
  wrap.innerHTML = '<span class="logo" id="logoMark" aria-label="Wrizo"></span><span class="logo-sw" role="group" aria-label="Logo option"><button data-l="terminal">Terminal</button><button data-l="hand">Hand-drawn</button></span>';
  top.insertBefore(wrap, top.firstChild);
  const mark = wrap.querySelector('#logoMark');
  function sync() {
    render(mark, choice === 'terminal' ? 17 : 22);
    wrap.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === choice)));
  }
  wrap.querySelectorAll('button').forEach((b) => b.onclick = () => { choice = b.dataset.l; try { localStorage.setItem(KEY, choice); } catch (_) {} sync(); splash(900); });
  sync();

  // the jack-in splash: the mark large, then the surface
  function splash(ms) {
    if (reduced) return;
    let s = document.getElementById('logoSplash'); if (s) s.remove();
    s = document.createElement('div'); s.id = 'logoSplash';
    const m = document.createElement('span'); m.className = 'logo'; s.appendChild(m);
    const cap = document.createElement('small'); cap.textContent = 'JACKING IN'; s.appendChild(cap);
    if (choice === 'hand') cap.style.marginTop = '120px';     // clear of the z's hanging loop
    document.body.appendChild(s); render(m, choice === 'terminal' ? 92 : 110);
    setTimeout(() => s.classList.add('out'), ms); setTimeout(() => s.remove(), ms + 700);
  }
  window.fluxLogo = { set: (l) => { choice = l; sync(); }, splash, get: () => choice };
  splash(1300);
})();
