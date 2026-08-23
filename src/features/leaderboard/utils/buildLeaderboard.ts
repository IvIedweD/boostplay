import type { PlayerProfile } from '../../player-profile/types';
import { getLeaderboardCategory } from '../config/leaderboardCategories';
import type {
  LeaderboardCategory,
  LeaderboardPlayer,
  LeaderboardResult,
  RankedLeaderboardEntry,
} from '../types';

const finiteInteger = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
};

export function normalizeLeaderboardPlayer(
  player: Partial<LeaderboardPlayer>,
): LeaderboardPlayer {
  return {
    id: String(player.id || 'unknown'),
    displayName: String(player.displayName || 'Игрок'),
    avatarId: String(player.avatarId || 'gamepad'),
    level: Math.max(1, finiteInteger(player.level, 1)),
    totalXp: finiteInteger(player.totalXp),
    communityPoints: finiteInteger(player.communityPoints),
    achievementsUnlocked: finiteInteger(player.achievementsUnlocked),
    roversBestScore: finiteInteger(player.roversBestScore),
    highestRoverLevel: Math.max(1, finiteInteger(player.highestRoverLevel, 1)),
    gamesPlayed: finiteInteger(player.gamesPlayed),
    totalMerges: finiteInteger(player.totalMerges),
    legendaryRoverCount: finiteInteger(player.legendaryRoverCount),
    isCurrentPlayer: Boolean(player.isCurrentPlayer),
  };
}

export function playerProfileToLeaderboardPlayer(
  profile: PlayerProfile,
): LeaderboardPlayer {
  return normalizeLeaderboardPlayer({
    id: `current:${profile.playerId}`,
    displayName: profile.displayName,
    avatarId: profile.avatarId,
    level: profile.progression.level,
    totalXp: profile.progression.totalXp,
    communityPoints: profile.progression.communityPoints,
    achievementsUnlocked: profile.totals.achievementsUnlocked,
    roversBestScore: profile.games.rovers.bestScore,
    highestRoverLevel: profile.games.rovers.highestRoverLevel,
    gamesPlayed: profile.games.rovers.gamesPlayed,
    totalMerges: profile.games.rovers.totalMerges,
    legendaryRoverCount: profile.games.rovers.legendaryRoversCreated,
    isCurrentPlayer: true,
  });
}

function compare(category: LeaderboardCategory, a: LeaderboardPlayer, b: LeaderboardPlayer) {
  const descending = (left: number, right: number) => right - left;
  const fields: Array<keyof LeaderboardPlayer> =
    category === 'rovers-score'
      ? ['roversBestScore', 'highestRoverLevel', 'totalMerges']
      : category === 'legendary-rovers'
          ? ['legendaryRoverCount', 'highestRoverLevel', 'roversBestScore']
          : category === 'community-points'
            ? ['communityPoints', 'totalXp', 'level']
            : category === 'player-level'
              ? ['level', 'totalXp', 'communityPoints']
              : ['achievementsUnlocked', 'level', 'communityPoints'];
  for (const field of fields) {
    const difference = descending(Number(a[field]), Number(b[field]));
    if (difference !== 0) return difference;
  }
  return a.id.localeCompare(b.id, 'ru');
}

export function buildLeaderboard(
  category: LeaderboardCategory,
  currentProfile: PlayerProfile,
  competitors: Array<Partial<LeaderboardPlayer>>,
): LeaderboardResult {
  const currentPlayer = playerProfileToLeaderboardPlayer(currentProfile);
  const players = competitors
    .filter((player) => player.id !== currentPlayer.id && !player.isCurrentPlayer)
    .map(normalizeLeaderboardPlayer)
    .concat(currentPlayer)
    .sort((a, b) => compare(category, a, b));
  const config = getLeaderboardCategory(category);
  let rank = 0;
  let previousMetric: number | null = null;
  const entries: RankedLeaderboardEntry[] = players.map((player) => {
    const metricValue = config.getMetric(player);
    if (previousMetric === null || metricValue !== previousMetric) rank += 1;
    previousMetric = metricValue;
    return { ...player, rank, metricValue };
  });
  const currentPlayerEntry = entries.find((entry) => entry.isCurrentPlayer)!;
  return {
    category,
    entries,
    topEntries: entries.slice(0, 20),
    currentPlayerEntry,
    currentPlayerRank: currentPlayerEntry.rank,
    totalEntries: entries.length,
  };
}
