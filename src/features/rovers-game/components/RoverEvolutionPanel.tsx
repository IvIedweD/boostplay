import { roverLevels } from '../config/roverLevels';
import type { RoverLevel } from '../types';
import { RoverImage } from './RoverImage';
import { LockIcon } from './RoversIcons';

interface RoverEvolutionPanelProps {
  highestLevel: RoverLevel;
}

export function RoverEvolutionPanel({
  highestLevel,
}: RoverEvolutionPanelProps) {
  const descriptions = [
    'Базовая модель',
    'Санитария',
    'Тяжёлая тяга',
    'Техподдержка',
    'Снабжение',
    'Текущий узел',
    'Скоростной класс',
    'Высший протокол',
  ];

  return (
    <aside className="rovers-evolution">
      <div>
        <span>Архив чертежей</span>
        <h2>Эволюция</h2>
      </div>
      <ol>
        {roverLevels.map((rover) => {
          const unlocked = rover.level <= highestLevel;
          return (
            <li
              key={rover.id}
              className={
                rover.level === highestLevel
                  ? 'is-current'
                  : unlocked
                    ? 'is-unlocked'
                    : 'is-locked'
              }
            >
              <span className="rovers-evolution-level">{rover.level}</span>
              <RoverImage level={rover.level} size={47} />
              <div>
                <strong>{rover.title}</strong>
                <em>{descriptions[rover.level - 1]}</em>
              </div>
              {!unlocked && (
                <small className="is-lock" aria-label="Не открыт"><LockIcon /></small>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
