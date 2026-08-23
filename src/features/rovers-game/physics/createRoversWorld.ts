import Matter from 'matter-js';
import {
  getRoverLevel,
  roverLevels,
} from '../config/roverLevels';
import {
  getRoversBalancePreset,
  roversPhysicsDefaults,
  type RoversDifficulty,
} from '../config/roversBalance';
import {
  getMergeLevel,
  pickSpawnLevel,
  updateDangerTimer,
  type DangerTimerState,
} from '../logic/roversGameRules';
import type { RoverLevel } from '../types';
import { emitRoversSoundEvent } from '../logic/roversSoundEvents';

const { Bodies, Body, Composite, Engine, Events, Sleeping } = Matter;

export const ROVERS_WORLD_WIDTH = 656;
export const ROVERS_WORLD_HEIGHT = 510;
const DROP_Y = 88;
const FIXED_STEP = 1000 / 60;

interface RoverBodyData {
  level: RoverLevel;
  hasCollided: boolean;
  dangerCandidateSince: number | null;
}

interface MergeEffect {
  bodyId: number;
  x: number;
  y: number;
  level: RoverLevel;
  score: number;
  startedAt: number;
}

export interface RoversWorldCallbacks {
  onQueueChange: (current: RoverLevel, next: RoverLevel) => void;
  onMerge: (createdLevel: RoverLevel, score: number) => void;
  onLegendaryCreated: () => void;
  onDangerChange: (progress: number) => void;
  onGameOver: () => void;
}

export interface RoversWorld {
  drop(): boolean;
  movePreview(delta: number): void;
  setPreviewX(x: number): void;
  setPaused(paused: boolean): void;
  setDebugVisible(visible: boolean): void;
  activateStabilizer(): void;
  restart(): void;
  destroy(): void;
  seedDemo(): void;
  seedMerge(): void;
  showMergeEffect(): void;
  getActiveLevels(): RoverLevel[];
  forceDanger(): void;
  forceGameOver(): void;
}

function getRoverData(body: Matter.Body): RoverBodyData | null {
  return (body.plugin.rover as RoverBodyData | undefined) ?? null;
}

export function createRoversWorld(
  canvas: HTMLCanvasElement,
  callbacks: RoversWorldCallbacks,
  reducedMotion: boolean,
  difficulty: RoversDifficulty,
): RoversWorld {
  const balance = getRoversBalancePreset(difficulty);
  const INNER_LEFT = balance.innerLeft;
  const INNER_RIGHT = balance.innerRight;
  const FLOOR_Y = balance.floorY;
  const dangerLineY = balance.dangerLineY;
  const worldWidth = balance.playfieldWidth;
  const worldHeight = balance.playfieldHeight;
  const canvasContext = canvas.getContext('2d');
  if (!canvasContext) throw new Error('Не удалось создать игровое поле.');
  const context: CanvasRenderingContext2D = canvasContext;

  // Keep the game artwork crisp even on 1x desktop displays. The canvas is
  // slightly resized by the responsive layout, so a 1:1 backing store makes
  // the small rover sprites noticeably soft after browser interpolation.
  const pixelRatio = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
  canvas.width = Math.round(worldWidth * pixelRatio);
  canvas.height = Math.round(worldHeight * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const engine = Engine.create({
    // A rover must always continue falling until it is physically supported.
    // Matter can otherwise put a slow-moving body to sleep in mid-air after a
    // shallow transient collision with another rover.
    enableSleeping: false,
    positionIterations: roversPhysicsDefaults.positionIterations,
    velocityIterations: roversPhysicsDefaults.velocityIterations,
    constraintIterations: roversPhysicsDefaults.constraintIterations,
  });
  engine.gravity.y = balance.gravity;

  const walls = [
    Bodies.rectangle(INNER_LEFT - 22, worldHeight / 2, 44, worldHeight, {
      isStatic: true,
      label: 'left-wall',
      restitution: 0.08,
    }),
    Bodies.rectangle(INNER_RIGHT + 22, worldHeight / 2, 44, worldHeight, {
      isStatic: true,
      label: 'right-wall',
      restitution: 0.08,
    }),
    Bodies.rectangle(
      worldWidth / 2,
      FLOOR_Y + 22,
      worldWidth,
      44,
      {
        isStatic: true,
        label: 'floor',
        restitution: 0.06,
      },
    ),
  ];
  Composite.add(engine.world, walls);

  const images = new Map<RoverLevel, HTMLImageElement>();
  for (const config of roverLevels) {
    const image = new Image();
    image.src = config.assetPath;
    images.set(config.level, image);
  }
  const backgroundImage = balance.backgroundAsset ? new Image() : null;
  if (backgroundImage && balance.backgroundAsset) {
    backgroundImage.src = balance.backgroundAsset;
  }

  let currentLevel = pickSpawnLevel(Math.random(), difficulty);
  let nextLevel = pickSpawnLevel(Math.random(), difficulty);
  let previewX = worldWidth / 2;
  let dropLocked = false;
  let paused = false;
  let pauseStartedAt: number | null = null;
  let debugVisible = false;
  let gameOver = false;
  let animationFrame = 0;
  let dropTimer = 0;
  let dangerState: DangerTimerState = {
    activeSince: null,
    progress: 0,
    gameOver: false,
  };
  let lastDangerProgress = -1;
  let forcedDangerBody: Matter.Body | null = null;
  let dangerWasActive = false;
  let stabilizerEffectStartedAt: number | null = null;
  const mergeLocked = new Set<number>();
  const activeBodyIds = new Set<number>();
  const consumedBodyIds = new Set<number>();
  const mergeQueue: Array<[Matter.Body, Matter.Body]> = [];
  const effects: MergeEffect[] = [];

  callbacks.onQueueChange(currentLevel, nextLevel);

  function createRover(
    level: RoverLevel,
    x: number,
    y: number,
    options?: { static?: boolean },
  ) {
    const config = getRoverLevel(level);
    const radius =
      config.physicsRadius * balance.radiusMultipliers[level];
    const body = Bodies.circle(x, y, radius, {
      label: `rover-${level}`,
      restitution: roversPhysicsDefaults.restitution,
      friction: roversPhysicsDefaults.friction,
      frictionStatic: roversPhysicsDefaults.frictionStatic,
      frictionAir: roversPhysicsDefaults.frictionAir,
      density: roversPhysicsDefaults.density,
      slop: roversPhysicsDefaults.slop,
      sleepThreshold: roversPhysicsDefaults.sleepThreshold,
      isStatic: options?.static,
    });
    body.plugin.rover = {
      level,
      hasCollided: false,
      dangerCandidateSince: null,
    } satisfies RoverBodyData;
    activeBodyIds.add(body.id);
    Composite.add(engine.world, body);
    return body;
  }

  const handleCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
    for (const pair of event.pairs) {
      const first = getRoverData(pair.bodyA);
      const second = getRoverData(pair.bodyB);

      // A newly spawned rover starts with zero velocity, so it must not count
      // as danger before it reaches the pile. Once it has made real contact,
      // later nudges from new drops must not reset the danger countdown.
      if (first) first.hasCollided = true;
      if (second) second.hasCollided = true;

      if (
        !first ||
        !second ||
        !activeBodyIds.has(pair.bodyA.id) ||
        !activeBodyIds.has(pair.bodyB.id) ||
        consumedBodyIds.has(pair.bodyA.id) ||
        consumedBodyIds.has(pair.bodyB.id)
      ) {
        continue;
      }
      const mergedLevel = getMergeLevel(
        {
          id: pair.bodyA.id,
          level: first.level,
          mergeLocked: mergeLocked.has(pair.bodyA.id),
        },
        {
          id: pair.bodyB.id,
          level: second.level,
          mergeLocked: mergeLocked.has(pair.bodyB.id),
        },
      );
      if (!mergedLevel) continue;
      mergeLocked.add(pair.bodyA.id);
      mergeLocked.add(pair.bodyB.id);
      mergeQueue.push([pair.bodyA, pair.bodyB]);
    }
  };
  Events.on(engine, 'collisionStart', handleCollision);

  function processMerges(now: number) {
    while (mergeQueue.length) {
      const [firstBody, secondBody] = mergeQueue.shift()!;
      const first = getRoverData(firstBody);
      const second = getRoverData(secondBody);
      if (
        !first ||
        !second ||
        !activeBodyIds.has(firstBody.id) ||
        !activeBodyIds.has(secondBody.id) ||
        consumedBodyIds.has(firstBody.id) ||
        consumedBodyIds.has(secondBody.id)
      ) {
        if (activeBodyIds.has(firstBody.id)) mergeLocked.delete(firstBody.id);
        if (activeBodyIds.has(secondBody.id)) mergeLocked.delete(secondBody.id);
        continue;
      }
      const createdLevel = getMergeLevel(
        { id: firstBody.id, level: first.level },
        { id: secondBody.id, level: second.level },
      );
      if (!createdLevel) continue;

      const midpoint = {
        x: (firstBody.position.x + secondBody.position.x) / 2,
        y: (firstBody.position.y + secondBody.position.y) / 2,
      };
      const velocity = {
        x: (firstBody.velocity.x + secondBody.velocity.x) / 2,
        y: Math.min(0, (firstBody.velocity.y + secondBody.velocity.y) / 2 - 1.2),
      };
      // Consume the pair before touching Matter's world. This makes the
      // transaction atomic for collision callbacks and the renderer.
      activeBodyIds.delete(firstBody.id);
      activeBodyIds.delete(secondBody.id);
      consumedBodyIds.add(firstBody.id);
      consumedBodyIds.add(secondBody.id);
      Composite.remove(engine.world, firstBody);
      Composite.remove(engine.world, secondBody);

      const mergedBody = createRover(createdLevel, midpoint.x, midpoint.y);
      Body.setVelocity(mergedBody, velocity);
      const score = getRoverLevel(createdLevel).scoreValue;
      effects.push({
        bodyId: mergedBody.id,
        ...midpoint,
        level: createdLevel,
        score,
        startedAt: now,
      });
      callbacks.onMerge(createdLevel, score);
      emitRoversSoundEvent('merge');
      if (createdLevel === 8) {
        callbacks.onLegendaryCreated();
        emitRoversSoundEvent('legendaryCreated');
      }
    }
  }

  function getRoverBodies() {
    return Composite.allBodies(engine.world).filter(
      (body) => activeBodyIds.has(body.id) && getRoverData(body),
    );
  }

  function updateDanger(now: number) {
    const dangerous = getRoverBodies().some((body) => {
      if (body === forcedDangerBody) return true;
      const data = getRoverData(body);
      if (!data) return false;
      const radius =
        getRoverLevel(data.level).physicsRadius *
        balance.radiusMultipliers[data.level];
      const isAboveLine = body.position.y - radius < dangerLineY;

      if (!isAboveLine) {
        data.dangerCandidateSince = null;
        return false;
      }

      if (!data.hasCollided) return false;

      data.dangerCandidateSince ??= now;
      return now - data.dangerCandidateSince >= 500;
    });
    dangerState = updateDangerTimer(
      dangerState,
      dangerous,
      now,
      balance.overflowDelayMs,
    );
    if (dangerous && !dangerWasActive) emitRoversSoundEvent('dangerStart');
    dangerWasActive = dangerous;
    const roundedProgress = Math.round(dangerState.progress * 100) / 100;
    if (roundedProgress !== lastDangerProgress) {
      lastDangerProgress = roundedProgress;
      callbacks.onDangerChange(roundedProgress);
    }
    if (dangerState.gameOver && !gameOver) finishGame();
  }

  function finishGame() {
    if (gameOver) return;
    gameOver = true;
    paused = true;
    emitRoversSoundEvent('gameOver');
    callbacks.onGameOver();
  }

  function drawBackground() {
    const gradient = context.createLinearGradient(0, 0, 0, worldHeight);
    gradient.addColorStop(0, '#0b1420');
    gradient.addColorStop(1, '#070d14');
    context.fillStyle = gradient;
    context.fillRect(0, 0, worldWidth, worldHeight);
    if (backgroundImage?.complete) {
      context.save();
      context.globalAlpha = 0.3;
      context.drawImage(
        backgroundImage,
        0,
        0,
        worldWidth,
        worldHeight,
      );
      context.restore();
    }

    context.fillStyle = 'rgba(85, 217, 244, 0.14)';
    for (let x = 30; x < worldWidth; x += 40) {
      for (let y = 30; y < FLOOR_Y; y += 40) {
        context.beginPath();
        context.arc(x, y, 0.7, 0, Math.PI * 2);
        context.fill();
      }
    }

    context.fillStyle = 'rgba(85, 217, 244, 0.08)';
    context.fillRect(INNER_LEFT, FLOOR_Y, INNER_RIGHT - INNER_LEFT, 1);
  }

  function getRenderMetrics(level: RoverLevel) {
    const config = getRoverLevel(level);
    const crop = config.sourceCrop;
    const scale =
      (config.renderSize * config.displayScale) /
      Math.max(crop.width, crop.height);
    return {
      config,
      crop,
      renderWidth: crop.width * scale,
      renderHeight: crop.height * scale,
    };
  }

  function drawRover(body: Matter.Body, level: RoverLevel, now: number) {
    const { config, crop, renderWidth, renderHeight } =
      getRenderMetrics(level);
    const image = images.get(level);
    const pulse = effects.find((effect) => effect.bodyId === body.id);
    const pulseProgress = pulse
      ? Math.min(1, Math.max(0, (now - pulse.startedAt) / roversPhysicsDefaults.mergeEffectMs))
      : 1;
    const pulseScale =
      reducedMotion || pulseProgress >= 1
        ? 1
        : 0.82 + Math.sin(pulseProgress * Math.PI) * 0.22 + pulseProgress * 0.18;
    context.save();
    context.translate(body.position.x, body.position.y);
    context.rotate(body.angle);
    context.scale(pulseScale, pulseScale);
    if (level === 8) {
      context.shadowColor = 'rgba(255, 211, 82, 0.9)';
      context.shadowBlur = 20;
    }
    if (image?.complete) {
      context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        -renderWidth / 2 + (config.offsetX ?? 0),
        -renderHeight / 2 + (config.offsetY ?? 0),
        renderWidth,
        renderHeight,
      );
    } else {
      context.fillStyle = '#66dcff';
      context.beginPath();
      context.arc(
        0,
        0,
        config.physicsRadius * balance.radiusMultipliers[level],
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    context.restore();
  }

  function drawPreview() {
    if (gameOver || paused || dropLocked) return;
    const { config, crop, renderWidth, renderHeight } =
      getRenderMetrics(currentLevel);
    const image = images.get(currentLevel);
    context.save();
    context.globalAlpha = 0.92;
    if (image?.complete) {
      context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        previewX - renderWidth / 2 + (config.offsetX ?? 0),
        DROP_Y - renderHeight / 2 + (config.offsetY ?? 0),
        renderWidth,
        renderHeight,
      );
    }
    context.restore();
  }

  function drawDropGuide() {
    if (gameOver || paused) return;
    const railY = 24;
    context.save();
    context.strokeStyle = 'rgba(85, 217, 244, 0.16)';
    context.lineWidth = 1;
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(INNER_LEFT + 18, railY);
    context.lineTo(INNER_RIGHT - 18, railY);
    context.stroke();

    context.fillStyle = 'rgba(85, 217, 244, 0.72)';
    context.shadowColor = 'rgba(85, 217, 244, 0.45)';
    context.shadowBlur = 8;
    context.beginPath();
    context.roundRect(previewX - 18, railY - 2, 36, 4, 2);
    context.fill();

    context.shadowBlur = 0;
    context.setLineDash([4, 7]);
    context.beginPath();
    context.moveTo(previewX, railY + 8);
    context.lineTo(previewX, FLOOR_Y);
    context.stroke();
    context.restore();
  }

  function drawDangerBoundary(now: number) {
    const dangerActive = dangerState.activeSince !== null;
    const pulse =
      dangerActive && !reducedMotion
        ? 0.5 + Math.sin(now / 220) * 0.5
        : 0;
    const lineAlpha = dangerActive ? 0.68 + pulse * 0.2 : 0.34;

    context.save();
    context.strokeStyle = `rgba(255, 105, 125, ${lineAlpha})`;
    context.lineWidth = dangerActive ? 1.5 : 1;
    context.setLineDash([8, 8]);
    context.shadowColor = 'rgba(255, 80, 108, 0.45)';
    context.shadowBlur = dangerActive ? 7 + pulse * 5 : 2;
    context.beginPath();
    context.moveTo(INNER_LEFT + 18, dangerLineY);
    context.lineTo(INNER_RIGHT - 18, dangerLineY);
    context.stroke();
    context.restore();
  }

  function drawEffects(now: number) {
    for (let index = effects.length - 1; index >= 0; index -= 1) {
      const effect = effects[index];
      const elapsed = now - effect.startedAt;
      const duration = reducedMotion ? 160 : roversPhysicsDefaults.mergeEffectMs;
      const progress = Math.min(1, Math.max(0, elapsed / duration));
      if (progress >= 1) {
        effects.splice(index, 1);
        continue;
      }
      const alpha = 1 - progress;
      context.save();
      const glowColor =
        effect.level === 8 ? '255, 211, 82' : '101, 216, 255';
      context.strokeStyle = `rgba(${glowColor}, ${alpha * 0.8})`;
      context.lineWidth = 4;
      context.beginPath();
      context.arc(effect.x, effect.y, 24 + progress * 45, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = `rgba(255, 213, 84, ${alpha})`;
      context.font = '800 17px Inter, Arial, sans-serif';
      context.textAlign = 'center';
      context.fillText(`+${effect.score}`, effect.x, effect.y - 35 - progress * 28);
      if (!reducedMotion) {
        for (let particle = 0; particle < 8; particle += 1) {
          const angle = (particle / 8) * Math.PI * 2;
          const distance = 18 + progress * 42;
          context.fillStyle = `rgba(${glowColor}, ${alpha * 0.72})`;
          context.beginPath();
          context.arc(
            effect.x + Math.cos(angle) * distance,
            effect.y + Math.sin(angle) * distance,
            2.5 * (1 - progress),
            0,
            Math.PI * 2,
          );
          context.fill();
        }
      }
      context.restore();
    }
  }

  function drawStabilizerEffect(now: number) {
    if (stabilizerEffectStartedAt === null) return;
    const duration = reducedMotion ? 360 : 1050;
    const progress = Math.min(1, Math.max(0, (now - stabilizerEffectStartedAt) / duration));
    if (progress >= 1) {
      stabilizerEffectStartedAt = null;
      return;
    }
    const eased = 1 - Math.pow(1 - progress, 3);
    const alpha = Math.sin(progress * Math.PI);
    const sweepY = dangerLineY + (FLOOR_Y - dangerLineY) * eased;

    context.save();
    context.globalCompositeOperation = 'screen';

    const fieldGlow = context.createRadialGradient(
      worldWidth / 2,
      sweepY,
      8,
      worldWidth / 2,
      sweepY,
      worldWidth * 0.62,
    );
    fieldGlow.addColorStop(0, `rgba(108, 241, 255, ${0.17 * alpha})`);
    fieldGlow.addColorStop(0.5, `rgba(57, 202, 232, ${0.08 * alpha})`);
    fieldGlow.addColorStop(1, 'rgba(30, 150, 190, 0)');
    context.fillStyle = fieldGlow;
    context.fillRect(INNER_LEFT, dangerLineY, INNER_RIGHT - INNER_LEFT, FLOOR_Y - dangerLineY);

    context.shadowColor = 'rgba(92, 232, 255, 0.9)';
    context.shadowBlur = reducedMotion ? 8 : 22;
    context.strokeStyle = `rgba(126, 241, 255, ${0.82 * alpha})`;
    context.lineWidth = reducedMotion ? 2 : 3;
    context.beginPath();
    context.moveTo(INNER_LEFT + 12, sweepY);
    context.lineTo(INNER_RIGHT - 12, sweepY);
    context.stroke();

    if (!reducedMotion) {
      context.shadowBlur = 10;
      for (let index = 0; index < 18; index += 1) {
        const seed = (index * 83) % 101;
        const x = INNER_LEFT + 22 + (seed / 100) * (INNER_RIGHT - INNER_LEFT - 44);
        const offset = ((index % 5) - 2) * 13;
        const size = 1.2 + (index % 3) * 0.8;
        context.fillStyle = `rgba(142, 242, 255, ${alpha * (0.35 + (index % 4) * 0.1)})`;
        context.beginPath();
        context.arc(x, sweepY + offset, size, 0, Math.PI * 2);
        context.fill();
      }

      context.strokeStyle = `rgba(99, 224, 255, ${0.38 * alpha})`;
      context.lineWidth = 1;
      for (let offset = 22; offset <= 66; offset += 22) {
        context.beginPath();
        context.moveTo(INNER_LEFT + 25, sweepY - offset);
        context.lineTo(INNER_RIGHT - 25, sweepY - offset);
        context.stroke();
      }
    }
    context.restore();
  }

  function drawDebugOverlay() {
    if (!import.meta.env.DEV || !debugVisible) return;
    context.save();
    context.font = '700 10px Inter, Arial, sans-serif';
    context.textAlign = 'center';
    for (const body of getRoverBodies()) {
      const data = getRoverData(body);
      if (!data) continue;
      const { config, renderWidth, renderHeight } = getRenderMetrics(data.level);
      context.strokeStyle = mergeLocked.has(body.id) ? '#ff5d73' : '#6dff9b';
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(
        body.position.x,
        body.position.y,
        config.physicsRadius * balance.radiusMultipliers[data.level],
        0,
        Math.PI * 2,
      );
      context.stroke();
      context.strokeStyle = 'rgba(255, 215, 82, 0.8)';
      context.strokeRect(
        body.position.x - renderWidth / 2 + (config.offsetX ?? 0),
        body.position.y - renderHeight / 2 + (config.offsetY ?? 0),
        renderWidth,
        renderHeight,
      );
      context.fillStyle = '#fff';
      context.fillRect(body.position.x - 2, body.position.y - 2, 4, 4);
      context.fillText(
        mergeLocked.has(body.id) ? 'LOCK' : `L${data.level}`,
        body.position.x,
        body.position.y -
          config.physicsRadius * balance.radiusMultipliers[data.level] -
          6,
      );
    }
    context.restore();
  }

  function render(now: number) {
    drawBackground();
    drawDropGuide();
    for (const body of getRoverBodies().sort(
      (first, second) => first.position.y - second.position.y,
    )) {
      const data = getRoverData(body);
      if (data) drawRover(body, data.level, now);
    }
    drawPreview();
    drawDangerBoundary(now);
    drawEffects(now);
    drawStabilizerEffect(now);
    drawDebugOverlay();
  }

  function tick(now: number) {
    if (!paused && !gameOver) {
      Engine.update(engine, FIXED_STEP);
      processMerges(now);
      updateDanger(now);
    }
    render(now);
    animationFrame = requestAnimationFrame(tick);
  }
  animationFrame = requestAnimationFrame(tick);

  function setPreviewX(value: number) {
    const radius =
      getRoverLevel(currentLevel).physicsRadius *
      balance.radiusMultipliers[currentLevel];
    previewX = Math.min(
      INNER_RIGHT - radius - 2,
      Math.max(INNER_LEFT + radius + 2, value),
    );
  }

  function drop() {
    if (paused || gameOver || dropLocked) return false;
    createRover(currentLevel, previewX, DROP_Y);
    emitRoversSoundEvent('drop');
    dropLocked = true;
    dropTimer = window.setTimeout(() => {
      if (gameOver) return;
      currentLevel = nextLevel;
      nextLevel = pickSpawnLevel(Math.random(), difficulty);
      setPreviewX(previewX);
      dropLocked = false;
      callbacks.onQueueChange(currentLevel, nextLevel);
    }, balance.dropCooldownMs);
    return true;
  }

  function clearDynamicBodies() {
    for (const body of getRoverBodies()) Composite.remove(engine.world, body);
    activeBodyIds.clear();
    consumedBodyIds.clear();
    mergeQueue.length = 0;
    mergeLocked.clear();
    effects.length = 0;
    stabilizerEffectStartedAt = null;
    forcedDangerBody = null;
    dangerWasActive = false;
  }

  function restart() {
    clearDynamicBodies();
    currentLevel = pickSpawnLevel(Math.random(), difficulty);
    nextLevel = pickSpawnLevel(Math.random(), difficulty);
    previewX = worldWidth / 2;
    dropLocked = false;
    window.clearTimeout(dropTimer);
    paused = false;
    pauseStartedAt = null;
    gameOver = false;
    dangerState = { activeSince: null, progress: 0, gameOver: false };
    lastDangerProgress = -1;
    callbacks.onDangerChange(0);
    callbacks.onQueueChange(currentLevel, nextLevel);
  }

  function activateStabilizer() {
    if (gameOver) return;
    clearDynamicBodies();
    stabilizerEffectStartedAt = performance.now();
    dangerState = { activeSince: null, progress: 0, gameOver: false };
    lastDangerProgress = 0;
    callbacks.onDangerChange(0);
  }

  return {
    drop,
    movePreview(delta) {
      setPreviewX(previewX + delta);
    },
    setPreviewX,
    setPaused(value) {
      if (paused === value) return;
      const now = performance.now();
      if (value) {
        pauseStartedAt = now;
      } else if (pauseStartedAt !== null) {
        const pausedDuration = now - pauseStartedAt;
        if (dangerState.activeSince !== null) {
          dangerState.activeSince += pausedDuration;
        }
        for (const effect of effects) effect.startedAt += pausedDuration;
        if (stabilizerEffectStartedAt !== null) {
          stabilizerEffectStartedAt += pausedDuration;
        }
        pauseStartedAt = null;
      }
      paused = value;
      for (const body of getRoverBodies()) {
        Sleeping.set(body, value);
      }
    },
    setDebugVisible(value) {
      debugVisible = import.meta.env.DEV && value;
    },
    activateStabilizer,
    restart,
    destroy() {
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(dropTimer);
      Events.off(engine, 'collisionStart', handleCollision);
      Composite.clear(engine.world, false, true);
      Engine.clear(engine);
    },
    seedDemo() {
      clearDynamicBodies();
      const demo: Array<[RoverLevel, number, number]> = [
        [4, 245, 412],
        [3, 345, 430],
        [2, 445, 440],
        [1, 535, 450],
        [2, 145, 450],
      ];
      for (const [level, x, y] of demo) createRover(level, x, y);
    },
    seedMerge() {
      clearDynamicBodies();
      createRover(2, 300, 425);
      createRover(2, 356, 425);
    },
    showMergeEffect() {
      clearDynamicBodies();
      createRover(3, 328, 425);
      effects.push({
        bodyId: getRoverBodies()[0]?.id ?? -1,
        x: 328,
        y: 425,
        level: 3,
        score: 25,
        startedAt: performance.now() + 60_000,
      });
    },
    getActiveLevels() {
      return getRoverBodies()
        .map((body) => getRoverData(body)?.level)
        .filter((level): level is RoverLevel => level !== undefined);
    },
    forceDanger() {
      if (forcedDangerBody) {
        activeBodyIds.delete(forcedDangerBody.id);
        Composite.remove(engine.world, forcedDangerBody);
      }
      effects.length = 0;
      forcedDangerBody = createRover(3, 328, 78, { static: true });
      paused = true;
      dangerState = {
        activeSince: performance.now() - 1160,
        progress: 0.58,
        gameOver: false,
      };
      callbacks.onDangerChange(0.58);
    },
    forceGameOver: finishGame,
  };
}
