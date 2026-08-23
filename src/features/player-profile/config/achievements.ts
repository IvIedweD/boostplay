export interface PlayerAchievementDefinition {
  id: string;
  gameId: 'rovers';
  title: string;
  description: string;
  iconId: string;
  target: number;
  xpReward: number;
  communityPointReward: number;
  metric: 'merges' | 'highestLevel' | 'legendary' | 'gamesPlayed';
  hidden: boolean;
}

export const playerAchievements: PlayerAchievementDefinition[] = [
  { id: 'rovers-first-merge', gameId: 'rovers', title: 'Первое слияние', description: 'Выполнить первое слияние роверов', iconId: 'merge', target: 1, xpReward: 50, communityPointReward: 10, metric: 'merges', hidden: false },
  { id: 'rovers-engineer', gameId: 'rovers', title: 'Инженер', description: 'Выполнить 100 слияний', iconId: 'tools', target: 100, xpReward: 150, communityPointReward: 30, metric: 'merges', hidden: false },
  { id: 'rovers-high-tech', gameId: 'rovers', title: 'Высокие технологии', description: 'Достичь ровера 6 уровня', iconId: 'chip', target: 6, xpReward: 120, communityPointReward: 25, metric: 'highestLevel', hidden: false },
  { id: 'rovers-legendary-builder', gameId: 'rovers', title: 'Легендарный конструктор', description: 'Создать легендарного ровера', iconId: 'star', target: 1, xpReward: 300, communityPointReward: 60, metric: 'legendary', hidden: false },
  { id: 'rovers-experienced', gameId: 'rovers', title: 'Опытный оператор', description: 'Завершить 10 партий в «Роверы»', iconId: 'badge', target: 10, xpReward: 200, communityPointReward: 40, metric: 'gamesPlayed', hidden: false },
];
