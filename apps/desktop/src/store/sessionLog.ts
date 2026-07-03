import { generateId, saveSession, flushNow } from './persistence';
import type { SessionLog } from '../types';

// F5 — TTFK instrumentation. Extends the existing SessionLog machinery onto the
// real writing paths (PageEditor, authored journal pages) so time-to-first-
// keystroke becomes a number in Railway SQL. Measurement only: no UI, no streaks.

export type SessionSurface = NonNullable<SessionLog['surface']>;

const STALL_MS = 10_000;

// Desk→ink funnel (Slice 2): the Desk stamps this on mount; the NEXT session that
// RECORDS consumes it (one-shot — cleared on consume, never persisted app-side).
let deskOpenedAt: string | null = null;
export function markDeskOpened(): void { deskOpenedAt = new Date().toISOString(); }
export function consumeDeskOpened(): string | null {
  const v = deskOpenedAt;
  deskOpenedAt = null;
  return v;
}

export interface SessionDraft {
  surface: SessionSurface;
  startedAt: string;
  startedMs: number;
  firstKeystrokeAt: string | null;
  projectId: string | null;
  words: number;
}

// Record a finished surface session — fire-and-forget, never blocks writing.
// Litter guard: record ONLY IF a keystroke happened OR dwell ≥ 10s. A drive-by
// (<10s, zero ink) logs nothing; an opened-and-stalled session (≥10s, zero ink)
// logs with a null firstKeystrokeAt — the TTFK failure case, not noise. The Desk
// funnel stamp is consumed here, iff we actually record.
export function recordSession(d: SessionDraft): void {
  try {
    const dwellMs = Date.now() - d.startedMs;
    if (!d.firstKeystrokeAt && dwellMs < STALL_MS) return; // drive-by → nothing
    const now = new Date().toISOString();
    const session: SessionLog = {
      id: generateId(),
      projectId: d.projectId,
      startedAt: d.startedAt,
      firstKeystrokeAt: d.firstKeystrokeAt,
      endedAt: now,
      words: d.words,
      durationSec: Math.max(0, Math.round(dwellMs / 1000)),
      surface: d.surface,
      deskOpenedAt: consumeDeskOpened() ?? undefined,
      updatedAt: now,
    };
    saveSession(session);
    flushNow();
  } catch {
    // A logging failure is silent — the keystroke always wins.
  }
}
