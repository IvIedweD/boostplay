import type { PlayerProfile } from '../../player-profile/types';
import { getTaskDefinition } from '../../tasks/config/taskDefinitions';
import type { CommunityNewsCategory, OfficialCommunityConfig } from '../types';

export const communityCategoryLabels: Record<CommunityNewsCategory, string> = {
  important: 'Важное', project: 'Проект', games: 'Игры', community: 'Сообщество', events: 'События',
};

export function normalizeCommunityCategory(value: string | null) {
  return value && value in communityCategoryLabels
    ? (value as CommunityNewsCategory)
    : 'all';
}

export function validateExternalCommunityUrl(config: OfficialCommunityConfig) {
  if (!config.enabled || !config.externalUrl) return null;
  try {
    const url = new URL(config.externalUrl);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getNearestTask(profile: PlayerProfile) {
  return [...profile.tasks.daily, ...profile.tasks.weekly]
    .filter((task) => !task.completed && !task.claimed)
    .sort((a, b) => {
      const ratio = b.progress / b.target - a.progress / a.target;
      return ratio || a.instanceId.localeCompare(b.instanceId);
    })
    .map((task) => ({ task, definition: getTaskDefinition(task.definitionId) }))
    .find((item) => item.definition);
}

export function getLatestAchievement(profile: PlayerProfile) {
  return [...profile.achievements]
    .filter((item) => item.unlocked && item.unlockedAt)
    .sort((a, b) => Date.parse(b.unlockedAt!) - Date.parse(a.unlockedAt!))[0];
}

export const formatCommunityDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
