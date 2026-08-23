import { describe, expect, it } from 'vitest';
import { normalizeLeaderboardRows } from './supabaseGameData';

describe('normalizeLeaderboardRows', () => {
  it('normalizes valid rows and marks the current player', () => {
    expect(normalizeLeaderboardRows([{
      rank: 1,
      player_id: 'player-1',
      display_name: 'Игрок',
      score: 4200,
      avatar_id: 'avatar-01',
    }], 'player-1')).toEqual([{
      rank: 1,
      playerId: 'player-1',
      displayName: 'Игрок',
      avatarUrl: expect.stringContaining('avatar-01'),
      score: 4200,
      isCurrentPlayer: true,
    }]);
  });

  it('drops malformed or unsafe rows', () => {
    expect(normalizeLeaderboardRows([
      { rank: 0, player_id: 'a', display_name: 'A', score: 1 },
      { rank: 1, player_id: 'b', display_name: 'B', score: -1 },
      null,
    ], null)).toEqual([]);
  });
});
