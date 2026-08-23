import { playerAchievements } from '../config/achievements';
import { createDefaultPlayerProfile } from '../config/profileDefaults';
import { getPlayerAvatar } from '../config/avatars';
import { calculatePlayerLevel } from './calculatePlayerLevel';
import { validatePlayerName } from './validatePlayerName';
import type { PlayerProfile } from '../types';
import { normalizeTaskState } from '../../tasks/utils/normalizeTaskState';

const number = (value: unknown, fallback = 0, max = Number.MAX_SAFE_INTEGER) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(0, Math.floor(value)))
    : fallback;

const date = (value: unknown, fallback: string | null) =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : fallback;

const stringIds = (value: unknown, limit: number) =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : []).filter(
        (item): item is string => typeof item === 'string' && item.length > 0,
      ),
    ),
  ).slice(-limit);

export function normalizePlayerProfile(raw: unknown): PlayerProfile {
  const fallback = createDefaultPlayerProfile();
  if (!raw || typeof raw !== 'object') return fallback;
  const source = raw as Partial<PlayerProfile>;
  const sourceProgression = source.progression ?? fallback.progression;
  const calculated = calculatePlayerLevel(number(sourceProgression.totalXp));
  const rovers = source.games?.rovers ?? fallback.games.rovers;
  const now = new Date().toISOString();
  const achievementById = new Map(
    (Array.isArray(source.achievements) ? source.achievements : []).map(
      (item) => [item?.achievementId, item],
    ),
  );
  const displayName = validatePlayerName(source.displayName ?? '');

  const profile: PlayerProfile = {
    version: 3,
    playerId:
      typeof source.playerId === 'string' && source.playerId.length >= 8
        ? source.playerId
        : fallback.playerId,
    displayName: displayName.valid ? displayName.value : fallback.displayName,
    avatarId: getPlayerAvatar(source.avatarId ?? '').id,
    progression: {
      level: calculated.level,
      totalXp: calculated.totalXp,
      currentLevelXp: calculated.currentLevelXp,
      xpRequiredForNextLevel: calculated.xpRequiredForNextLevel,
      communityPoints: number(sourceProgression.communityPoints),
    },
    totals: {
      totalGamesPlayed: number(source.totals?.totalGamesPlayed),
      totalPlayTimeSeconds: number(source.totals?.totalPlayTimeSeconds),
      achievementsUnlocked: 0,
    },
    games: {
      rovers: {
        gamesPlayed: number(rovers.gamesPlayed),
        totalPlayTimeSeconds: number(rovers.totalPlayTimeSeconds),
        bestScore: number(rovers.bestScore),
        highestRoverLevel: Math.min(8, Math.max(1, number(rovers.highestRoverLevel, 1))),
        totalMerges: number(rovers.totalMerges),
        legendaryRoversCreated: number(rovers.legendaryRoversCreated),
        lastScore: number(rovers.lastScore),
        lastPlayedAt: date(rovers.lastPlayedAt, null),
        lastRewardXp: number(rovers.lastRewardXp),
        lastRewardCommunityPoints: number(rovers.lastRewardCommunityPoints),
        unseenResult: Boolean(rovers.unseenResult),
      },
    },
    achievements: playerAchievements.map((definition) => {
      const item = achievementById.get(definition.id);
      const unlocked = Boolean(item?.unlocked);
      return {
        achievementId: definition.id,
        currentProgress: Math.min(
          definition.target,
          number(item?.currentProgress),
        ),
        target: definition.target,
        unlocked,
        unlockedAt: unlocked ? date(item?.unlockedAt, now) : null,
        rewardGranted: unlocked && Boolean(item?.rewardGranted),
        rewardGrantedAt:
          unlocked && item?.rewardGranted
            ? date(item.rewardGrantedAt, now)
            : null,
      };
    }),
    rewards: (Array.isArray(source.rewards) ? source.rewards : [])
      .filter((item) => item && typeof item.id === 'string')
      .slice(0, 50),
    recentActivity: (Array.isArray(source.recentActivity)
      ? source.recentActivity
      : [])
      .filter((item) => item && typeof item.id === 'string')
      .slice(0, 20),
    completedSessionIds: (Array.isArray(source.completedSessionIds)
      ? source.completedSessionIds
      : [])
      .filter((item): item is string => typeof item === 'string')
      .slice(-200),
    tasks: normalizeTaskState(source.tasks, now),
    communityHub: {
      version: 1,
      readNewsIds: stringIds(source.communityHub?.readNewsIds, 200),
      dismissedAnnouncementIds: stringIds(
        source.communityHub?.dismissedAnnouncementIds,
        100,
      ),
      visitedAt: date(source.communityHub?.visitedAt, null),
      lastNewsViewedAt: date(source.communityHub?.lastNewsViewedAt, null),
    },
    createdAt: date(source.createdAt, fallback.createdAt) ?? fallback.createdAt,
    updatedAt: date(source.updatedAt, now) ?? now,
    lastActiveAt: date(source.lastActiveAt, now) ?? now,
    migration: {
      legacyRoversMigrated: Boolean(source.migration?.legacyRoversMigrated),
      migratedAt: date(source.migration?.migratedAt, null) ?? undefined,
      migratedKeys: Array.isArray(source.migration?.migratedKeys)
        ? source.migration.migratedKeys.filter(
            (item): item is string => typeof item === 'string',
          )
        : undefined,
    },
  };
  profile.totals.achievementsUnlocked = profile.achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;
  return profile;
}
