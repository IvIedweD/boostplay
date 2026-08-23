import { getRoverLevel } from '../config/roverLevels';
import type { RoverLevel } from '../types';
import { formatRoversDuration } from '../logic/roversGameRules';
import { RoverImage } from './RoverImage';
import { useAuth } from '../../boostplay/auth/BoostplayAuthProvider';

interface RoversResultProps {
  score: number;
  highestLevel: RoverLevel;
  bestScore: number;
  merges: number;
  durationMs: number;
  onRestart: () => void;
  onExit: () => void;
}

export function RoversResult({
  score,
  highestLevel,
  bestScore,
  merges,
  durationMs,
  onRestart,
  onExit,
}: RoversResultProps) {
  const auth = useAuth();
  const confirmedRank = auth.user?.rank ?? 0;

  return (
    <div className="rovers-modal-backdrop">
      <section
        className="rovers-game-over"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rovers-result-title"
      >
        <div className="rovers-game-over-specimen">
          <div className="rovers-game-over-halo" aria-hidden="true" />
          <RoverImage
            level={highestLevel}
            size={192}
            className="rovers-game-over-rover"
          />
          <div className="rovers-game-over-specimen-copy">
            <span>Лучший ровер</span>
            <h3>{getRoverLevel(highestLevel).title}</h3>
            <p>Уровень {highestLevel}</p>
          </div>
          <div className="rovers-game-over-tech-line" aria-hidden="true" />
        </div>

        <div className="rovers-game-over-report">
          <header>
            <span>Сессия завершена</span>
            <h2 id="rovers-result-title">Игра окончена</h2>
          </header>

          <div className="rovers-game-over-score">
            <span>Результат</span>
            <strong>{score.toLocaleString('ru-RU')}</strong>
          </div>

          <dl className="rovers-game-over-stats">
            <div><dt>Рекорд</dt><dd>{bestScore.toLocaleString('ru-RU')}</dd></div>
            <div><dt>Место</dt><dd>{confirmedRank > 0 ? `#${confirmedRank}` : '—'}</dd></div>
            <div><dt>Слияния</dt><dd>{merges.toLocaleString('ru-RU')}</dd></div>
            <div><dt>Время</dt><dd>{formatRoversDuration(durationMs)}</dd></div>
          </dl>

          <div className="rovers-game-over-actions">
            <button type="button" autoFocus onClick={onRestart}>Сыграть ещё</button>
            <button type="button" className="is-secondary" onClick={onExit}>Выйти</button>
          </div>
        </div>
      </section>
    </div>
  );
}
