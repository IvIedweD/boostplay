const STORAGE_KEY = 'boostplay.activity-points';
export const DEFAULT_ACTIVITY_POINTS = 420;

function normalizePoints(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : DEFAULT_ACTIVITY_POINTS;
}

export function loadActivityPoints() {
  if (typeof window === 'undefined') return DEFAULT_ACTIVITY_POINTS;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? DEFAULT_ACTIVITY_POINTS : normalizePoints(stored);
  } catch {
    return DEFAULT_ACTIVITY_POINTS;
  }
}

export function saveActivityPoints(points: number) {
  const normalized = normalizePoints(points);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, String(normalized));
  }
  return normalized;
}
