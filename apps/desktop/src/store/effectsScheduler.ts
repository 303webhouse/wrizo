// TH1 Slice 4 — a jittered-timer scheduler utility for the effects layer
// (canon §6). Generic and content-free: it knows nothing about tear-lines or
// glow math (TH2's Signal Loss dialect owns that), only how to fire a
// callback at a randomized interval, skip while "busy" (the TEXTURE damping
// rule — schedulers skip while typing), and never exceed a per-event cap
// (the ≤3Hz photosensitivity ceiling, canon §14, is enforced by the CALLER
// choosing minMs/maxMs; this utility enforces the FLOOR so a caller can't
// accidentally violate it).
export interface JitteredSchedulerOptions {
  minMs: number;
  maxMs: number;
  onFire: () => void;
  // A hard floor between fires, independent of the jittered interval — the
  // structural ≤3Hz backstop (canon §7's "nothing flashes above 3Hz anywhere
  // at any dial position"). Defaults to minMs.
  minGapMs?: number;
  // Reports whether the scheduler should skip firing right now (typing-state
  // damping for TEXTURE events; RESPONSE events pass a scheduler that never
  // reports busy, per canon §6's opposite-damping rule).
  isBusy?: () => boolean;
}

export interface JitteredScheduler {
  start(): void;
  stop(): void;
  running(): boolean;
}

export function createJitteredScheduler(opts: JitteredSchedulerOptions): JitteredScheduler {
  const minGapMs = opts.minGapMs ?? opts.minMs;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastFireAt = 0;

  const scheduleNext = () => {
    const delay = opts.minMs + Math.random() * Math.max(0, opts.maxMs - opts.minMs);
    timer = setTimeout(() => {
      const now = Date.now();
      const busy = opts.isBusy?.() ?? false;
      if (!busy && now - lastFireAt >= minGapMs) {
        lastFireAt = now;
        opts.onFire();
      }
      scheduleNext();
    }, delay);
  };

  return {
    start() {
      if (timer !== null) return;
      scheduleNext();
    },
    stop() {
      if (timer !== null) { clearTimeout(timer); timer = null; }
    },
    running() {
      return timer !== null;
    },
  };
}
