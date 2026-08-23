import { playerAchievements } from '../config/achievements';
import { createLocalId } from '../config/profileDefaults';
import { calculateRoversReward } from '../rewards/calculateRoversReward';
import {
  loadPlayerProfile,
  resetPlayerProfileForDevelopment,
  savePlayerProfile,
} from '../storage/playerProfileStorage';
import type {
  CompletedRoversResult,
  PlayerActivityItem,
  PlayerProfile,
  PlayerReward,
  ProgressRewardSummary,
} from '../types';
import { addPlayerXp, calculatePlayerLevel } from '../utils/calculatePlayerLevel';
import { normalizePlayerProfile } from '../utils/normalizePlayerProfile';
import { validatePlayerName } from '../utils/validatePlayerName';
import { migrateLegacyRoversProfile } from '../storage/migrateLegacyRoversProfile';

type Listener = () => void;
const listeners = new Set<Listener>();
let currentProfile: PlayerProfile | null = null;

function notify() {
  for (const listener of listeners) listener();
}

function commit(profile: PlayerProfile) {
  const now = new Date().toISOString();
  const normalized = normalizePlayerProfile({
    ...profile,
    updatedAt: now,
    lastActiveAt: now,
  });
  normalized.totals.achievementsUnlocked = normalized.achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;
  currentProfile = savePlayerProfile(normalized);
  notify();
  return currentProfile;
}

export function getPlayerProfile() {
  currentProfile ??= loadPlayerProfile();
  return currentProfile;
}

export function subscribeToPlayerProfile(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updatePlayerDisplayName(value: string) {
  const validation = validatePlayerName(value);
  if (!validation.valid) return validation;
  commit({ ...getPlayerProfile(), displayName: validation.value });
  return validation;
}

export function updatePlayerAvatar(avatarId: string) {
  return commit({ ...getPlayerProfile(), avatarId });
}

function addReward(
  rewards: PlayerReward[],
  reward: PlayerReward,
) {
  if (rewards.some((item) => item.id === reward.id)) return rewards;
  return [reward, ...rewards].slice(0, 50);
}

function addActivity(
  activities: PlayerActivityItem[],
  activity: PlayerActivityItem,
) {
  if (activities.some((item) => item.id === activity.id)) return activities;
  return [activity, ...activities].slice(0, 20);
}

export function commitPlayerProfile(profile: PlayerProfile) {
  return commit(profile);
}

export function applyTaskReward(
  taskInstanceId: string,
  title: string,
  reward: { xp: number; communityPoints: number },
  claimedAt: string,
  automaticallyClaimed = false,
) {
  const profile = getPlayerProfile();
  const task = [...profile.tasks.daily, ...profile.tasks.weekly].find(
    (item) => item.instanceId === taskInstanceId,
  );
  if (!task || !task.completed || task.claimed) {
    return { granted: false, profile };
  }
  const safeXp = Math.max(0, Math.floor(reward.xp));
  const safePoints = Math.max(0, Math.floor(reward.communityPoints));
  const xp = addPlayerXp(profile.progression.totalXp, safeXp);
  const updateTask = (item: typeof task) =>
    item.instanceId === taskInstanceId
      ? { ...item, claimed: true, claimedAt }
      : item;
  const next = commit({
    ...profile,
    progression: {
      ...profile.progression,
      ...xp.progression,
      communityPoints: profile.progression.communityPoints + safePoints,
    },
    tasks: {
      ...profile.tasks,
      daily: profile.tasks.daily.map(updateTask),
      weekly: profile.tasks.weekly.map(updateTask),
      unseenCompletedTaskInstanceIds:
        profile.tasks.unseenCompletedTaskInstanceIds.filter(
          (id) => id !== taskInstanceId,
        ),
      totalClaimed: profile.tasks.totalClaimed + 1,
      totalRewardXp: profile.tasks.totalRewardXp + safeXp,
      totalRewardCommunityPoints:
        profile.tasks.totalRewardCommunityPoints + safePoints,
      lastUpdatedAt: claimedAt,
    },
    rewards: addReward(profile.rewards, {
      id: `reward-task-${taskInstanceId}`,
      sourceType: 'task',
      sourceId: taskInstanceId,
      title: `Задание «${title}»`,
      description: automaticallyClaimed
        ? 'Награда получена автоматически при обновлении заданий'
        : 'Награда за выполнение задания',
      xpAmount: safeXp,
      communityPointAmount: safePoints,
      createdAt: claimedAt,
      viewedAt: null,
    }),
    recentActivity: addActivity(profile.recentActivity, {
      id: `activity-task-claim-${taskInstanceId}`,
      type: 'task',
      title: automaticallyClaimed
        ? `Автоматически получена награда «${title}»`
        : `Получена награда «${title}»`,
      description: `+${safeXp} XP · +${safePoints} очков сообщества`,
      createdAt: claimedAt,
    }),
  });
  return { granted: true, profile: next };
}

function metricValue(profile: PlayerProfile, metric: string) {
  const rovers = profile.games.rovers;
  if (metric === 'merges') return rovers.totalMerges;
  if (metric === 'highestLevel') return rovers.highestRoverLevel;
  if (metric === 'legendary') return rovers.legendaryRoversCreated;
  return rovers.gamesPlayed;
}

export function applyCompletedGameResult(
  result: CompletedRoversResult,
): ProgressRewardSummary {
  const existing = getPlayerProfile();
  if (existing.completedSessionIds.includes(result.sessionId)) {
    return {
      duplicate: true,
      xpEarned: 0,
      communityPointsEarned: 0,
      achievementIds: [],
      previousLevel: existing.progression.level,
      newLevel: existing.progression.level,
      profile: existing,
    };
  }

  const now = result.completedAt;
  const sessionReward = calculateRoversReward(result);
  const previousLevel = existing.progression.level;
  const isRecord = result.score > existing.games.rovers.bestScore;
  let xpEarned = sessionReward.xp;
  let pointsEarned = sessionReward.communityPoints;
  let rewards = addReward(existing.rewards, {
    id: `reward-session-${result.sessionId}`,
    sourceType: 'gameSession',
    sourceId: result.sessionId,
    title: 'Награда за «Роверы»',
    description: `Счёт: ${result.score}`,
    xpAmount: sessionReward.xp,
    communityPointAmount: sessionReward.communityPoints,
    createdAt: now,
    viewedAt: null,
  });
  let activity = addActivity(existing.recentActivity, {
    id: `activity-session-${result.sessionId}`,
    type: 'game',
    title: 'Сыграна партия в «Роверы»',
    description: `Счёт ${result.score}, ровер ${result.highestRoverLevel} уровня`,
    gameId: 'rovers',
    createdAt: now,
  });
  if (isRecord) {
    activity = addActivity(activity, {
      id: `activity-record-${result.sessionId}`,
      type: 'record',
      title: `Новый рекорд: ${result.score}`,
      description: 'Установлен новый рекорд в игре «Роверы»',
      gameId: 'rovers',
      createdAt: now,
    });
  }

  let profile: PlayerProfile = {
    ...existing,
    progression: {
      ...existing.progression,
      communityPoints:
        existing.progression.communityPoints + sessionReward.communityPoints,
    },
    totals: {
      ...existing.totals,
      totalGamesPlayed: existing.totals.totalGamesPlayed + 1,
      totalPlayTimeSeconds:
        existing.totals.totalPlayTimeSeconds +
        Math.max(0, Math.floor(result.durationSeconds)),
    },
    games: {
      ...existing.games,
      rovers: {
        ...existing.games.rovers,
        gamesPlayed: existing.games.rovers.gamesPlayed + 1,
        totalPlayTimeSeconds:
          existing.games.rovers.totalPlayTimeSeconds +
          Math.max(0, Math.floor(result.durationSeconds)),
        bestScore: Math.max(existing.games.rovers.bestScore, result.score),
        highestRoverLevel: Math.max(
          existing.games.rovers.highestRoverLevel,
          result.highestRoverLevel,
        ),
        totalMerges:
          existing.games.rovers.totalMerges + Math.max(0, result.totalMerges),
        legendaryRoversCreated:
          existing.games.rovers.legendaryRoversCreated +
          Math.max(0, result.legendaryRoversCreated),
        lastScore: Math.max(0, result.score),
        lastPlayedAt: result.completedAt,
        lastRewardXp: sessionReward.xp,
        lastRewardCommunityPoints: sessionReward.communityPoints,
        unseenResult: true,
      },
    },
    rewards,
    recentActivity: activity,
    completedSessionIds: [
      ...existing.completedSessionIds,
      result.sessionId,
    ].slice(-200),
  };

  const unlockedIds: string[] = [];
  profile.achievements = profile.achievements.map((progress) => {
    const definition = playerAchievements.find(
      (item) => item.id === progress.achievementId,
    )!;
    const currentProgress = Math.min(
      definition.target,
      metricValue(profile, definition.metric),
    );
    if (progress.unlocked || currentProgress < definition.target) {
      return { ...progress, currentProgress };
    }
    unlockedIds.push(definition.id);
    xpEarned += definition.xpReward;
    pointsEarned += definition.communityPointReward;
    rewards = addReward(rewards, {
      id: `reward-achievement-${definition.id}`,
      sourceType: 'achievement',
      sourceId: definition.id,
      title: definition.title,
      description: 'Награда за достижение',
      xpAmount: definition.xpReward,
      communityPointAmount: definition.communityPointReward,
      createdAt: now,
      viewedAt: null,
    });
    activity = addActivity(activity, {
      id: `activity-achievement-${definition.id}`,
      type: 'achievement',
      title: `Получено достижение «${definition.title}»`,
      description: definition.description,
      gameId: 'rovers',
      createdAt: now,
    });
    return {
      ...progress,
      currentProgress,
      unlocked: true,
      unlockedAt: now,
      rewardGranted: true,
      rewardGrantedAt: now,
    };
  });

  const xpResult = addPlayerXp(existing.progression.totalXp, xpEarned);
  profile = {
    ...profile,
    progression: {
      level: xpResult.progression.level,
      totalXp: xpResult.progression.totalXp,
      currentLevelXp: xpResult.progression.currentLevelXp,
      xpRequiredForNextLevel: xpResult.progression.xpRequiredForNextLevel,
      communityPoints:
        existing.progression.communityPoints + pointsEarned,
    },
    rewards,
    recentActivity: activity,
  };
  if (xpResult.newLevel > previousLevel) {
    profile.recentActivity = addActivity(profile.recentActivity, {
      id: `activity-level-${result.sessionId}`,
      type: 'levelUp',
      title: `Достигнут уровень ${xpResult.newLevel}`,
      description: `Получено уровней: ${xpResult.newLevel - previousLevel}`,
      createdAt: now,
    });
  }

  const saved = commit(profile);
  return {
    duplicate: false,
    xpEarned,
    communityPointsEarned: pointsEarned,
    achievementIds: unlockedIds,
    previousLevel,
    newLevel: saved.progression.level,
    profile: saved,
  };
}

export function addPlayerXpForDevelopment(amount: number) {
  const profile = getPlayerProfile();
  const xp = addPlayerXp(profile.progression.totalXp, amount);
  return commit({
    ...profile,
    progression: {
      ...profile.progression,
      ...xp.progression,
    },
  });
}

export function addCommunityPointsForDevelopment(amount: number) {
  const profile = getPlayerProfile();
  return commit({
    ...profile,
    progression: {
      ...profile.progression,
      communityPoints: Math.max(
        0,
        profile.progression.communityPoints + Math.floor(amount),
      ),
    },
  });
}

export function unlockAchievementForDevelopment(achievementId: string) {
  const profile = getPlayerProfile();
  const definition = playerAchievements.find(
    (achievement) => achievement.id === achievementId,
  );
  const progress = profile.achievements.find(
    (achievement) => achievement.achievementId === achievementId,
  );
  if (!definition || !progress || progress.unlocked) return profile;
  const now = new Date().toISOString();
  const xp = addPlayerXp(
    profile.progression.totalXp,
    definition.xpReward,
  );
  return commit({
    ...profile,
    progression: {
      ...profile.progression,
      ...xp.progression,
      communityPoints:
        profile.progression.communityPoints +
        definition.communityPointReward,
    },
    achievements: profile.achievements.map((achievement) =>
      achievement.achievementId === achievementId
        ? {
            ...achievement,
            currentProgress: achievement.target,
            unlocked: true,
            unlockedAt: now,
            rewardGranted: true,
            rewardGrantedAt: now,
          }
        : achievement,
    ),
    rewards: addReward(profile.rewards, {
      id: `reward-achievement-${achievementId}`,
      sourceType: 'achievement',
      sourceId: achievementId,
      title: definition.title,
      description: 'DEV-разблокировка достижения',
      xpAmount: definition.xpReward,
      communityPointAmount: definition.communityPointReward,
      createdAt: now,
      viewedAt: null,
    }),
  });
}

export function inspectLegacyRoversMigration() {
  return migrateLegacyRoversProfile(
    {
      ...getPlayerProfile(),
      migration: { legacyRoversMigrated: false },
    },
  );
}

export function markAllPlayerRewardsViewed() {
  const now = new Date().toISOString();
  return commit({
    ...getPlayerProfile(),
    rewards: getPlayerProfile().rewards.map((reward) => ({
      ...reward,
      viewedAt: reward.viewedAt ?? now,
    })),
  });
}

export function markRoversProfileResultViewed() {
  const profile = getPlayerProfile();
  return commit({
    ...profile,
    games: {
      ...profile.games,
      rovers: { ...profile.games.rovers, unseenResult: false },
    },
  });
}

export function resetLocalPlayerProfile() {
  currentProfile = resetPlayerProfileForDevelopment();
  notify();
  return currentProfile;
}

export function getRoversProfileSummary() {
  const data = getPlayerProfile().games.rovers;
  return {
    status: data.unseenResult ? ('rewardAvailable' as const) : ('default' as const),
    preview: `Рекорд: ${data.bestScore} · Лучший: уровень ${data.highestRoverLevel} · Игр: ${data.gamesPlayed} · Слияний: ${data.totalMerges} · Легендарных: ${data.legendaryRoversCreated}`,
    data,
  };
}

export function createPlayerSessionId() {
  return createLocalId('rovers-session');
}

export function getPlayerLevelProgress() {
  return calculatePlayerLevel(getPlayerProfile().progression.totalXp);
}
