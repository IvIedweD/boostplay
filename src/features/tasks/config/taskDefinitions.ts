import type { TaskDefinition } from '../types';

export const dailyTaskDefinitions: TaskDefinition[] = [
  { id: 'daily-first-session', cadence: 'daily', title: 'Первый запуск', description: 'Сыграйте 1 партию в «Роверы».', difficulty: 'easy', condition: { type: 'rovers.sessionsPlayed', target: 1 }, reward: { xp: 50, communityPoints: 10 }, iconId: 'play', enabled: true },
  { id: 'daily-merges-15', cadence: 'daily', title: 'Начало цепочки', description: 'Выполните 15 слияний.', difficulty: 'easy', condition: { type: 'rovers.totalMerges', target: 15 }, reward: { xp: 55, communityPoints: 10 }, iconId: 'merge', enabled: true },
  { id: 'daily-merges-35', cadence: 'daily', title: 'Опытный механик', description: 'Выполните 35 слияний.', difficulty: 'medium', condition: { type: 'rovers.totalMerges', target: 35 }, reward: { xp: 100, communityPoints: 20 }, iconId: 'tools', enabled: true },
  { id: 'daily-score-4000', cadence: 'daily', title: 'Высокий результат', description: 'Наберите 4 000 очков за одну партию.', difficulty: 'medium', condition: { type: 'rovers.scoreInSession', target: 4000 }, reward: { xp: 110, communityPoints: 22 }, iconId: 'score', enabled: true },
  { id: 'daily-level-5', cadence: 'daily', title: 'Продвинутая модель', description: 'Достигните ровера 5-го уровня.', difficulty: 'medium', condition: { type: 'rovers.highestLevelInSession', target: 5 }, reward: { xp: 90, communityPoints: 18 }, iconId: 'rover', enabled: true },
  { id: 'daily-level-6', cadence: 'daily', title: 'Технологический прорыв', description: 'Достигните ровера 6-го уровня.', difficulty: 'medium', condition: { type: 'rovers.highestLevelInSession', target: 6 }, reward: { xp: 120, communityPoints: 25 }, iconId: 'chip', enabled: true },
  { id: 'daily-playtime', cadence: 'daily', title: 'В игре', description: 'Проведите в «Роверах» 5 минут.', difficulty: 'medium', condition: { type: 'rovers.playTimeSeconds', target: 300 }, reward: { xp: 90, communityPoints: 18 }, iconId: 'time', enabled: true },
  { id: 'daily-gamercomm', cadence: 'daily', title: 'Знакомство с городом', description: 'Откройте здание GamerComm.', difficulty: 'easy', condition: { type: 'navigation.gamercommOpened', target: 1 }, reward: { xp: 40, communityPoints: 8 }, iconId: 'city', enabled: true },
  { id: 'daily-leaderboard', cadence: 'daily', title: 'Проверить результаты', description: 'Посетите страницу рейтинга.', difficulty: 'easy', condition: { type: 'navigation.leaderboardVisited', target: 1 }, reward: { xp: 40, communityPoints: 8 }, iconId: 'rating', enabled: true },
  { id: 'daily-profile', cadence: 'daily', title: 'Личный кабинет', description: 'Посетите профиль игрока.', difficulty: 'easy', condition: { type: 'navigation.profileVisited', target: 1 }, reward: { xp: 40, communityPoints: 8 }, iconId: 'profile', enabled: true },
];

export const weeklyTaskDefinitions: TaskDefinition[] = [
  { id: 'weekly-sessions', cadence: 'weekly', title: 'Постоянный участник', description: 'Сыграйте 8 партий в «Роверы».', difficulty: 'easy', condition: { type: 'rovers.sessionsPlayed', target: 8 }, reward: { xp: 200, communityPoints: 40 }, iconId: 'play', enabled: true },
  { id: 'weekly-merges', cadence: 'weekly', title: 'Инженерная практика', description: 'Выполните 250 слияний.', difficulty: 'medium', condition: { type: 'rovers.totalMerges', target: 250 }, reward: { xp: 300, communityPoints: 65 }, iconId: 'merge', enabled: true },
  { id: 'weekly-score', cadence: 'weekly', title: 'Стабильный результат', description: 'Наберите 40 000 очков суммарно.', difficulty: 'medium', condition: { type: 'rovers.totalScore', target: 40000 }, reward: { xp: 330, communityPoints: 70 }, iconId: 'score', enabled: true },
  { id: 'weekly-level', cadence: 'weekly', title: 'Продвинутые технологии', description: 'Достигните ровера 7-го уровня.', difficulty: 'medium', condition: { type: 'rovers.highestLevelInSession', target: 7 }, reward: { xp: 280, communityPoints: 55 }, iconId: 'chip', enabled: true },
  { id: 'weekly-legendary', cadence: 'weekly', title: 'Легендарный проект', description: 'Создайте легендарного ровера.', difficulty: 'hard', condition: { type: 'rovers.legendaryCreated', target: 1 }, reward: { xp: 600, communityPoints: 120 }, iconId: 'star', enabled: true },
  { id: 'weekly-playtime', cadence: 'weekly', title: 'Время экспериментов', description: 'Проведите в «Роверах» 30 минут.', difficulty: 'medium', condition: { type: 'rovers.playTimeSeconds', target: 1800 }, reward: { xp: 300, communityPoints: 60 }, iconId: 'time', enabled: true },
  { id: 'weekly-community', cadence: 'weekly', title: 'Рост сообщества', description: 'Получите 300 очков сообщества в «Роверах».', difficulty: 'medium', condition: { type: 'rovers.communityPointsEarned', target: 300 }, reward: { xp: 320, communityPoints: 70 }, iconId: 'community', enabled: true },
  { id: 'weekly-xp', cadence: 'weekly', title: 'Опыт недели', description: 'Получите 800 XP.', difficulty: 'hard', condition: { type: 'profile.xpEarned', target: 800 }, reward: { xp: 500, communityPoints: 100 }, iconId: 'xp', enabled: true },
  { id: 'weekly-achievement', cadence: 'weekly', title: 'Охотник за достижениями', description: 'Откройте 1 достижение.', difficulty: 'hard', condition: { type: 'profile.achievementUnlocked', target: 1 }, reward: { xp: 500, communityPoints: 100 }, iconId: 'badge', enabled: true },
  { id: 'weekly-levels', cadence: 'weekly', title: 'Новая ступень', description: 'Получите 2 уровня профиля.', difficulty: 'easy', condition: { type: 'profile.levelsGained', target: 2 }, reward: { xp: 180, communityPoints: 35 }, iconId: 'level', enabled: true },
];

export const allTaskDefinitions = [...dailyTaskDefinitions, ...weeklyTaskDefinitions];
export const getTaskDefinition = (id: string) =>
  allTaskDefinitions.find((definition) => definition.id === id);
