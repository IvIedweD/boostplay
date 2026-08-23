import { describe, expect, it } from 'vitest';
import { createDefaultPlayerProfile } from '../../player-profile/config/profileDefaults';
import { demoLeaderboardPlayers } from '../config/demoLeaderboardPlayers';
import { getLeaderboard } from '../services/leaderboardService';
import type { LeaderboardCategory, LeaderboardPlayer } from '../types';
import { buildLeaderboard, normalizeLeaderboardPlayer } from './buildLeaderboard';

function profile() {
  const value = createDefaultPlayerProfile('2026-01-01T00:00:00.000Z');
  value.playerId = 'test-player';
  value.displayName = 'Тестовый игрок';
  return value;
}

function competitor(id: string, values: Partial<LeaderboardPlayer>) {
  return normalizeLeaderboardPlayer({ id, displayName: id, ...values });
}

describe('local demo leaderboard', () => {
  it('contains 24 deterministic competitors with unique stable IDs', () => {
    expect(demoLeaderboardPlayers).toHaveLength(24);
    expect(new Set(demoLeaderboardPlayers.map((item) => item.id)).size).toBe(24);
    expect(demoLeaderboardPlayers[0].displayName).toBe('ТурбоКот');
  });

  it('inserts the current player exactly once', () => {
    const result = getLeaderboard('rovers-score', profile());
    expect(result.entries.filter((entry) => entry.isCurrentPlayer)).toHaveLength(1);
    expect(result.currentPlayerEntry.id).toBe('current:test-player');
  });

  it.each<[LeaderboardCategory, keyof LeaderboardPlayer]>([
    ['rovers-score', 'roversBestScore'],
    ['legendary-rovers', 'legendaryRoverCount'],
    ['community-points', 'communityPoints'],
    ['player-level', 'level'],
    ['achievements', 'achievementsUnlocked'],
  ])('sorts %s by its primary metric', (category, field) => {
    const result = buildLeaderboard(category, profile(), [
      competitor('low', { [field]: 2 }),
      competitor('high', { [field]: 20 }),
    ]);
    expect(result.entries[0].id).toBe('high');
  });

  it('uses category-specific secondary sorting and stable ID ordering', () => {
    const result = buildLeaderboard('rovers-score', profile(), [
      competitor('z-last', { roversBestScore: 100, highestRoverLevel: 4, totalMerges: 20 }),
      competitor('b-second', { roversBestScore: 100, highestRoverLevel: 5, totalMerges: 10 }),
      competitor('a-first', { roversBestScore: 100, highestRoverLevel: 5, totalMerges: 10 }),
    ]);
    expect(result.entries.slice(0, 3).map((entry) => entry.id)).toEqual([
      'a-first',
      'b-second',
      'z-last',
    ]);
  });

  it('uses dense ranking for equal primary metric values', () => {
    const result = buildLeaderboard('community-points', profile(), [
      competitor('first', { communityPoints: 300 }),
      competitor('tie-a', { communityPoints: 200, totalXp: 100 }),
      competitor('tie-b', { communityPoints: 200, totalXp: 90 }),
      competitor('third-rank', { communityPoints: 100 }),
    ]);
    expect(result.entries.slice(0, 4).map((entry) => entry.rank)).toEqual([1, 2, 2, 3]);
  });

  it('normalizes missing and invalid values safely', () => {
    const normalized = normalizeLeaderboardPlayer({
      id: 'broken',
      level: Number.NaN,
      roversBestScore: -50,
    });
    expect(normalized.level).toBe(1);
    expect(normalized.roversBestScore).toBe(0);
    expect(normalized.avatarId).toBe('gamepad');
  });

  it('still contains the current player when demo data is empty', () => {
    const result = buildLeaderboard('rovers-score', profile(), []);
    expect(result.entries).toHaveLength(1);
    expect(result.currentPlayerRank).toBe(1);
  });

  it('pins a correct current rank even when outside top 20', () => {
    const result = getLeaderboard('rovers-score', profile());
    expect(result.currentPlayerRank).toBeGreaterThan(20);
    expect(result.topEntries.some((entry) => entry.isCurrentPlayer)).toBe(false);
    expect(result.currentPlayerEntry.isCurrentPlayer).toBe(true);
  });

  it('recalculates rank after profile score changes', () => {
    const current = profile();
    const before = getLeaderboard('rovers-score', current).currentPlayerRank;
    current.games.rovers.bestScore = 99999;
    const after = getLeaderboard('rovers-score', current).currentPlayerRank;
    expect(after).toBe(1);
    expect(after).toBeLessThan(before);
  });

  it('recalculates level, points and achievement categories from profile updates', () => {
    const current = profile();
    const initial = {
      level: getLeaderboard('player-level', current).currentPlayerRank,
      points: getLeaderboard('community-points', current).currentPlayerRank,
      achievements: getLeaderboard('achievements', current).currentPlayerRank,
    };
    current.progression.level = 99;
    current.progression.totalXp = 999999;
    current.progression.communityPoints = 999999;
    current.totals.achievementsUnlocked = 99;
    expect(getLeaderboard('player-level', current).currentPlayerRank).toBeLessThan(initial.level);
    expect(getLeaderboard('community-points', current).currentPlayerRank).toBeLessThan(initial.points);
    expect(getLeaderboard('achievements', current).currentPlayerRank).toBeLessThan(initial.achievements);
  });

  it('does not duplicate an entry falsely marked as current player', () => {
    const current = profile();
    const result = buildLeaderboard('rovers-score', current, [
      competitor('fake-current', { isCurrentPlayer: true }),
      competitor(`current:${current.playerId}`, { roversBestScore: 99999 }),
    ]);
    expect(result.entries.filter((entry) => entry.isCurrentPlayer)).toHaveLength(1);
    expect(result.entries.filter((entry) => entry.id === `current:${current.playerId}`)).toHaveLength(1);
  });
});
