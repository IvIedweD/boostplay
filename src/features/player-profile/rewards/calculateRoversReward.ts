import type { CompletedRoversResult } from '../types';

export const ROVERS_REWARD_LIMITS = {
  maxXp: 1500,
  maxCommunityPoints: 500,
} as const;

export function calculateRoversReward(result: CompletedRoversResult) {
  const score = Math.max(0, Math.floor(result.score));
  const highest = Math.min(8, Math.max(1, Math.floor(result.highestRoverLevel)));
  const legendary = Math.max(0, Math.floor(result.legendaryRoversCreated));
  const durationBonus = Math.min(
    40,
    Math.floor(Math.max(0, result.durationSeconds) / 60) * 2,
  );
  return {
    xp: Math.min(
      ROVERS_REWARD_LIMITS.maxXp,
      Math.floor(score / 12) + highest * 18 + durationBonus + (legendary > 0 ? 120 : 0),
    ),
    communityPoints: Math.min(
      ROVERS_REWARD_LIMITS.maxCommunityPoints,
      Math.floor(score / 30) + highest * highest + (legendary > 0 ? 60 : 0),
    ),
  };
}
