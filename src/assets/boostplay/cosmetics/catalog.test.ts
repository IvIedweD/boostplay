import { describe, expect, it } from 'vitest';
import {
  avatarCatalog,
  boosterVisualCatalog,
  defaultAvatarId,
  defaultFrameId,
  frameCatalog,
  noBoosterVisual,
} from './catalog';

const unique = (values: readonly string[]) => new Set(values).size === values.length;

describe('каталог косметики BOOSTPLAY', () => {
  it('загружает все обнаруженные ассеты', () => {
    expect(avatarCatalog).toHaveLength(10);
    expect(frameCatalog).toHaveLength(10);
    expect(boosterVisualCatalog).toHaveLength(3);
  });

  it('использует уникальные стабильные ID', () => {
    expect(unique(avatarCatalog.map((item) => item.id))).toBe(true);
    expect(unique(frameCatalog.map((item) => item.id))).toBe(true);
    expect(unique(boosterVisualCatalog.map((item) => item.id))).toBe(true);
  });

  it('содержит доступные значения по умолчанию', () => {
    expect(avatarCatalog.some((item) => item.id === defaultAvatarId && item.available)).toBe(true);
    expect(frameCatalog.some((item) => item.id === defaultFrameId && item.available)).toBe(true);
    expect(noBoosterVisual).toMatchObject({ id: 'booster_no_boost', source: 'none', effect: 'none' });
  });
});
