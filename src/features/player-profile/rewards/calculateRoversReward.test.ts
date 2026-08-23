import { describe, expect, it } from 'vitest';
import { calculateRoversReward } from './calculateRoversReward';
import type { CompletedRoversResult } from '../types';

const result: CompletedRoversResult = {
  sessionId: 'session-1',
  gameId: 'rovers',
  score: 2400,
  highestRoverLevel: 6,
  totalMerges: 30,
  legendaryRoversCreated: 0,
  durationSeconds: 360,
  completedAt: '2026-07-29T00:00:00.000Z',
};

describe('награда за Rovers', () => {
  it('детерминирована и неотрицательна', () => {
    expect(calculateRoversReward(result)).toEqual(
      calculateRoversReward(result),
    );
    expect(calculateRoversReward(result).xp).toBeGreaterThan(0);
    expect(calculateRoversReward(result).communityPoints).toBeGreaterThan(0);
  });

  it('ограничивает чрезмерно большие значения', () => {
    expect(
      calculateRoversReward({
        ...result,
        score: Number.MAX_SAFE_INTEGER,
        legendaryRoversCreated: 10,
      }),
    ).toEqual({ xp: 1500, communityPoints: 500 });
  });
});
