import { createContext } from 'react';
import type { PlayerProfile } from '../types';

export const PlayerProfileContext = createContext<PlayerProfile | null>(null);
