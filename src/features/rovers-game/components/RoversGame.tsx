import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoversGame } from '../hooks/useRoversGame';
import { RoverEvolutionPanel } from './RoverEvolutionPanel';
import { RoversHud } from './RoversHud';
import { RoversPlayfield } from './RoversPlayfield';
import { RoversResult } from './RoversResult';
import { RoversRulesModal } from './RoversRulesModal';
import { PauseIcon, PlayIcon } from './RoversIcons';
import {
  isRoversResultPreview,
  roversResultPreview,
} from '../config/roversResultPreview';

export function RoversGame() {
  const navigate = useNavigate();
  const game = useRoversGame();
  const rulesButtonRef = useRef<HTMLButtonElement>(null);
  const exitButtonRef = useRef<HTMLButtonElement>(null);
  const rulesWereOpen = useRef(game.rulesOpen);
  const exitWasOpen = useRef(game.exitOpen);
  const resultPreview = isRoversResultPreview(
    window.location.search,
    import.meta.env.DEV,
  );

  const exitToCity = () => navigate('/');
  const closeRules = () => {
    game.closeRules();
    requestAnimationFrame(() => rulesButtonRef.current?.focus());
  };
  const closeExit = () => {
    game.closeExit();
    requestAnimationFrame(() => exitButtonRef.current?.focus());
  };
  const requestExit = () => {
    if (!game.requestExit()) exitToCity();
  };

  useEffect(() => {
    if (rulesWereOpen.current && !game.rulesOpen) {
      requestAnimationFrame(() => rulesButtonRef.current?.focus());
    }
    rulesWereOpen.current = game.rulesOpen;
  }, [game.rulesOpen]);

  useEffect(() => {
    if (exitWasOpen.current && !game.exitOpen) {
      requestAnimationFrame(() => exitButtonRef.current?.focus());
    }
    exitWasOpen.current = game.exitOpen;
  }, [game.exitOpen]);

  return (
    <main className="rovers-game-page">
      <header className="rovers-game-topbar">
        <div className="rovers-game-brand">
          <span>R</span>
          <div>
            <strong>Роверы</strong>
            <small>Merge Laboratory v4.0</small>
          </div>
        </div>
        <div className="rovers-score-bridge" aria-label="Результаты текущей игры">
          <div className="rovers-header-score">
            <span>Счёт</span>
            <strong>{game.score.toLocaleString('ru-RU')}</strong>
          </div>
          <div className="rovers-header-score is-record">
            <span>Рекорд</span>
            <strong>{game.bestScore.toLocaleString('ru-RU')}</strong>
          </div>
        </div>
        <nav className="rovers-header-actions" aria-label="Действия игры">
          <button ref={rulesButtonRef} type="button" className="is-secondary" onClick={game.openRules}>Правила</button>
          <button type="button" className="rovers-pause-button" onClick={game.togglePause}>
            {game.manualPause
              ? <PlayIcon className="rovers-action-icon" />
              : <PauseIcon className="rovers-action-icon" />}
            {game.manualPause ? 'Продолжить' : 'Пауза'}
          </button>
          <button ref={exitButtonRef} type="button" className="is-secondary is-exit" onClick={requestExit}>Выйти</button>
        </nav>
      </header>

      <div className="rovers-game-layout">
        <RoversHud
          highestLevel={game.highestLevel}
          merges={game.merges}
          boosterLoadout={game.boosterLoadout}
          stabilizerUsed={game.stabilizerUsed}
        />
        <RoversPlayfield
          canvasRef={game.canvasRef}
          currentLevel={game.currentLevel}
          nextLevel={game.nextLevel}
          dangerProgress={game.dangerProgress}
          paused={game.worldPaused && !game.rulesOpen && !game.exitOpen}
          onPointerMove={game.handlePointerMove}
          onDrop={game.drop}
        />
        <RoverEvolutionPanel highestLevel={game.unlockedHighest} />
      </div>

      {game.rulesOpen && !resultPreview && <RoversRulesModal onClose={closeRules} />}

      {game.exitOpen && (
        <div className="rovers-modal-backdrop">
          <section
            className="rovers-modal is-compact"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rovers-exit-title"
          >
            <span className="rovers-kicker">Текущая игра не сохранится</span>
            <h2 id="rovers-exit-title">Выйти в город?</h2>
            <button type="button" autoFocus onClick={closeExit}>
              Продолжить игру
            </button>
            <button type="button" className="is-secondary" onClick={exitToCity}>
              Выйти
            </button>
          </section>
        </div>
      )}

      {(game.phase === 'gameover' || resultPreview) && (
        <RoversResult
          score={resultPreview ? roversResultPreview.score : game.score}
          highestLevel={resultPreview ? roversResultPreview.highestLevel : game.highestLevel}
          bestScore={resultPreview ? roversResultPreview.bestScore : game.bestScore}
          merges={resultPreview ? roversResultPreview.merges : game.merges}
          durationMs={resultPreview ? roversResultPreview.durationMs : game.lastDurationMs}
          rank={resultPreview ? 8 : game.lastRank}
          rankLoading={resultPreview ? false : game.resultStandingLoading}
          onRestart={resultPreview ? () => navigate('/play', { replace: true }) : game.restart}
          onExit={exitToCity}
        />
      )}
    </main>
  );
}
