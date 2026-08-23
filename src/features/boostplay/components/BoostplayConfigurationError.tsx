import { boostplayAssets } from '../../../assets/boostplay/assets';
import './boostplay.css';

export function BoostplayConfigurationError({ message }: { message: string }) {
  return <main
    className="bp-configuration-error"
    style={{ '--bp-background-image': `url(${boostplayAssets.backgrounds.lobby})` } as React.CSSProperties}
  >
    <section role="alert">
      <span>BOOSTPLAY</span>
      <h1>Сервис временно недоступен</h1>
      <p>Конфигурация опубликованной версии не завершена. Игровые данные и тестовые профили не подменяются локальными значениями.</p>
      <small>{message}</small>
      <button type="button" onClick={() => window.location.reload()}>Повторить</button>
    </section>
  </main>;
}
