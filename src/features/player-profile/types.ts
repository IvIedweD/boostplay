export type PlayerGameId = 'rovers';

import type { PlayerCommunityHubState } from '../gamercomm/types';
import type { PlayerTasksState } from '../tasks/types';

export interface PlayerProgression {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  xpRequiredForNextLevel: number;
  communityPoints: number;
}

export interface RoversProfileStats {
  gamesPlayed: number;
  totalPlayTimeSeconds: number;
  bestScore: number;
  highestRoverLevel: number;
  totalMerges: number;
  legendaryRoversCreated: number;
  lastScore: number;
  lastPlayedAt: string | null;
  lastRewardXp: number;
  lastRewardCommunityPoints: number;
  unseenResult: boolean;
}

export interface PlayerAchievementProgress {
  achievementId: string;
  currentProgress: number;
  target: number;
  unlocked: boolean;
  unlockedAt: string | null;
  rewardGranted: boolean;
  rewardGrantedAt: string | null;
}

export interface PlayerReward {
  id: string;
  sourceType: 'gameSession' | 'achievement' | 'levelUp' | 'task' | 'futureEvent';
  sourceId: string;
  title: string;
  description: string;
  xpAmount: number;
  communityPointAmount: number;
  createdAt: string;
  viewedAt: string | null;
}

export interface PlayerActivityItem {
  id: string;
  type: 'game' | 'record' | 'achievement' | 'levelUp' | 'reward' | 'task';
  title: string;
  description: string;
  gameId?: PlayerGameId;
  createdAt: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface PlayerProfile {
  version: 3;
  playerId: string;
  displayName: string;
  avatarId: string;
  progression: PlayerProgression;
  totals: {
    totalGamesPlayed: number;
    totalPlayTimeSeconds: number;
    achievementsUnlocked: number;
  };
  games: {
    rovers: RoversProfileStats;
  };
  achievements: PlayerAchievementProgress[];
  rewards: PlayerReward[];
  recentActivity: PlayerActivityItem[];
  completedSessionIds: string[];
  tasks: PlayerTasksState;
  communityHub: PlayerCommunityHubState;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
  migration: {
    legacyRoversMigrated: boolean;
    migratedAt?: string;
    migratedKeys?: string[];
  };
}

export interface CompletedRoversResult {
  sessionId: string;
  gameId: 'rovers';
  score: number;
  highestRoverLevel: number;
  totalMerges: number;
  legendaryRoversCreated: number;
  durationSeconds: number;
  completedAt: string;
  difficulty?: string;
  boosterActivationId?: string | null;
}

export interface ProgressRewardSummary {
  duplicate: boolean;
  xpEarned: number;
  communityPointsEarned: number;
  achievementIds: string[];
  previousLevel: number;
  newLevel: number;
  profile: PlayerProfile;
}
