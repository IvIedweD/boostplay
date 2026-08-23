import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultPlayerProfile } from '../../player-profile/config/profileDefaults';
import {
  commitPlayerProfile,
  getPlayerProfile,
  resetLocalPlayerProfile,
} from '../../player-profile/services/playerProgressService';
import { officialCommunity } from '../config/officialCommunity';
import {
  dismissAnnouncement,
  getCommunityEvents,
  getNewsBySlug,
  getOfficialCommunityStatus,
  getPublishedNews,
  getUnreadImportantAnnouncement,
  getUnreadNews,
  markAllNewsRead,
  markNewsRead,
} from './gamerCommService';
import {
  getLatestAchievement,
  getNearestTask,
  normalizeCommunityCategory,
  validateExternalCommunityUrl,
} from '../utils/communityUtils';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const storage = new MemoryStorage();

describe('GamerComm service', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('window', { localStorage: storage });
    resetLocalPlayerProfile();
  });

  it('показывает только 8 опубликованных материалов в стабильном порядке', () => {
    const news = getPublishedNews();
    expect(news).toHaveLength(8);
    expect(news[0].pinned).toBe(true);
    expect(news.some((item) => item.status === 'archived')).toBe(false);
    expect(news.map((item) => item.id).length).toBe(new Set(news.map((item) => item.id)).size);
  });

  it('фильтрует категории и безопасно нормализует неизвестную', () => {
    expect(getPublishedNews('games').every((item) => item.category === 'games')).toBe(true);
    expect(normalizeCommunityCategory('games')).toBe('games');
    expect(normalizeCommunityCategory('broken')).toBe('all');
  });

  it('безопасно обрабатывает неизвестный slug', () => {
    expect(getNewsBySlug('unknown-publication')).toBeUndefined();
  });

  it('хранит чтение отдельно и не отмечает остальные публикации', () => {
    const [first] = getPublishedNews();
    expect(getUnreadNews()).toHaveLength(8);
    markNewsRead(first.id);
    expect(getUnreadNews()).toHaveLength(7);
    expect(getPlayerProfile().communityHub.readNewsIds).toEqual([first.id]);
    markAllNewsRead();
    expect(getUnreadNews()).toHaveLength(0);
  });

  it('не повторяет скрытое важное объявление', () => {
    const announcement = getUnreadImportantAnnouncement();
    expect(announcement).toBeDefined();
    dismissAnnouncement(announcement!.id);
    expect(getUnreadImportantAnnouncement()).toBeUndefined();
    expect(getPlayerProfile().communityHub.dismissedAnnouncementIds).toContain(announcement!.id);
  });

  it('принимает только безопасный HTTPS URL', () => {
    expect(getOfficialCommunityStatus().available).toBe(false);
    expect(validateExternalCommunityUrl({ ...officialCommunity, externalUrl: 'http://example.com' })).toBeNull();
    expect(validateExternalCommunityUrl({ ...officialCommunity, externalUrl: 'https://example.com/group' })).toBe('https://example.com/group');
  });

  it('разделяет активные, будущие и завершённые события', () => {
    const statuses = new Set(getCommunityEvents().map((event) => event.status));
    expect(statuses).toEqual(new Set(['active', 'upcoming', 'completed']));
  });
});

describe('GamerComm player summary helpers', () => {
  it('выбирает ближайшее незавершённое задание по доле прогресса', () => {
    const profile = createDefaultPlayerProfile('2026-07-30T00:00:00.000Z');
    profile.tasks.daily = [
      { instanceId: 'a', definitionId: 'daily-first-session', cadence: 'daily', periodKey: 'x', progress: 1, target: 2, completed: false, completedAt: null, claimed: false, claimedAt: null },
      { instanceId: 'b', definitionId: 'daily-merges-15', cadence: 'daily', periodKey: 'x', progress: 9, target: 10, completed: false, completedAt: null, claimed: false, claimedAt: null },
    ];
    expect(getNearestTask(profile)?.task.instanceId).toBe('b');
  });

  it('выбирает последнее достижение по времени', () => {
    const profile = createDefaultPlayerProfile('2026-07-30T00:00:00.000Z');
    profile.achievements[0] = { ...profile.achievements[0], unlocked: true, unlockedAt: '2026-07-20T00:00:00.000Z' };
    profile.achievements[1] = { ...profile.achievements[1], unlocked: true, unlockedAt: '2026-07-29T00:00:00.000Z' };
    expect(getLatestAchievement(profile)?.achievementId).toBe(profile.achievements[1].achievementId);
  });

  it('сохраняет неизвестные IDs безопасно при нормализации', () => {
    const profile = createDefaultPlayerProfile();
    commitPlayerProfile({ ...profile, communityHub: { ...profile.communityHub, readNewsIds: ['removed-news'] } });
    expect(getPlayerProfile().communityHub.readNewsIds).toEqual(['removed-news']);
    expect(getUnreadNews()).toHaveLength(8);
  });
});
