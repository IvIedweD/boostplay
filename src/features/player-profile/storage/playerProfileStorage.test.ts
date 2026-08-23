import { describe, expect, it } from 'vitest';
import { ROVERS_STORAGE_KEY } from '../../rovers-game/storage/roversGameStorage';
import {
  loadPlayerProfile,
  migratePlayerProfile,
  PLAYER_PROFILE_STORAGE_KEY,
  resetPlayerProfileForDevelopment,
  savePlayerProfile,
} from './playerProfileStorage';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('хранилище профиля', () => {
  it('создаёт профиль со стабильным ID', () => {
    const storage = new MemoryStorage();
    const first = loadPlayerProfile(storage);
    const second = loadPlayerProfile(storage);
    expect(first.playerId).toBe(second.playerId);
    expect(first.displayName).toBe('Игрок');
    expect(first.migration.legacyRoversMigrated).toBe(true);
  });

  it('восстанавливается после повреждённого JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(PLAYER_PROFILE_STORAGE_KEY, '{broken');
    expect(loadPlayerProfile(storage).progression.level).toBe(1);
  });

  it('нормализует данные неизвестной старой версии', () => {
    const migrated = migratePlayerProfile(
      { version: 0, displayName: 'Старый игрок', progression: { totalXp: 100 } },
      0,
    );
    expect(migrated.version).toBe(3);
    expect(migrated.displayName).toBe('Старый игрок');
    expect(migrated.progression.level).toBe(2);
    expect(migrated.tasks.daily).toEqual([]);
    expect(migrated.communityHub).toEqual({
      version: 1,
      readNewsIds: [],
      dismissedAnnouncementIds: [],
      visitedAt: null,
      lastNewsViewedAt: null,
    });
  });

  it('нормализует XP, уровень и отрицательные очки', () => {
    const storage = new MemoryStorage();
    const profile = loadPlayerProfile(storage);
    const saved = savePlayerProfile({
      ...profile,
      progression: {
        ...profile.progression,
        totalXp: 1000,
        level: 49,
        communityPoints: -20,
      },
    }, storage);
    expect(saved.progression.level).not.toBe(49);
    expect(saved.progression.communityPoints).toBe(0);
  });

  it('однократно мигрирует legacy Rovers без повторного начисления', () => {
    const storage = new MemoryStorage();
    storage.setItem(ROVERS_STORAGE_KEY, JSON.stringify({
      version: 1,
      bestScore: 2500,
      highestLevel: 6,
      totalMerges: 120,
      totalCommunityPoints: 80,
      totalGamesPlayed: 12,
      legendaryRoverCount: 1,
      rulesViewed: true,
      lastResult: {
        score: 900,
        highestLevel: 5,
        merges: 20,
        communityPoints: 20,
        legendaryCreated: false,
        durationMs: 180000,
        difficulty: 'standard',
        gameOverReason: 'overflow',
        completedAt: '2026-07-29T00:00:00.000Z',
      },
      unseenResult: true,
    }));
    const first = loadPlayerProfile(storage);
    const second = loadPlayerProfile(storage);
    expect(first.games.rovers).toMatchObject({
      bestScore: 2500,
      highestRoverLevel: 6,
      totalMerges: 120,
      gamesPlayed: 12,
      legendaryRoversCreated: 1,
      unseenResult: true,
    });
    expect(second.progression.communityPoints).toBe(80);
    expect(second.migration.migratedKeys).toEqual([ROVERS_STORAGE_KEY]);
  });

  it('сбрасывает профиль через storage-слой', () => {
    const storage = new MemoryStorage();
    const original = loadPlayerProfile(storage);
    const reset = resetPlayerProfileForDevelopment(storage);
    expect(reset.playerId).not.toBe(original.playerId);
  });
});
