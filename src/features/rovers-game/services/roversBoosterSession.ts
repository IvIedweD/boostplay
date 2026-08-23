export type RoversBoosterId = 'double-score' | 'stabilizer';

export interface RoversBoosterLoadout {
  doubleScore: boolean;
  stabilizer: boolean;
  activationId: string | null;
}

export const ROVERS_BOOSTER_COSTS: Record<RoversBoosterId, number> = {
  'double-score': 120,
  stabilizer: 180,
};

export const EMPTY_ROVERS_BOOSTER_LOADOUT: RoversBoosterLoadout = {
  doubleScore: false,
  stabilizer: false,
  activationId: null,
};

export function getRoversBoosterCost(loadout: RoversBoosterLoadout) {
  return (loadout.doubleScore ? ROVERS_BOOSTER_COSTS['double-score'] : 0)
    + (loadout.stabilizer ? ROVERS_BOOSTER_COSTS.stabilizer : 0);
}

export function getRoversScoreMultiplier(loadout: RoversBoosterLoadout) {
  return loadout.doubleScore ? 2 : 1;
}

export function shouldUseRoversStabilizer(
  loadout: RoversBoosterLoadout,
  dangerProgress: number,
  alreadyUsed: boolean,
) {
  return loadout.stabilizer && !alreadyUsed && dangerProgress >= 0.5;
}

const STORAGE_KEY = 'boostplay.rovers.next-booster-loadout';

function normalizeLoadout(value: unknown): RoversBoosterLoadout {
  if (!value || typeof value !== 'object') return EMPTY_ROVERS_BOOSTER_LOADOUT;
  const candidate = value as Partial<RoversBoosterLoadout>;
  return {
    doubleScore: candidate.doubleScore === true,
    stabilizer: candidate.stabilizer === true,
    activationId: typeof candidate.activationId === 'string' && candidate.activationId.length > 0
      ? candidate.activationId
      : null,
  };
}

export function saveRoversBoosterLoadout(loadout: RoversBoosterLoadout) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeLoadout(loadout)));
}

export function loadRoversBoosterLoadout(): RoversBoosterLoadout {
  if (typeof window === 'undefined') return EMPTY_ROVERS_BOOSTER_LOADOUT;
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    return stored ? normalizeLoadout(JSON.parse(stored)) : EMPTY_ROVERS_BOOSTER_LOADOUT;
  } catch {
    return EMPTY_ROVERS_BOOSTER_LOADOUT;
  }
}
