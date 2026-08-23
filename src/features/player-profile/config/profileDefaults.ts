import { playerAchievements } from './achievements';
import { DEFAULT_PLAYER_AVATAR_ID } from './avatars';
import { calculatePlayerLevel } from '../utils/calculatePlayerLevel';
import type { PlayerProfile } from '../types';
import { createEmptyTasksState } from '../../tasks/utils/normalizeTaskState';

export function createLocalId(prefix = 'local') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function createDefaultPlayerProfile(now = new Date().toISOString()): PlayerProfile {
  const level = calculatePlayerLevel(0);
  return {
    version: 3,
    playerId: createLocalId('player'),
    displayName: 'Игрок',
    avatarId: DEFAULT_PLAYER_AVATAR_ID,
    progression: {
      level: level.level,
      totalXp: level.totalXp,
      currentLevelXp: level.currentLevelXp,
      xpRequiredForNextLevel: level.xpRequiredForNextLevel,
      communityPoints: 0,
    },
    totals: {
      totalGamesPlayed: 0,
      totalPlayTimeSeconds: 0,
      achievementsUnlocked: 0,
    },
    games: {
      rovers: {
        gamesPlayed: 0,
        totalPlayTimeSeconds: 0,
        bestScore: 0,
        highestRoverLevel: 1,
        totalMerges: 0,
        legendaryRoversCreated: 0,
        lastScore: 0,
        lastPlayedAt: null,
        lastRewardXp: 0,
        lastRewardCommunityPoints: 0,
        unseenResult: false,
      },
    },
    achievements: playerAchievements.map((achievement) => ({
      achievementId: achievement.id,
      currentProgress: 0,
      target: achievement.target,
      unlocked: false,
      unlockedAt: null,
      rewardGranted: false,
      rewardGrantedAt: null,
    })),
    rewards: [],
    recentActivity: [],
    completedSessionIds: [],
    tasks: createEmptyTasksState(now),
    communityHub: {
      version: 1,
      readNewsIds: [],
      dismissedAnnouncementIds: [],
      visitedAt: null,
      lastNewsViewedAt: null,
    },
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now,
    migration: { legacyRoversMigrated: false },
  };
}
