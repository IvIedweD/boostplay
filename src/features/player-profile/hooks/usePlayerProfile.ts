import { useContext } from 'react';
import { PlayerProfileContext } from '../context/playerProfileContext';

export function usePlayerProfile() {
  const profile = useContext(PlayerProfileContext);
  if (!profile) throw new Error('PlayerProfileProvider не подключён.');
  return profile;
}
