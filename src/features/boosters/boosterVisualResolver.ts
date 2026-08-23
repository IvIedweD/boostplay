import {
  boosterVisualCatalog,
  noBoosterVisual,
  type BoosterVisual,
  type BoosterVisualSource,
} from '../../assets/boostplay/cosmetics/catalog';

export interface ResolvableBooster {
  id?: string | null;
  source?: string | null;
  effectType?: string | null;
  multiplier?: number | null;
  active?: boolean | null;
}

const exactVisualIds: Record<string, string> = {
  'hubbyhub-turbo-x3': 'booster_hh',
  'hubbyhub-turbo-x2': 'booster_hh',
  'gamercomm-charge-x3': 'booster_gc',
  'gamercomm-charge-x2': 'booster_gc',
  booster_hh_x3: 'booster_hh',
  booster_hh_x2: 'booster_hh',
  booster_gc_x3: 'booster_gc',
  booster_gc_x2: 'booster_gc',
  no_boost: 'booster_no_boost',
  booster_no_boost: 'booster_no_boost',
};

export function normalizeBoosterSource(source: string | null | undefined): BoosterVisualSource | null {
  const normalized = source?.trim().toLowerCase().replaceAll(/[^a-zа-яё]/g, '');
  if (!normalized) return null;
  if (normalized === 'hh' || normalized === 'hubbyhub') return 'hubbyhub';
  if (normalized === 'gc' || normalized === 'gamercomm') return 'gamercomm';
  if (normalized === 'community' || normalized === 'сообщество') return 'community';
  if (normalized === 'event' || normalized === 'событие') return 'event';
  if (normalized === 'none' || normalized === 'noboost' || normalized === 'nobust') return 'none';
  return null;
}

const findVisual = (id: string) => boosterVisualCatalog.find((visual) => visual.id === id);

export function resolveBoosterVisual(activeBooster: ResolvableBooster | null | undefined): BoosterVisual {
  if (!activeBooster || activeBooster.active === false) return noBoosterVisual;

  const exactId = activeBooster.id ? exactVisualIds[activeBooster.id.trim().toLowerCase()] : undefined;
  if (exactId) return findVisual(exactId) ?? noBoosterVisual;

  const source = normalizeBoosterSource(activeBooster.source);
  if (source === 'hubbyhub') return findVisual('booster_hh') ?? noBoosterVisual;
  if (source === 'gamercomm') return findVisual('booster_gc') ?? noBoosterVisual;

  return noBoosterVisual;
}

export const boosterSourceLabel = (source: BoosterVisualSource) => ({
  gamercomm: 'GamerComm',
  hubbyhub: 'HubbyHub',
  community: 'Сообщество',
  event: 'Событие',
  none: 'Без источника',
}[source]);
