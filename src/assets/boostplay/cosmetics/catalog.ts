import avatar01 from './avatars/avatar-01.png';
import avatar02 from './avatars/avatar-02.png';
import avatar03 from './avatars/avatar-03.png';
import avatar04 from './avatars/avatar-04.png';
import avatar05 from './avatars/avatar-05.png';
import avatar06 from './avatars/avatar-06.png';
import avatar07 from './avatars/avatar-07.png';
import avatar08 from './avatars/avatar-08.png';
import avatar09 from './avatars/avatar-09.png';
import avatar10 from './avatars/avatar-10.png';
import frame01 from './frames/frame-01.png';
import frame02 from './frames/frame-02.png';
import frame03 from './frames/frame-03.png';
import frame04 from './frames/frame-04.png';
import frame05 from './frames/frame-05.png';
import frame06 from './frames/frame-06.png';
import frame07 from './frames/frame-07.png';
import frame08 from './frames/frame-08.png';
import frame09 from './frames/frame-09.png';
import frame10 from './frames/frame-10.png';
import boosterGc from './boosters/booster-gc.png';
import boosterHh from './boosters/booster-hh.png';
import boosterNoBoost from './boosters/booster-no-boost.png';

export interface AvatarCosmetic {
  id: string;
  displayName: string;
  imageUrl: string;
  sortOrder: number;
  available: boolean;
}

export interface FrameDisplayConfig {
  avatarInsetPercent: number;
  avatarScale: number;
  avatarOffsetXPercent: number;
  avatarOffsetYPercent: number;
  frameScale: number;
}

export interface FrameCosmetic {
  id: string;
  displayName: string;
  imageUrl: string;
  sortOrder: number;
  available: boolean;
  displayConfig: FrameDisplayConfig;
}

export type BoosterVisualSource = 'gamercomm' | 'hubbyhub' | 'community' | 'event' | 'none';
export type BoosterVisualEffect = 'multiplier' | 'fixed_bonus' | 'result_shield' | 'second_chance' | 'other' | 'none';

export interface BoosterVisual {
  id: string;
  source: BoosterVisualSource;
  effect: BoosterVisualEffect;
  multiplier?: number;
  imageUrl: string;
  displayName: string;
}

const avatarEntries = [
  [avatar01, 'Оранжевый визор'], [avatar02, 'Фиолетовая гарнитура'], [avatar03, 'Синяя камера'],
  [avatar04, 'Синий кролик'], [avatar05, 'Красный шлем'], [avatar06, 'Зелёный разведчик'],
  [avatar07, 'Оранжевый рабочий'], [avatar08, 'Синий дрон'], [avatar09, 'Золотой страж'],
  [avatar10, 'Розовый кролик'],
] as const;

export const avatarCatalog: readonly AvatarCosmetic[] = avatarEntries.map(([imageUrl, displayName], index) => ({
  id: `avatar_${String(index + 1).padStart(2, '0')}`,
  displayName,
  imageUrl,
  sortOrder: index + 1,
  available: true,
}));

const sharedFrameDisplay: FrameDisplayConfig = {
  avatarInsetPercent: 15,
  avatarScale: 1,
  avatarOffsetXPercent: 0,
  avatarOffsetYPercent: 0,
  frameScale: 1,
};

const frameEntries = [
  [frame01, 'Синяя сталь'], [frame02, 'Бирюзовая сталь'], [frame03, 'Оранжевая сталь'],
  [frame04, 'Серебро и синий'], [frame05, 'Золотая сталь'], [frame06, 'Белый и фиолетовый'],
  [frame07, 'Чёрный и красный'], [frame08, 'Технологичный синий'], [frame09, 'Золото и красный'],
  [frame10, 'Фиолетовый и красный'],
] as const;

export const frameCatalog: readonly FrameCosmetic[] = frameEntries.map(([imageUrl, displayName], index) => ({
  id: `frame_${String(index + 1).padStart(2, '0')}`,
  displayName,
  imageUrl,
  sortOrder: index + 1,
  available: true,
  displayConfig: sharedFrameDisplay,
}));

export const boosterVisualCatalog: readonly BoosterVisual[] = [
  { id: 'booster_hh', source: 'hubbyhub', effect: 'multiplier', imageUrl: boosterHh, displayName: 'Усиление HubbyHub' },
  { id: 'booster_gc', source: 'gamercomm', effect: 'multiplier', imageUrl: boosterGc, displayName: 'Усиление GamerComm' },
  { id: 'booster_no_boost', source: 'none', effect: 'none', imageUrl: boosterNoBoost, displayName: 'Без бустера' },
];

export const defaultAvatarId = 'avatar_01';
export const defaultFrameId = 'frame_01';
export const noBoosterVisual = boosterVisualCatalog.find((visual) => visual.id === 'booster_no_boost')!;

export const findAvatarCosmetic = (id: string) => avatarCatalog.find((item) => item.id === id && item.available);
export const findFrameCosmetic = (id: string) => frameCatalog.find((item) => item.id === id && item.available);
