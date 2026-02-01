import type { Framework, WizardAnswers } from '../types';

import threeAct from '../../../../packages/modules-writing/data/frameworks/three_act.json';
import storyCircle from '../../../../packages/modules-writing/data/frameworks/story_circle.json';
import saveTheCat from '../../../../packages/modules-writing/data/frameworks/save_the_cat.json';

export const frameworks: Framework[] = [
  threeAct as Framework,
  storyCircle as Framework,
  saveTheCat as Framework,
];

export function getFramework(id: string): Framework | null {
  return frameworks.find(f => f.id === id) || null;
}

export function getAllFrameworks(): Framework[] {
  return frameworks;
}

interface FrameworkScore {
  framework: Framework;
  score: number;
}

export function recommendFrameworks(answers: WizardAnswers): { primary: Framework; alternate: Framework } {
  const scores: FrameworkScore[] = frameworks.map(framework => {
    let score = 0;

    // Genre scoring
    if (answers.genre === 'action' || answers.genre === 'thriller') {
      if (framework.id === 'save_the_cat') score += 3;
      if (framework.id === 'three_act') score += 2;
    } else if (answers.genre === 'drama' || answers.genre === 'literary') {
      if (framework.id === 'story_circle') score += 3;
      if (framework.id === 'three_act') score += 2;
    } else if (answers.genre === 'fantasy' || answers.genre === 'scifi') {
      if (framework.id === 'story_circle') score += 3;
      if (framework.id === 'save_the_cat') score += 1;
    }

    // Length scoring
    if (answers.length === 'short') {
      if (framework.id === 'story_circle') score += 2;
      if (framework.id === 'three_act') score += 2;
    } else if (answers.length === 'novel') {
      if (framework.id === 'save_the_cat') score += 2;
      if (framework.id === 'three_act') score += 1;
    } else if (answers.length === 'screenplay') {
      if (framework.id === 'save_the_cat') score += 3;
    }

    // Character focus scoring
    if (answers.characterFocus === 'transformation') {
      if (framework.id === 'story_circle') score += 3;
    } else if (answers.characterFocus === 'external') {
      if (framework.id === 'save_the_cat') score += 2;
      if (framework.id === 'three_act') score += 2;
    }

    // Pacing scoring
    if (answers.pacing === 'fast') {
      if (framework.id === 'save_the_cat') score += 2;
    } else if (answers.pacing === 'measured') {
      if (framework.id === 'story_circle') score += 2;
      if (framework.id === 'three_act') score += 1;
    }

    // Base score for three_act (most universal)
    if (framework.id === 'three_act') score += 1;

    return { framework, score };
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  return {
    primary: scores[0].framework,
    alternate: scores[1].framework,
  };
}
