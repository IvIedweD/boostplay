import type { ReactNode } from 'react';
import type { RoversBoosterId, RoversBoosterLoadout } from '../../rovers-game/services/roversBoosterSession';
import { getRoversBoosterCost, ROVERS_BOOSTER_COSTS } from '../../rovers-game/services/roversBoosterSession';
import { BoostplayDialog } from './BoostplayDialog';

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 20 6v5c0 5.1-3.2 8.6-8 10-4.8-1.4-8-4.9-8-10V6l8-3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 5c3-3 5-2 5-2s1 2-2 5l-4.5 4.5-4-1-1-4L14 5Z" />
      <path d="m8.5 12.5-3 3M6 18l-2 2M11.5 15.5l-3 3" />
    </svg>
  );
}

function BoosterCard({
  id,
  selected,
  icon,
  title,
  description,
  onToggle,
}: {
  id: RoversBoosterId;
  selected: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onToggle: (id: RoversBoosterId) => void;
}) {
  return (
    <button
      type="button"
      className={`bp-booster-node is-${id}${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onToggle(id)}
    >
      <i className="bp-booster-node__glow" aria-hidden="true" />
      <span className="bp-booster-node__icon">{icon}</span>
      <strong>{title}</strong>
      <small>{description}</small>
      <em><b>{ROVERS_BOOSTER_COSTS[id]}</b> активности</em>
    </button>
  );
}

export function BoosterSelectionDialog({
  loadout,
  onChange,
  onClose,
  onStart,
  onStartWithoutBoosters,
  activityPoints,
  pending = false,
  error = '',
}: {
  loadout: RoversBoosterLoadout;
  onChange: (loadout: RoversBoosterLoadout) => void;
  onClose: () => void;
  onStart: () => void;
  onStartWithoutBoosters: () => void;
  activityPoints: number;
  pending?: boolean;
  error?: string;
}) {
  const selectedCount = Number(loadout.doubleScore) + Number(loadout.stabilizer);
  const totalCost = getRoversBoosterCost(loadout);

  const toggle = (id: RoversBoosterId) => {
    onChange({
      ...loadout,
      activationId: null,
      [id === 'double-score' ? 'doubleScore' : 'stabilizer']:
        id === 'double-score' ? !loadout.doubleScore : !loadout.stabilizer,
    });
  };

  return (
    <BoostplayDialog
      title="ВЫБЕРИТЕ БУСТЕРЫ"
      eyebrow="Подготовка к игре"
      className="bp-booster-select-dialog"
      bodyClassName="bp-booster-select-dialog__body"
      onClose={onClose}
    >
      <p className="bp-booster-select-subtitle">Снаряжение для следующего вылета</p>
      <div className={`bp-energy-selector${selectedCount > 0 ? ' has-selection' : ''}`}>
        <svg className="bp-energy-links" viewBox="0 0 580 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M120 100 H260" />
          <path d="M320 100 H460" />
        </svg>
        <BoosterCard
          id="double-score"
          selected={loadout.doubleScore}
          icon={<span>×2</span>}
          title="Множитель"
          description="Удвоение рейтинга"
          onToggle={toggle}
        />
        <div className="bp-energy-core" aria-label={`${activityPoints} очков активности`}>
          <i aria-hidden="true" />
          <span>Core</span>
          <strong>{activityPoints}</strong>
          <small>Energy Center</small>
        </div>
        <BoosterCard
          id="stabilizer"
          selected={loadout.stabilizer}
          icon={<ShieldIcon />}
          title="Стабилизатор"
          description="Очистка поля"
          onToggle={toggle}
        />
      </div>
      <div className="bp-booster-selection-summary">
        <div><span>Выбрано</span><strong>{selectedCount}</strong></div>
        <div><span>Стоимость</span><strong className="is-cost">{totalCost}</strong></div>
        <div><span>Останется</span><strong className="is-balance">{Math.max(0, activityPoints - totalCost)}</strong></div>
        <p>Бустеры действуют только в следующей игровой сессии</p>
      </div>
      <div className="bp-booster-selection-actions">
        {error && <p className="bp-auth-error" role="alert">{error}</p>}
        <button type="button" className="is-secondary" disabled={pending} onClick={onStartWithoutBoosters}>Играть без бустеров</button>
        <button type="button" className="is-primary" disabled={pending || totalCost > activityPoints} onClick={onStart}>{pending ? 'Подготовка…' : 'Начать игру'} {!pending && <RocketIcon />}</button>
      </div>
    </BoostplayDialog>
  );
}
