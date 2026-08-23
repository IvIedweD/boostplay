import { describe, expect, it } from 'vitest';
import {
  ALLOWED_EMAIL_DOMAIN,
  createRegistrationIdentity,
  isAllowedRegistrationEmail,
  normalizeEmail,
  normalizeReferralCode,
} from './registrationPolicy';

describe('политика регистрации BOOSTPLAY', () => {
  it('разрешает только точный подтверждаемый домен', () => {
    expect(ALLOWED_EMAIL_DOMAIN).toBe('yandex-team.ru');
    expect(isAllowedRegistrationEmail('login@yandex-team.ru')).toBe(true);
    expect(isAllowedRegistrationEmail('LOGIN@YANDEX-TEAM.RU')).toBe(true);
    expect(isAllowedRegistrationEmail('login@evil-yandex-team.ru')).toBe(false);
    expect(isAllowedRegistrationEmail('login@yandex-team.ru.example.com')).toBe(false);
    expect(isAllowedRegistrationEmail('login@gmail.com')).toBe(false);
  });

  it('нормализует email и берёт имя до символа @', () => {
    expect(normalizeEmail('  Ivan.Petrov@YANDEX-TEAM.RU ')).toBe('ivan.petrov@yandex-team.ru');
    expect(createRegistrationIdentity('  Ivan.Petrov@YANDEX-TEAM.RU ')).toEqual({
      email: 'ivan.petrov@yandex-team.ru',
      displayName: 'ivan.petrov',
    });
  });

  it('оставляет безопасную заготовку под реферальный код', () => {
    expect(normalizeReferralCode(' team_2026 ')).toBe('TEAM_2026');
    expect(normalizeReferralCode('x')).toBeNull();
    expect(normalizeReferralCode('<script>')).toBeNull();
    expect(normalizeReferralCode(null)).toBeNull();
  });
});

