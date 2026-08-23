import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { createDefaultPlayerProfile } from '../../player-profile/config/profileDefaults';
import { PlayerProfileContext } from '../../player-profile/context/playerProfileContext';
import { AuthProvider } from '../auth/BoostplayAuthProvider';
import { runtimeConfig } from '../../../config/runtimeConfig';
import BoostplayLobbyPage from './BoostplayLobbyPage';

function renderLobby() {
  const profile = createDefaultPlayerProfile('2026-08-06T00:00:00.000Z');
  return renderToStaticMarkup(
    <MemoryRouter>
      <AuthProvider>
        <PlayerProfileContext.Provider value={profile}>
          <BoostplayLobbyPage />
        </PlayerProfileContext.Provider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('BoostplayLobbyPage', () => {
  it('renders the approved lobby hierarchy with one main heading', () => {
    const html = renderLobby();
    expect(html).toContain('BOOSTPLAY');
    expect(html).toContain('>РОВЕРЫ</h1>');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('class="bp-play-cta"');
    expect(html).toContain('type="button"');
    expect(html).toContain('>ИГРАТЬ</span>');
  });

  it('does not render a fake authenticated profile before session resolution', () => {
    const html = renderLobby();
    if (runtimeConfig.authMode === 'local') {
      expect(html).toContain('bp-guest-profile');
      expect(html).toContain('Войти или зарегистрироваться');
    } else {
      expect(html).toContain('bp-profile-loading');
      expect(html).toContain('Загружаем профиль');
      expect(html).not.toContain('bp-guest-profile');
    }
    expect(html).not.toContain('player-avatar__avatar');
    expect(html).not.toContain('player-avatar__edit');
    expect(html).not.toContain('Настроить профиль');
  });

  it('does not flash a fallback season countdown before server settings load', () => {
    const html = renderLobby();
    expect(html).toContain('bp-season-chip is-loading');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Загружаем…');
    expect(html).not.toContain('>6 дней</strong>');
  });

  it('does not render demo leaderboard entries while production data is loading', () => {
    const html = renderLobby();
    expect(html.match(/class="place-[123]"/g)).toHaveLength(3);
    expect(html).toContain('Загружаем результаты');
    expect(html).not.toContain('Кибер_Драйвер');
    expect(html).not.toContain('Марсоход');
    expect(html).toContain('Доставочный ровер');
    expect(html).toContain('Футболка Яндекса');
    expect(html).toContain('Набор носков');
    expect(html).not.toContain('bp-prize-image');
  });

  it('keeps development and cosmetics tooling off the lobby', () => {
    const html = renderLobby();
    expect(html).not.toContain('Reference overlay');
    expect(html).not.toContain('Калибровка');
    expect(html).not.toContain('Выбрать аватар');
  });

  it('keeps public lobby information open while authentication is loading', () => {
    const html = renderLobby();
    expect(html).not.toContain('bp-page is-auth-locked');
    expect(html).not.toContain('type="password"');
    expect(html).toContain('Смотреть все');
    expect(html).toContain('Как это работает?');
    expect(html).not.toContain('<small>Вы</small>');
  });
});
