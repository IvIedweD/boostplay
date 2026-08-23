import { describe, expect, it } from 'vitest';
import { normalizeBoosterSource, resolveBoosterVisual } from './boosterVisualResolver';

describe('resolver визуалов бустера', () => {
  it.each(['HH', 'hubbyhub', 'HubbyHub'])('нормализует HubbyHub: %s', (source) => {
    expect(normalizeBoosterSource(source)).toBe('hubbyhub');
  });

  it.each(['GC', 'gamercomm', 'GamerComm'])('нормализует GamerComm: %s', (source) => {
    expect(normalizeBoosterSource(source)).toBe('gamercomm');
  });

  it.each([2, 3])('разрешает HubbyHub ×%i в HH-иконку', (multiplier) => {
    expect(resolveBoosterVisual({ source: 'HH', multiplier, active: true }).id).toBe('booster_hh');
  });

  it.each([2, 3])('разрешает GamerComm ×%i в GC-иконку', (multiplier) => {
    expect(resolveBoosterVisual({ source: 'GC', multiplier, active: true }).id).toBe('booster_gc');
  });

  it('использует no_boost для пустого и неизвестного состояния', () => {
    expect(resolveBoosterVisual(null).id).toBe('booster_no_boost');
    expect(resolveBoosterVisual(undefined).id).toBe('booster_no_boost');
    expect(resolveBoosterVisual({ source: 'unknown', active: true }).id).toBe('booster_no_boost');
    expect(resolveBoosterVisual({ source: 'HH', active: false }).id).toBe('booster_no_boost');
  });
});
