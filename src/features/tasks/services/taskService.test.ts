import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commitPlayerProfile, getPlayerProfile, resetLocalPlayerProfile } from '../../player-profile/services/playerProgressService';
import { LocalTaskTimeProvider } from '../time/LocalTaskTimeProvider';
import type { ProgressionEvent } from '../types';
import {
  calculateTaskEventProgress,
  claimTaskReward,
  completeTaskForDevelopment,
  initializeTasks,
  processTaskEvent,
} from './taskService';

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
const now = new Date(2030, 6, 30, 12);
const provider = new LocalTaskTimeProvider(() => now);
const session: ProgressionEvent = {
  id: 'event-session-1',
  type: 'rovers.sessionCompleted',
  sessionId: 'session-1',
  score: 10000,
  highestLevel: 8,
  merges: 35,
  legendaryCreated: 1,
  durationSeconds: 300,
  xpEarned: 200,
  communityPointsEarned: 50,
  levelsGained: 1,
  achievementIds: ['achievement'],
  occurredAt: now.toISOString(),
};

describe('task service', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('window', { localStorage: storage });
    resetLocalPlayerProfile();
  });

  it('initializes and preserves stable active sets', () => {
    const first = initializeTasks(provider);
    const second = initializeTasks(provider);
    expect(first.tasks.daily).toHaveLength(3);
    expect(first.tasks.weekly).toHaveLength(4);
    expect(second.tasks.daily.map((task) => task.instanceId))
      .toEqual(first.tasks.daily.map((task) => task.instanceId));
  });

  it('tracks cumulative and single-session event semantics', () => {
    expect(calculateTaskEventProgress({ type: 'rovers.totalMerges', target: 100 }, session, 10)).toBe(45);
    expect(calculateTaskEventProgress({ type: 'rovers.scoreInSession', target: 20000 }, session, 12000)).toBe(12000);
    expect(calculateTaskEventProgress({ type: 'rovers.highestLevelInSession', target: 8 }, session, 5)).toBe(8);
    expect(calculateTaskEventProgress({ type: 'rovers.playTimeSeconds', target: 600 }, session, 100)).toBe(400);
    expect(calculateTaskEventProgress({ type: 'profile.xpEarned', target: 800 }, session, 100)).toBe(300);
  });

  it('processes a session event only once', () => {
    initializeTasks(provider);
    expect(processTaskEvent(session, provider).duplicate).toBe(false);
    const afterFirst = JSON.stringify(getPlayerProfile().tasks);
    expect(processTaskEvent(session, provider).duplicate).toBe(true);
    expect(JSON.stringify(getPlayerProfile().tasks)).toBe(afterFirst);
  });

  it('processes a navigation event only once', () => {
    initializeTasks(provider);
    const event = { id: 'visit-1', type: 'navigation.profileVisited' as const, occurredAt: now.toISOString() };
    processTaskEvent(event, provider);
    expect(processTaskEvent(event, provider).duplicate).toBe(true);
  });

  it('claims completed rewards once and blocks incomplete or duplicate claims', () => {
    const profile = initializeTasks(provider);
    const completed = profile.tasks.daily[0];
    const incomplete = profile.tasks.daily[1];
    completeTaskForDevelopment(completed.instanceId);
    const before = getPlayerProfile();
    expect(claimTaskReward(incomplete.instanceId, provider).granted).toBe(false);
    expect(claimTaskReward(completed.instanceId, provider).granted).toBe(true);
    const after = getPlayerProfile();
    expect(after.progression.totalXp).toBeGreaterThan(before.progression.totalXp);
    expect(after.progression.communityPoints).toBeGreaterThan(before.progression.communityPoints);
    expect(after.rewards[0].sourceType).toBe('task');
    expect(after.recentActivity[0].type).toBe('task');
    expect(claimTaskReward(completed.instanceId, provider).granted).toBe(false);
  });

  it('rotates daily and weekly sets when period keys change', () => {
    const first = initializeTasks(provider);
    const nextProvider = new LocalTaskTimeProvider(
      () => new Date(2030, 7, 5, 12),
    );
    const next = initializeTasks(nextProvider);
    expect(next.tasks.dailyPeriodKey).not.toBe(first.tasks.dailyPeriodKey);
    expect(next.tasks.weeklyPeriodKey).not.toBe(first.tasks.weeklyPeriodKey);
  });

  it('auto-claims completed expired tasks and expires incomplete tasks without rewards', () => {
    const first = initializeTasks(provider);
    const completed = first.tasks.daily[0];
    commitPlayerProfile({
      ...first,
      tasks: {
        ...first.tasks,
        daily: first.tasks.daily.map((task) =>
          task.instanceId === completed.instanceId
            ? { ...task, progress: task.target, completed: true, completedAt: now.toISOString() }
            : task,
        ),
      },
    });
    const nextProvider = new LocalTaskTimeProvider(
      () => new Date(2030, 6, 31, 12),
    );
    const next = initializeTasks(nextProvider);
    expect(next.tasks.totalClaimed).toBe(1);
    expect(next.rewards.some((reward) => reward.sourceId === completed.instanceId)).toBe(true);
    expect(next.rewards.filter((reward) => reward.sourceType === 'task')).toHaveLength(1);
  });

  it('keeps task data intact after a large backwards clock jump', () => {
    const futureProvider = new LocalTaskTimeProvider(
      () => new Date(2030, 7, 5, 12),
    );
    const future = initializeTasks(futureProvider);
    const pastProvider = new LocalTaskTimeProvider(
      () => new Date(2030, 6, 30, 0),
    );
    const past = initializeTasks(pastProvider);
    expect(past.tasks.clockWarning).toBe(true);
    expect(past.tasks.dailyPeriodKey).toBe(future.tasks.dailyPeriodKey);
    expect(past.tasks.daily.map((task) => task.instanceId))
      .toEqual(future.tasks.daily.map((task) => task.instanceId));
  });
});
