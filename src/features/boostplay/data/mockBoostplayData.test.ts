import { describe, expect, it } from 'vitest';
import {
  boostplayActivities,
  boostplayBooster,
  boostplayFeaturedGame,
  boostplayLeaderboard,
  formatBoostplayScore,
  getBoostplayViewState,
} from './mockBoostplayData';

describe('BOOSTPLAY lobby configuration', () => {
  it('uses the authenticated ready state by default', () => {
    expect(getBoostplayViewState('')).toEqual({
      guest: false,
      booster: 'active',
      player: 'ready',
      season: 'ready',
      activities: 'ready',
      leaderboard: 'ready',
      prizes: 'ready',
      artwork: 'ready',
      stress: false,
    });
  });

  it('exposes deterministic states for browser validation', () => {
    const state = getBoostplayViewState('?auth=guest&booster=none&state=loading&leaderboard=unavailable&prizes=unavailable&artwork=missing&stress=1');
    expect(state).toMatchObject({ guest: true, booster: 'none', player: 'loading', prizes: 'unavailable', artwork: 'missing', stress: true });
    expect(state.leaderboard).toBe('loading');
    expect(getBoostplayViewState('?booster=gamercomm').booster).toBe('gamercomm');
  });

  it('keeps the featured game and booster routes explicit', () => {
    expect(boostplayFeaturedGame.route).toBe('/play');
    expect(boostplayBooster.remainingUses).toBeGreaterThan(0);
    expect(boostplayLeaderboard.some((entry) => entry.isCurrentPlayer)).toBe(true);
  });

  it('allows only https community destinations', () => {
    for (const activity of boostplayActivities) {
      expect(activity.externalUrl && new URL(activity.externalUrl).protocol).toBe('https:');
    }
  });

  it('formats leaderboard scores for Russian readers', () => {
    expect(formatBoostplayScore(42_300).replace(/\s/g, ' ')).toBe('42 300');
  });
});
