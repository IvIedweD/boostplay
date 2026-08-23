import { describe, expect, it } from 'vitest';
import {
  defaultRoversDifficulty,
  roversBalancePresets,
} from './roversBalance';

describe('баланс игры «Роверы»', () => {
  it('использует стандартную сложность по умолчанию', () => {
    expect(defaultRoversDifficulty).toBe('standard');
  });

  it('хранит вероятности и задержки отдельно для каждого пресета', () => {
    expect(roversBalancePresets.standard.spawnProbabilities).toEqual([
      { level: 1, probability: 0.6 },
      { level: 2, probability: 0.3 },
      { level: 3, probability: 0.1 },
    ]);
    expect(roversBalancePresets.relaxed.overflowDelayMs).toBe(2400);
    expect(roversBalancePresets.standard.overflowDelayMs).toBe(1600);
    expect(roversBalancePresets.challenge.overflowDelayMs).toBe(1400);
  });

  it('увеличивает только старшие коллайдеры в стандартном режиме', () => {
    expect(roversBalancePresets.standard.radiusMultipliers[4]).toBe(1);
    expect(roversBalancePresets.standard.radiusMultipliers[5]).toBe(1.03);
    expect(roversBalancePresets.standard.radiusMultipliers[8]).toBe(1.09);
  });
});
