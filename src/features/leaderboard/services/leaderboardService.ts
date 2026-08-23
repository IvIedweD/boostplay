import type { PlayerProfile } from '../../player-profile/types';
import { demoLeaderboardPlayers } from '../config/demoLeaderboardPlayers';
import { buildLeaderboard } from '../utils/buildLeaderboard';
import type {
  LeaderboardCategory,
  LeaderboardDataSource,
  LeaderboardPlayer,
} from '../types';

export class LocalDemoLeaderboardDataSource implements LeaderboardDataSource {
  getEntries(): LeaderboardPlayer[] {
    return demoLeaderboardPlayers.map((player) => ({ ...player }));
  }
}

const localDataSource = new LocalDemoLeaderboardDataSource();

export function getLeaderboard(
  category: LeaderboardCategory,
  currentProfile: PlayerProfile,
  dataSource: LeaderboardDataSource = localDataSource,
) {
  return buildLeaderboard(category, currentProfile, dataSource.getEntries());
}
