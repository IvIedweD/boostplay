import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  getPlayerProfile,
  subscribeToPlayerProfile,
} from '../services/playerProgressService';
import { PlayerProfileContext } from './playerProfileContext';

export function PlayerProfileProvider({ children }: { children: ReactNode }) {
  const profile = useSyncExternalStore(
    subscribeToPlayerProfile,
    getPlayerProfile,
    getPlayerProfile,
  );
  const previousLevel = useRef(profile.progression.level);
  const [levelUp, setLevelUp] = useState<number | null>(null);

  useEffect(() => {
    if (profile.progression.level > previousLevel.current) {
      setLevelUp(profile.progression.level);
      const timer = window.setTimeout(() => setLevelUp(null), 5000);
      previousLevel.current = profile.progression.level;
      return () => window.clearTimeout(timer);
    }
    previousLevel.current = profile.progression.level;
  }, [profile.progression.level]);

  return (
    <PlayerProfileContext.Provider value={profile}>
      {children}
      {levelUp !== null && (
        <div className="player-level-up" role="status">
          <span>Новый уровень!</span>
          <strong>Достигнут уровень {levelUp}</strong>
        </div>
      )}
    </PlayerProfileContext.Provider>
  );
}
