import {
  getXpRequiredForLevel,
  PLAYER_MAX_LEVEL,
} from '../config/playerLevels';

export interface CalculatedPlayerLevel {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  xpRequiredForNextLevel: number;
  progressPercent: number;
}

export function calculatePlayerLevel(totalXp: number): CalculatedPlayerLevel {
  const safeXp = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(Number.isFinite(totalXp) ? totalXp : 0)));
  let remaining = safeXp;
  let level = 1;
  while (level < PLAYER_MAX_LEVEL) {
    const required = getXpRequiredForLevel(level);
    if (remaining < required) break;
    remaining -= required;
    level += 1;
  }
  const required = getXpRequiredForLevel(level);
  return {
    level,
    totalXp: safeXp,
    currentLevelXp: level === PLAYER_MAX_LEVEL ? 0 : remaining,
    xpRequiredForNextLevel: required,
    progressPercent:
      level === PLAYER_MAX_LEVEL || required === 0
        ? 100
        : Math.min(100, (remaining / required) * 100),
  };
}

export function addPlayerXp(totalXp: number, amount: number) {
  const previous = calculatePlayerLevel(totalXp);
  const next = calculatePlayerLevel(
    previous.totalXp + Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0)),
  );
  return { previousLevel: previous.level, newLevel: next.level, progression: next };
}
