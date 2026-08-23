import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createRoversWorld, ROVERS_WORLD_WIDTH, type RoversWorld } from '../physics/createRoversWorld';
import {
  createFreshGameState,
  getHorizontalDirection,
  isDropControl,
  shouldPauseRoversWorld,
} from '../logic/roversGameRules';
import {
  loadRoversGameStorage,
  markRoversRulesViewed,
} from '../storage/roversGameStorage';
import type { RoverLevel, RoversGamePhase } from '../types';
import {
  defaultRoversDifficulty,
} from '../config/roversBalance';
import {
  recordRoversDevSession,
} from '../storage/roversDevTelemetry';
import {
  applyCompletedGameResult,
  createPlayerSessionId,
  getPlayerProfile,
} from '../../player-profile/services/playerProgressService';
import { processTaskEvent } from '../../tasks/services/taskService';
import {
  shouldPersistRoversGameResult,
  shouldRememberRoversRulesViewed,
} from '../logic/roversGameRuntime';
import { submitRoversResult } from '../../boostplay/data/supabaseGameData';
import {
  EMPTY_ROVERS_BOOSTER_LOADOUT,
  getRoversScoreMultiplier,
  loadRoversBoosterLoadout,
  saveRoversBoosterLoadout,
  shouldUseRoversStabilizer,
} from '../services/roversBoosterSession';

export interface RoversGameDebugApi {
  seedDemo: () => void;
  seedMerge: () => void;
  showMergeEffect: () => void;
  forceDanger: () => void;
  forceGameOver: () => void;
  setCollidersVisible: (visible: boolean) => void;
  getActiveLevels: () => RoverLevel[];
}

export interface UseRoversGameOptions {
  prototypeMode?: boolean;
  externallyPaused?: boolean;
  initialRulesOpen?: boolean;
}

declare global {
  interface Window {
    __roversGameDebug?: RoversGameDebugApi;
  }
}

export function useRoversGame({
  prototypeMode = false,
  externallyPaused = false,
  initialRulesOpen,
}: UseRoversGameOptions = {}) {
  const [legacySettings] = useState(loadRoversGameStorage);
  const [boosterLoadout, setBoosterLoadout] = useState(loadRoversBoosterLoadout);
  const boosterLoadoutRef = useRef(boosterLoadout);
  const stabilizerUsedRef = useRef(false);
  const [profileAtStart] = useState(getPlayerProfile);
  const difficulty = defaultRoversDifficulty;
  const sessionStartedAtRef = useRef(0);
  const sessionIdRef = useRef('');
  const pauseStartedAtRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<RoversWorld | null>(null);
  const scoreRef = useRef(0);
  const mergesRef = useRef(0);
  const highestRef = useRef<RoverLevel>(1);
  const legendaryRef = useRef(false);
  const bestScoreRef = useRef(profileAtStart.games.rovers.bestScore);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(profileAtStart.games.rovers.bestScore);
  const [highestLevel, setHighestLevel] = useState<RoverLevel>(1);
  const [merges, setMerges] = useState(0);
  const [legendaryCreated, setLegendaryCreated] = useState(false);
  const [stabilizerUsed, setStabilizerUsed] = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<RoverLevel>(1);
  const [nextLevel, setNextLevel] = useState<RoverLevel>(1);
  const [dangerProgress, setDangerProgress] = useState(0);
  const [phase, setPhase] = useState<RoversGamePhase>('playing');
  const [manualPause, setManualPause] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(document.hidden);
  const [rulesOpen, setRulesOpen] = useState(
    initialRulesOpen ?? (!prototypeMode && !legacySettings.rulesViewed),
  );
  const [exitOpen, setExitOpen] = useState(false);
  const [lastCommunityPoints, setLastCommunityPoints] = useState(0);
  const [lastXp, setLastXp] = useState(0);
  const [lastDurationMs, setLastDurationMs] = useState(0);
  const [newlyCompletedTaskCount, setNewlyCompletedTaskCount] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;
    sessionStartedAtRef.current = Date.now();
    sessionIdRef.current = createPlayerSessionId();
    pauseStartedAtRef.current = null;
    totalPausedMsRef.current = 0;
    const world = createRoversWorld(
      canvasRef.current,
      {
        onQueueChange: (current, next) => {
          setCurrentLevel(current);
          setNextLevel(next);
        },
        onMerge: (createdLevel, points) => {
          const awardedPoints = points * getRoversScoreMultiplier(boosterLoadoutRef.current);
          scoreRef.current += awardedPoints;
          mergesRef.current += 1;
          highestRef.current = Math.max(
            highestRef.current,
            createdLevel,
          ) as RoverLevel;
          setScore(scoreRef.current);
          setMerges(mergesRef.current);
          setHighestLevel(highestRef.current);
        },
        onLegendaryCreated: () => {
          legendaryRef.current = true;
          setLegendaryCreated(true);
        },
        onDangerChange: (progress) => {
          if (shouldUseRoversStabilizer(
            boosterLoadoutRef.current,
            progress,
            stabilizerUsedRef.current,
          )) {
            stabilizerUsedRef.current = true;
            setStabilizerUsed(true);
            worldRef.current?.activateStabilizer();
            setDangerProgress(0);
            return;
          }
          setDangerProgress(progress);
        },
        onGameOver: () => {
          const now = Date.now();
          const activePauseMs =
            pauseStartedAtRef.current === null
              ? 0
              : now - pauseStartedAtRef.current;
          const durationMs = Math.max(
            0,
            now -
              sessionStartedAtRef.current -
              totalPausedMsRef.current -
              activePauseMs,
          );
          setNewRecord(scoreRef.current > bestScoreRef.current);
          if (!shouldPersistRoversGameResult(prototypeMode)) {
            setLastDurationMs(durationMs);
            setPhase('gameover');
            return;
          }
          const completedResult = {
            sessionId: sessionIdRef.current,
            gameId: 'rovers' as const,
            score: scoreRef.current,
            highestRoverLevel: highestRef.current,
            totalMerges: mergesRef.current,
            legendaryRoversCreated: legendaryRef.current ? 1 : 0,
            durationSeconds: Math.floor(durationMs / 1000),
            completedAt: new Date().toISOString(),
            difficulty,
            boosterActivationId: boosterLoadoutRef.current.activationId,
          };
          const reward = applyCompletedGameResult(completedResult);
          void submitRoversResult(completedResult).catch((error: unknown) => {
            if (import.meta.env.DEV) console.warn(error);
          });
          if (import.meta.env.DEV) {
            recordRoversDevSession({
              completedAt: new Date().toISOString(),
              durationMs,
              finalScore: scoreRef.current,
              highestLevel: highestRef.current,
              totalMerges: mergesRef.current,
              legendaryCreated: legendaryRef.current,
              gameOverReason: 'overflow',
              difficulty,
            });
          }
          setBestScore(reward.profile.games.rovers.bestScore);
          bestScoreRef.current = reward.profile.games.rovers.bestScore;
          setLastCommunityPoints(reward.communityPointsEarned);
          setLastXp(reward.xpEarned);
          setLastDurationMs(durationMs);
          if (!reward.duplicate) {
            const taskResult = processTaskEvent({
              id: `rovers:${sessionIdRef.current}`,
              type: 'rovers.sessionCompleted',
              sessionId: sessionIdRef.current,
              score: scoreRef.current,
              highestLevel: highestRef.current,
              merges: mergesRef.current,
              legendaryCreated: legendaryRef.current ? 1 : 0,
              durationSeconds: Math.floor(durationMs / 1000),
              xpEarned: reward.xpEarned,
              communityPointsEarned: reward.communityPointsEarned,
              levelsGained: Math.max(0, reward.newLevel - reward.previousLevel),
              achievementIds: reward.achievementIds,
              occurredAt: new Date().toISOString(),
            });
            setNewlyCompletedTaskCount(taskResult.newlyCompleted.length);
          }
          setPhase('gameover');
        },
      },
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      difficulty,
    );
    worldRef.current = world;
    if (import.meta.env.DEV) {
      window.__roversGameDebug = {
        seedDemo: world.seedDemo,
        seedMerge: world.seedMerge,
        showMergeEffect: world.showMergeEffect,
        forceDanger: world.forceDanger,
        forceGameOver: world.forceGameOver,
        setCollidersVisible: world.setDebugVisible,
        getActiveLevels: world.getActiveLevels,
      };
    }
    return () => {
      world.destroy();
      worldRef.current = null;
      delete window.__roversGameDebug;
    };
  }, [difficulty, prototypeMode]);

  const worldPaused = externallyPaused || shouldPauseRoversWorld({
    manualPause,
    rulesOpen,
    exitOpen,
    documentHidden,
    gameOver: phase === 'gameover',
  });

  useEffect(() => {
    worldRef.current?.setPaused(worldPaused);
    const now = Date.now();
    if (worldPaused && pauseStartedAtRef.current === null) {
      pauseStartedAtRef.current = now;
    } else if (!worldPaused && pauseStartedAtRef.current !== null) {
      totalPausedMsRef.current += now - pauseStartedAtRef.current;
      pauseStartedAtRef.current = null;
    }
  }, [worldPaused]);

  useEffect(() => {
    const onVisibilityChange = () => {
      setDocumentHidden(document.hidden);
      if (document.hidden && phase === 'playing') setManualPause(true);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [phase]);

  const closeRules = useCallback(() => {
    if (shouldRememberRoversRulesViewed(prototypeMode)) markRoversRulesViewed();
    setRulesOpen(false);
  }, [prototypeMode]);

  const restart = useCallback(() => {
    const fresh = createFreshGameState();
    scoreRef.current = fresh.score;
    mergesRef.current = fresh.merges;
    highestRef.current = fresh.highestLevel;
    legendaryRef.current = false;
    setScore(fresh.score);
    setHighestLevel(fresh.highestLevel);
    setMerges(0);
    setLegendaryCreated(false);
    setNewRecord(false);
    setDangerProgress(fresh.dangerProgress);
    setPhase(fresh.phase);
    setManualPause(false);
    setExitOpen(false);
    setLastCommunityPoints(0);
    setLastXp(0);
    setLastDurationMs(0);
    setNewlyCompletedTaskCount(0);
    sessionStartedAtRef.current = Date.now();
    sessionIdRef.current = createPlayerSessionId();
    pauseStartedAtRef.current = null;
    totalPausedMsRef.current = 0;
    stabilizerUsedRef.current = false;
    setStabilizerUsed(false);
    boosterLoadoutRef.current = EMPTY_ROVERS_BOOSTER_LOADOUT;
    setBoosterLoadout(EMPTY_ROVERS_BOOSTER_LOADOUT);
    saveRoversBoosterLoadout(EMPTY_ROVERS_BOOSTER_LOADOUT);
    worldRef.current?.restart();
  }, []);

  const drop = useCallback(() => worldRef.current?.drop() ?? false, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (prototypeMode && event.key === 'Escape') return;
      if (rulesOpen) {
        if (event.key === 'Escape') closeRules();
        return;
      }
      if (exitOpen) {
        if (event.key === 'Escape') setExitOpen(false);
        return;
      }
      if (event.key === 'Escape' && phase !== 'gameover') {
        setExitOpen(true);
        return;
      }
      const direction = getHorizontalDirection(event.key);
      if (direction) {
        event.preventDefault();
        worldRef.current?.movePreview(direction * 22);
        return;
      }
      if (isDropControl(event.key)) {
        event.preventDefault();
        if (!event.repeat) drop();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeRules, drop, exitOpen, phase, prototypeMode, rulesOpen]);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * ROVERS_WORLD_WIDTH;
      worldRef.current?.setPreviewX(x);
    },
    [],
  );

  return {
    canvasRef,
    score,
    bestScore,
    highestLevel,
    merges,
    legendaryCreated,
    newRecord,
    unlockedHighest: Math.max(
      highestLevel,
      profileAtStart.games.rovers.highestRoverLevel,
    ) as RoverLevel,
    currentLevel,
    nextLevel,
    dangerProgress,
    phase,
    rulesOpen,
    exitOpen,
    manualPause,
    worldPaused,
    lastCommunityPoints,
    lastXp,
    lastDurationMs,
    newlyCompletedTaskCount,
    difficulty,
    boosterLoadout,
    stabilizerUsed,
    handlePointerMove,
    drop,
    restart,
    closeRules,
    openRules: () => setRulesOpen(true),
    requestExit: () => {
      if (phase === 'gameover') return false;
      setExitOpen(true);
      return true;
    },
    closeExit: () => setExitOpen(false),
    togglePause: () => setManualPause((value) => !value),
  };
}
