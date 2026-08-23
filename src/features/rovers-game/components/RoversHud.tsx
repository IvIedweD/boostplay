import { FlaskIcon } from './RoversIcons';
import type { RoversBoosterLoadout } from '../services/roversBoosterSession';

interface RoversHudProps {
  highestLevel: number;
  merges: number;
  boosterLoadout: RoversBoosterLoadout;
  stabilizerUsed: boolean;
}

export function RoversHud({
  highestLevel,
  merges,
  boosterLoadout,
  stabilizerUsed,
}: RoversHudProps) {
  const hasBoosters = boosterLoadout.doubleScore || boosterLoadout.stabilizer;

  return (
    <aside className="rovers-hud">
      <div className="rovers-hud-console">
        <div className="rovers-hud-title">
          <span><FlaskIcon /> Статус сессии</span>
          <strong>Лаборатория</strong>
        </div>
        <div className="rovers-session-stats">
          <span>Высший уровень <strong>{highestLevel}<small>из 8</small></strong></span>
          <span>Объединений <strong>{merges}</strong></span>
        </div>
        <div className="rovers-controls-card">
          <strong>Управление</strong>
          <p><span>Движение</span><b><kbd>A</kbd><kbd>D</kbd></b></p>
          <p><span>Сброс</span><kbd className="is-wide">Пробел</kbd></p>
        </div>
      </div>
      <div className={`rovers-sync-card${hasBoosters ? ' has-boosters' : ''}`} aria-label="Состояние усилений">
        <strong className="rovers-sync-title">Синхронизация усилений</strong>
        {hasBoosters ? (
          <div className="rovers-booster-stack">
            {boosterLoadout.doubleScore && (
              <div className="rovers-booster-status is-multiplier">
                <b>×2</b>
                <span><strong>Двойной результат</strong><small>Активен</small></span>
              </div>
            )}
            {boosterLoadout.stabilizer && (
              <div className={`rovers-booster-status is-stabilizer${stabilizerUsed ? ' is-spent' : ''}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3 20 6v5c0 5.1-3.2 8.6-8 10-4.8-1.4-8-4.9-8-10V6l8-3Z" />
                  <path d="m8.5 12 2.2 2.2 4.8-5" />
                </svg>
                <span><strong>Стабилизатор</strong><small>{stabilizerUsed ? 'Израсходовано' : 'Готов · 1 заряд'}</small></span>
              </div>
            )}
          </div>
        ) : (
          <div className="rovers-sync-empty">
            <img className="rovers-atom" src={`${import.meta.env.BASE_URL}assets/ui/lucide-atom.svg`} alt="" />
            <p>Усиления не выбраны</p>
          </div>
        )}
      </div>
    </aside>
  );
}
