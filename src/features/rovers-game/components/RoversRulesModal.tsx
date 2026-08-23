import { RoverImage } from './RoverImage';

interface RoversRulesModalProps {
  onClose: () => void;
}

export function RoversRulesModal({ onClose }: RoversRulesModalProps) {
  return (
    <div className="rovers-modal-backdrop" role="presentation">
      <section
        className="rovers-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rovers-rules-title"
      >
        <span className="rovers-kicker">Как играть</span>
        <h2 id="rovers-rules-title">Создайте легендарного ровера</h2>
        <div className="rovers-merge-example" aria-label="Два ровера первого уровня превращаются в ровер второго уровня">
          <RoverImage level={1} size={56} />
          <span>+</span>
          <RoverImage level={1} size={56} />
          <span>→</span>
          <RoverImage level={2} size={64} />
        </div>
        <ul>
          <li>Перемещайте ровер по горизонтали.</li>
          <li>Нажмите, чтобы сбросить его в контейнер.</li>
          <li>Соединяйте два одинаковых ровера.</li>
          <li>Получайте ровера следующего уровня.</li>
          <li>Не допускайте переполнения поля.</li>
          <li>Доберитесь до легендарного ровера.</li>
        </ul>
        <button type="button" autoFocus onClick={onClose}>
          Начать игру
        </button>
      </section>
    </div>
  );
}
