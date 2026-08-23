import { describe, expect, it } from 'vitest';
import {
  isRoversResultPreview,
  roversResultPreview,
} from './roversResultPreview';

describe('development result preview', () => {
  it('is available only in development with an explicit query parameter', () => {
    expect(isRoversResultPreview('?preview=result', true)).toBe(true);
    expect(isRoversResultPreview('?preview=result', false)).toBe(false);
    expect(isRoversResultPreview('', true)).toBe(false);
  });

  it('uses realistic, non-persistent result values', () => {
    expect(roversResultPreview.highestLevel).toBe(8);
    expect(roversResultPreview.score).toBeGreaterThan(0);
    expect(roversResultPreview.xpEarned).toBeGreaterThan(0);
  });
});
