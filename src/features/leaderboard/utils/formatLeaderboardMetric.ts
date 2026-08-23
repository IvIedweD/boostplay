import type { LeaderboardCategory, RankedLeaderboardEntry } from '../types';

export const formatLeaderboardNumber = (value: number) =>
  value.toLocaleString('ru-RU');

export function formatLeaderboardMetric(
  category: LeaderboardCategory,
  entry: RankedLeaderboardEntry,
) {
  if (category === 'player-level') return `${entry.level} уровень`;
  return formatLeaderboardNumber(entry.metricValue);
}
