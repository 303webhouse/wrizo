export interface Beat {
  id: string;
  name: string;
  order: number;
  prompt: string;
  act?: number;
}

export interface Framework {
  id: string;
  name: string;
  description: string;
  tags: string[];
  beats: Beat[];
}

export interface BeatNote {
  beatId: string;
  notes: string[];
  status: 'empty' | 'started' | 'complete';
}

export interface StoryPlan {
  id: string;
  projectId: string;
  frameworkId: string;
  beatNotes: BeatNote[];
  currentBeatId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  type: 'creative' | 'academic';
  storyPlanId: string | null;
  sprintText?: string;
  createdAt: string;
  updatedAt: string;
  // Resume data (A3) — stamped by the adapter on sprint/beat writes.
  lastActivityAt?: string;
  lastActivityType?: 'sprint' | 'beat';
  // Soft delete — rows that must sync are never hard-deleted (see storage adapter / sync).
  deletedAt?: string;
}

// Autosaved writing buffer (A1). One record per writing surface, keyed by
// `projectId ?? 'scratch'`. The committed text still lives on Project.sprintText
// / BeatNote.notes; a draft is the unsaved work-in-progress that must survive a
// crash or tab close.
export interface Draft {
  id: string; // projectId or 'scratch'
  text: string;
  updatedAt: string;
}

// Writing-session instrumentation (A9). The collection is wired through the
// storage adapter now so sync (W2) has it; recording logic lands with A9.
export interface SessionLog {
  id: string;
  projectId: string | null;
  startedAt: string;
  firstKeystrokeAt: string | null;
  endedAt: string | null;
  words: number;
  durationSec: number;
  updatedAt: string;
}

export interface WizardAnswers {
  genre?: string;
  length?: string;
  characterFocus?: string;
  pacing?: string;
}
