import type { DeskTermId } from '../../store/lexicon/terms';

// THE PLAN PRESETS (the Wrizors' plan-presets-draft.md, Nov 20, 2:15 pm; Nick: "Yes, as drafted", Nov 20, 3:14 pm; Fable's order, 9:45 pm). Three starting shapes for the Back menu's PLAN tab: Stasis Theory, the Hero's Journey
// (twelve steps grouped under three acts), Three-Act Structure. Every heading and every prompt is a LEXICON key, never a string here. A prompt is guidance in grey under its heading, never her text; the Plan hides it once a Part
// under that heading has words (planPresetOps.ts). A preset is a starting shape, not a rule: she can rename, drop, add and re-order every row.
export interface PresetRow { depth: 0 | 1; title: DeskTermId; prompt?: DeskTermId }
export interface PlanPreset { id: 'stasis' | 'hero' | 'three'; name: DeskTermId; rows: PresetRow[] }

export const PLAN_PRESETS: PlanPreset[] = [
  { id: 'stasis', name: 'reorgPreStasis', rows: [
    { depth: 0, title: 'reorgPreStasisQuestion', prompt: 'reorgPreStasisQuestionP' },
    { depth: 0, title: 'reorgPreStasisFact', prompt: 'reorgPreStasisFactP' },
    { depth: 0, title: 'reorgPreStasisDefinition', prompt: 'reorgPreStasisDefinitionP' },
    { depth: 0, title: 'reorgPreStasisQuality', prompt: 'reorgPreStasisQualityP' },
    { depth: 0, title: 'reorgPreStasisPolicy', prompt: 'reorgPreStasisPolicyP' },
    { depth: 0, title: 'reorgPreStasisObjections', prompt: 'reorgPreStasisObjectionsP' },
    { depth: 0, title: 'reorgPreStasisConclusion', prompt: 'reorgPreStasisConclusionP' },
  ] },
  { id: 'hero', name: 'reorgPreHero', rows: [
    { depth: 0, title: 'reorgPreHeroActOne' },
    { depth: 1, title: 'reorgPreHeroOrdinary', prompt: 'reorgPreHeroOrdinaryP' },
    { depth: 1, title: 'reorgPreHeroCall', prompt: 'reorgPreHeroCallP' },
    { depth: 1, title: 'reorgPreHeroRefusal', prompt: 'reorgPreHeroRefusalP' },
    { depth: 1, title: 'reorgPreHeroMentor', prompt: 'reorgPreHeroMentorP' },
    { depth: 1, title: 'reorgPreHeroThreshold', prompt: 'reorgPreHeroThresholdP' },
    { depth: 0, title: 'reorgPreHeroActTwo' },
    { depth: 1, title: 'reorgPreHeroTests', prompt: 'reorgPreHeroTestsP' },
    { depth: 1, title: 'reorgPreHeroApproach', prompt: 'reorgPreHeroApproachP' },
    { depth: 1, title: 'reorgPreHeroOrdeal', prompt: 'reorgPreHeroOrdealP' },
    { depth: 1, title: 'reorgPreHeroReward', prompt: 'reorgPreHeroRewardP' },
    { depth: 0, title: 'reorgPreHeroActThree' },
    { depth: 1, title: 'reorgPreHeroRoad', prompt: 'reorgPreHeroRoadP' },
    { depth: 1, title: 'reorgPreHeroResurrection', prompt: 'reorgPreHeroResurrectionP' },
    { depth: 1, title: 'reorgPreHeroElixir', prompt: 'reorgPreHeroElixirP' },
  ] },
  { id: 'three', name: 'reorgPreThree', rows: [
    { depth: 0, title: 'reorgPreThreeActOne' },
    { depth: 1, title: 'reorgPreThreeOpening', prompt: 'reorgPreThreeOpeningP' },
    { depth: 1, title: 'reorgPreThreeInciting', prompt: 'reorgPreThreeIncitingP' },
    { depth: 1, title: 'reorgPreThreeFirstTurn', prompt: 'reorgPreThreeFirstTurnP' },
    { depth: 0, title: 'reorgPreThreeActTwo' },
    { depth: 1, title: 'reorgPreThreeRising', prompt: 'reorgPreThreeRisingP' },
    { depth: 1, title: 'reorgPreThreeMidpoint', prompt: 'reorgPreThreeMidpointP' },
    { depth: 1, title: 'reorgPreThreeCrisis', prompt: 'reorgPreThreeCrisisP' },
    { depth: 1, title: 'reorgPreThreeSecondTurn', prompt: 'reorgPreThreeSecondTurnP' },
    { depth: 0, title: 'reorgPreThreeActThree' },
    { depth: 1, title: 'reorgPreThreeClimax', prompt: 'reorgPreThreeClimaxP' },
    { depth: 1, title: 'reorgPreThreeResolution', prompt: 'reorgPreThreeResolutionP' },
  ] },
];
