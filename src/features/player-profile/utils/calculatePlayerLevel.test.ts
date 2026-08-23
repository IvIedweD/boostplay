import { describe, expect, it } from 'vitest';
import { addPlayerXp, calculatePlayerLevel } from './calculatePlayerLevel';
import { PLAYER_MAX_LEVEL } from '../config/playerLevels';

describe('уровни локального профиля', () => {
  it('начинает с первого уровня и не принимает отрицательный XP', () => {
    expect(calculatePlayerLevel(-100).level).toBe(1);
    expect(calculatePlayerLevel(-100).totalXp).toBe(0);
  });

  it('рассчитывает прогресс внутри уровня', () => {
    expect(calculatePlayerLevel(40)).toMatchObject({
      level: 1,
      currentLevelXp: 40,
      xpRequiredForNextLevel: 100,
    });
  });

  it('поддерживает несколько повышений за одну награду', () => {
    const result = addPlayerXp(0, 1000);
    expect(result.newLevel).toBeGreaterThan(2);
    expect(result.newLevel).toBeGreaterThan(result.previousLevel);
  });

  it('ограничивает максимальный уровень', () => {
    expect(calculatePlayerLevel(Number.MAX_SAFE_INTEGER).level).toBe(
      PLAYER_MAX_LEVEL,
    );
  });
});
