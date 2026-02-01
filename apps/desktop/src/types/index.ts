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
}

export interface WizardAnswers {
  genre?: string;
  length?: string;
  characterFocus?: string;
  pacing?: string;
}
