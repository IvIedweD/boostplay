import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '../auth/BoostplayAuthProvider';
import { BoostplayAuthDialog } from './BoostplayAuthDialog';

describe('BoostplayAuthDialog', () => {
  it('renders corporate registration and preserves a referral marker', () => {
    const html = renderToStaticMarkup(<AuthProvider><BoostplayAuthDialog referralCode="team_2026" onClose={() => undefined} /></AuthProvider>);
    expect(html).toContain('Создать аккаунт');
    expect(html).toContain('login@yandex-team.ru');
    expect(html).toContain('Не менее 8 символов');
    expect(html).toContain('@yandex-team.ru');
    expect(html).toContain('Реферальная метка применена');
    expect(html).toContain('TEAM_2026');
  });

  it('renders a separate password login state', () => {
    const html = renderToStaticMarkup(<AuthProvider><BoostplayAuthDialog initialMode="login" onClose={() => undefined} /></AuthProvider>);
    expect(html).toContain('С возвращением');
    expect(html).toContain('Введите пароль');
    expect(html).not.toContain('Повторите пароль');
  });
});
