import { describe, expect, it } from 'vitest';
import { LocalTaskTimeProvider } from './LocalTaskTimeProvider';

describe('LocalTaskTimeProvider', () => {
  const date = new Date(2026, 6, 30, 12, 15);
  const provider = new LocalTaskTimeProvider(() => date);

  it('creates stable local daily and ISO weekly keys', () => {
    expect(provider.getDailyPeriodKey()).toBe('2026-07-30');
    expect(provider.getWeeklyPeriodKey()).toBe('2026-W31');
  });

  it('returns local midnight for the next daily reset', () => {
    expect(provider.getNextDailyReset()).toEqual(new Date(2026, 6, 31, 0, 0));
  });

  it('returns Monday local midnight for the next weekly reset', () => {
    expect(provider.getNextWeeklyReset()).toEqual(new Date(2026, 7, 3, 0, 0));
  });
});
