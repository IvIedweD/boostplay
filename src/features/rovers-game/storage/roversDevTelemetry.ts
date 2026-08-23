import type { RoversDifficulty } from '../config/roversBalance';
import type { RoverLevel } from '../types';

export const ROVERS_DEV_SESSIONS_KEY = 'gamercomm.roversDevSessions.v1';

export interface RoversDevSession {
  completedAt: string;
  durationMs: number;
  finalScore: number;
  highestLevel: RoverLevel;
  totalMerges: number;
  legendaryCreated: boolean;
  gameOverReason: 'overflow';
  difficulty: RoversDifficulty;
}

export function loadRoversDevSessions(storage?: Storage): RoversDevSession[] {
  try {
    const raw = (storage ?? window.localStorage).getItem(
      ROVERS_DEV_SESSIONS_KEY,
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function recordRoversDevSession(
  session: RoversDevSession,
  storage?: Storage,
) {
  const target = storage ?? window.localStorage;
  const sessions = [session, ...loadRoversDevSessions(target)].slice(0, 10);
  target.setItem(ROVERS_DEV_SESSIONS_KEY, JSON.stringify(sessions));
  return sessions;
}

export function exportRoversDevSessions(storage?: Storage) {
  return JSON.stringify(loadRoversDevSessions(storage), null, 2);
}
