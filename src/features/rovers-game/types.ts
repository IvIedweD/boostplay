export type RoverLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type RoversGamePhase = 'playing' | 'paused' | 'gameover';

export interface RoverLevelConfig {
  level: RoverLevel;
  id:
    | 'courier'
    | 'cleaner'
    | 'cargo'
    | 'repair'
    | 'food'
    | 'scanner'
    | 'speed'
    | 'legendary';
  title: string;
  assetPath: string;
  physicsRadius: number;
  renderSize: number;
  scoreValue: number;
  displayScale: number;
  offsetX?: number;
  offsetY?: number;
  sourceCrop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface RoversGameResult {
  score: number;
  highestLevel: RoverLevel;
  merges: number;
  communityPoints: number;
  legendaryCreated: boolean;
  durationMs: number;
  difficulty: RoversDifficulty;
  gameOverReason: 'overflow';
  completedAt: string;
}

export interface RoversGameSnapshot {
  score: number;
  bestScore: number;
  highestLevel: RoverLevel;
  currentLevel: RoverLevel;
  nextLevel: RoverLevel;
  phase: RoversGamePhase;
  dangerProgress: number;
}
import type { RoversDifficulty } from './config/roversBalance';
