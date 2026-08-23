import { describe, expect, it } from 'vitest';
import {
  EMPTY_ROVERS_BOOSTER_LOADOUT,
  getRoversBoosterCost,
  getRoversScoreMultiplier,
  shouldUseRoversStabilizer,
} from './roversBoosterSession';

describe('rovers booster rules', () => {
  it('calculates the server-aligned booster costs', () => {
    expect(getRoversBoosterCost(EMPTY_ROVERS_BOOSTER_LOADOUT)).toBe(0);
    expect(getRoversBoosterCost({
      doubleScore: true,
      stabilizer: true,
      activationId: null,
    })).toBe(300);
  });

  it('doubles score only for a double-score loadout', () => {
    expect(getRoversScoreMultiplier(EMPTY_ROVERS_BOOSTER_LOADOUT)).toBe(1);
    expect(getRoversScoreMultiplier({
      doubleScore: true,
      stabilizer: false,
      activationId: 'activation-id',
    })).toBe(2);
  });

  it('uses the stabilizer once when critical mass reaches one half', () => {
    const loadout = {
      doubleScore: false,
      stabilizer: true,
      activationId: 'activation-id',
    };
    expect(shouldUseRoversStabilizer(loadout, 0.49, false)).toBe(false);
    expect(shouldUseRoversStabilizer(loadout, 0.5, false)).toBe(true);
    expect(shouldUseRoversStabilizer(loadout, 0.8, true)).toBe(false);
  });
});
