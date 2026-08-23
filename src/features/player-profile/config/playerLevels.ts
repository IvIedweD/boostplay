export const PLAYER_MIN_LEVEL = 1;
export const PLAYER_MAX_LEVEL = 50;

export function getXpRequiredForLevel(level: number) {
  if (level >= PLAYER_MAX_LEVEL) return 0;
  const offset = Math.max(0, level - 1);
  return 100 + offset * 40 + Math.floor(offset * offset * 6);
}
