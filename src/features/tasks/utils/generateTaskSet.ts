import type { ActiveTask, TaskCadence, TaskDefinition, TaskDifficulty } from '../types';

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededOrder<T extends { id: string }>(items: T[], seed: string) {
  return [...items].sort(
    (a, b) => hashSeed(`${seed}:${a.id}`) - hashSeed(`${seed}:${b.id}`),
  );
}

export function generateTaskSet(
  definitions: TaskDefinition[],
  cadence: TaskCadence,
  periodKey: string,
  playerId: string,
): ActiveTask[] {
  const enabled = definitions.filter((item) => item.enabled && item.cadence === cadence);
  const composition: TaskDifficulty[] =
    cadence === 'daily'
      ? ['easy', 'medium', hashSeed(`${playerId}:${periodKey}:varied`) % 2 ? 'easy' : 'medium']
      : ['easy', 'medium', 'medium', 'hard'];
  const selected: TaskDefinition[] = [];
  for (const difficulty of composition) {
    const candidate = seededOrder(
      enabled.filter(
        (item) =>
          item.difficulty === difficulty &&
          !selected.some((chosen) => chosen.id === item.id) &&
          !selected.some((chosen) => chosen.condition.type === item.condition.type),
      ),
      `${playerId}:${periodKey}:${cadence}:${difficulty}`,
    )[0] ?? seededOrder(
      enabled.filter((item) => item.difficulty === difficulty && !selected.includes(item)),
      `${playerId}:${periodKey}:${cadence}:fallback`,
    )[0];
    if (candidate) selected.push(candidate);
  }
  return selected.map((definition) => ({
    instanceId: `${cadence}:${periodKey}:${definition.id}`,
    definitionId: definition.id,
    cadence,
    periodKey,
    progress: 0,
    target: definition.condition.target,
    completed: false,
    completedAt: null,
    claimed: false,
    claimedAt: null,
  }));
}
