import { describe, expect, it } from 'vitest';
import { createDefaultPlayerProfile } from '../../player-profile/config/profileDefaults';
import { getBoostplayLobbyData } from './lobbyDataAdapter';

describe('getBoostplayLobbyData', () => {
  const profile = createDefaultPlayerProfile('2026-08-23T00:00:00.000Z');

  it('does not expose demo leaderboard or player values in server mode', () => {
    const data = getBoostplayLobbyData(profile, null, null, null, Date.now(), false);
    expect(data.leaderboard).toEqual([]);
    expect(data.player.displayName).toBe('Игрок');
    expect(data.player.rank).toBe(0);
    expect(data.player.bestScore).toBe(0);
    expect(data.seasonEndsIn).toBe('—');
  });

  it('keeps demo data available only when explicitly enabled', () => {
    const data = getBoostplayLobbyData(profile, null, null, null, Date.now(), true);
    expect(data.leaderboard.length).toBeGreaterThan(0);
    expect(data.player.bestScore).toBeGreaterThan(0);
  });
});
