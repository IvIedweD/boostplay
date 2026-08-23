import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyCompletedGameResult,
  getPlayerProfile,
  markAllPlayerRewardsViewed,
  resetLocalPlayerProfile,
} from './playerProgressService';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const storage = new MemoryStorage();

describe('player progress service', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('window', { localStorage: storage });
    resetLocalPlayerProfile();
  });

  it('применяет результат Rovers и игнорирует дубликат sessionId', () => {
    const result = {
      sessionId: 'unique-session',
      gameId: 'rovers' as const,
      score: 2400,
      highestRoverLevel: 6,
      totalMerges: 35,
      legendaryRoversCreated: 0,
      durationSeconds: 360,
      completedAt: '2026-07-29T00:00:00.000Z',
    };
    const first = applyCompletedGameResult(result);
    const duplicate = applyCompletedGameResult(result);
    expect(first.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    expect(getPlayerProfile().games.rovers.gamesPlayed).toBe(1);
    expect(getPlayerProfile().games.rovers.totalMerges).toBe(35);
    expect(getPlayerProfile().games.rovers.unseenResult).toBe(true);
  });

  it('обновляет рекорд только вверх и накапливает время', () => {
    applyCompletedGameResult({
      sessionId: 'one', gameId: 'rovers', score: 1000,
      highestRoverLevel: 5, totalMerges: 10, legendaryRoversCreated: 0,
      durationSeconds: 100, completedAt: '2026-07-29T00:00:00.000Z',
    });
    applyCompletedGameResult({
      sessionId: 'two', gameId: 'rovers', score: 500,
      highestRoverLevel: 3, totalMerges: 4, legendaryRoversCreated: 0,
      durationSeconds: 50, completedAt: '2026-07-29T00:10:00.000Z',
    });
    expect(getPlayerProfile().games.rovers).toMatchObject({
      bestScore: 1000,
      highestRoverLevel: 5,
      totalMerges: 14,
      totalPlayTimeSeconds: 150,
    });
  });

  it('разблокирует достижения и выдаёт награду один раз', () => {
    const first = applyCompletedGameResult({
      sessionId: 'achievement-1', gameId: 'rovers', score: 100,
      highestRoverLevel: 6, totalMerges: 1, legendaryRoversCreated: 1,
      durationSeconds: 60, completedAt: '2026-07-29T00:00:00.000Z',
    });
    expect(first.achievementIds).toEqual(
      expect.arrayContaining([
        'rovers-first-merge',
        'rovers-high-tech',
        'rovers-legendary-builder',
      ]),
    );
    applyCompletedGameResult({
      sessionId: 'achievement-2', gameId: 'rovers', score: 100,
      highestRoverLevel: 2, totalMerges: 0, legendaryRoversCreated: 0,
      durationSeconds: 60, completedAt: '2026-07-29T00:02:00.000Z',
    });
    const rewardIds = getPlayerProfile().rewards.map((reward) => reward.id);
    expect(new Set(rewardIds).size).toBe(rewardIds.length);
  });

  it('ограничивает активность и сохраняет просмотр наград', () => {
    for (let index = 0; index < 25; index += 1) {
      applyCompletedGameResult({
        sessionId: `session-${index}`, gameId: 'rovers', score: index,
        highestRoverLevel: 1, totalMerges: 0, legendaryRoversCreated: 0,
        durationSeconds: 1, completedAt: new Date(2026, 0, index + 1).toISOString(),
      });
    }
    expect(getPlayerProfile().recentActivity.length).toBeLessThanOrEqual(20);
    markAllPlayerRewardsViewed();
    expect(getPlayerProfile().rewards.every((reward) => reward.viewedAt)).toBe(true);
  });
});
