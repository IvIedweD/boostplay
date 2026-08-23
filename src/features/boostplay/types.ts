export interface BoostplayPlayer {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  rank: number;
  bestScore: number;
  authenticated: boolean;
  prizeEligible: boolean;
}

export interface BoostplaySeason {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: 'upcoming' | 'active' | 'finished';
}

export interface BoostplayFeaturedGame {
  id: string;
  title: string;
  description: string;
  artworkUrl: string | null;
  route: string;
  available: boolean;
}

export interface BoostplayBooster {
  id: string;
  name: string;
  source: 'GamerComm' | 'HubbyHub';
  effectType: 'multiplier' | 'eventBonus' | 'protection';
  multiplier: number | null;
  remainingUses: number;
  expiresAt: string;
  active: boolean;
}

export interface BoostplayCommunityActivity {
  id: string;
  source: 'GamerComm' | 'HubbyHub';
  title: string;
  description: string;
  rewardLabel: string;
  status: 'available' | 'completed' | 'rewarded';
  externalUrl: string | null;
  expiresAt: string;
}

export interface BoostplayLeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  isCurrentPlayer: boolean;
}

export interface BoostplayPrize {
  place: 1 | 2 | 3;
  title: string;
  description: string;
  imageUrl: string;
  eligibilityNote: string;
}

export type BoostplayDialogType =
  | 'season'
  | 'booster'
  | 'play-confirmation'
  | 'play-without-booster'
  | 'auth-prompt'
  | 'profile-customization'
  | 'external-link';

export type BoostplayUtilityPanel = 'notifications' | 'messages' | 'settings' | null;

export interface BoostplayViewState {
  guest: boolean;
  booster: 'active' | 'gamercomm' | 'none';
  player: 'ready' | 'loading';
  season: 'ready' | 'loading' | 'none';
  activities: 'ready' | 'loading' | 'none';
  leaderboard: 'ready' | 'loading' | 'unavailable';
  prizes: 'ready' | 'unavailable';
  artwork: 'ready' | 'missing';
  stress: boolean;
}
