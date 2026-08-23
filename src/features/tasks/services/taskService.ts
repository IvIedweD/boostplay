import type { PlayerProfile } from '../../player-profile/types';
import {
  applyTaskReward,
  commitPlayerProfile,
  getPlayerProfile,
} from '../../player-profile/services/playerProgressService';
import {
  allTaskDefinitions,
  dailyTaskDefinitions,
  getTaskDefinition,
  weeklyTaskDefinitions,
} from '../config/taskDefinitions';
import { LocalTaskTimeProvider } from '../time/LocalTaskTimeProvider';
import type { TaskTimeProvider } from '../time/TaskTimeProvider';
import type {
  ActiveTask,
  ProgressionEvent,
  TaskCondition,
  TaskEventResult,
} from '../types';
import { generateTaskSet } from '../utils/generateTaskSet';

export const taskTimeProvider = new LocalTaskTimeProvider();

function autoClaimExpired(profile: PlayerProfile, tasks: ActiveTask[], now: string) {
  let current = profile;
  for (const task of tasks.filter((item) => item.completed && !item.claimed)) {
    const definition = getTaskDefinition(task.definitionId);
    if (definition) {
      applyTaskReward(task.instanceId, definition.title, definition.reward, now, true);
      current = getPlayerProfile();
    }
  }
  return current;
}

export function initializeTasks(
  provider: TaskTimeProvider = taskTimeProvider,
) {
  let profile = getPlayerProfile();
  const currentDate = provider.now();
  const now = currentDate.toISOString();
  const dailyKey = provider.getDailyPeriodKey(currentDate);
  const weeklyKey = provider.getWeeklyPeriodKey(currentDate);
  const lastSeen = Date.parse(profile.tasks.lastSeenAt);
  const backwards = Number.isFinite(lastSeen) && currentDate.getTime() < lastSeen - 21600000;

  if (!backwards && profile.tasks.dailyPeriodKey !== dailyKey) {
    profile = autoClaimExpired(profile, profile.tasks.daily, now);
    profile = {
      ...profile,
      tasks: {
        ...profile.tasks,
        dailyPeriodKey: dailyKey,
        daily: generateTaskSet(dailyTaskDefinitions, 'daily', dailyKey, profile.playerId),
      },
    };
  }
  if (!backwards && profile.tasks.weeklyPeriodKey !== weeklyKey) {
    profile = autoClaimExpired(profile, profile.tasks.weekly, now);
    profile = {
      ...profile,
      tasks: {
        ...profile.tasks,
        weeklyPeriodKey: weeklyKey,
        weekly: generateTaskSet(weeklyTaskDefinitions, 'weekly', weeklyKey, profile.playerId),
      },
    };
  }
  const next = {
    ...profile,
    tasks: {
      ...profile.tasks,
      lastSeenAt: now,
      lastUpdatedAt: now,
      clockWarning: backwards,
    },
  };
  return commitPlayerProfile(next);
}

export function calculateTaskEventProgress(
  condition: TaskCondition,
  event: ProgressionEvent,
  current: number,
) {
  if (event.type === 'rovers.sessionCompleted') {
    if (condition.type === 'rovers.sessionsPlayed') return current + 1;
    if (condition.type === 'rovers.totalMerges') return current + event.merges;
    if (condition.type === 'rovers.totalScore') return current + event.score;
    if (condition.type === 'rovers.scoreInSession') return Math.max(current, event.score);
    if (condition.type === 'rovers.highestLevelInSession') return Math.max(current, event.highestLevel);
    if (condition.type === 'rovers.legendaryCreated') return current + event.legendaryCreated;
    if (condition.type === 'rovers.playTimeSeconds') return current + event.durationSeconds;
    if (condition.type === 'rovers.communityPointsEarned') return current + event.communityPointsEarned;
    if (condition.type === 'profile.xpEarned') return current + event.xpEarned;
    if (condition.type === 'profile.levelsGained') return current + event.levelsGained;
    if (condition.type === 'profile.achievementUnlocked') return current + event.achievementIds.length;
  }
  if (condition.type === event.type) return current + 1;
  return current;
}

export function processTaskEvent(
  event: ProgressionEvent,
  provider: TaskTimeProvider = taskTimeProvider,
): TaskEventResult {
  const profile = initializeTasks(provider);
  if (profile.tasks.processedEventIds.includes(event.id)) {
    return { duplicate: true, newlyCompleted: [] };
  }
  const newlyCompleted: ActiveTask[] = [];
  const update = (task: ActiveTask) => {
    if (task.claimed || task.completed) return task;
    const definition = getTaskDefinition(task.definitionId);
    if (!definition) return task;
    const progress = Math.min(
      task.target,
      calculateTaskEventProgress(definition.condition, event, task.progress),
    );
    const completed = progress >= task.target;
    const next = {
      ...task,
      progress,
      completed,
      completedAt: completed ? event.occurredAt : null,
    };
    if (completed) newlyCompleted.push(next);
    return next;
  };
  const nextProfile: PlayerProfile = {
    ...profile,
    tasks: {
      ...profile.tasks,
      daily: profile.tasks.daily.map(update),
      weekly: profile.tasks.weekly.map(update),
      processedEventIds: [...profile.tasks.processedEventIds, event.id].slice(-500),
      completedTaskInstanceIds: [
        ...profile.tasks.completedTaskInstanceIds,
        ...newlyCompleted.map((task) => task.instanceId),
      ].slice(-500),
      unseenCompletedTaskInstanceIds: [
        ...profile.tasks.unseenCompletedTaskInstanceIds,
        ...newlyCompleted.map((task) => task.instanceId),
      ].slice(-20),
      lastUpdatedAt: event.occurredAt,
    },
    recentActivity: newlyCompleted.reduce(
      (items, task) => {
        const definition = getTaskDefinition(task.definitionId)!;
        return [
          {
            id: `activity-task-complete-${task.instanceId}`,
            type: 'task' as const,
            title: `Задание выполнено: ${definition.title}`,
            description: 'Награда ожидает получения',
            createdAt: event.occurredAt,
          },
          ...items,
        ].slice(0, 20);
      },
      profile.recentActivity,
    ),
  };
  commitPlayerProfile(nextProfile);
  return { duplicate: false, newlyCompleted };
}

export function claimTaskReward(
  instanceId: string,
  provider: TaskTimeProvider = taskTimeProvider,
) {
  initializeTasks(provider);
  const task = [...getPlayerProfile().tasks.daily, ...getPlayerProfile().tasks.weekly]
    .find((item) => item.instanceId === instanceId);
  const definition = task ? getTaskDefinition(task.definitionId) : undefined;
  if (!task || !definition) return { granted: false, profile: getPlayerProfile() };
  return applyTaskReward(
    task.instanceId,
    definition.title,
    definition.reward,
    provider.now().toISOString(),
  );
}

export function getTaskSummary(profile = getPlayerProfile()) {
  const all = [...profile.tasks.daily, ...profile.tasks.weekly];
  return {
    dailyCompleted: profile.tasks.daily.filter((task) => task.completed).length,
    weeklyCompleted: profile.tasks.weekly.filter((task) => task.completed).length,
    unclaimed: all.filter((task) => task.completed && !task.claimed).length,
    totalCompleted: profile.tasks.completedTaskInstanceIds.length,
    totalClaimed: profile.tasks.totalClaimed,
  };
}

export function markTaskCompletionNotificationViewed(instanceId: string) {
  const profile = getPlayerProfile();
  return commitPlayerProfile({
    ...profile,
    tasks: {
      ...profile.tasks,
      unseenCompletedTaskInstanceIds:
        profile.tasks.unseenCompletedTaskInstanceIds.filter((id) => id !== instanceId),
    },
  });
}

export function setTaskDevelopmentOffset(offsetMs: number) {
  taskTimeProvider.setDevelopmentOffset(offsetMs);
  return initializeTasks();
}

export function resetTaskStateForDevelopment() {
  const profile = getPlayerProfile();
  commitPlayerProfile({
    ...profile,
    tasks: {
      ...profile.tasks,
      dailyPeriodKey: '',
      weeklyPeriodKey: '',
      daily: [],
      weekly: [],
      processedEventIds: [],
      unseenCompletedTaskInstanceIds: [],
    },
  });
  return initializeTasks();
}

export function regenerateTasksForDevelopment(cadence: 'daily' | 'weekly') {
  const profile = getPlayerProfile();
  commitPlayerProfile({
    ...profile,
    tasks: {
      ...profile.tasks,
      ...(cadence === 'daily'
        ? { dailyPeriodKey: '', daily: [] }
        : { weeklyPeriodKey: '', weekly: [] }),
    },
  });
  return initializeTasks();
}

export function completeTaskForDevelopment(instanceId: string) {
  const profile = initializeTasks();
  const occurredAt = taskTimeProvider.now().toISOString();
  const update = (task: ActiveTask) =>
    task.instanceId === instanceId
      ? { ...task, progress: task.target, completed: true, completedAt: occurredAt }
      : task;
  return commitPlayerProfile({
    ...profile,
    tasks: {
      ...profile.tasks,
      daily: profile.tasks.daily.map(update),
      weekly: profile.tasks.weekly.map(update),
      completedTaskInstanceIds: [...profile.tasks.completedTaskInstanceIds, instanceId],
      unseenCompletedTaskInstanceIds: [...profile.tasks.unseenCompletedTaskInstanceIds, instanceId],
    },
  });
}

export { allTaskDefinitions };
