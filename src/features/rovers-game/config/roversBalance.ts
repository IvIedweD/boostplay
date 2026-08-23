import type { RoverLevel } from '../types';

export type RoversDifficulty = 'relaxed' | 'standard' | 'challenge';

export interface RoversBalancePreset {
  id: RoversDifficulty;
  title: string;
  playfieldWidth: number;
  playfieldHeight: number;
  innerLeft: number;
  innerRight: number;
  floorY: number;
  dangerLineY: number;
  overflowDelayMs: number;
  spawnProbabilities: ReadonlyArray<{
    level: 1 | 2 | 3;
    probability: number;
  }>;
  gravity: number;
  dropCooldownMs: number;
  radiusMultipliers: Record<RoverLevel, number>;
  backgroundAsset?: string;
}

const unchangedRadii: Record<RoverLevel, number> = {
  1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1,
};

export const roversBalancePresets: Record<RoversDifficulty, RoversBalancePreset> = {
  relaxed: {
    id: 'relaxed',
    title: 'Спокойный',
    playfieldWidth: 656,
    playfieldHeight: 738,
    innerLeft: 10,
    innerRight: 646,
    floorY: 716,
    dangerLineY: 142,
    overflowDelayMs: 2400,
    spawnProbabilities: [
      { level: 1, probability: 0.5 },
      { level: 2, probability: 0.35 },
      { level: 3, probability: 0.15 },
    ],
    gravity: 0.92,
    dropCooldownMs: 420,
    radiusMultipliers: unchangedRadii,
  },
  standard: {
    id: 'standard',
    title: 'Стандарт',
    playfieldWidth: 656,
    playfieldHeight: 738,
    innerLeft: 10,
    innerRight: 646,
    floorY: 716,
    dangerLineY: 150,
    overflowDelayMs: 1600,
    spawnProbabilities: [
      { level: 1, probability: 0.6 },
      { level: 2, probability: 0.3 },
      { level: 3, probability: 0.1 },
    ],
    gravity: 0.94,
    dropCooldownMs: 420,
    radiusMultipliers: {
      ...unchangedRadii, 5: 1.03, 6: 1.05, 7: 1.07, 8: 1.09,
    },
  },
  challenge: {
    id: 'challenge',
    title: 'Испытание',
    playfieldWidth: 656,
    playfieldHeight: 738,
    innerLeft: 20,
    innerRight: 636,
    floorY: 716,
    dangerLineY: 158,
    overflowDelayMs: 1400,
    spawnProbabilities: [
      { level: 1, probability: 0.65 },
      { level: 2, probability: 0.27 },
      { level: 3, probability: 0.08 },
    ],
    gravity: 0.97,
    dropCooldownMs: 400,
    radiusMultipliers: {
      ...unchangedRadii, 5: 1.06, 6: 1.08, 7: 1.1, 8: 1.12,
    },
  },
};

export const defaultRoversDifficulty: RoversDifficulty = 'standard';

export const roversPhysicsDefaults = {
  restitution: 0.08,
  friction: 0.36,
  frictionStatic: 0.62,
  frictionAir: 0.006,
  density: 0.00105,
  slop: 0.018,
  sleepThreshold: 38,
  positionIterations: 12,
  velocityIterations: 10,
  constraintIterations: 4,
  mergeEffectMs: 460,
} as const;

export function getRoversBalancePreset(difficulty: RoversDifficulty) {
  return roversBalancePresets[difficulty];
}
