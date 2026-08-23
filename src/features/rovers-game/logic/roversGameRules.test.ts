import { describe, expect, it } from 'vitest';
import {
  getHorizontalDirection,
  getMergeLevel,
  getMergeScore,
  createFreshGameState,
  isDropControl,
  pickSpawnLevel,
  resolveMergeChain,
  shouldPauseRoversWorld,
  updateDangerTimer,
  formatRoversDuration,
} from './roversGameRules';

describe('правила игры «Роверы»', () => {
  it('создаёт только уровни 1–3 с заданными границами вероятностей', () => {
    expect(pickSpawnLevel(0)).toBe(1);
    expect(pickSpawnLevel(0.5999)).toBe(1);
    expect(pickSpawnLevel(0.6)).toBe(2);
    expect(pickSpawnLevel(0.8999)).toBe(2);
    expect(pickSpawnLevel(0.9)).toBe(3);
    expect(pickSpawnLevel(0.9999)).toBe(3);
    expect(pickSpawnLevel(0.54, 'relaxed')).toBe(2);
    expect(pickSpawnLevel(0.62, 'challenge')).toBe(1);
  });

  it('объединяет два одинаковых уровня', () => {
    expect(getMergeLevel({ id: 1, level: 3 }, { id: 2, level: 3 })).toBe(4);
    const result = resolveMergeChain([2, 2]);
    expect(result.counts.get(2)).toBe(0);
    expect(result.counts.get(3)).toBe(1);
    expect([...result.counts.values()].reduce((sum, count) => sum + count, 0)).toBe(1);
  });

  it('не объединяет разные уровни и легендарные роверы', () => {
    expect(getMergeLevel({ id: 1, level: 2 }, { id: 2, level: 3 })).toBeNull();
    expect(getMergeLevel({ id: 1, level: 8 }, { id: 2, level: 8 })).toBeNull();
  });

  it('позволяет цепочкой получить легендарного ровера', () => {
    const result = resolveMergeChain(Array.from({ length: 128 }, () => 1));
    expect(result.counts.get(8)).toBe(1);
    expect(result.highestLevel).toBe(8);
    expect(result.merges).toBe(127);
  });

  it('защищает тело от повторного слияния', () => {
    expect(
      getMergeLevel(
        { id: 1, level: 2, mergeLocked: true },
        { id: 2, level: 2 },
      ),
    ).toBeNull();
    expect(getMergeLevel({ id: 1, level: 2 }, { id: 1, level: 2 })).toBeNull();
  });

  it('рассчитывает цепные слияния и очки', () => {
    const result = resolveMergeChain([1, 1, 1, 1, 2, 2]);
    expect(result.counts.get(3)).toBe(0);
    expect(result.counts.get(4)).toBe(1);
    expect(result.merges).toBe(5);
    expect(result.score).toBe(125);
    expect(result.highestLevel).toBe(4);
    expect(getMergeScore(8)).toBe(900);
  });

  it('сбрасывает таймер опасности после возвращения ниже линии', () => {
    const active = updateDangerTimer(
      { activeSince: null, progress: 0, gameOver: false },
      true,
      1000,
    );
    expect(updateDangerTimer(active, true, 2000).progress).toBe(0.5);
    expect(updateDangerTimer(active, false, 2100)).toEqual({
      activeSince: null,
      progress: 0,
      gameOver: false,
    });
  });

  it('завершает игру только после двух секунд опасности', () => {
    const active = updateDangerTimer(
      { activeSince: null, progress: 0, gameOver: false },
      true,
      1000,
    );
    expect(updateDangerTimer(active, true, 2999).gameOver).toBe(false);
    expect(updateDangerTimer(active, true, 3000).gameOver).toBe(true);
  });

  it('распознаёт клавиатурное перемещение и сброс', () => {
    expect(getHorizontalDirection('ArrowLeft')).toBe(-1);
    expect(getHorizontalDirection('d')).toBe(1);
    expect(getHorizontalDirection('Escape')).toBe(0);
    expect(isDropControl(' ')).toBe(true);
    expect(isDropControl('Enter')).toBe(true);
  });

  it('ставит игру на паузу для модальных окон и скрытой вкладки', () => {
    expect(
      shouldPauseRoversWorld({
        manualPause: false,
        rulesOpen: false,
        exitOpen: false,
        documentHidden: false,
        gameOver: false,
      }),
    ).toBe(false);
    expect(
      shouldPauseRoversWorld({
        manualPause: false,
        rulesOpen: true,
        exitOpen: false,
        documentHidden: false,
        gameOver: false,
      }),
    ).toBe(true);
  });

  it('создаёт чистое состояние при перезапуске', () => {
    expect(createFreshGameState()).toEqual({
      score: 0,
      merges: 0,
      highestLevel: 1,
      dangerProgress: 0,
      phase: 'playing',
    });
  });

  it('форматирует длительность результата', () => {
    expect(formatRoversDuration(367_000)).toBe('6:07');
  });
});
