import { getRoverLevel } from '../config/roverLevels';
import {
  defaultRoversDifficulty,
  getRoversBalancePreset,
  type RoversDifficulty,
} from '../config/roversBalance';
import type { RoverLevel } from '../types';

export interface MergeCandidate {
  id: number;
  level: RoverLevel;
  mergeLocked?: boolean;
}

export interface DangerTimerState {
  activeSince: number | null;
  progress: number;
  gameOver: boolean;
}

export function pickSpawnLevel(
  randomValue = Math.random(),
  difficulty: RoversDifficulty = defaultRoversDifficulty,
): RoverLevel {
  const spawnProbabilities =
    getRoversBalancePreset(difficulty).spawnProbabilities;
  const normalized = Math.min(0.999999, Math.max(0, randomValue));
  let cursor = 0;
  for (const item of spawnProbabilities) {
    cursor += item.probability;
    if (normalized < cursor) return item.level;
  }
  return 3;
}

export function getMergeLevel(
  first: MergeCandidate,
  second: MergeCandidate,
): RoverLevel | null {
  if (
    first.id === second.id ||
    first.mergeLocked ||
    second.mergeLocked ||
    first.level !== second.level ||
    first.level >= 8
  ) {
    return null;
  }
  return (first.level + 1) as RoverLevel;
}

export function getMergeScore(createdLevel: RoverLevel) {
  return getRoverLevel(createdLevel).scoreValue;
}

export function formatRoversDuration(durationMs: number) {
  const seconds = Math.max(0, Math.floor(durationMs / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function resolveMergeChain(levels: RoverLevel[]) {
  const counts = new Map<RoverLevel, number>();
  let score = 0;
  let merges = 0;
  let highestLevel: RoverLevel = 1;

  for (const level of levels) {
    counts.set(level, (counts.get(level) ?? 0) + 1);
    highestLevel = Math.max(highestLevel, level) as RoverLevel;
  }

  for (let level = 1 as RoverLevel; level < 8; level = (level + 1) as RoverLevel) {
    const count = counts.get(level) ?? 0;
    const mergedPairs = Math.floor(count / 2);
    if (!mergedPairs) continue;
    counts.set(level, count % 2);
    const nextLevel = (level + 1) as RoverLevel;
    counts.set(nextLevel, (counts.get(nextLevel) ?? 0) + mergedPairs);
    score += getMergeScore(nextLevel) * mergedPairs;
    merges += mergedPairs;
    highestLevel = Math.max(highestLevel, nextLevel) as RoverLevel;
  }

  return { counts, score, merges, highestLevel };
}

export function updateDangerTimer(
  state: DangerTimerState,
  isDangerous: boolean,
  now: number,
  duration = 2000,
): DangerTimerState {
  if (!isDangerous) {
    return { activeSince: null, progress: 0, gameOver: false };
  }
  const activeSince = state.activeSince ?? now;
  const progress = Math.min(1, Math.max(0, (now - activeSince) / duration));
  return {
    activeSince,
    progress,
    gameOver: progress >= 1,
  };
}

export function isDropControl(key: string) {
  return key === ' ' || key === 'Enter';
}

export function getHorizontalDirection(key: string) {
  if (key === 'ArrowLeft' || key.toLowerCase() === 'a') return -1;
  if (key === 'ArrowRight' || key.toLowerCase() === 'd') return 1;
  return 0;
}

export function shouldPauseRoversWorld(options: {
  manualPause: boolean;
  rulesOpen: boolean;
  exitOpen: boolean;
  documentHidden: boolean;
  gameOver: boolean;
}) {
  return Object.values(options).some(Boolean);
}

export function createFreshGameState() {
  return {
    score: 0,
    merges: 0,
    highestLevel: 1 as RoverLevel,
    dangerProgress: 0,
    phase: 'playing' as const,
  };
}
