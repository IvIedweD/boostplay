import { describe, expect, it } from 'vitest';
import type { RoversGameResult } from '../types';
import {
  loadRoversGameStorage,
  markRoversResultViewed,
  markRoversRulesViewed,
  ROVERS_STORAGE_KEY,
  saveRoversResult,
} from './roversGameStorage';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const firstResult: RoversGameResult = {
  score: 325,
  highestLevel: 5,
  merges: 12,
  communityPoints: 32,
  legendaryCreated: false,
  durationMs: 180_000,
  difficulty: 'standard',
  gameOverReason: 'overflow',
  completedAt: '2026-07-28T00:00:00.000Z',
};

describe('хранилище игры «Роверы»', () => {
  it('использует версионированный ключ', () => {
    expect(ROVERS_STORAGE_KEY).toBe('gamercomm.roversGame.v1');
  });

  it('сохраняет рекорд, прогресс и невидимый результат', () => {
    const storage = new MemoryStorage();
    saveRoversResult(firstResult, storage);
    const data = loadRoversGameStorage(storage);
    expect(data.bestScore).toBe(325);
    expect(data.highestLevel).toBe(5);
    expect(data.totalMerges).toBe(12);
    expect(data.totalCommunityPoints).toBe(32);
    expect(data.totalGamesPlayed).toBe(1);
    expect(data.unseenResult).toBe(true);
  });

  it('не уменьшает рекорд и суммирует число слияний', () => {
    const storage = new MemoryStorage();
    saveRoversResult(firstResult, storage);
    saveRoversResult(
      { ...firstResult, score: 100, highestLevel: 3, merges: 2 },
      storage,
    );
    const data = loadRoversGameStorage(storage);
    expect(data.bestScore).toBe(325);
    expect(data.highestLevel).toBe(5);
    expect(data.totalMerges).toBe(14);
    expect(data.totalCommunityPoints).toBe(64);
    expect(data.totalGamesPlayed).toBe(2);
  });

  it('сохраняет количество созданных легендарных роверов', () => {
    const storage = new MemoryStorage();
    saveRoversResult({ ...firstResult, highestLevel: 8, legendaryCreated: true }, storage);
    expect(loadRoversGameStorage(storage).legendaryRoverCount).toBe(1);
  });

  it('сохраняет просмотр правил и результата', () => {
    const storage = new MemoryStorage();
    expect(markRoversRulesViewed(storage).rulesViewed).toBe(true);
    saveRoversResult(firstResult, storage);
    expect(markRoversResultViewed(storage).unseenResult).toBe(false);
  });
});
