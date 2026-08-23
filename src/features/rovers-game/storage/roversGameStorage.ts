import { getRoverLevel } from '../config/roverLevels';
import type { RoverLevel, RoversGameResult } from '../types';

export const ROVERS_STORAGE_KEY = 'gamercomm.roversGame.v1';

export interface RoversGameStorageData {
  version: 1;
  bestScore: number;
  highestLevel: RoverLevel;
  totalMerges: number;
  totalCommunityPoints: number;
  totalGamesPlayed: number;
  legendaryRoverCount: number;
  rulesViewed: boolean;
  lastResult: RoversGameResult | null;
  unseenResult: boolean;
}

export const defaultRoversGameStorage: RoversGameStorageData = {
  version: 1,
  bestScore: 0,
  highestLevel: 1,
  totalMerges: 0,
  totalCommunityPoints: 0,
  totalGamesPlayed: 0,
  legendaryRoverCount: 0,
  rulesViewed: false,
  lastResult: null,
  unseenResult: false,
};

function getStorage(storage?: Storage) {
  return storage ?? window.localStorage;
}

export function loadRoversGameStorage(
  storage?: Storage,
): RoversGameStorageData {
  try {
    const raw = getStorage(storage).getItem(ROVERS_STORAGE_KEY);
    if (!raw) return { ...defaultRoversGameStorage };
    const parsed = JSON.parse(raw) as Partial<RoversGameStorageData>;
    if (parsed.version !== 1) return { ...defaultRoversGameStorage };
    return {
      ...defaultRoversGameStorage,
      ...parsed,
      highestLevel: Math.min(
        8,
        Math.max(1, parsed.highestLevel ?? 1),
      ) as RoverLevel,
    };
  } catch {
    return { ...defaultRoversGameStorage };
  }
}

export function saveRoversGameStorage(
  data: RoversGameStorageData,
  storage?: Storage,
) {
  getStorage(storage).setItem(ROVERS_STORAGE_KEY, JSON.stringify(data));
}

export function saveRoversResult(
  result: RoversGameResult,
  storage?: Storage,
) {
  const current = loadRoversGameStorage(storage);
  const next: RoversGameStorageData = {
    ...current,
    bestScore: Math.max(current.bestScore, result.score),
    highestLevel: Math.max(
      current.highestLevel,
      result.highestLevel,
    ) as RoverLevel,
    totalMerges: current.totalMerges + result.merges,
    totalCommunityPoints:
      current.totalCommunityPoints + result.communityPoints,
    totalGamesPlayed: current.totalGamesPlayed + 1,
    legendaryRoverCount:
      current.legendaryRoverCount + (result.legendaryCreated ? 1 : 0),
    lastResult: result,
    unseenResult: true,
  };
  saveRoversGameStorage(next, storage);
  return next;
}

export function markRoversRulesViewed(storage?: Storage) {
  const current = loadRoversGameStorage(storage);
  const next = { ...current, rulesViewed: true };
  saveRoversGameStorage(next, storage);
  return next;
}

export function markRoversResultViewed(storage?: Storage) {
  const current = loadRoversGameStorage(storage);
  const next = { ...current, unseenResult: false };
  saveRoversGameStorage(next, storage);
  return next;
}

export function getRoversResultSummary(storage?: Storage) {
  const data = loadRoversGameStorage(storage);
  if (!data.lastResult && data.bestScore === 0) return null;
  return {
    status: data.unseenResult ? ('rewardAvailable' as const) : ('default' as const),
    preview: `Рекорд: ${data.bestScore} · Лучший: ${getRoverLevel(data.highestLevel).title} · Игр: ${data.totalGamesPlayed} · Очки сообщества: ${data.totalCommunityPoints}`,
    data,
  };
}
