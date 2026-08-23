import { describe, expect, it } from 'vitest';
import {
  exportRoversDevSessions,
  loadRoversDevSessions,
  recordRoversDevSession,
  type RoversDevSession,
} from './roversDevTelemetry';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const session: RoversDevSession = {
  completedAt: '2026-07-29T00:00:00.000Z',
  durationMs: 360_000,
  finalScore: 1200,
  highestLevel: 6,
  totalMerges: 28,
  legendaryCreated: false,
  gameOverReason: 'overflow',
  difficulty: 'standard',
};

describe('локальная DEV-телеметрия роверов', () => {
  it('сохраняет не более десяти последних сессий', () => {
    const storage = new MemoryStorage();
    for (let index = 0; index < 12; index += 1) {
      recordRoversDevSession(
        { ...session, completedAt: `session-${index}` },
        storage,
      );
    }
    expect(loadRoversDevSessions(storage)).toHaveLength(10);
    expect(loadRoversDevSessions(storage)[0].completedAt).toBe('session-11');
  });

  it('экспортирует сессии как JSON', () => {
    const storage = new MemoryStorage();
    recordRoversDevSession(session, storage);
    expect(JSON.parse(exportRoversDevSessions(storage))).toHaveLength(1);
  });
});
