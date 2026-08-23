import { describe, expect, it } from 'vitest';
import { dailyTaskDefinitions, weeklyTaskDefinitions } from '../config/taskDefinitions';
import { generateTaskSet } from './generateTaskSet';

describe('deterministic task generation', () => {
  it('generates three daily tasks and four weekly tasks', () => {
    expect(generateTaskSet(dailyTaskDefinitions, 'daily', '2026-07-30', 'player-1')).toHaveLength(3);
    expect(generateTaskSet(weeklyTaskDefinitions, 'weekly', '2026-W31', 'player-1')).toHaveLength(4);
  });

  it('is deterministic for the same player and period', () => {
    const first = generateTaskSet(dailyTaskDefinitions, 'daily', '2026-07-30', 'player-1');
    const second = generateTaskSet(dailyTaskDefinitions, 'daily', '2026-07-30', 'player-1');
    expect(second).toEqual(first);
  });

  it('uses period in instance IDs and never duplicates definitions', () => {
    const first = generateTaskSet(dailyTaskDefinitions, 'daily', '2026-07-30', 'player-1');
    const next = generateTaskSet(dailyTaskDefinitions, 'daily', '2026-07-31', 'player-1');
    expect(next.map((task) => task.instanceId)).not.toEqual(first.map((task) => task.instanceId));
    expect(new Set(first.map((task) => task.definitionId)).size).toBe(3);
  });

  it('uses the required difficulty composition and skips disabled definitions', () => {
    const daily = generateTaskSet(dailyTaskDefinitions, 'daily', '2026-07-30', 'player-1');
    const weekly = generateTaskSet(weeklyTaskDefinitions, 'weekly', '2026-W31', 'player-1');
    const difficulty = (id: string) =>
      [...dailyTaskDefinitions, ...weeklyTaskDefinitions].find((item) => item.id === id)!.difficulty;
    expect(daily.map((task) => difficulty(task.definitionId)).filter((item) => item === 'easy')).not.toHaveLength(0);
    expect(weekly.map((task) => difficulty(task.definitionId))).toEqual(
      expect.arrayContaining(['easy', 'medium', 'medium', 'hard']),
    );
    const disabled = dailyTaskDefinitions.map((item) => ({ ...item, enabled: false }));
    expect(generateTaskSet(disabled, 'daily', 'x', 'p')).toEqual([]);
  });
});
