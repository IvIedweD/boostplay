import { createDefaultPlayerProfile } from '../config/profileDefaults';
import type { PlayerProfile } from '../types';
import { normalizePlayerProfile } from '../utils/normalizePlayerProfile';
import { migrateLegacyRoversProfile } from './migrateLegacyRoversProfile';

export const PLAYER_PROFILE_STORAGE_KEY = 'gamercomm.playerProfile.v1';

const getStorage = (storage?: Storage) => storage ?? window.localStorage;

export function migratePlayerProfile(raw: unknown, fromVersion: number) {
  void fromVersion;
  return normalizePlayerProfile(raw);
}

export function loadPlayerProfile(storage?: Storage): PlayerProfile {
  const target = getStorage(storage);
  let profile: PlayerProfile;
  try {
    const raw = target.getItem(PLAYER_PROFILE_STORAGE_KEY);
    profile = raw
      ? migratePlayerProfile(JSON.parse(raw), 0)
      : createDefaultPlayerProfile();
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Профиль восстановлен после ошибки чтения.', error);
    profile = createDefaultPlayerProfile();
  }
  const migrated = normalizePlayerProfile(
    migrateLegacyRoversProfile(profile, target),
  );
  target.setItem(PLAYER_PROFILE_STORAGE_KEY, JSON.stringify(migrated));
  return migrated;
}

export function savePlayerProfile(profile: PlayerProfile, storage?: Storage) {
  const normalized = normalizePlayerProfile(profile);
  getStorage(storage).setItem(
    PLAYER_PROFILE_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  return normalized;
}

export function updatePlayerProfile(
  updater: (profile: PlayerProfile) => PlayerProfile,
  storage?: Storage,
) {
  return savePlayerProfile(updater(loadPlayerProfile(storage)), storage);
}

export function resetPlayerProfileForDevelopment(storage?: Storage) {
  const target = getStorage(storage);
  const now = new Date().toISOString();
  const profile = createDefaultPlayerProfile(now);
  profile.migration = {
    legacyRoversMigrated: true,
    migratedAt: now,
    migratedKeys: [],
  };
  return savePlayerProfile(profile, target);
}
