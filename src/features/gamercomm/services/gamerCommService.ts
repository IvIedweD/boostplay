import {
  commitPlayerProfile,
  getPlayerProfile,
} from '../../player-profile/services/playerProgressService';
import { communityEvents } from '../config/communityEvents';
import { communityNews } from '../config/communityNews';
import { officialCommunity } from '../config/officialCommunity';
import type {
  CommunityNewsCategory,
  GamerCommContentSource,
} from '../types';
import { validateExternalCommunityUrl } from '../utils/communityUtils';

export class LocalGamerCommContentSource implements GamerCommContentSource {
  getNews() { return communityNews.map((item) => ({ ...item, content: [...item.content], tags: [...item.tags] })); }
  getEvents() { return communityEvents.map((item) => ({ ...item })); }
  getOfficialCommunity() { return { ...officialCommunity, instructions: [...officialCommunity.instructions] }; }
}

const localSource = new LocalGamerCommContentSource();
export const gamerCommContentSource: GamerCommContentSource = localSource;

export function getPublishedNews(category: CommunityNewsCategory | 'all' = 'all') {
  return localSource.getNews()
    .filter((item) => item.status === 'published' && (category === 'all' || item.category === category))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.id.localeCompare(b.id));
}

export const getNewsBySlug = (slug: string) =>
  getPublishedNews().find((item) => item.slug === slug);

export function getUnreadNews(profile = getPlayerProfile()) {
  const read = new Set(profile.communityHub.readNewsIds);
  return getPublishedNews().filter((item) => !read.has(item.id));
}

export function markNewsRead(newsId: string) {
  const profile = getPlayerProfile();
  if (profile.communityHub.readNewsIds.includes(newsId)) return profile;
  const now = new Date().toISOString();
  return commitPlayerProfile({
    ...profile,
    communityHub: {
      ...profile.communityHub,
      readNewsIds: [...profile.communityHub.readNewsIds, newsId].slice(-200),
      lastNewsViewedAt: now,
    },
  });
}

export function markAllNewsRead() {
  const profile = getPlayerProfile();
  return commitPlayerProfile({
    ...profile,
    communityHub: {
      ...profile.communityHub,
      readNewsIds: getPublishedNews().map((item) => item.id),
      lastNewsViewedAt: new Date().toISOString(),
    },
  });
}

export function markAllNewsUnread() {
  const profile = getPlayerProfile();
  return commitPlayerProfile({ ...profile, communityHub: { ...profile.communityHub, readNewsIds: [], lastNewsViewedAt: null } });
}

export function visitGamerComm() {
  const profile = getPlayerProfile();
  return commitPlayerProfile({
    ...profile,
    communityHub: { ...profile.communityHub, visitedAt: new Date().toISOString() },
  });
}

export function dismissAnnouncement(newsId: string) {
  const profile = getPlayerProfile();
  if (profile.communityHub.dismissedAnnouncementIds.includes(newsId)) return profile;
  return commitPlayerProfile({
    ...profile,
    communityHub: {
      ...profile.communityHub,
      dismissedAnnouncementIds: [...profile.communityHub.dismissedAnnouncementIds, newsId].slice(-100),
    },
  });
}

export function getUnreadImportantAnnouncement(profile = getPlayerProfile()) {
  const dismissed = new Set(profile.communityHub.dismissedAnnouncementIds);
  return getUnreadNews(profile).find(
    (item) => (item.pinned || item.category === 'important') && !dismissed.has(item.id),
  );
}

export function restoreAnnouncements() {
  const profile = getPlayerProfile();
  return commitPlayerProfile({ ...profile, communityHub: { ...profile.communityHub, dismissedAnnouncementIds: [] } });
}

export function resetGamerCommState() {
  const profile = getPlayerProfile();
  return commitPlayerProfile({
    ...profile,
    communityHub: { version: 1, readNewsIds: [], dismissedAnnouncementIds: [], visitedAt: null, lastNewsViewedAt: null },
  });
}

export function getCommunityEvents() {
  return localSource.getEvents().sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export function getOfficialCommunityStatus() {
  const config = localSource.getOfficialCommunity();
  const url = validateExternalCommunityUrl(config);
  return { config, url, available: Boolean(url) };
}
