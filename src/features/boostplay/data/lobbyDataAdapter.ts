import { defaultAvatarId, defaultFrameId } from '../../../assets/boostplay/cosmetics/catalog';
import type { PlayerProfile } from '../../player-profile/types';
import type { AuthUser } from '../auth/authAdapter';
import type { BoostplayLeaderboardEntry } from '../types';
import type { PublicSeasonSettings } from './supabaseGameData';
import { boostplayLeaderboard, boostplayPlayer, boostplayPrizes } from './mockBoostplayData';
import { runtimeConfig } from '../../../config/runtimeConfig';

export interface BoostplayLobbyData {
  player: {
    displayName: string;
    rank: number;
    bestScore: number;
    avatarId: string;
    frameId: string;
  };
  seasonEndsIn: string;
  seasonTitle: string;
  seasonLabel: string;
  leaderboardRefreshMinutes: number;
  leaderboard: readonly BoostplayLeaderboardEntry[];
  prizes: typeof boostplayPrizes;
}

function pluralRu(value: number, forms: [string, string, string]) {
  const mod100 = value % 100;
  const mod10 = value % 10;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

function seasonCountdown(endsAt: string | undefined, now: number) {
  if (!endsAt) return '—';
  const remaining = new Date(endsAt).getTime() - now;
  if (remaining <= 0) return 'Сезон завершён';
  const days = Math.floor(remaining / 86_400_000);
  const hours = days > 0
    ? Math.floor((remaining % 86_400_000) / 3_600_000)
    : Math.max(1, Math.floor(remaining / 3_600_000));
  if (days > 0) return `${days} ${pluralRu(days, ['день', 'дня', 'дней'])} ${hours} ${pluralRu(hours, ['час', 'часа', 'часов'])}`;
  return `${hours} ${pluralRu(hours, ['час', 'часа', 'часов'])}`;
}

/**
 * Presentation boundary for lobby data. Demo values are available only when the
 * application is explicitly running in local development mode.
 */
export function getBoostplayLobbyData(
  profile: PlayerProfile,
  authUser: AuthUser | null = null,
  serverLeaderboard: readonly BoostplayLeaderboardEntry[] | null = null,
  serverSeason: PublicSeasonSettings | null = null,
  now = Date.now(),
  demoDataEnabled = runtimeConfig.demoDataEnabled,
): BoostplayLobbyData {
  const hasLocalProgress = profile.games.rovers.gamesPlayed > 0 || profile.games.rovers.bestScore > 0;
  const serverStanding = authUser
    ? serverLeaderboard?.find((entry) => entry.playerId === authUser.id)
    : null;

  return {
    player: {
      displayName: authUser?.displayName ?? (profile.displayName !== 'Игрок' ? profile.displayName : 'Игрок'),
      rank: serverStanding?.rank ?? authUser?.rank ?? 0,
      bestScore: Math.max(
        serverStanding?.score ?? 0,
        authUser?.bestScore ?? 0,
        hasLocalProgress ? profile.games.rovers.bestScore : 0,
      ) || (demoDataEnabled ? boostplayPlayer.bestScore : 0),
      avatarId: authUser?.avatarId ?? defaultAvatarId,
      frameId: authUser?.frameId ?? defaultFrameId,
    },
    seasonEndsIn: seasonCountdown(serverSeason?.endsAt, now),
    seasonTitle: serverSeason?.title ?? (demoDataEnabled ? 'Первые шаги' : 'Сезон'),
    seasonLabel: serverSeason?.label ?? (demoDataEnabled ? 'Сезон «Первые шаги» · Август 2026' : 'Данные сезона недоступны'),
    leaderboardRefreshMinutes: serverSeason?.leaderboardRefreshMinutes ?? 30,
    leaderboard: serverLeaderboard ?? (demoDataEnabled ? boostplayLeaderboard : []),
    prizes: boostplayPrizes,
  };
}
