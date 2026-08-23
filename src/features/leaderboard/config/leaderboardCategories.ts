import type { LeaderboardCategory, LeaderboardPlayer } from '../types';

export interface LeaderboardCategoryConfig {
  id: LeaderboardCategory;
  title: string;
  shortTitle: string;
  subtitle: string;
  metricLabel: string;
  secondaryLabel?: string;
  gamesRelevant: boolean;
  getMetric: (player: LeaderboardPlayer) => number;
  getSecondary: (player: LeaderboardPlayer) => number;
}

export const leaderboardCategories: LeaderboardCategoryConfig[] = [
  {
    id: 'rovers-score',
    title: 'Рекорд в Роверах',
    shortTitle: 'Рекорд в Роверах',
    subtitle: 'Лучшие результаты в локальной версии мини-игры «Роверы».',
    metricLabel: 'Рекорд',
    gamesRelevant: true,
    getMetric: (player) => player.roversBestScore,
    getSecondary: (player) => player.highestRoverLevel,
  },
  {
    id: 'legendary-rovers',
    title: 'Легендарные роверы',
    shortTitle: 'Легендарные',
    subtitle: 'Игроки, собравшие больше всего легендарных роверов.',
    metricLabel: 'Легендарные',
    gamesRelevant: true,
    getMetric: (player) => player.legendaryRoverCount,
    getSecondary: (player) => player.highestRoverLevel,
  },
  {
    id: 'community-points',
    title: 'Очки сообщества',
    shortTitle: 'Очки сообщества',
    subtitle: 'Локальный вклад игроков в развитие сообщества GamerComm.',
    metricLabel: 'Очки сообщества',
    secondaryLabel: 'Уровень',
    gamesRelevant: false,
    getMetric: (player) => player.communityPoints,
    getSecondary: (player) => player.level,
  },
  {
    id: 'player-level',
    title: 'Уровень игрока',
    shortTitle: 'Уровень',
    subtitle: 'Рейтинг общего прогресса и накопленного опыта.',
    metricLabel: 'Уровень',
    secondaryLabel: 'Всего XP',
    gamesRelevant: false,
    getMetric: (player) => player.level,
    getSecondary: (player) => player.totalXp,
  },
  {
    id: 'achievements',
    title: 'Достижения',
    shortTitle: 'Достижения',
    subtitle: 'Рейтинг по количеству открытых достижений.',
    metricLabel: 'Достижения',
    secondaryLabel: 'Уровень',
    gamesRelevant: false,
    getMetric: (player) => player.achievementsUnlocked,
    getSecondary: (player) => player.level,
  },
];

export const DEFAULT_LEADERBOARD_CATEGORY: LeaderboardCategory = 'rovers-score';

export function isLeaderboardCategory(value: string | null): value is LeaderboardCategory {
  return leaderboardCategories.some((category) => category.id === value);
}

export function getLeaderboardCategory(category: LeaderboardCategory) {
  return leaderboardCategories.find((item) => item.id === category)!;
}
