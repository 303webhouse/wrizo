import type { Framework } from '../types';

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
