import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import type { RoverLevel } from '../types';
import { RoverPreview } from './RoverPreview';
import { ChevronsRightIcon } from './RoversIcons';

interface RoversPlayfieldProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  currentLevel: RoverLevel;
  nextLevel: RoverLevel;
  dangerProgress: number;
  paused: boolean;
  onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onDrop: () => void;
}

export function RoversPlayfield({
  canvasRef,
  currentLevel,
  nextLevel,
  dangerProgress,
  paused,
  onPointerMove,
  onDrop,
}: RoversPlayfieldProps) {
  return (
    <section className="rovers-playfield-column" aria-label="Игровое поле">
      <div className="rovers-queue">
        <RoverPreview level={currentLevel} label="Текущий" />
        <ChevronsRightIcon className="queue-arrow" />
        <RoverPreview level={nextLevel} label="След." compact />
      </div>
      <div
        className={`rovers-board-shell${dangerProgress > 0 ? ' is-danger' : ''}`}
      >
        <canvas
          ref={canvasRef}
          aria-label="Контейнер для объединения роверов"
          onPointerMove={onPointerMove}
          onClick={onDrop}
        />
        {dangerProgress > 0 && (
          <div className="danger-warning is-active" role="status">
            <span>Критическая масса</span>
            <progress max={1} value={dangerProgress} />
          </div>
        )}
        {paused && (
          <div className="rovers-pause-overlay">
            <span>Пауза</span>
            <small>Физика остановлена</small>
          </div>
        )}
      </div>
    </section>
  );
}
