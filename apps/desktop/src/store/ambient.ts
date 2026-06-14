// Ambient sprint feedback (J5) — the felt layer.
//
// As the writer types, the sprint surface's warmth drifts up slowly and
// continuously; a lull settles it back. No discrete events — never a pop, flash,
// or flicker. This is the sanctioned third exception to §8 ("nothing animates
// without user action…"), scoped strictly to the sprint surface's drift (and the
// deferred finish juice, which lives in the finish moment, not here).
//
// The drift writes a runtime `--sprint-warmth` (0..1) on the surface element; the
// surface's warm overlay reads it (opacity = warmth × --ambient-intensity). All
// calibration lives in CSS variables (--ambient-* in index.css) and is read live
// each frame, so feel can be tuned without code edits.
//
// Optional Web Audio bed (no dependency): a faint, almost-imperceptible drone
// whose gain follows the same warmth. Off by default, created lazily on first
// enable (a user gesture), and never allowed to throw into the writing path.
//
// Reduced-motion (D8, required): when the OS prefers reduced motion, the visual
// drift does not run and audio stays off. The §8 exception never overrides a11y.

export interface AmbientHandle {
  noteKeystroke(): void;
  resolve(): void; // settle to calm at the finish moment
  stop(): void;
  setSoundEnabled(on: boolean): void;
  reducedMotion: boolean;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readVar(name: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function startAmbient(surface: HTMLElement): AmbientHandle {
  const reduced = prefersReducedMotion();

  let warmth = 0;
  let lastKeystroke = 0;
  let resolving = false;
  let raf = 0;
  let prev = typeof performance !== 'undefined' ? performance.now() : 0;

  // --- optional audio bed (lazy; off by default) --------------------------
  let audioOn = false;
  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;

  function ensureAudio() {
    if (ctx || reduced) return;
    try {
      const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext });
      const AC = Ctor.AudioContext || Ctor.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      // Two softly-detuned low oscillators through a gentle low-pass = a warm bed.
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 320;
      lp.connect(masterGain);
      masterGain.connect(ctx.destination);
      for (const freq of [110, 110.5]) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(lp);
        osc.start();
      }
    } catch {
      ctx = null; // never let audio break writing
    }
  }

  function applyAudioGain() {
    if (!ctx || !masterGain) return;
    // Almost-imperceptible: peak ~0.04 linear gain, scaled by warmth.
    const target = audioOn ? warmth * 0.04 : 0;
    try {
      masterGain.gain.setTargetAtTime(target, ctx.currentTime, 0.5);
    } catch {
      /* ignore */
    }
  }

  // --- the drift loop ------------------------------------------------------
  function frame(now: number) {
    const dt = Math.min(0.1, (now - prev) / 1000);
    prev = now;

    const activeWindow = readVar('--ambient-active-window', 4) * 1000;
    const riseTau = readVar('--ambient-rise-tau', 28);
    const fallTau = readVar('--ambient-fall-tau', 14);

    const typing = !resolving && lastKeystroke > 0 && now - lastKeystroke < activeWindow;
    const target = typing ? 1 : 0;
    const tau = Math.max(0.001, target > warmth ? riseTau : fallTau);
    // Exponential approach — continuous, never a step.
    warmth += (target - warmth) * Math.min(1, dt / tau);
    if (warmth < 0.0001 && target === 0) warmth = 0;

    surface.style.setProperty('--sprint-warmth', warmth.toFixed(4));
    applyAudioGain();
    raf = requestAnimationFrame(frame);
  }

  if (!reduced) {
    surface.style.setProperty('--sprint-warmth', '0');
    raf = requestAnimationFrame(frame);
  } else {
    // Drift disabled: pin warmth to 0 so the overlay is fully transparent.
    surface.style.setProperty('--sprint-warmth', '0');
  }

  return {
    reducedMotion: reduced,
    noteKeystroke() {
      lastKeystroke = typeof performance !== 'undefined' ? performance.now() : Date.now();
    },
    resolve() {
      // Finish moment: stop driving warmth up; it eases back to calm. Any
      // celebratory payoff belongs to the finish moment (J7), not here.
      resolving = true;
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      try {
        if (ctx) void ctx.close();
      } catch {
        /* ignore */
      }
      ctx = null;
      masterGain = null;
    },
    setSoundEnabled(on: boolean) {
      audioOn = on && !reduced;
      if (audioOn) {
        ensureAudio();
        if (ctx && ctx.state === 'suspended') void ctx.resume();
      }
      applyAudioGain();
    },
  };
}
