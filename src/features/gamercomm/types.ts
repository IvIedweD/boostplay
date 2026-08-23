export type CommunityNewsCategory =
  | 'project'
  | 'games'
  | 'community'
  | 'events'
  | 'important';

export type CommunityContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string };

export interface CommunityNewsItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: CommunityContentBlock[];
  category: CommunityNewsCategory;
  publishedAt: string;
  updatedAt?: string;
  featured: boolean;
  pinned: boolean;
  status: 'published' | 'archived';
  author?: string;
  tags: string[];
  relatedRoute?: string;
  externalUrl?: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  status: 'upcoming' | 'active' | 'completed';
  startsAt: string;
  endsAt?: string;
  category: 'game' | 'community' | 'project';
  relatedRoute?: string;
  externalUrl?: string;
  featured: boolean;
}

export interface OfficialCommunityConfig {
  enabled: boolean;
  platform: 'yandex-messenger';
  title: string;
  description: string;
  externalUrl: string | null;
  instructions: string[];
  openInNewTab: boolean;
}

export interface PlayerCommunityHubState {
  version: 1;
  readNewsIds: string[];
  dismissedAnnouncementIds: string[];
  visitedAt: string | null;
  lastNewsViewedAt: string | null;
}

export interface GamerCommContentSource {
  getNews(): CommunityNewsItem[];
  getEvents(): CommunityEvent[];
  getOfficialCommunity(): OfficialCommunityConfig;
}
