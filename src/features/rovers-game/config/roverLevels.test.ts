import { describe, expect, it } from 'vitest';
import { roverLevels } from './roverLevels';

describe('визуальные границы роверов', () => {
  it('обрезает прозрачные поля, не выходя за исходное изображение', () => {
    for (const rover of roverLevels) {
      const crop = rover.sourceCrop;
      expect(crop.x).toBeGreaterThanOrEqual(0);
      expect(crop.y).toBeGreaterThanOrEqual(0);
      expect(crop.x + crop.width).toBeLessThanOrEqual(1254);
      expect(crop.y + crop.height).toBeLessThanOrEqual(1254);
      expect(rover.renderSize).toBeGreaterThan(rover.physicsRadius * 2);
      expect(rover.displayScale).toBeGreaterThan(0);
      expect(rover.displayScale).toBeLessThanOrEqual(1);
      expect(Number.isFinite(rover.offsetX ?? 0)).toBe(true);
      expect(Number.isFinite(rover.offsetY ?? 0)).toBe(true);
    }
  });
});
