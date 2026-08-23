import type { PlayerProfile } from '../player-profile/types';

export type LeaderboardCategory =
  | 'rovers-score'
  | 'legendary-rovers'
  | 'community-points'
  | 'player-level'
  | 'achievements';

export interface LeaderboardPlayer {
  id: string;
  displayName: string;
  avatarId: string;
  level: number;
  totalXp: number;
  communityPoints: number;
  achievementsUnlocked: number;
  roversBestScore: number;
  highestRoverLevel: number;
  gamesPlayed: number;
  totalMerges: number;
  legendaryRoverCount: number;
  isCurrentPlayer?: boolean;
}

export interface RankedLeaderboardEntry extends LeaderboardPlayer {
  rank: number;
  metricValue: number;
}

export interface LeaderboardResult {
  category: LeaderboardCategory;
  entries: RankedLeaderboardEntry[];
  topEntries: RankedLeaderboardEntry[];
  currentPlayerEntry: RankedLeaderboardEntry;
  currentPlayerRank: number;
  totalEntries: number;
}

export interface LeaderboardDataSource {
  getEntries(): LeaderboardPlayer[];
}

export type CurrentPlayerProfile = PlayerProfile;
