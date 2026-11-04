// FLUX3 - THE DRAWING LAYER (S1 prep, Fable Nov 4). One layer under the Schema's nodes draws the links, the electrons and the ground
// (flux-rulings-oct31.md q1: nodes stay real DOM, one drawing layer underneath, canvas 2D, no WebGL; q11: the motion budget).
// Fable's three rules for it (Oct 31, after S0):
//   1. DAMPING = HOLD THE STILL FRAME. While keys land, a pointer is held (a drag) or the view zooms/pans, the layer makes ZERO draw calls.
//      A view change in that time moves the held frame with a CSS transform (no draw); the real redraw waits until the writer settles.
//   2. THE FRAME BUDGET IS AN INTERVAL. At rest, the median frame interval stays within 10% of the control's, on the box.
//   3. The layer carries data-flux3-layer, and it pauses (no frame loop at all) while the window is hidden.
// Every motion has a still frame: reduced motion, or motion switched off, draws the links once and stops.
//
// Not mounted anywhere yet: S1 mounts it on the Schema, behind ?flux3=1, after #13's BoardEditor split (step 10g). Plain DOM and canvas,
// no React and no app imports, so the board drives it through four calls: setView, setScene, setOptions, lightLink.
//
// WHY IT DRAWS LIGHTER THAN S0'S STAND-IN (which redrew a full-screen ground, 300 dashed traces and 120 blurred electrons every frame and
// cost +16% frame interval on the box):
//   - the ground (grid and circuitry) is drawn once per view, size or tone into its own canvas, never per frame; its fill and glow are CSS;
//   - the moving parts draw at 30 Hz into a second canvas only as big as the links' box;
//   - the strokes are batched (one path for the resting links, one for the selected node's), and no shadowBlur is used per frame:
//     the electron's glow is a sprite drawn once;
//   - the ground's current is occasional: at most three pulses at a time, on traces inside the links' box.

export type FluxTone = 'dark' | 'light';
/** A node in board coordinates (the same rect the card has on the board). */
export interface FluxNode { id: string; x: number; y: number; w: number; h: number }
export interface FluxLink { a: string; b: string }
/** Board -> layer: layerX = boardX * s + tx (the layer's own top-left is 0,0). */
export interface FluxView { tx: number; ty: number; s: number }
export interface FluxScene { nodes: FluxNode[]; links: FluxLink[]; selected?: string | null }
export interface FluxLayerOptions {
  tone: FluxTone;
  /** All motion (the dashes, the electrons, the current). Off = the still frame. */
  motion: boolean;
  /** The electrons on the selected node's links. */
  electrons: boolean;
  /** The ground's occasional current. */
  current: boolean;
}
export interface FluxLayerStats {
  state: 'running' | 'held' | 'paused' | 'still' | 'destroyed';
  motionFrames: number;
  groundDraws: number;
  box: { x: number; y: number; w: number; h: number };
  view: FluxView;
}

const BUSY_MS = 600;          // after the last key, wheel or pointer release, the layer stays still this long
const FRAME_MS = 1000 / 30;   // the motion's rate
const FLASH_MS = 1100;        // a new link lights up, then settles
const FLASH_GAP_MS = 334;     // never more than 3 flashes a second
const GRID = 40;              // the ground's finest grid, in board units
const PAD = 12;               // the motion box's margin (an electron's half-width and its glow)
const MAX_PULSES = 3;
const DPR_CAP = 2;

const TONES: Record<FluxTone, { ground: string; glow: string; grid: string; trace: string; end: string; link: string; hot: string; flash: string; cyan: string }> = {
  dark: {
    ground: '#020c10',
    glow: 'radial-gradient(70% 60% at 50% 48%, rgba(8,40,72,.45), rgba(2,12,16,0) 70%)',
    grid: '29,74,82', trace: '42,106,118', end: '87,208,245',
    link: 'rgba(0,194,255,.36)', hot: 'rgba(0,194,255,.75)', flash: '166,240,255', cyan: '#00C2FF',
  },
  light: {
    ground: '#F7FAFA',
    glow: 'radial-gradient(70% 60% at 50% 48%, rgba(0,194,255,.05), rgba(247,250,250,0) 70%)',
    grid: '143,169,174', trace: '143,169,174', end: '0,150,200',
    link: 'rgba(0,194,255,.55)', hot: 'rgba(0,194,255,.95)', flash: '0,194,255', cyan: '#00C2FF',
  },
};

type Pt = [number, number];
interface Route { a: string; b: string; pts: Pt[]; len: number; hot: boolean; phase: number }
interface Pulse { pts: Pt[]; len: number; t0: number; dur: number }

// a stable hash in [0,1): the ground's circuitry is the same every time the same part of the board is drawn
function rnd(a: number, b: number, c: number): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) % 100000) / 100000;
}
function strHash(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}
function lengthOf(pts: Pt[]): number {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
  return L;
}
function along(pts: Pt[], len: number, f: number): Pt {
  let d = f * len;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
    if (d <= seg) {
      const u = seg ? d / seg : 0;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
    }
    d -= seg;
  }
  return pts[pts.length - 1];
}
// square to square: from the facing side's middle, across, and in (the mockup's route); steps out and back when the nodes overlap in x
function route(A: FluxNode, B: FluxNode): Pt[] {
  const right = B.x + B.w / 2 >= A.x + A.w / 2;
  const ax = right ? A.x + A.w : A.x, ay = A.y + A.h / 2;
  const bx = right ? B.x : B.x + B.w, by = B.y + B.h / 2;
  const out = right ? 26 : -26;
  if (right ? bx - ax >= 52 : ax - bx >= 52) { const m = (ax + bx) / 2; return [[ax, ay], [m, ay], [m, by], [bx, by]]; }
  const my = (ay + by) / 2 + (Math.abs(ay - by) < 40 ? 90 : 0);
  return [[ax, ay], [ax + out, ay], [ax + out, my], [bx - out, my], [bx - out, by], [bx, by]];
}
// one piece of the ground's circuitry inside a cell (board units)
function circuit(cx: number, cy: number, lvl: number, i: number, cell: number): Pt[] {
  const r = (n: number) => rnd(cx * 13 + n, cy * 7 + i, lvl);
  const x0 = (cx + r(1)) * cell, y0 = (cy + Math.round(r(2) * 4) / 4) * cell;
  const x1 = (cx + r(3)) * cell, y1 = (cy + Math.round(r(4) * 4) / 4) * cell;
  const mx = (cx + Math.round(r(5) * 4) / 4) * cell;
  return r(6) < 0.5 ? [[x0, y0], [mx, y0], [mx, y1], [x1, y1]] : [[x0, y0], [x0, (y0 + y1) / 2], [x1, (y0 + y1) / 2], [x1, y1]];
}

export class FluxLayer {
  readonly el: HTMLDivElement;
  private readonly wrap: HTMLDivElement;
  private readonly gcv: HTMLCanvasElement;
  private readonly mcv: HTMLCanvasElement;
  private readonly g: CanvasRenderingContext2D;
  private readonly m: CanvasRenderingContext2D;
  private readonly sprite: HTMLCanvasElement;
  private readonly mq: MediaQueryList | null;
  private readonly ro: ResizeObserver | null;

  private opts: FluxLayerOptions;
  private view: FluxView = { tx: 0, ty: 0, s: 1 };
  private drawnView: FluxView = { tx: 0, ty: 0, s: 1 };
  private scene: FluxScene = { nodes: [], links: [], selected: null };
  private W = 0;
  private H = 0;
  private dpr = 1;
  private groundDirty = true;
  private sceneDirty = true;
  private routes: Route[] = [];
  private traces: Pt[][] = [];
  private boxTraces: Pt[][] = [];
  private box = { x: 0, y: 0, w: 0, h: 0 };
  private pulses: Pulse[] = [];
  private nextPulseAt = 0;
  private seed = 1;
  private flashes: { a: string; b: string; t0: number }[] = [];
  private flashQueue: { a: string; b: string }[] = [];
  private lastFlashAt = -1e9;

  private state: FluxLayerStats['state'] = 'held';
  private raf = 0;
  private settleTimer = 0;
  private held = false;
  private busyUntil = 0;
  private lastTick = 0;
  private lastDraw = -1e9;
  private clock = 0;
  private motionFrames = 0;
  private groundDraws = 0;

  constructor(host: HTMLElement, options: Partial<FluxLayerOptions> = {}) {
    this.opts = { tone: 'dark', motion: true, electrons: true, current: true, ...options };
    const el = document.createElement('div');
    el.setAttribute('data-flux3-layer', '');
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;contain:strict;';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;left:0;top:0;transform-origin:0 0;';
    const gcv = document.createElement('canvas');
    gcv.style.cssText = 'position:absolute;left:0;top:0;';
    const mcv = document.createElement('canvas');
    mcv.style.cssText = 'position:absolute;left:0;top:0;';
    wrap.append(gcv, mcv);
    el.append(wrap);
    host.prepend(el);
    this.el = el; this.wrap = wrap; this.gcv = gcv; this.mcv = mcv;
    this.g = gcv.getContext('2d') as CanvasRenderingContext2D;
    this.m = mcv.getContext('2d') as CanvasRenderingContext2D;
    this.sprite = this.makeSprite();
    this.paintTone();

    this.mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    this.mq?.addEventListener?.('change', this.onReduced);
    this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(this.onResize) : null;
    this.ro?.observe(el);
    // the writer's acts, wherever they land (capture, passive: the layer only listens)
    window.addEventListener('keydown', this.onActivity, true);
    window.addEventListener('beforeinput', this.onActivity, true);
    window.addEventListener('wheel', this.onActivity, { capture: true, passive: true });
    window.addEventListener('pointerdown', this.onPointerDown, true);
    window.addEventListener('pointermove', this.onPointerMove, { capture: true, passive: true });
    window.addEventListener('pointerup', this.onPointerUp, true);
    window.addEventListener('pointercancel', this.onPointerUp, true);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.refresh();
  }

  setView(view: FluxView): void {
    this.view = { tx: view.tx, ty: view.ty, s: view.s > 0 ? view.s : 1 };
    this.groundDirty = true; this.sceneDirty = true;
    if (this.damped()) { this.followHeld(); this.hold(); return; }
    this.refresh();
  }

  setScene(scene: FluxScene): void {
    this.scene = { nodes: scene.nodes, links: scene.links, selected: scene.selected ?? null };
    this.sceneDirty = true;
    if (this.damped()) { this.hold(); return; }
    this.refresh();
  }

  setOptions(options: Partial<FluxLayerOptions>): void {
    const tone = this.opts.tone;
    this.opts = { ...this.opts, ...options };
    if (this.opts.tone !== tone) { this.paintTone(); this.groundDirty = true; }
    this.sceneDirty = true;
    if (this.damped()) { this.hold(); return; }
    this.refresh();
  }

  /** A link just made: it lights up once, then settles (none under reduced motion; at most 3 a second). */
  lightLink(a: string, b: string): void {
    this.flashQueue.push({ a, b });
  }

  stats(): FluxLayerStats {
    return { state: this.state, motionFrames: this.motionFrames, groundDraws: this.groundDraws, box: { ...this.box }, view: { ...this.drawnView } };
  }

  destroy(): void {
    this.stopLoop();
    if (this.settleTimer) clearTimeout(this.settleTimer);
    this.settleTimer = 0;
    this.state = 'destroyed';
    window.removeEventListener('keydown', this.onActivity, true);
    window.removeEventListener('beforeinput', this.onActivity, true);
    window.removeEventListener('wheel', this.onActivity, true);
    window.removeEventListener('pointerdown', this.onPointerDown, true);
    window.removeEventListener('pointermove', this.onPointerMove, true);
    window.removeEventListener('pointerup', this.onPointerUp, true);
    window.removeEventListener('pointercancel', this.onPointerUp, true);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.mq?.removeEventListener?.('change', this.onReduced);
    this.ro?.disconnect();
    this.el.remove();
  }

  // ---- the damping gate: the ONE decision every path asks -----------------------------------------------------------------------------------
  private damped(): boolean {
    return this.held || performance.now() < this.busyUntil;
  }

  private onActivity = (): void => {
    this.busyUntil = performance.now() + BUSY_MS;
    this.hold();
  };
  private onPointerDown = (): void => { this.held = true; this.hold(); };
  private onPointerMove = (e: PointerEvent): void => { if (e.buttons) { this.busyUntil = performance.now() + BUSY_MS; this.hold(); } };
  private onPointerUp = (): void => {
    this.held = false;
    this.busyUntil = performance.now() + BUSY_MS;
    this.hold();
  };
  // ---- the hidden-window gate: the ONE decision for pausing -------------------------------------------------------------------------------------
  private hidden(): boolean {
    return typeof document !== 'undefined' && document.hidden;
  }

  private onVisibility = (): void => {
    if (this.hidden()) { this.pause(); return; }
    this.refresh();
  };
  private onReduced = (): void => { this.sceneDirty = true; if (!this.damped()) this.refresh(); };
  private onResize = (): void => {
    this.groundDirty = true; this.sceneDirty = true;
    if (this.damped()) { this.hold(); return; }
    this.refresh();
  };

  private still(): boolean {
    return !this.opts.motion || !!this.mq?.matches;
  }

  /** Busy: stop drawing, keep the frame on screen, and come back when the writer settles. */
  private hold(): void {
    if (!this.damped()) return;
    if (this.state === 'destroyed' || this.state === 'paused') return;
    // the still frame has nothing moving to stop: it holds only when something changed under it
    if (this.state === 'still' && !this.groundDirty && !this.sceneDirty) return;
    this.stopLoop();
    this.state = 'held';
    this.armSettle();
  }

  private armSettle(): void {
    if (this.settleTimer) return;
    const wait = this.held ? 100 : this.busyUntil - performance.now() + 16;
    this.settleTimer = window.setTimeout(() => {
      this.settleTimer = 0;
      if (this.state !== 'held') return;
      if (this.damped()) { this.armSettle(); return; }
      this.refresh();
    }, Math.max(16, wait));
  }

  private pause(): void {
    if (this.state === 'destroyed') return;
    this.stopLoop();
    if (this.settleTimer) clearTimeout(this.settleTimer);
    this.settleTimer = 0;
    this.state = 'paused';
  }

  /** Draw what changed, then run (or stay still). Never while busy, hidden or destroyed. */
  private refresh(): void {
    if (this.state === 'destroyed') return;
    if (this.hidden()) { this.pause(); return; }
    if (this.damped()) { this.state = 'running'; this.hold(); return; }
    if (this.groundDirty) this.drawGround();
    if (this.sceneDirty) this.layoutMotion();
    this.wrap.style.transform = '';
    const still = this.still();
    this.drawMotion(performance.now(), still);
    if (still) { this.stopLoop(); this.state = 'still'; return; }
    this.state = 'running';
    this.startLoop();
  }

  private startLoop(): void {
    if (this.raf) return;
    this.lastTick = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }
  private stopLoop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
  private tick = (now: number): void => {
    this.raf = 0;
    if (this.state !== 'running') return;
    if (this.damped()) { this.hold(); return; }
    this.raf = requestAnimationFrame(this.tick);
    if (now - this.lastDraw < FRAME_MS - 4) return;
    this.drawMotion(now, false);
  };

  // a held frame follows a zoom or a pan as a CSS transform of what is already drawn: no draw call
  private followHeld(): void {
    const d = this.drawnView, v = this.view;
    const k = v.s / d.s;
    this.wrap.style.transform = `translate(${v.tx - d.tx * k}px, ${v.ty - d.ty * k}px) scale(${k})`;
  }

  private paintTone(): void {
    const T = TONES[this.opts.tone];
    this.el.style.background = `${T.glow}, ${T.ground}`;
  }

  private makeSprite(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const x = c.getContext('2d') as CanvasRenderingContext2D;
    x.shadowColor = '#00C2FF'; x.shadowBlur = 8; x.fillStyle = '#00C2FF';
    x.fillRect(11, 11, 10, 10);
    return c;
  }

  // ---- the ground: drawn once per view, size or tone ----------------------------------------------------------------------------------------
  private drawGround(): void {
    const W = Math.max(0, this.el.clientWidth), H = Math.max(0, this.el.clientHeight);
    const dpr = Math.min(DPR_CAP, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
    if (W !== this.W || H !== this.H || dpr !== this.dpr) {
      this.W = W; this.H = H; this.dpr = dpr;
      this.gcv.width = Math.round(W * dpr); this.gcv.height = Math.round(H * dpr);
      this.gcv.style.width = `${W}px`; this.gcv.style.height = `${H}px`;
      this.sceneDirty = true;
    }
    this.groundDirty = false;
    this.groundDraws += 1;
    const g = this.g, v = this.view, T = TONES[this.opts.tone];
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    this.traces = [];
    if (!W || !H) return;
    const wx0 = -v.tx / v.s, wy0 = -v.ty / v.s, wx1 = (W - v.tx) / v.s, wy1 = (H - v.ty) / v.s;
    const k = Math.ceil(Math.log(14 / (GRID * v.s)) / Math.log(8));
    for (let lvl = k; lvl <= k + 1; lvl++) {
      const step = GRID * Math.pow(8, lvl), px = step * v.s;
      if (px < 6) continue;
      const a = Math.min(1, (px - 6) / 90);
      g.strokeStyle = `rgba(${T.grid},${(0.35 * a).toFixed(3)})`;
      g.lineWidth = 1;
      g.beginPath();
      for (let x = Math.floor(wx0 / step) * step; x <= wx1; x += step) { const sx = Math.round(x * v.s + v.tx) + 0.5; g.moveTo(sx, 0); g.lineTo(sx, H); }
      for (let y = Math.floor(wy0 / step) * step; y <= wy1; y += step) { const sy = Math.round(y * v.s + v.ty) + 0.5; g.moveTo(0, sy); g.lineTo(W, sy); }
      g.stroke();
      const cell = step * 4, cpx = cell * v.s;
      if (cpx < 110 || cpx > 2600) continue;
      const ta = Math.min(1, (cpx - 110) / 160) * Math.min(1, (2600 - cpx) / 900);
      g.strokeStyle = `rgba(${T.trace},${(0.55 * ta).toFixed(3)})`;
      g.lineWidth = Math.max(1, Math.min(2.5, cpx / 400));
      g.beginPath();
      const ends: Pt[] = [];
      for (let cx = Math.floor(wx0 / cell); cx <= Math.floor(wx1 / cell); cx++) {
        for (let cy = Math.floor(wy0 / cell); cy <= Math.floor(wy1 / cell); cy++) {
          const n = 1 + Math.floor(rnd(cx, cy, lvl) * 3);
          for (let i = 0; i < n; i++) {
            const pts = circuit(cx, cy, lvl, i, cell).map((p): Pt => [p[0] * v.s + v.tx, p[1] * v.s + v.ty]);
            pts.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
            ends.push(pts[0], pts[pts.length - 1]);
            this.traces.push(pts);
          }
        }
      }
      g.stroke();
      g.fillStyle = `rgba(${T.end},${(0.35 * ta).toFixed(3)})`;
      g.beginPath();
      for (const p of ends) g.rect(p[0] - 2, p[1] - 2, 4, 4);
      g.fill();
    }
    this.drawnView = { ...v };
  }

  // ---- the moving parts: the links' box, the routes, the current's traces --------------------------------------------------------------------
  private layoutMotion(): void {
    this.sceneDirty = false;
    const v = this.view, byId = new Map(this.scene.nodes.map((n) => [n.id, n] as const));
    const sel = this.scene.selected;
    this.routes = [];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const l of this.scene.links) {
      const A = byId.get(l.a), B = byId.get(l.b);
      if (!A || !B) continue;
      const pts = route(A, B).map((p): Pt => [p[0] * v.s + v.tx, p[1] * v.s + v.ty]);
      for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
      this.routes.push({ a: l.a, b: l.b, pts, len: lengthOf(pts), hot: !!sel && (l.a === sel || l.b === sel), phase: strHash(l.a + '>' + l.b) });
    }
    const pad = PAD + 4 * Math.max(1, v.s);
    const bx = Math.max(0, Math.floor(x0 - pad)), by = Math.max(0, Math.floor(y0 - pad));
    const bw = this.routes.length ? Math.max(0, Math.min(this.W, Math.ceil(x1 + pad)) - bx) : 0;
    const bh = this.routes.length ? Math.max(0, Math.min(this.H, Math.ceil(y1 + pad)) - by) : 0;
    this.box = { x: bx, y: by, w: bw, h: bh };
    const dpr = this.dpr, cw = Math.round(bw * dpr), ch = Math.round(bh * dpr);
    if (this.mcv.width !== cw || this.mcv.height !== ch) { this.mcv.width = cw; this.mcv.height = ch; }
    this.mcv.style.width = `${bw}px`; this.mcv.style.height = `${bh}px`;
    this.mcv.style.left = `${bx}px`; this.mcv.style.top = `${by}px`;
    // the current runs only where the circuit is: on ground traces wholly inside the links' box
    const inBox = (p: Pt) => p[0] >= bx + PAD && p[0] <= bx + bw - PAD && p[1] >= by + PAD && p[1] <= by + bh - PAD;
    this.boxTraces = bw && bh ? this.traces.filter((t) => t.every(inBox)) : [];
    this.pulses = [];
  }

  private drawMotion(now: number, still: boolean): void {
    if (!still) {
      this.clock += Math.min(50, Math.max(0, now - this.lastTick));
      this.lastTick = now;
    }
    this.lastDraw = now;
    const b = this.box;
    if (!b.w || !b.h) return;
    this.motionFrames += 1;
    const m = this.m, dpr = this.dpr, T = TONES[this.opts.tone], t = this.clock, v = this.view;
    m.setTransform(dpr, 0, 0, dpr, -b.x * dpr, -b.y * dpr);
    m.clearRect(b.x, b.y, b.w, b.h);

    // flashes: a new link lights once (never under the still frame; started at most every FLASH_GAP_MS)
    if (still) { this.flashes = []; this.flashQueue = []; }
    else {
      if (this.flashQueue.length && now - this.lastFlashAt >= FLASH_GAP_MS) {
        const f = this.flashQueue.shift()!;
        this.flashes.push({ ...f, t0: now });
        this.lastFlashAt = now;
      }
      this.flashes = this.flashes.filter((f) => now - f.t0 < FLASH_MS);
    }
    const flashOf = (r: Route) => {
      for (const f of this.flashes) if ((f.a === r.a && f.b === r.b) || (f.a === r.b && f.b === r.a)) return 1 - (now - f.t0) / FLASH_MS;
      return 0;
    };

    // the links: moving dashed traces; the selected node's brighter; one path per kind
    m.setLineDash([6, 5]);
    m.lineDashOffset = still ? 0 : -(t / 60) % 11;
    for (const hot of [false, true]) {
      let any = false;
      m.beginPath();
      for (const r of this.routes) {
        if (r.hot !== hot) continue;
        any = true;
        r.pts.forEach((p, j) => (j ? m.lineTo(p[0], p[1]) : m.moveTo(p[0], p[1])));
      }
      if (!any) continue;
      m.lineWidth = Math.max(1, Math.min(3, v.s * (hot ? 2 : 1.4)));
      m.strokeStyle = hot ? T.hot : T.link;
      m.stroke();
    }
    m.setLineDash([]);
    for (const r of this.routes) {
      const lf = this.flashes.length ? flashOf(r) : 0;
      if (lf <= 0) continue;
      m.beginPath();
      r.pts.forEach((p, j) => (j ? m.lineTo(p[0], p[1]) : m.moveTo(p[0], p[1])));
      m.strokeStyle = `rgba(${T.flash},${(0.25 * lf).toFixed(3)})`; m.lineWidth = 2 + 8 * lf; m.stroke();
      m.strokeStyle = `rgba(${T.flash},${(0.5 + 0.5 * lf).toFixed(3)})`; m.lineWidth = 1.5 + 2 * lf; m.stroke();
    }
    if (still) return;

    // the electrons: only on the selected node's links, two each, slow
    if (this.opts.electrons) {
      const s = Math.max(4, Math.min(7, v.s * 6)), z = s * 3.2;
      for (const r of this.routes) {
        if (!r.hot) continue;
        for (let i = 0; i < 2; i++) {
          const q = along(r.pts, r.len, ((t / 1000) * 0.16 + i / 2 + r.phase) % 1);
          m.drawImage(this.sprite, q[0] - z / 2, q[1] - z / 2, z, z);
        }
      }
    }

    // the ground's current: occasional pulses on the circuitry under the links
    if (this.opts.current && this.boxTraces.length) {
      this.pulses = this.pulses.filter((p) => t - p.t0 < p.dur);
      if (this.pulses.length < MAX_PULSES && t >= this.nextPulseAt) {
        this.seed = (this.seed * 16807) % 2147483647;
        const pts = this.boxTraces[this.seed % this.boxTraces.length];
        this.pulses.push({ pts, len: lengthOf(pts), t0: t, dur: 2200 + (this.seed % 1600) });
        this.nextPulseAt = t + 700 + (this.seed % 2200);
      }
      m.globalAlpha = 0.8;
      for (const p of this.pulses) {
        const q = along(p.pts, p.len, (t - p.t0) / p.dur);
        m.drawImage(this.sprite, q[0] - 7, q[1] - 7, 14, 14);
      }
      m.globalAlpha = 1;
    }
  }
}
