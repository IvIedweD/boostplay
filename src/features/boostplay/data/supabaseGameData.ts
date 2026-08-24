import type { CompletedRoversResult } from '../../player-profile/types';
import type { BoostplayLeaderboardEntry } from '../types';
import { getBoostplaySupabaseClient } from '../supabase/boostplaySupabaseClient';
import { findAvatarCosmetic } from '../../../assets/boostplay/cosmetics/catalog';
import type { RoversBoosterLoadout } from '../../rovers-game/services/roversBoosterSession';

interface LeaderboardRow {
  rank: number;
  player_id: string;
  display_name: string;
  score: number;
  avatar_id: string;
}

export interface RoversPlayerStanding {
  rank: number;
  bestScore: number;
}

interface BoosterPurchaseRow {
  activation_id: string;
  activity_points: number;
  cost: number;
}

export interface ActivityPointHistoryEntry {
  id: number;
  amount: number;
  reason: string;
  note: string | null;
  createdAt: string;
}

interface ActivityPointHistoryRow {
  entry_id: number;
  amount: number;
  reason: string;
  note: string | null;
  created_at: string;
}

export interface PublicSeasonSettings {
  title: string;
  label: string;
  startsAt: string;
  endsAt: string;
  status: 'upcoming' | 'active' | 'finished';
  leaderboardRefreshMinutes: number;
}

interface PublicSeasonRow {
  title: string;
  label: string;
  starts_at: string;
  ends_at: string;
  status: PublicSeasonSettings['status'];
  leaderboard_refresh_minutes: number;
}

function validInteger(value: unknown) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function cosmeticId(databaseId: string) {
  return databaseId.replace('-', '_');
}

export async function loadBoostplaySeason(): Promise<PublicSeasonSettings | null> {
  const client = getBoostplaySupabaseClient();
  if (!client) return null;
  const { data, error } = await client.rpc('get_boostplay_season');
  if (error) throw new Error(`Не удалось загрузить сезон: ${error.message}`);
  const row = Array.isArray(data) ? data[0] as Partial<PublicSeasonRow> | undefined : undefined;
  if (!row || typeof row.title !== 'string' || typeof row.label !== 'string'
    || typeof row.starts_at !== 'string' || typeof row.ends_at !== 'string'
    || !['upcoming', 'active', 'finished'].includes(row.status ?? '')
    || !Number.isSafeInteger(row.leaderboard_refresh_minutes)) return null;
  return {
    title: row.title,
    label: row.label,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status as PublicSeasonSettings['status'],
    leaderboardRefreshMinutes: row.leaderboard_refresh_minutes as number,
  };
}

export function normalizeLeaderboardRows(
  rows: unknown,
  currentPlayerId: string | null,
): BoostplayLeaderboardEntry[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const row = candidate as Partial<LeaderboardRow>;
    const rank = row.rank;
    const score = row.score;
    if (
      !validInteger(rank)
      || rank === 0
      || typeof row.player_id !== 'string'
      || typeof row.display_name !== 'string'
      || typeof row.avatar_id !== 'string'
      || !validInteger(score)
    ) return [];
    return [{
      rank: rank as number,
      playerId: row.player_id,
      displayName: row.display_name,
      avatarUrl: findAvatarCosmetic(cosmeticId(row.avatar_id))?.imageUrl ?? null,
      score: score as number,
      isCurrentPlayer: row.player_id === currentPlayerId,
    }];
  });
}

export async function loadRoversLeaderboard(
  currentPlayerId: string | null,
  limit = 50,
) {
  const client = getBoostplaySupabaseClient();
  if (!client || currentPlayerId === 'local-test-account') return null;
  const { data, error } = await client.rpc('get_rovers_leaderboard', {
    requested_limit: Math.min(100, Math.max(3, Math.floor(limit))),
  });
  if (error) throw new Error(`Не удалось загрузить таблицу: ${error.message}`);
  const leaderboard = normalizeLeaderboardRows(data, currentPlayerId);
  return leaderboard;
}

export async function loadRoversPlayerStanding(playerId: string) {
  const leaderboard = await loadRoversLeaderboard(playerId, 100);
  const player = leaderboard?.find((entry) => entry.playerId === playerId);
  return player ? { rank: player.rank, bestScore: player.score } : null;
}

export async function loadActivityPointHistory(playerId: string, limit = 60) {
  const client = getBoostplaySupabaseClient();
  if (!client || playerId === 'local-test-account') return [];
  const { data: authData } = await client.auth.getUser();
  if (!authData.user || authData.user.id !== playerId) {
    throw new Error('Сессия входа устарела. Войдите в аккаунт ещё раз.');
  }
  const { data, error } = await client.rpc('get_my_activity_point_history', {
    requested_limit: Math.min(100, Math.max(1, Math.floor(limit))),
  });
  if (error) throw new Error(`Не удалось загрузить историю очков: ${error.message}`);
  if (!Array.isArray(data)) return [];
  return data.flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const row = candidate as Partial<ActivityPointHistoryRow>;
    if (
      !Number.isSafeInteger(row.entry_id)
      || !Number.isSafeInteger(row.amount)
      || typeof row.reason !== 'string'
      || typeof row.created_at !== 'string'
      || (row.note !== null && typeof row.note !== 'string')
    ) return [];
    return [{
      id: row.entry_id as number,
      amount: row.amount as number,
      reason: row.reason,
      note: row.note ?? null,
      createdAt: row.created_at,
    }];
  });
}

export async function submitRoversResult(result: CompletedRoversResult) {
  const client = getBoostplaySupabaseClient();
  if (!client) return { submitted: false, reason: 'not-configured' } as const;
  const { data: authData } = await client.auth.getUser();
  if (!authData.user) return { submitted: false, reason: 'not-authenticated' } as const;
  const { data, error } = await client.rpc('submit_rovers_result', {
    submitted_session_id: result.sessionId,
    submitted_score: Math.max(0, Math.floor(result.score)),
    submitted_highest_level: Math.max(1, Math.floor(result.highestRoverLevel)),
    submitted_merges: Math.max(0, Math.floor(result.totalMerges)),
    submitted_legendary_count: Math.max(0, Math.floor(result.legendaryRoversCreated)),
    submitted_duration_seconds: Math.max(0, Math.floor(result.durationSeconds)),
    submitted_difficulty: result.difficulty ?? 'standard',
    submitted_completed_at: result.completedAt,
    submitted_booster_activation_id: result.boosterActivationId ?? null,
  });
  if (error) throw new Error(`Результат не сохранён: ${error.message}`);
  const standing = await loadRoversPlayerStanding(authData.user.id);
  return { submitted: true, data, standing } as const;
}

export async function purchaseRoversBoosters(
  loadout: RoversBoosterLoadout,
  playerId: string,
) {
  const selected = loadout.doubleScore || loadout.stabilizer;
  if (!selected) return null;
  const client = getBoostplaySupabaseClient();
  if (!client || playerId === 'local-test-account') return null;
  const { data: authData } = await client.auth.getUser();
  if (!authData.user || authData.user.id !== playerId) {
    throw new Error('Сессия входа устарела. Войдите в аккаунт ещё раз.');
  }
  const requestId = crypto.randomUUID();
  const { data, error } = await client.rpc('purchase_rovers_boosters', {
    purchase_request_id: requestId,
    requested_double_score: loadout.doubleScore,
    requested_stabilizer: loadout.stabilizer,
  });
  if (error) {
    if (error.message.includes('insufficient_activity_points')) {
      throw new Error('Недостаточно очков активности.');
    }
    throw new Error(`Не удалось активировать бустеры: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] as BoosterPurchaseRow | undefined : undefined;
  if (!row || typeof row.activation_id !== 'string' || !validInteger(row.activity_points)) {
    throw new Error('Сервер вернул некорректное подтверждение покупки.');
  }
  return {
    loadout: { ...loadout, activationId: row.activation_id },
    activityPoints: row.activity_points,
    cost: row.cost,
  };
}
