import type { RoverLevel } from '../types';
import type { RoversDifficulty } from './roversBalance';

export const roversResultPreview = {
  score: 24_680,
  highestLevel: 8 as RoverLevel,
  communityPoints: 120,
  xpEarned: 600,
  bestScore: 24_680,
  merges: 37,
  newRecord: true,
  legendaryCreated: true,
  durationMs: 312_000,
  difficulty: 'standard' as RoversDifficulty,
  newlyCompletedTaskCount: 2,
};

export function isRoversResultPreview(search: string, isDevelopment: boolean) {
  return isDevelopment
    && new URLSearchParams(search).get('preview') === 'result';
}
