import type { ActiveTask, PlayerTasksState } from '../types';

export function createEmptyTasksState(now: string): PlayerTasksState {
  return {
    version: 1,
    dailyPeriodKey: '',
    weeklyPeriodKey: '',
    daily: [],
    weekly: [],
    completedTaskInstanceIds: [],
    processedEventIds: [],
    unseenCompletedTaskInstanceIds: [],
    totalClaimed: 0,
    totalRewardXp: 0,
    totalRewardCommunityPoints: 0,
    lastUpdatedAt: now,
    lastSeenAt: now,
    clockWarning: false,
  };
}

const normalizeActive = (value: unknown): ActiveTask[] =>
  (Array.isArray(value) ? value : [])
    .filter((item) => item && typeof item.instanceId === 'string')
    .map((item) => ({
      instanceId: String(item.instanceId),
      definitionId: String(item.definitionId),
      cadence: item.cadence === 'weekly' ? 'weekly' : 'daily',
      periodKey: String(item.periodKey || ''),
      progress: Math.max(0, Math.floor(Number(item.progress) || 0)),
      target: Math.max(1, Math.floor(Number(item.target) || 1)),
      completed: Boolean(item.completed),
      completedAt: typeof item.completedAt === 'string' ? item.completedAt : null,
      claimed: Boolean(item.claimed),
      claimedAt: typeof item.claimedAt === 'string' ? item.claimedAt : null,
    }));

export function normalizeTaskState(value: unknown, now: string): PlayerTasksState {
  const fallback = createEmptyTasksState(now);
  if (!value || typeof value !== 'object') return fallback;
  const source = value as Partial<PlayerTasksState>;
  const strings = (items: unknown) =>
    (Array.isArray(items) ? items : []).filter((item): item is string => typeof item === 'string');
  return {
    ...fallback,
    dailyPeriodKey: typeof source.dailyPeriodKey === 'string' ? source.dailyPeriodKey : '',
    weeklyPeriodKey: typeof source.weeklyPeriodKey === 'string' ? source.weeklyPeriodKey : '',
    daily: normalizeActive(source.daily),
    weekly: normalizeActive(source.weekly),
    completedTaskInstanceIds: strings(source.completedTaskInstanceIds).slice(-500),
    processedEventIds: strings(source.processedEventIds).slice(-500),
    unseenCompletedTaskInstanceIds: strings(source.unseenCompletedTaskInstanceIds).slice(-20),
    totalClaimed: Math.max(0, Math.floor(Number(source.totalClaimed) || 0)),
    totalRewardXp: Math.max(0, Math.floor(Number(source.totalRewardXp) || 0)),
    totalRewardCommunityPoints: Math.max(0, Math.floor(Number(source.totalRewardCommunityPoints) || 0)),
    lastUpdatedAt: typeof source.lastUpdatedAt === 'string' ? source.lastUpdatedAt : now,
    lastSeenAt: typeof source.lastSeenAt === 'string' ? source.lastSeenAt : now,
    clockWarning: Boolean(source.clockWarning),
  };
}
