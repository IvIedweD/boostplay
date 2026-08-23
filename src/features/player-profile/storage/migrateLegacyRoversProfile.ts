import {
  loadRoversGameStorage,
  ROVERS_STORAGE_KEY,
} from '../../rovers-game/storage/roversGameStorage';
import type { PlayerProfile } from '../types';
import { playerAchievements } from '../config/achievements';

export function migrateLegacyRoversProfile(
  profile: PlayerProfile,
  storage?: Storage,
) {
  if (profile.migration.legacyRoversMigrated) return profile;
  const target = storage ?? window.localStorage;
  const hasLegacy = target.getItem(ROVERS_STORAGE_KEY) !== null;
  const legacy = loadRoversGameStorage(target);
  const lastDuration = Math.floor((legacy.lastResult?.durationMs ?? 0) / 1000);
  const migratedAt = new Date().toISOString();
  const metricValue = (metric: string) => {
    if (metric === 'merges') return legacy.totalMerges;
    if (metric === 'highestLevel') return legacy.highestLevel;
    if (metric === 'legendary') return legacy.legendaryRoverCount;
    return legacy.totalGamesPlayed;
  };

  return {
    ...profile,
    progression: {
      ...profile.progression,
      communityPoints: Math.max(
        profile.progression.communityPoints,
        legacy.totalCommunityPoints,
      ),
    },
    totals: {
      ...profile.totals,
      totalGamesPlayed: Math.max(
        profile.totals.totalGamesPlayed,
        legacy.totalGamesPlayed,
      ),
      totalPlayTimeSeconds: Math.max(
        profile.totals.totalPlayTimeSeconds,
        lastDuration,
      ),
    },
    games: {
      ...profile.games,
      rovers: {
        ...profile.games.rovers,
        gamesPlayed: Math.max(
          profile.games.rovers.gamesPlayed,
          legacy.totalGamesPlayed,
        ),
        totalPlayTimeSeconds: Math.max(
          profile.games.rovers.totalPlayTimeSeconds,
          lastDuration,
        ),
        bestScore: Math.max(profile.games.rovers.bestScore, legacy.bestScore),
        highestRoverLevel: Math.max(
          profile.games.rovers.highestRoverLevel,
          legacy.highestLevel,
        ),
        totalMerges: Math.max(
          profile.games.rovers.totalMerges,
          legacy.totalMerges,
        ),
        legendaryRoversCreated: Math.max(
          profile.games.rovers.legendaryRoversCreated,
          legacy.legendaryRoverCount,
        ),
        lastScore: legacy.lastResult?.score ?? profile.games.rovers.lastScore,
        lastPlayedAt:
          legacy.lastResult?.completedAt ?? profile.games.rovers.lastPlayedAt,
        lastRewardCommunityPoints:
          legacy.lastResult?.communityPoints ??
          profile.games.rovers.lastRewardCommunityPoints,
        unseenResult:
          profile.games.rovers.unseenResult || legacy.unseenResult,
      },
    },
    achievements: profile.achievements.map((progress) => {
      const definition = playerAchievements.find(
        (achievement) => achievement.id === progress.achievementId,
      );
      return definition
        ? {
            ...progress,
            currentProgress: Math.min(
              definition.target,
              Math.max(
                progress.currentProgress,
                metricValue(definition.metric),
              ),
            ),
          }
        : progress;
    }),
    migration: {
      legacyRoversMigrated: true,
      migratedAt,
      migratedKeys: hasLegacy ? [ROVERS_STORAGE_KEY] : [],
    },
    updatedAt: migratedAt,
  } satisfies PlayerProfile;
}
